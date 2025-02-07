import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Message } from 'ai';


interface ChatMessageProps {
    message: (Message)
    className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
    return (
        <div key={message.id} className={`flex flex-row mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
            } ${className}`}>
            <div
                className={`relative inline-block py-2 px-3 rounded-xl text-sm ${message.role === 'user'
                    ? 'bg-blue-500 text-white before:bg-blue-500'
                    : 'bg-gray-200 text-gray-700 before:bg-gray-200'
                    } 
                    before:absolute before:bottom-0 before:h-5 before:w-5 before:z-0
                    after:absolute after:bottom-0 after:w-2.5 after:h-5 after:bg-white after:z-[1]
                    ${message.role === 'user'
                        ? 'before:-right-2 before:rounded-bl-[15px] after:-right-2.5 after:rounded-bl-[10px]'
                        : 'before:-left-2 before:rounded-br-[15px] after:-left-2.5 after:rounded-br-[10px]'
                    }`}
            >
                {Array.isArray(message.content)
                    ? message.content.map(part => 'text' in part ? part.text : '').join('')
                    : message.content}
            </div>
        </div>
    )
}

