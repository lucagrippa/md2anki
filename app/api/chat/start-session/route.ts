import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const { userId, sessionName } = await request.json()

    try {
        const session = await prisma.chatSession.create({
            data: {
                userId,
                sessionName,
            },
        })

        return NextResponse.json(session, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}