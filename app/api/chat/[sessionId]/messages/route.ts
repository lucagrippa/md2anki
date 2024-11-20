import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    const sessionId = params.sessionId

    try {
        const messages = await prisma.message.findMany({
            where: { chatSessionId: parseInt(sessionId) },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json(messages)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}