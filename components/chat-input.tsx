import React from 'react';

import { Button } from "@/components/ui/button";
import { InputNoStyles } from "@/components/ui/input-no-styles"
import { CircleArrowUp } from 'lucide-react';


type ChatInputProps = {
    file: File | null;
    onSubmit: (query: string) => void;
    isLoading: boolean;
};

export function ChatInput({ file, onSubmit, isLoading }: ChatInputProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (inputRef.current) {
            onSubmit(inputRef.current.value);
            inputRef.current.value = ''; // Clear input after submit
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            if (inputRef.current) {
                onSubmit(inputRef.current.value);
                inputRef.current.value = ''; // Clear input after submit
            }
        }
    };

    return (
        <div className="flex w-full items-center justify-between pl-4 space-x-2 border-2 rounded-full shadow-sm">
            <InputNoStyles
                ref={inputRef}
                type="text"
                placeholder={file ? "How can I help you?" : "Upload a file to get started..."}
                className="appearance-none border-none outline-none focus:ring-0 focus:outline-none bg-transparent "
                disabled={!file}
                onKeyDown={handleKeyPress}
            />
            <Button variant="ghost" size="icon" disabled={isLoading || !file} onClick={handleSubmit} className="rounded-full text-gray-500 hover:text-gray-800">
                <CircleArrowUp className="h-6 w-6 mx-2 hover:text-blue-500" stroke="currentColor"/>
            </Button>
        </div>
    )
}
