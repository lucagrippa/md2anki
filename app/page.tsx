"use client";
// import * as seline from '@seline-analytics/web'; // remove seline

//TODO1: add chatbot edit flashcard functionality via chat
//TODO2: add summarize feature (new page) and url support
//TODO3: add additional prompt for instructions when re-generating

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { readStreamableValue } from "ai/rsc";
import { ArrowDownToLine, Sparkles, RefreshCw, Play } from "lucide-react";
import log from "loglevel";

// UI component imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Custom component imports
import { extractTextFromFile, generateFlashcards } from "./actions";
import { PartialGeneration, isValidFlashcard } from "./schema";
import { FileCard } from "../components/file-card";
import { FileInput } from "../components/file-input";
import { Flashcard } from "../components/flashcard";
import { InteractiveFlashcard } from "../components/interactive-flashcard";

// Anki-related imports
import {
    BASIC_MODEL,
    BASIC_AND_REVERSED_CARD_MODEL,
    CLOZE_MODEL,
} from "../lib/anki/builtin-models";
import Deck from "../lib/anki/Deck";
import { Note } from "../lib/anki/Note";
import { Package } from "../lib/anki/Package";
import Chat from "@/components/chat";
import { useUser } from "@stackframe/stack";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Configuration
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Set log level based on environment
if (process.env.NODE_ENV === "development") {
    log.setLevel("debug");
} else {
    log.setLevel("error");
}

// Form schema definition
const formSchema = z.object({
    document: z
        .instanceof(File)
        .refine(
            (file) => file.name.endsWith(".md") || file.name.endsWith(".pdf"),
            {
                message: "Only markdown (.md) or PDF (.pdf) files are allowed",
            }
        )
        .optional(),
    instructions: z
        .string()
        .optional()
        .describe("Additional instructions for flashcard generation"),
});

type FormValues = z.infer<typeof formSchema>;

