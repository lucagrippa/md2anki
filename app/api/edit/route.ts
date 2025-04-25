import { flashcardSchemaObject } from "@/lib/schema";
import { openai } from "@ai-sdk/openai";
import { streamObject, Message } from "ai";
import { Langfuse } from "langfuse";
import { randomUUID } from "crypto";


import fs from 'fs';
import path from 'path';

// Read the prompt file synchronously when the module is loaded
// read prompt from file in lib/prompt.txt
const promptPath = path.join(process.cwd(), 'lib', 'prompt.txt');
const systemPrompt = fs.readFileSync(promptPath, 'utf8');

export async function POST(request: Request) {
    // Parse the request body
    // console.log("request", request);
    const { file, messages, flashcards } = await request.json();
    console.log("messages:", messages);
    console.log("file:", file);

    const langfuse = new Langfuse({
        secretKey: process.env.LANGFUSE_API_KEY,
        publicKey: process.env.LANGFUSE_API_KEY,
        baseUrl: "https://us.cloud.langfuse.com", // 🇺🇸 US region
    });
    const parentTraceId = randomUUID();

    langfuse.trace({
        id: parentTraceId,
        name: "generate-flashcards",
    });

    const result = streamObject({
        schema: flashcardSchemaObject,
        output: "object",
        model: openai("gpt-4o-mini-2024-07-18"),
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: file }, ...messages],
        providerOptions: {
            openai: {
                prediction: {
                    type: 'content',
                    content: flashcards,
                },
            },
        },
        experimental_telemetry: { isEnabled: true },
        onFinish: async (result) => {
            // save result to 
            console.log("result", result);
            await langfuse.flushAsync();
        },
    });

    return result.toTextStreamResponse();
}