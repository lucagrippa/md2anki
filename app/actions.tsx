"use server";

import { createOpenAI, openai, OpenAIProvider } from "@ai-sdk/openai";
import {
    streamObject,
    CoreSystemMessage,
    CoreUserMessage,
    CompletionTokenUsage,
    CallWarning,
    streamText,
} from "ai";
import { createStreamableValue } from "ai/rsc";
import { PartialGeneration, generationSchema } from "./schema";
import { getLangfuse, fetchPrompt } from "../lib/langfuse";
import { LangfuseGenerationClient, LangfuseTraceClient } from "langfuse";
import { kv } from "@vercel/kv"; // TODO: remove
import redis from "@/utils/upstash/config";
import crypto from "crypto";
import { storage } from "@/utils/firebase/config";
import { ref, uploadBytes } from "firebase/storage";
import {
    HarmBlockThreshold,
    HarmCategory,
    VertexAI,
    GenerateContentRequest,
    Part,
    StreamGenerateContentResult,
} from "@google-cloud/vertexai";
import { stackServerApp } from "@/stack";
import { MODEL_PRICING } from "@/utils/llm/pricing";

// Constants
const WORDS_PER_PAGE = 500;
const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini-2024-07-18";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-001";
const PROMPT_NAME = process.env.PROMPT_NAME || "generate-deck-system";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;

/**
 * Generates a hash of the given content.
 * @param content - The content to be hashed.
 * @returns A SHA-256 hash of the content.
 */
function generateHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Caches the response for future use.
 * @param key - The key to store the cache under.
 * @param finalCards - The final flashcards to be cached.
 */
async function cacheResponse(
    key: string,
    finalCards: PartialGeneration
): Promise<void> {
    await redis.set(key, finalCards);
}

/**
 * Splits a document into pages based on a specified number of words per page.
 * @param content - The content to be paginated.
 * @param wordsPerPage - The number of words per page.
 * @returns An array of strings, each representing a page.
 */
function paginateDocument(content: string, wordsPerPage: number): string[] {
    const words = content.split(/\s+/);
    const pages: string[] = [];

    for (let i = 0; i < words.length; i += wordsPerPage) {
        pages.push(words.slice(i, i + wordsPerPage).join(" "));
    }

    return pages;
}

/**
 * Processes each page of the document to generate flashcards.
 * @param key - The key to store the cache under.
 * @param pages - An array of document pages.
 * @param promptInfo - Information about the prompt to be used.
 * @param MODEL - The AI model to be used.
 * @param trace - The Langfuse trace client.
 * @param openai - The OpenAI provider.
 * @param finalCards - The object to store the generated flashcards.
 * @param stream - The stream to update with partial results.
 */
async function processPages(
    key: string,
    pages: string[],
    promptInfo: { promptLink: any; promptTemplate: string },
    trace: LangfuseTraceClient,
    openai: OpenAIProvider,
    finalCards: PartialGeneration,
    stream: any,
    instructions?: string
): Promise<void> {
    console.log("Received instructions:", instructions);
    for (const page of pages) {
        const promptWithInstructions = instructions
            ? `${promptInfo.promptTemplate}. ${instructions}`
            : promptInfo.promptTemplate;

        console.log("Prompt with instructions:", promptWithInstructions);

        const messages: (CoreSystemMessage | CoreUserMessage)[] = [
            { role: "system", content: promptWithInstructions },
            { role: "user", content: page },
        ];

        const generation = trace.generation({
            name: "generation",
            input: messages,
            model: OPENAI_MODEL,
            prompt: promptInfo.promptLink,
            completionStartTime: new Date(),
        });

        try {
            await streamObject({
                model: openai(OPENAI_MODEL),
                messages: messages,
                schema: generationSchema,
                mode: "tool",
                maxTokens: 16_384,
                onFinish: async (event) =>
                    updateGeneration(key, finalCards, event, generation),
            }).then(async ({ partialObjectStream }) => {
                for await (const partialObject of partialObjectStream) {
                    stream.update({
                        deck_name:
                            partialObject.deck_name !== undefined
                                ? partialObject.deck_name
                                : finalCards?.deck_name,
                        flashcards: [
                            ...(finalCards?.flashcards ?? []),
                            ...(partialObject.flashcards ?? []),
                        ],
                    });
                }
            });
        } catch (error) {
            console.error("Error in partialObjectStream:", error);
            trace.update({
                output:
                    error instanceof Error ? error : new Error(String(error)),
            });
        }
    }

    trace.update({ output: finalCards });
}

