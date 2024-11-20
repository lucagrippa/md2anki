"use client";
import * as seline from '@seline-analytics/web';

import { useState } from "react";
import { z } from "zod";
import log from 'loglevel';
import { experimental_useObject as useObject } from "ai/react";
import { flashcardsSchema, flashcardSchemaObject } from "@/lib/schema";
import { ArrowDownToLine, Sparkles, RefreshCw } from 'lucide-react';

// UI component imports
import { Button } from "@/components/ui/button";

// Custom component imports
import { FileInput } from "@/components/file-input";
import { FileCard } from "@/components/file-card";
import { FlashcardCard } from "@/components/flashcard-v2";
import { DownloadButton } from "@/components/download-button";
import { RegenerateButton } from "@/components/regenerate-button";
import { ChatInput } from "@/components/chat-input";

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('error');
}
// Form schema definition

export default function GenerateDeck() {
    const [file, setFile] = useState<File | null>(null);
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const {
        object: flashcardsObject,
        submit: submitObject,
        isLoading: isLoadingObject,
    } = useObject({
        api: "/api/generate",
        schema: flashcardSchemaObject,
    });

    return (
        <div className="flex flex-col items-center justify-center my-auto px-8 w-full sm:max-w-xl md:max-w-xl lg:max-w-xl">
            <h1 className="font-medium text-4xl mb-6 cursor-pointer hover:text-primary/75 transition-colors" onClick={() => window.location.reload()}> md2anki</h1>
            <div className="grid w-full items-start gap-6">
                {file ? (
                    <FileCard file={file} setFile={setFile} />
                ) : (
                    <FileInput setFile={setFile} />
                )}
                <ChatInput file={file} submitObject={submitObject} isLoading={isLoadingObject} />
                {flashcardsObject && (
                    <div className="flex justify-between items-center w-full ">
                        <span className="ml-1 font-normal">{flashcardsObject?.flashcards?.length || 0} flashcards</span>

                        <div className="flex flex-row">
                            <RegenerateButton submitObject={submitObject} isLoading={isLoadingObject} />
                            <DownloadButton isLoading={isLoadingObject} />
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4 mt-8 w-full">
                    {flashcardsObject && flashcardsObject.flashcards?.map((flashcard, index) => (
                        <FlashcardCard key={index} flashcard={flashcard} />
                    ))}
                </div>
            </div>
        </div >
    );
}