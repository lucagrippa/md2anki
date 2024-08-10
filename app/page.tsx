"use client";
import * as seline from '@seline-analytics/web';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { readStreamableValue } from "ai/rsc";
import { ArrowDownToLine, Sparkles, RefreshCw } from 'lucide-react';
import log from 'loglevel';

// UI component imports
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// Custom component imports
import { generateFlashcards } from "./actions";
import { PartialGeneration, isValidFlashcard } from "./schema";
import { FileCard } from "../components/file-card";
import { FileInput } from "../components/file-input";
import { Flashcard } from "../components/flashcard";

// Anki-related imports
import { BASIC_MODEL, BASIC_AND_REVERSED_CARD_MODEL, CLOZE_MODEL } from '../lib/anki/builtin-models';
import Deck from '../lib/anki/Deck';
import { Note } from '../lib/anki/Note';
import { Package } from '../lib/anki/Package';

// Configuration
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('error');
}

// Form schema definition
const formSchema = z.object({
    document: z.instanceof(File).optional(),
})
type FormValues = z.infer<typeof formSchema>

export default function GenerateDeck() {
    seline.init();
    const { toast } = useToast()
    const [file, setFile] = useState<File | null>(null);
    const [generation, setGeneration] = useState<PartialGeneration>({ deck_name: "", flashcards: [] });
    const [isLoading, setIsLoading] = useState<boolean | null>(null);

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
        setFile(null);  // Clear the file
    };

    const handleFlashcardGeneration = async (text: string) => {
        try {
            setIsLoading(true); // Set loading state to true

            toast({
                description: "Generating your Anki deck...",
            });

            const { object } = await generateFlashcards(text);
            for await (const partialObject of readStreamableValue(object)) {
                if (partialObject) {
                    setGeneration(partialObject);
                }
            }
            setIsLoading(false); // Set loading state to false when donesetIsLoading(false); // Set loading state to false when done
        } catch (error) {
            console.error("Error generating deck:", error);
            toast({
                description: "Failed to generate Anki deck. Please try again.",
                variant: "destructive",
            });
        }
    };

    // Form submission handler
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        log.debug(values)
        if (!file) {
            toast({
                description: "Please upload a markdown file",
                variant: "destructive",
            });
            return;
        }

        const text = await file.text();
        seline.track("user: generate", { file: file.name });
        await handleFlashcardGeneration(text);
    }

    const regenerateFlashcards = async () => {
        setGeneration({ deck_name: "", flashcards: [] });

        if (!file) {
            toast({
                description: "Regenerate not available",
                variant: "destructive",
            });
            return;
        }

        const text = await file.text();
        seline.track("user: regenerate", { file: file.name });
        await handleFlashcardGeneration(text);
    };

    const updateFlashcard = (index: number, updatedFlashcard: { question: string; answer: string }) => {
        setGeneration(prevState => {
            const newFlashcards = [...(prevState.flashcards || [])];
            seline.track("user: update card", {
                question: newFlashcards[index]?.question,
                answer: newFlashcards[index]?.answer,
                updated_question: updatedFlashcard.question,
                updated_answer: updatedFlashcard.answer,
            });
            newFlashcards[index] = updatedFlashcard;
            return { flashcards: newFlashcards };
        });
    };

    const deleteFlashcard = (index: number, event?: React.MouseEvent<HTMLElement>) => {
        if (event) {
            event.stopPropagation(); // Prevent the event from bubbling up and the card's onClick from firing
        }

        let deletedFlashcard: { question: string; answer: string } | undefined;
        setGeneration(prevState => {
            const newFlashcards = [...(prevState.flashcards || [])];
            if (index >= 0 && index < newFlashcards.length) {
                seline.track("user: delete card", {
                    question: newFlashcards[index]?.question,
                    answer: newFlashcards[index]?.answer,
                });
                const deleted = newFlashcards.splice(index, 1);
                if (deleted.length > 0) {
                    deletedFlashcard = deleted[0] as { question: string; answer: string };
                }
            }
            return { flashcards: newFlashcards };
        });

        if (deletedFlashcard) {
            toast({
                description: "Flashcard deleted",
                variant: "destructive",
                action: <ToastAction
                    altText="Undo"
                    onClick={() => undoDelete(deletedFlashcard!, index)}
                >
                    Undo
                </ToastAction>,
            });
        } else {
            toast({
                description: "Failed to delete flashcard",
                variant: "destructive"
            });
        }
    };

    const undoDelete = (flashcard: { question: string; answer: string }, index: number) => {
        setGeneration(prevState => {
            const newFlashcards = [...(prevState.flashcards || [])];
            seline.track("user: undo delete card", {
                question: newFlashcards[index]?.question,
                answer: newFlashcards[index]?.answer,
            });
            newFlashcards.splice(index, 0, flashcard);
            return { flashcards: newFlashcards };
        });
    };

    function downloadDeck(partialGeneration: PartialGeneration) {
        log.debug('Downloading deck...');

        seline.track("user: download", {
            file: file?.name,
        });

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
                if (flashcard.type === 'basic') {
                    const note = new Note(BASIC_MODEL, [flashcard.question, flashcard.answer], null, flashcard.tags);
                    myDeck.addNote(note);
                } else if (flashcard.type === 'reversible') {
                    const note = new Note(BASIC_AND_REVERSED_CARD_MODEL, [flashcard.question, flashcard.answer], null, flashcard.tags);
                    myDeck.addNote(note);

                } else if (flashcard.type === 'cloze') {
                    const note = new Note(CLOZE_MODEL, [flashcard.question, flashcard.answer], null, flashcard.tags);
                    myDeck.addNote(note);
                } else {
                    log.warn(`Skipping flashcard at index ${index} with invalid type: ${flashcard.type}`);
                }
            } else {
                log.warn(`Skipping invalid flashcard at index ${index}`);
            }
        });

        // Create a package and write to file
        const myPackage = new Package(myDeck);
        myPackage.writeToFile(`${partialGeneration.deck_name?.toLowerCase().replace(/ /g, '-')}-md2anki.apkg`)
            .then(() => log.debug("Anki package created successfully!"))
            .catch(error => log.error("Error creating Anki package:", error));
    }

    return (
        <div className="flex flex-col items-center justify-center mt-36 mb-24 px-8 w-full sm:max-w-xl md:max-w-xl lg:max-w-xl">
            <h1 className="font-medium text-xl mb-6 cursor-pointer hover:text-primary/75 transition-colors" onClick={() => window.location.reload()}> md2anki</h1>
            <div className="flex flex-col items-center justify-center w-full max-w-xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full items-start gap-6">
                        {file ? (
                            isLoading === null ? (
                                <>
                                    <FileCard file={file} handleFileRemove={handleFileRemove} />
                                    < Button type="submit" disabled={file === null}>
                                        <Sparkles className="mr-2 h-4 w-4" />Generate flashcards
                                    </Button>
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
                                            <FileInput handleFileChange={handleFileChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                    </form>
                </Form>
            </div>
            {isLoading !== null && (
                <>
                    <div className="flex justify-between items-center w-full ">
                        <span className="font-normal">{generation?.flashcards?.length || 0} flashcards</span>

                        <div className="flex flex-row">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isLoading === null || isLoading === true || file === null} onClick={() => regenerateFlashcards()} className="p-2">
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
                                        <Button variant="ghost" size="icon" disabled={isLoading === null || isLoading === true || file === null} onClick={() => downloadDeck(generation)} className="p-2">
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
                    <div className="grid grid-cols-1 gap-4 mt-8 w-full">
                        {generation?.flashcards?.map((flashcard, index) => (
                            <Flashcard key={index}
                                flashcard={flashcard}
                                index={index}
                                updateFlashcard={updateFlashcard}
                                deleteFlashcard={deleteFlashcard}
                            />
                        ))}
                    </div>
                </>
            )}
        </div >
    );
}
