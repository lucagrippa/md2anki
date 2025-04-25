import React, { useState } from 'react';

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
    const [userInput, setUserInput] = useState("");

    const handleSubmit = () => {
        if (userInput.trim()) {
            onSubmit(userInput);
            setUserInput(""); // Clear input after submit
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isLoading && userInput.trim()) {
            onSubmit(userInput);
            setUserInput(""); // Clear input after submit
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-between pb-3 border-2 rounded-lg shadow-sm">
            {/* Chat history */}
            <ScrollArea className="w-full flex flex-col px-3">
                {chatHistory.map((message, index) => (
                    <ChatMessage key={message.id} message={message} className={index === 0 ? "pt-3" : ""} />
                ))}
                {/* Only show streaming message if it's not the last message in chat history */}
                {message && (!chatHistory.length || chatHistory[chatHistory.length - 1].content !== message) && (
                    <ChatMessage
                        key="streaming"
                        message={{ role: "assistant", content: message, id: "streaming" }}
                        className="pt-3"
                    />
                )}
            </ScrollArea>

            <div className="flex flex-col w-full px-3">
                <div className="flex w-full items-center justify-between mt-0 border-2 rounded-xl shadow-sm">
                    <InputNoStyles
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        type="text"
                        placeholder="How can I help you?"
                        className="ml-4 appearance-none border-none outline-none focus:ring-0 focus:outline-none bg-transparent "
                        onKeyDown={handleKeyPress}
                    />
                    {(!isLoading) ? (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={isLoading || !userInput.trim()} 
                            onClick={handleSubmit} 
                            className="rounded-full text-gray-500 hover:text-blue-500"
                        >
                            <CircleArrowUp className="h-6 w-6 mx-2" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" disabled={!isLoading} onClick={stop} className="rounded-full text-gray-500 hover:text-red-500 animate-spin-slow">
                            <CircleStop className="h-6 w-6 mx-2" />
                        </Button>
                    )}
                </div>
            </div >
        </div >
    )
}