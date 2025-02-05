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
import { FileCard } from "@/components/file-card";
import { FlashcardCard } from "@/components/flashcard-v2";
import { ChatInput } from "@/components/chat-input";
import { ChatInterface } from "@/components/chat-interface";
import { MarkdownViewer } from "@/components/markdown-viewer";

export default function GenerateDeck() {
    const [file, setFile] = useState<File | null>(null);
    const [chatHistory, setChatHistory] = useState<(Message)[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

    const { object, submit, isLoading, stop } = useObject({
        api: "/api/generate",
        schema: flashcardSchemaObject,
    });

    const handleSubmit = async (query: string) => {
        console.log("query", query);
        console.log("chat history", chatHistory);
        console.log("file", file);
        setChatHistory([...chatHistory, {
            role: "user",
            content: query,
            id: crypto.randomUUID()
        }]);

        if (file) {
            const fileContent = await file.text();
            submit({ file: fileContent, messages: chatHistory });
        } else {
            submit({ messages: chatHistory });
        }
    };

    if (chatHistory.length === 0) return (
        <div className="flex flex-col items-center justify-center space-y-4 mt-24 w-full max-w-lg">
            <h1 className="font-medium text-4xl mt-4 cursor-pointer hover:text-primary/75 transition-colors" onClick={() => window.location.reload()}> md2anki</h1>
            {(!file) ? (
                <FileInput setFile={setFile} />
            ) : (
                <FileCard file={file} setFile={setFile} />
            )}
            <ChatInput file={file} onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    )

    if (file && chatHistory.length > 0) return (
        <ResizablePanelGroup direction="horizontal" className=" pt-4">
            <ResizablePanel defaultSize={35} className="pl-4 mb-4">
                <ChatInterface
                    chatHistory={chatHistory}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    message={object?.response}
                    stop={stop}
                />
            </ResizablePanel>
            <ResizableHandle className="bg-transparent" />
            <ResizablePanel defaultSize={65} className="pl-4">
                <Tabs defaultValue="flashcards" className="flex flex-col flex-grow h-full">
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                            <TabsTrigger value={file.name}>{file.name}</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="flashcards" className="flex-grow overflow-auto mb-4">
                        <ScrollArea className="w-full">
                            <div className="grid grid-cols-1 gap-4 w-full pr-4">
                                {object?.flashcards?.map((flashcard, index) => (
                                    <FlashcardCard key={index} flashcard={flashcard} />
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value={file.name} className="flex-grow overflow-auto mb-4 border-2 rounded-lg">
                        <MarkdownViewer file={file} />
                    </TabsContent>
                </Tabs>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}