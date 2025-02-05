import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Message } from 'ai';


interface ChatMessageProps {
    message: (Message)
    className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
    return (
        <div key={message.id} className={`flex flex-row mb-4 space-x-2 items-center ${className}`}>
            <Avatar>
                <AvatarImage src={message.role === 'user' ? 'https://github.com/shadcn.png' : 'https://github.com/vercel.png'} />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div
                className={`inline-block p-2 rounded-xl text-sm ${message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                    }`}
            >
                {Array.isArray(message.content)
                    ? message.content.map(part => 'text' in part ? part.text : '').join('')
                    : message.content}
            </div>

        </div>
    )
}

