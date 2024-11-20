import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    const { sessionId } = params

    try {
        const flashcards = await prisma.flashcard.findMany({
            where: { chatSessionId: parseInt(sessionId) },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json(flashcards)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    const { sessionId } = params
    const { question, answer, type } = await request.json()

    try {
        const flashcard = await prisma.flashcard.upsert({
            where: {
                chatSessionId_question: {
                    chatSessionId: parseInt(sessionId),
                    question,
                },
            },
            update: { answer, type },
            create: {
                chatSessionId: parseInt(sessionId),
                question,
                answer,
                type,
            },
        })

        return NextResponse.json(flashcard)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}