import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, tool } from "ai";
import { createAISDKTools } from "@agentic/ai-sdk";
import { TavilyClient } from "@agentic/tavily";
import { z } from "zod";
import { extractText } from "@/app/actions";

const tavily = new TavilyClient();

// New function to query file content
async function queryFileContent(query: string, filePath: string) {
    console.log("Querying file content", query, filePath);
    const mimeType = filePath.split("/").slice(2, -1).join("/");
    return extractText(filePath, mimeType, query);
}

export async function POST(req: Request) {
    const { messages, knowledge, filePath } = await req.json();
    const allowAskingToGemini = filePath && filePath.length > 0;

    console.log("USE GEMINI", knowledge, filePath);

    const tools = {
        ...createAISDKTools(tavily),
        queryFile: tool({
            description: "Query the content of the uploaded file",
            parameters: z.object({
                query: z
                    .string()
                    .describe("The query to search for in the file content"),
            }),
            execute: async ({ query }) => queryFileContent(query, filePath),
        }),
    };

    const result = await streamText({
        model: openai("gpt-4o-mini"),
        messages: convertToCoreMessages(messages),
        tools,
        system: `You are a helpful assistant that can answer questions and provide information. The user uploaded a file. Here is the summarized content: ${knowledge}. 
        ${
            allowAskingToGemini
                ? "If you don't know the answer or need more specific information from the file, use the queryFile function"
                : ""
        }. For general knowledge questions, you can use the search function. Provide your answer in markdown format, use $ for Latex.`,
        maxTokens: 16_384,
    });

    return result.toDataStreamResponse();
}
