"use client";

import { useState } from "react";
import { Message } from "ai";
import { experimental_useObject as useObject } from "ai/react";
import { flashcardSchemaObject, Flashcard } from "@/lib/schema";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"

import { FileInput } from "@/components/file-input";
import { FlashcardCard } from "@/components/flashcard-v2";
import { ChatInterface } from "@/components/chat-interface";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { DownloadButton } from "@/components/download-button";

export default function GenerateDeck() {
    const [file, setFile] = useState<File | null>(null);
    const [chatHistory, setChatHistory] = useState<(Message)[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

    const { object, submit, isLoading, stop } = useObject({
        api: "/api/generate",
        schema: flashcardSchemaObject,
        onFinish: (result) => {
            setFlashcards(result.object?.flashcards || []);
            const assistantMessage = {
                role: "assistant",
                content: result.object?.response || "",
                id: crypto.randomUUID()
            } as Message;
            setChatHistory(prevChatHistory => [...prevChatHistory, assistantMessage]);
            // object?.response  = ""
        },
    });

    const handleSubmit = async (query: string, submittedFile?: File) => {
        console.log("query", query);
        console.log("chat history", chatHistory);
        console.log("file", submittedFile || file);

        const fileToUse = submittedFile || file;
        if (!fileToUse) return;

        // Create new message
        if (query !== "") {
            const newMessage = {
                role: "user",
                content: query,
                id: crypto.randomUUID()
            } as Message;

            // Update chat history
            setChatHistory(prevChatHistory => [...prevChatHistory, newMessage]);
        }

        const fileName = fileToUse.name;
        const fileContent = await fileToUse.text();
        submit({ fileName, fileContent, messages: chatHistory, flashcards });
    };

    if (!file) return (
        <div className="flex flex-col items-center justify-center space-y-4 mt-24 w-full max-w-lg">
            <h1 className="font-medium text-4xl mt-4 cursor-pointer hover:text-primary/75 transition-colors" onClick={() => window.location.reload()}> md2anki</h1>
            <FileInput setFile={setFile} onSubmit={handleSubmit} />
        </div>
    )

    if (file && (isLoading || chatHistory.length > 0)) return (
        <ResizablePanelGroup direction="horizontal" className="pl-6 pr-3 py-6 space-x-1.5">
            <ResizablePanel defaultSize={35} className="">
                <ChatInterface
                    chatHistory={chatHistory}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    message={object?.response}
                    stop={stop}
                />
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel defaultSize={65} className="">
                <Tabs defaultValue="flashcards" className="flex flex-col flex-grow h-full">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                            <TabsTrigger value={file.name}>{file.name}</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center justify-between space-x-2">
                            <p className="text-sm ">{flashcards.length} flashcards </p>
                            <DownloadButton isLoading={isLoading} />
                        </div>
                    </div>
                    <TabsContent value="flashcards" className="flex-grow overflow-auto shadow-sm">
                        <ScrollArea className="w-full">
                            <div className="grid grid-cols-1 gap-4 w-full pr-3">
                                {object?.flashcards?.map((flashcard, index) => (
                                    <FlashcardCard key={index} flashcard={flashcard} />
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value={file.name} className="flex-grow overflow-auto border-2 rounded-lg shadow-sm">
                        <MarkdownViewer file={file} />
                    </TabsContent>
                </Tabs>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}