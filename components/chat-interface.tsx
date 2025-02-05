import React from 'react';

import { CircleArrowUp, CircleStop } from 'lucide-react';
import { Message } from 'ai';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"
import { InputNoStyles } from "@/components/ui/input-no-styles"

import { ChatMessage } from '@/components/chat-message';

type ChatInterfaceProps = {
    chatHistory: (Message)[];
    onSubmit: (query: string) => void;
    isLoading: boolean;
    message: string | undefined;
    stop: () => void;
};

export function ChatInterface({ chatHistory, onSubmit, isLoading, message, stop }: ChatInterfaceProps) {
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
        <div className="flex flex-col h-full items-center justify-between pb-2 px-2 border-2 rounded-lg">
            {/* Chat history */}
            <ScrollArea className="w-full flex flex-col pl-2 pr-4">
                {/* {chatHistory.map((message, index) => ( */}
                {chatHistory.map((message, index) => (
                    <ChatMessage key={message.id} message={message} className={index === 0 ? "pt-4" : ""} />
                ))}
                <ChatMessage key={chatHistory.length} message={{ role: "assistant", content: message || "", id: crypto.randomUUID() }} className={"pt-4"} />
            </ScrollArea>

            <div className="flex w-full items-center justify-between mt-0 border-2 rounded-xl shadow-sm">
                <InputNoStyles
                    ref={inputRef}
                    type="text"
                    placeholder="How can I help you?"
                    className="ml-4 appearance-none border-none outline-none focus:ring-0 focus:outline-none bg-transparent "
                    onKeyDown={handleKeyPress}
                />
                {(!isLoading) ? (
                    <Button variant="ghost" size="icon" disabled={isLoading} onClick={handleSubmit} className="rounded-full text-gray-500 hover:text-gray-800">
                        <CircleArrowUp className="h-6 w-6 mx-2 " />
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" disabled={!isLoading} onClick={stop} className="rounded-full text-gray-500 hover:text-gray-800">
                        <CircleStop className="h-6 w-6 mx-2 " />
                    </Button>
                )}
            </div>
        </div >
    )
}