export default function GenerateDeck() {
    // seline.init();
    const user = useUser();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [generation, setGeneration] = useState<PartialGeneration>({
        deck_name: "",
        flashcards: [],
    });
    const [isLoading, setIsLoading] = useState<boolean | null>(null);
    const [isInteractiveMode, setIsInteractiveMode] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatbotKnowledge, setChatbotKnowledge] = useState<string>("");
    const [filePath, setFilePath] = useState<string>("");
    const [instructions, setInstructions] = useState<string>("");
    const [inputText, setInputText] = useState<string>("");
    const [summary, setSummary] = useState<string>("");
    const [summarizing, setSummarizing] = useState<boolean>(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<"file" | "text" | "url">(
        "file"
    );

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            document: undefined,
        },
    });

    // File handling functions
    const handleFileChange = async (file: File) => {
        setFile(file);
    };

    const handleFileRemove = async (event: React.MouseEvent<HTMLElement>) => {
        setFile(null); // Clear the file
    };

    const startInteractiveMode = () => {
        setIsInteractiveMode(true);
        setCurrentCardIndex(0);
    };

    const nextCard = () => {
        setShowAnswer(false);
        //@ts-ignore
        if (currentCardIndex < generation.flashcards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            setCurrentCardIndex(0);
        }
    };

    const previousCard = () => {
        setShowAnswer(false);
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        } else {
            //@ts-ignore
            setCurrentCardIndex(generation.flashcards.length - 1);
        }
    };

    const handleFlip = () => {
        setShowAnswer((prev) => !prev);
    };

    const handleFlashcardGeneration = async (
        text: string,
        instructions?: string
    ) => {
        try {
            setIsLoading(true); // Set loading state to true

            toast({
                description: "Generating your Anki deck...",
            });

            const { object } = await generateFlashcards(text, instructions);
            for await (const partialObject of readStreamableValue(object)) {
                if (partialObject) {
                    setGeneration(partialObject);
                }
            }
            setIsLoading(false); // Set loading state to false when done
        } catch (error) {
            console.error("Error generating deck:", error);
            toast({
                description: "Failed to generate Anki deck. Please try again.",
                variant: "destructive",
            });
        }
    };

    //TODO: support urls also

    const useGemini = (fileType: string) => {
        return (
            fileType === "application/pdf" ||
            fileType.startsWith("image/") ||
            fileType.startsWith("video/") ||
            fileType.startsWith("audio/")
        );
    };

    // Form submission handler
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        log.debug(values);

        let text: string | undefined = "";
        if (inputText) {
            text = inputText;
        } else if (!file) {
            toast({
                description: "Please upload a file or enter text",
                variant: "destructive",
            });
            return;
        } else {
            if (useGemini(file.type)) {
                toast({
                    description: "Extracting text from file...",
                });

                const userId = user?.id;
                if (!userId) {
                    toast({
                        description:
                            "Please sign in to generate with pdf, image, video or audio files.",
                        variant: "destructive",
                    });
                    return;
                }

                const filePath = `upload/${userId}/${file.type}/${file.name}`;
                setFilePath(filePath);
                setIsExtracting(true);
                const formData = new FormData();
                formData.append("file", file);
                text = await extractTextFromFile(formData, filePath);
                setIsExtracting(false);

                if (!text) {
                    toast({
                        description: "Failed to extract text from PDF",
                        variant: "destructive",
                    });
                    return;
                }

                setExtractedText(text);
            } else {
                text = await file.text();
                setExtractedText(text);
            }
        }

        setChatbotKnowledge(text);
        // seline.track("user: generate", { file: file.name });
        await handleFlashcardGeneration(text, instructions);
    };

    const regenerateFlashcards = async () => {
        setGeneration({ deck_name: "", flashcards: [] });

        if (!file) {
            toast({
                description: "Regenerate not available",
                variant: "destructive",
            });
            return;
        }

        // seline.track("user: regenerate", { file: file.name });
        await handleFlashcardGeneration(chatbotKnowledge, instructions);
    };

    const updateFlashcard = (
        index: number,
        updatedFlashcard: { question: string; answer: string }
    ) => {
        setGeneration((prevState) => {
            const newFlashcards = [...(prevState.flashcards || [])];
            // seline.track("user: update card", {
            //     question: newFlashcards[index]?.question,
            //     answer: newFlashcards[index]?.answer,
            //     updated_question: updatedFlashcard.question,
            //     updated_answer: updatedFlashcard.answer,
            // });
            newFlashcards[index] = updatedFlashcard;
            return { flashcards: newFlashcards };
        });
    };

    const deleteFlashcard = (
        index: number,
        event?: React.MouseEvent<HTMLElement>
    ) => {
        if (event) {
            event.stopPropagation(); // Prevent the event from bubbling up and the card's onClick from firing
        }

        let deletedFlashcard: { question: string; answer: string } | undefined;
        setGeneration((prevState) => {
            const newFlashcards = [...(prevState.flashcards || [])];
            if (index >= 0 && index < newFlashcards.length) {
                // seline.track("user: delete card", {
                //     question: newFlashcards[index]?.question,
                //     answer: newFlashcards[index]?.answer,
                // });
                const deleted = newFlashcards.splice(index, 1);
                if (deleted.length > 0) {
                    deletedFlashcard = deleted[0] as {
                        question: string;
                        answer: string;
                    };
                }
            }
            return { flashcards: newFlashcards };
        });

        if (deletedFlashcard) {
            toast({
                description: "Flashcard deleted",
                variant: "destructive",
                action: (
                    <ToastAction
                        altText="Undo"
                        onClick={() => undoDelete(deletedFlashcard!, index)}
                    >
                        Undo
                    </ToastAction>
                ),
            });
        } else {
            toast({
                description: "Failed to delete flashcard",
                variant: "destructive",
            });
        }
    };

    const undoDelete = (
        flashcard: { question: string; answer: string },
        index: number
    ) => {
        setGeneration((prevState) => {
            const newFlashcards = [...(prevState.flashcards || [])];
            // seline.track("user: undo delete card", {
            //     question: newFlashcards[index]?.question,
            //     answer: newFlashcards[index]?.answer,
            // });
            newFlashcards.splice(index, 0, flashcard);
            return { flashcards: newFlashcards };
        });
    };

    function downloadDeck(partialGeneration: PartialGeneration) {
        log.debug("Downloading deck...");

        // seline.track("user: download", {
        //     file: file?.name,
        // });

        // Create a deck and add notes
        log.debug(`Deck: ${partialGeneration.deck_name}`);
        const deckID = Math.floor(100000 + Math.random() * 900000);
        log.debug(`Deck ID: ${deckID}`);
        const deckName = partialGeneration?.deck_name || "md2anki Deck";
        const deckDescription = "A deck created using md2anki";
        const myDeck = new Deck(deckID, deckName, deckDescription);

        // Add notes from partialFlashcards
        partialGeneration?.flashcards?.forEach((flashcard, index) => {
            if (isValidFlashcard(flashcard)) {
                // check if flashcard type is basic
                if (flashcard.type === "basic") {
                    const note = new Note(
                        BASIC_MODEL,
                        [flashcard.question, flashcard.answer],
                        null,
                        flashcard.tags
                    );
                    myDeck.addNote(note);
                } else if (flashcard.type === "reversible") {
                    const note = new Note(
                        BASIC_AND_REVERSED_CARD_MODEL,
                        [flashcard.question, flashcard.answer],
                        null,
                        flashcard.tags
                    );
                    myDeck.addNote(note);
                } else if (flashcard.type === "cloze") {
                    const note = new Note(
                        CLOZE_MODEL,
                        [flashcard.question, flashcard.answer],
                        null,
                        flashcard.tags
                    );
                    myDeck.addNote(note);
                } else {
                    log.warn(
                        `Skipping flashcard at index ${index} with invalid type: ${flashcard.type}`
                    );
                }
            } else {
                log.warn(`Skipping invalid flashcard at index ${index}`);
            }
        });

        // Create a package and write to file
        const myPackage = new Package(myDeck);
        myPackage
            .writeToFile(
                `${partialGeneration.deck_name
                    ?.toLowerCase()
                    .replace(/ /g, "-")}-md2anki.apkg`
            )
            .then(() => log.debug("Anki package created successfully!"))
            .catch((error) => log.error("Error creating Anki package:", error));
        toast({
            description: "Deck downloaded successfully",
        });
    }

    return (
        <div className="flex flex-col items-center justify-center mt-16 mb-24 px-8 w-full sm:max-w-xl md:max-w-xl lg:max-w-xl">
            <div className="flex flex-col items-center justify-center w-full max-w-xl">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="grid w-full items-start gap-6"
                    >
                        <Tabs
                            defaultValue="file"
                            onChange={(e) => console.log(e)}
                        >
                            <TabsList className="flex gap-4">
                                <TabsTrigger
                                    value="file"
                                    onClick={() => setSelectedTab("file")}
                                >
                                    File
                                </TabsTrigger>
                                <TabsTrigger
                                    value="text"
                                    onClick={() => setSelectedTab("text")}
                                >
                                    Text
                                </TabsTrigger>
                                {/* <TabsTrigger
                                    value="url"
                                    onClick={() => setSelectedTab("url")}
                                >
                                    URL
                                </TabsTrigger> */}
                            </TabsList>
                            <TabsContent value="file">
                                {file ? (
                                    isLoading === null ? (
                                        <>
                                            <FileCard
                                                file={file}
                                                handleFileRemove={
                                                    handleFileRemove
                                                }
                                            />
                                        </>
                                    ) : (
                                        <div className="mb-6">
                                            <FileCard file={file} />
                                        </div>
                                    )
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="document"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <FileInput
                                                        handleFileChange={
                                                            handleFileChange
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </TabsContent>
                            <TabsContent value="text">
                                <Textarea
                                    placeholder="Enter your text here..."
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    rows={10}
                                />
                            </TabsContent>
                            <TabsContent value="url">
                                <Input
                                    type="url"
                                    placeholder="Enter the URL here..."
                                />
                            </TabsContent>
                        </Tabs>
                        {isLoading === null ? (
                            <>
                                <Textarea
                                    placeholder="Generate the flashcards in French"
                                    onChange={(e) => {
                                        setInstructions(e.target.value);
                                        console.log(
                                            e.target.value,
                                            "Instructions"
                                        );
                                    }}
                                />
                                <Button
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        (file === null &&
                                            (inputText === null ||
                                                inputText.length === 0))
                                    }
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate flashcards
                                </Button>
                            </>
                        ) : (
                            <></>
                        )}
                    </form>
                </Form>
            </div>

            {isExtracting && (
                <div className="flex items-center">
                    <div className="animate-pulse bg-gray-300 h-4 w-32 rounded"></div>
                    <span className="ml-2">Extracting text...</span>
                </div>
            )}

            {isLoading !== null && (
                <>
                    <div className="flex justify-between items-center w-full ">
                        <span className="font-normal">
                            {generation?.flashcards?.length || 0} flashcards
                        </span>

                        <div className="flex flex-row">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={
                                                isLoading ||
                                                //@ts-ignore
                                                !generation.flashcards.length
                                            }
                                            onClick={() =>
                                                setShowChat(!showChat)
                                            }
                                            className="p-2"
                                        >
                                            <Sparkles className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Chat</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={
                                                isLoading ||
                                                //@ts-ignore
                                                !generation.flashcards.length
                                            }
                                            onClick={startInteractiveMode}
                                            className="p-2"
                                        >
                                            <Play className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Start Interactive Mode
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={
                                                isLoading === null ||
                                                isLoading === true ||
                                                (file === null &&
                                                    (!inputText ||
                                                        inputText.length === 0))
                                            }
                                            onClick={() =>
                                                regenerateFlashcards()
                                            }
                                            className="p-2"
                                        >
                                            <RefreshCw className="h-5 w-5 " />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Re-generate flashcards
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={
                                                isLoading === null ||
                                                isLoading === true ||
                                                (file === null &&
                                                    (!inputText ||
                                                        inputText.length === 0))
                                            }
                                            onClick={() =>
                                                downloadDeck(generation)
                                            }
                                            className="p-2"
                                        >
                                            <ArrowDownToLine className="h-5 w-5 " />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Download as .apkg
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <Dialog open={showChat} onOpenChange={setShowChat}>
                        <DialogContent className="max-w-3xl h-full">
                            <DialogHeader>
                                <DialogTitle>Chat</DialogTitle>
                            </DialogHeader>
                            <ScrollArea>
                                <Chat
                                    knowledge={chatbotKnowledge}
                                    filePath={filePath}
                                />
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    {isInteractiveMode ? (
                        <Dialog
                            open={isInteractiveMode}
                            onOpenChange={setIsInteractiveMode}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Interactive Flashcard Review
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <InteractiveFlashcard
                                        //@ts-ignore
                                        flashcard={
                                            //@ts-ignore
                                            generation.flashcards[
                                                currentCardIndex
                                            ]
                                        }
                                        showAnswer={showAnswer}
                                        handleFlip={handleFlip}
                                    />
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button
                                        onClick={previousCard}
                                        disabled={currentCardIndex === 0}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={nextCard}
                                        disabled={
                                            currentCardIndex ===
                                            //@ts-ignore
                                            generation.flashcards.length - 1
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 mt-8 w-full">
                            {generation?.flashcards?.map((flashcard, index) => (
                                <Flashcard
                                    key={index}
                                    flashcard={flashcard}
                                    index={index}
                                    updateFlashcard={updateFlashcard}
                                    deleteFlashcard={deleteFlashcard}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
