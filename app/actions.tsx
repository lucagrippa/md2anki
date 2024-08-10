'use server';

import { createOpenAI, OpenAIProvider } from '@ai-sdk/openai';
import { streamObject, CoreSystemMessage, CoreUserMessage, CompletionTokenUsage, CallWarning } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { PartialGeneration, generationSchema } from './schema';
import { getLangfuse, fetchPrompt } from '../lib/langfuse';
import { LangfuseGenerationClient, LangfuseTraceClient } from "langfuse";
import { kv } from '@vercel/kv';
import crypto from 'crypto';

// Constants
const WORDS_PER_PAGE = 500;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini-2024-07-18";
const PROMPT_NAME = process.env.PROMPT_NAME || "generate-deck-system";

/**
 * Generates a hash of the given content.
 * @param content - The content to be hashed.
 * @returns A SHA-256 hash of the content.
 */
function generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Caches the response for future use.
 * @param key - The key to store the cache under.
 * @param finalCards - The final flashcards to be cached.
 */
async function cacheResponse(key: string, finalCards: PartialGeneration): Promise<void> {
    await kv.set(key, finalCards);
    await kv.expire(key, 60 * 60); // Cache for 1 hour
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
        pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }

    return pages;
}

/**
 * Processes each page of the document to generate flashcards.
 * @param pages - An array of document pages.
 * @param promptInfo - Information about the prompt to be used.
 * @param MODEL - The AI model to be used.
 * @param trace - The Langfuse trace client.
 * @param openai - The OpenAI provider.
 * @param finalCards - The object to store the generated flashcards.
 * @param stream - The stream to update with partial results.
 */
async function processPages(
    pages: string[],
    promptInfo: { promptLink: any; promptTemplate: string },
    trace: LangfuseTraceClient,
    openai: OpenAIProvider,
    finalCards: PartialGeneration,
    stream: any
): Promise<void> {
    for (const page of pages) {
        const messages: (CoreSystemMessage | CoreUserMessage)[] = [
            { role: "system", content: promptInfo.promptTemplate },
            { role: "user", content: page }
        ];

        const generation = trace.generation({
            name: "generation",
            input: messages,
            model: MODEL,
            prompt: promptInfo.promptLink,
            completionStartTime: new Date(),
        });

        try {
            await streamObject({
                model: openai(MODEL),
                messages: messages,
                schema: generationSchema,
                mode: "tool",
                temperature: 0.0,
                onFinish: async (event) => updateGeneration(finalCards, event, generation),
            })
                .then(async ({ partialObjectStream }) => {
                    for await (const partialObject of partialObjectStream) {
                        stream.update({
                            deck_name: partialObject.deck_name !== undefined
                                ? partialObject.deck_name
                                : finalCards?.deck_name,
                            flashcards: [...(finalCards?.flashcards ?? []), ...(partialObject.flashcards ?? [])]
                        });
                    }
                });
        } catch (error) {
            console.error('Error in partialObjectStream:', error);
            trace.update({ output: error instanceof Error ? error : new Error(String(error)) });
        }
    }

    trace.update({ output: finalCards });
}

/**
 * Updates the generation with the latest flashcards and handles any errors.
 * @param finalCards - The object to store the final flashcards.
 * @param event - The event containing the latest generated flashcards or error.
 * @param generation - The Langfuse generation client.
 */
async function updateGeneration(
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
        console.error('Error in stream:', event.error);
    }

    if (event.object?.flashcards) {
        console.log(`Received ${event.object.flashcards.length} flashcards`);
        // Update deck_name if it's null, undefined, or an empty string
        if (!finalCards.deck_name) {
            finalCards.deck_name = event.object.deck_name;
        }

        // Update flashcards by merging existing ones with new ones
        finalCards.flashcards = [...(finalCards.flashcards ?? []), ...event.object.flashcards];

        generation.update({
            endTime: new Date(),
            output: event.object,
        });
    } else {
        console.warn('No valid object generated');
    }
}


/**
 * Generates an Anki deck based on the provided document content.
 * @param documentContent The content of the document to generate cards from.
 * @param apiKey The API key for OpenAI.
 * @returns A stream of partial card objects.
 */
export async function generateFlashcards(documentContent: string) {
    if (!API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in the environment variables.");
    }

    // const key = JSON.stringify(documentContent);
    const key = generateHash(documentContent);
    const langfuse = getLangfuse()
    const stream = createStreamableValue<PartialGeneration>();
    const openai = createOpenAI({ apiKey: API_KEY });

    // Uncomment the following block to enable caching
    // const cached = await kv.get(key);
    // if (cached) {
    //     console.log(`Fetching cached response for key: ${key}`);
    //     stream.update(cached);
    //     stream.done();
    //     return stream.value;
    // }

    const trace = langfuse.trace({
        name: "Generate Flashcards",
        input: documentContent
    });

    const pages = paginateDocument(documentContent, WORDS_PER_PAGE);
    console.log(`Split document into ${pages.length} pages`);

    try {
        const promptInfo = await fetchPrompt(trace, PROMPT_NAME, langfuse)
        const finalCards: PartialGeneration = { deck_name: "", flashcards: [] };

        processPages(pages, promptInfo, trace, openai, finalCards, stream)
            .finally(async () => {
                stream.done();
                await langfuse.flushAsync();
            });

        // Uncomment the following line to enable caching
        // await cacheResponse(key, finalCards);
    } catch (error) {
        console.error('Error in generating flashcards:', error);
        trace.update({ output: error instanceof Error ? error : new Error(String(error)) });
        stream.error(error);
    }

    return { object: stream.value };
}
