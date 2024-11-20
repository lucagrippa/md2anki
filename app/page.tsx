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
import { Separator } from "@/components/ui/separator"

// Custom component imports
import { FileInput } from "@/components/file-input";
import { FileCard } from "@/components/file-card";
import { FlashcardCard } from "@/components/flashcard-v2";
import { DownloadButton } from "@/components/download-button";
import { RegenerateButton } from "@/components/regenerate-button";
import { ChatInput } from "@/components/chat-input";
import { Nudges } from "@/components/nudges";

// Set log level based on environment
if (process.env.NODE_ENV === 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('error');
}
// Form schema definition

export default function GenerateDeck() {
    const [file, setFile] = useState<File | null>(null);
    const [instructions, setInstructions] = useState<string>("");
    
    const {
        object: flashcardsObject,
        submit: submitObject,
        isLoading: isLoadingObject,
    } = useObject({
        api: "/api/generate",
        schema: flashcardSchemaObject,
    });

    return (
        <div className="flex flex-col items-center justify-center mt-36 mb-24 px-8 w-full sm:max-w-xl md:max-w-xl lg:max-w-xl">
            <h1 className="font-medium text-4xl mb-6 cursor-pointer hover:text-primary/75 transition-colors" onClick={() => window.location.reload()}> md2anki</h1>
            {file ? (
                <>
                    <div className="grid w-full items-start gap-6">
                        <FileCard file={file} setFile={setFile} />
                        {isLoadingObject === false && flashcardsObject === undefined && (
                            <div className="flex flex-col space-y-4">
                                <ChatInput
                                    file={file}
                                    instructions={instructions}
                                    setInstructions={setInstructions}
                                    submitObject={submitObject}
                                    isLoading={isLoadingObject}
                                />
                                <Nudges setInstructions={setInstructions} />
                            </div>
                        )}

                        {flashcardsObject && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center w-full mb-0">
                                    <span className="ml-1 font-normal">{flashcardsObject?.flashcards?.length || 0} flashcards</span>

                                    <div className="flex flex-row">
                                        <RegenerateButton submitObject={submitObject} isLoading={isLoadingObject} />
                                        <DownloadButton isLoading={isLoadingObject} />
                                    </div>
                                </div>
                                <Separator className="my-0" />
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4 mt-4 w-full">
                            {flashcardsObject && flashcardsObject.flashcards?.map((flashcard, index) => (
                                <FlashcardCard key={index} flashcard={flashcard} />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center w-full max-w-xl">
                    <FileInput setFile={setFile} />
                </div>
            )}
        </div >
    );
}