import { flashcardSchemaObject } from "@/lib/schema";
import { openai } from "@ai-sdk/openai";
import { generateObject, CoreSystemMessage, CoreUserMessage } from "ai";

import fs from 'fs';
import path from 'path';

// Read the prompt file synchronously when the module is loaded
// read prompt from file in lib/prompt.txt
const promptPath = path.join(process.cwd(), 'lib', 'prompt.txt');
const systemPrompt = fs.readFileSync(promptPath, 'utf8');

export async function POST(request: Request) {
    // Parse the request body
    // console.log("request", request);
    const { fileContent, instructions } = await request.json();
    console.log("fileContent", fileContent);
    console.log("instructions", instructions);

    const messages: (CoreSystemMessage | CoreUserMessage)[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: fileContent },
        { role: "user", content: instructions }
    ];

    const result = await generateObject({
        schema: flashcardSchemaObject,
        output: "object",
        model: openai("gpt-4o-mini-2024-07-18"),
        messages: messages,
    });

    return result.object.flashcards;
}