/**
 * Updates the generation with the latest flashcards and handles any errors.
 * @param key - The key to store the cache under.
 * @param finalCards - The object to store the final flashcards.
 * @param event - The event containing the latest generated flashcards or error.
 * @param generation - The Langfuse generation client.
 */
async function updateGeneration(
    key: string,
    finalCards: PartialGeneration,
    event: {
        usage: CompletionTokenUsage;
        object: PartialGeneration | undefined;
        error: unknown | undefined;
        rawResponse?: { headers?: Record<string, string> };
        warnings?: CallWarning[];
    },
    generation: LangfuseGenerationClient
): Promise<void> {
    if (event.error) {
        console.error("Error in stream:", event.error);
    }

    if (event.object?.flashcards) {
        console.log(`Received ${event.object.flashcards.length} flashcards`);
        // Update deck_name if it's null, undefined, or an empty string
        if (!finalCards.deck_name) {
            finalCards.deck_name = event.object.deck_name;
        }

        // Update flashcards by merging existing ones with new ones
        finalCards.flashcards = [
            ...(finalCards.flashcards ?? []),
            ...event.object.flashcards,
        ];

        generation.update({
            endTime: new Date(),
            output: event.object,
            usage: {
                input: event.usage.promptTokens,
                inputCost:
                    MODEL_PRICING[OPENAI_MODEL].unitInput *
                    event.usage.promptTokens,
                output: event.usage.completionTokens,
                outputCost:
                    MODEL_PRICING[OPENAI_MODEL].unitOutput *
                    event.usage.completionTokens,
            },
        });

        // await cacheResponse(key, finalCards);
    } else {
        console.warn("No valid object generated");
    }
}

/**
 * Generates an Anki deck based on the provided document content.
 * @param documentContent The content of the document to generate cards from.
 * @param apiKey The API key for OpenAI.
 * @returns A stream of partial card objects.
 */
export async function generateFlashcards(
    documentContent: string,
    instructions?: string
) {
    if (!API_KEY) {
        throw new Error(
            "OPENAI_API_KEY is not set in the environment variables."
        );
    }

    console.log("Generating flashcards WITH INSTRUCTIONS", instructions);

    const key = generateHash(documentContent);
    const langfuse = getLangfuse();
    const stream = createStreamableValue<PartialGeneration>();
    const openai = createOpenAI({ apiKey: API_KEY });

    const cached = await redis.get(key);
    if (cached) {
        console.log("Cache hit", cached);
        console.log(`Fetching cached response for key: ${key}`);
        stream.update(cached);
        stream.done();
        return { object: stream.value };
    }

    const trace = langfuse.trace({
        name: "Generate Flashcards",
        input: documentContent,
    });

    const pages = paginateDocument(documentContent, WORDS_PER_PAGE);
    console.log(`Split document into ${pages.length} pages`);

    try {
        const promptInfo = await fetchPrompt(trace, PROMPT_NAME, langfuse);
        const finalCards: PartialGeneration = { deck_name: "", flashcards: [] };

        processPages(
            key,
            pages,
            promptInfo,
            trace,
            openai,
            finalCards,
            stream,
            instructions
        ).finally(async () => {
            stream.done();
            await langfuse.flushAsync();
        });

        console.log("GENERATED FLASHCARDS:", finalCards);
    } catch (error) {
        console.error("Error in generating flashcards:", error);
        trace.update({
            output: error instanceof Error ? error : new Error(String(error)),
        });
        stream.error(error);
    }

    return { object: stream.value };
}

export const extractTextFromFile = async (
    formData: FormData,
    filePath: string,
    instructions?: string,
    stream?: boolean
) => {
    const file = formData.get("file") as File;
    if (!file) {
        throw new Error("No file provided");
    }
    console.log("Generating FF cheatsheet for file:", file.name);
    const user = await stackServerApp.getUser();
    const userId = user?.id;

    const langfuse = getLangfuse();
    const trace = langfuse.trace({
        name: "Extract Text from PDF",
        metadata: {
            file: file.name,
            fileSize: file.size,
            fileType: file.type,
        },
        userId,
    });

    try {
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);

        const extractTextSpan = trace.span({ name: "Extract Text" });
        const extractedText = await extractText(
            filePath,
            file.type,
            instructions,
            "",
        );
        extractTextSpan.end();
        console.log("DONE EXTRACTING TEXT");


        const usageMetadata = extractedText.usageMetadata;
        const generation = trace.generation({
            name: "Extracting Text from File",
            model: GEMINI_MODEL,
            usage: {
                input: usageMetadata?.promptTokenCount,
                inputCost:
                    MODEL_PRICING[GEMINI_MODEL].unitInput *
                    (usageMetadata?.promptTokenCount || 0),
                output: usageMetadata?.candidatesTokenCount,
                outputCost:
                    MODEL_PRICING[GEMINI_MODEL].unitOutput *
                    (usageMetadata?.candidatesTokenCount || 0),
            },
        });

        let text = "";
        extractedText.candidates?.forEach((candidate) => {
            candidate.content.parts.forEach((part, i) => {
                if (part.text) text += part.text;
            });
        });

        if (!text) {
            throw new Error("Failed to extract text from PDF");
        }

        console.log("Extracted text:", text);

        return text;
    } catch (error) {
        console.error("Error generating cheatsheet:", error);
        trace.update({
            output: error instanceof Error ? error : new Error(String(error)),
        });
    } finally {
        await langfuse.flushAsync();
    }
};

