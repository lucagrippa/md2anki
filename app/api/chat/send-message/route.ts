import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: NextRequest) {
    const { chatSessionId, role, content } = await request.json()

    try {
        // Store the message
        await prisma.message.create({
            data: {
                chatSessionId,
                role,
                content,
            },
        })

        // Retrieve all messages for the session
        const messages = await prisma.message.findMany({
            where: { chatSessionId },
            orderBy: { createdAt: 'asc' },
        })

        // Generate response using LLM
        const result = await streamObject({
            model: openai('gpt-4-turbo'),
            messages: messages.map((msg) => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
            })),
        })

        // Create a readable stream from the AI response
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result) {
                    controller.enqueue(JSON.stringify(chunk))
                }
                controller.close()
            },
        })

        // Return the streaming response
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}