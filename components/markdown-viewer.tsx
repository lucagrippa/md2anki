import React, { useMemo, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from '@/components/ui/card'

interface MarkdownViewerProps {
    file: File
}

export function MarkdownViewer({ file }: MarkdownViewerProps) {
    const [content, setContent] = useState('')

    useEffect(() => {
        file.text().then(setContent)
    }, [file])

    // Memoize the markdown rendering
    const memoizedMarkdown = useMemo(() => (
        <ReactMarkdown>{content}</ReactMarkdown>
    ), [content])

    return (
        <ScrollArea className="w-full p-6">
            <div className="prose dark:prose-invert max-w-none prose-sm">
                {memoizedMarkdown}
            </div>
        </ScrollArea>
    )
}