export async function summarizeFile(
    formData: FormData
) {
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;
    const instructions = formData.get("instructions") as string;
    const mimeType = file.type;
    if (!file) {
        throw new Error("No file provided");
    }

    const user = await stackServerApp.getUser();
    const userId = user?.id;

    const langfuse = getLangfuse();
    const trace = langfuse.trace({
        name: "Summarize File",
        metadata: {
            file: file.name,
            fileSize: file.size,
            fileType: file.type,
        },
        userId,
    });

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
        try {
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, file);

            const vertexAI = new VertexAI({
                project: FIREBASE_PROJECT_ID,
                location: "us-central1",
            });

            const generativeModel = vertexAI.getGenerativeModel({
                model: GEMINI_MODEL,
            });

            const uri = `gs://${FIREBASE_PROJECT_ID}.appspot.com/${filePath}`;
            const filePart = {
                fileData: {
                    fileUri: uri,
                    mimeType,
                },
            };

            const request = {
                contents: [
                    {
                        parts: [
                            filePart,
                            {
                                text: instructions
                                    ? "Please summarize the file. " +
                                      instructions
                                    : "Please summarize the file.",
                            },
                        ],
                        role: "user",
                    },
                ],
            };

            const resp = await generativeModel.generateContentStream(request);

            for await (const chunk of resp.stream) {
                console.log("CHUNK", JSON.stringify(chunk, null, 2));
                // Check if candidates exist before accessing
                if (chunk.candidates && chunk.candidates.length > 0) {
                    await writer.write(chunk.candidates[0].content.parts[0].text);
                } else {
                    console.warn("No candidates found in chunk");
                }
            }

            const usageMetadata = (await resp.response).usageMetadata;
            trace.generation({
                name: "Extracting Text from File",
                model: GEMINI_MODEL,
                usage: {
                    input: usageMetadata?.promptTokenCount,
                    inputCost:
                        MODEL_PRICING[GEMINI_MODEL].unitInput *
                        (usageMetadata?.promptTokenCount || 0),
                    output: usageMetadata?.candidatesTokenCount,
                    outputCost:
                        MODEL_PRICING[GEMINI_MODEL].unitOutput *
                        (usageMetadata?.candidatesTokenCount || 0),
                },
            });
        } catch (error) {
            console.error("Error generating summary:", error);
            trace.update({
                output:
                    error instanceof Error ? error : new Error(String(error)),
            });
            await writer.write("An error occurred while summarizing the file.");
        } finally {
            await langfuse.flushAsync();
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

export async function extractText(
    path: string,
    mimeType: string,
    query?: string,
    instructions?: string,
) {
    const vertexAI = new VertexAI({
        project: FIREBASE_PROJECT_ID,
        location: "us-central1",
    });

    const generativeModel = vertexAI.getGenerativeModel({
        model: GEMINI_MODEL,
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
            {
                category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
                threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        ],
    });

    console.log("Extracting text from file:", path);

    const uri = `gs://${FIREBASE_PROJECT_ID}.appspot.com/${path}`;
    const filePart: Part = {
        fileData: {
            fileUri: uri,
            mimeType,
        },
    };

    console.log("URI:", uri, query, instructions);

    const request: GenerateContentRequest = {
        contents: [
            {
                parts: [
                    filePart,
                    {
                        text:
                            query && query?.length > 0
                                ? `Please extract content from the file. ${query}`
                                : instructions && instructions?.length > 0
                                ? `Please extract content from the file. User Instructions: ${instructions}`
                                : `You are a very professional educator. Extract content from the file. Il will be used to create summaries and flashcards about the file.`,
                    },
                ],
                role: "user",
            },
        ],
    };

    try {
        const resp = await generativeModel.generateContent(request);
        const contentResponse = resp.response;
        return contentResponse;
    } catch (error) {
        console.error("Error generating cheatsheet:", error);
        throw new Error("Failed to generate cheatsheet");
    }
}
