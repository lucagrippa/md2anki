import React, { useState } from 'react';

import { Button } from "@/components/ui/button";
import { InputNoStyles } from "@/components/ui/input-no-styles"
import { CircleArrowUp } from 'lucide-react';


type ChatInputProps = {
    file: File | null;
    instructions: string;
    setInstructions: (instructions: string) => void;
    // submitObject: (input: { fileContent: string, instructions: string }) => void;
    onSubmit: () => Promise<void>;
    isLoading: boolean;
};

export function ChatInput({ file, instructions, setInstructions, onSubmit, isLoading }: ChatInputProps) {
    // const [instructions, setInstructions] = useState('');

    // const handleSubmit = async () => {
    //     if (file) {
    //         try {
    //             const fileContent = await file.text();
    //             submitObject({ fileContent, instructions });
    //             setInstructions(''); // Clear the input after submission
    //         } catch (error) {
    //             console.error('Error reading file:', error);
    //             // You might want to show an error message to the user here
    //         }
    //     }
    // };


    return (
        <div className="flex w-full items-center justify-between pl-4 space-x-2 border-2 rounded-full shadow-sm">
            <InputNoStyles
                type="text"
                placeholder={file ? "How can I help you?" : "Upload a file to get started..."}
                className="appearance-none border-none outline-none focus:ring-0 focus:outline-none bg-transparent "
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                disabled={!file}
            />
            <Button variant="ghost" size="icon" disabled={isLoading || !file} onClick={onSubmit} className="rounded-full text-gray-500 hover:text-gray-800">
                <CircleArrowUp className="h-6 w-6 mx-2 " />
            </Button>
        </div>
    )
}

// Implement the downloadDeck function
function downloadDeck() {
    // Logic to download the deck
}