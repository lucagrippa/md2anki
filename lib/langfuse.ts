import { Langfuse, LangfuseTraceClient } from "langfuse";
import { CallbackHandler } from "langfuse-langchain";

export function getCallbackHandler() {
    const langfuseHandler = new CallbackHandler({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.NEXT_PUBLIC_LANGFUSE_HOST,
    });

    return langfuseHandler
}

/**
 * Initializes and returns a Langfuse instance.
 * @returns {Langfuse} An initialized Langfuse instance.
 * @throws {Error} If required environment variables are missing.
 */
export function getLangfuse(): Langfuse {
    const publicKey = process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_LANGFUSE_HOST;

    if (!publicKey || !secretKey) {
        throw new Error('Langfuse public key or secret key is missing in environment variables.');
    }

    try {
        const langfuse = new Langfuse({
            publicKey,
            secretKey,
            baseUrl,
        });
        return langfuse;
    } catch (error) {
        console.error('Failed to initialize Langfuse:', error);
        throw new Error('Failed to initialize Langfuse. Check your configuration and credentials.');
    }
}

/**
 * Fetches a prompt from Langfuse.
 * @param {LangfuseTraceClient} trace - The Langfuse trace client.
 * @param {string} promptName - The name of the prompt to fetch.
 * @param {Langfuse} langfuse - The Langfuse instance.
 * @returns {Promise<{ promptLink: any; promptTemplate: string }>} The fetched prompt and its template.
 * @throws {Error} If the prompt fetch fails or if the prompt is invalid.
 */
export async function fetchPrompt(
    trace: LangfuseTraceClient, 
    promptName: string, 
    langfuse: Langfuse
): Promise<{ promptLink: any; promptTemplate: string }> {
    const promptSpan = trace.span({
        name: "fetch-prompt-from-langfuse",
        input: { promptName },
    });

    try {
        // Retrieve Langfuse prompt template with promptName
        const promptLink = await langfuse.getPrompt(promptName);

        if (!promptLink || !promptLink.prompt) {
            throw new Error(`Invalid or empty prompt retrieved for name: ${promptName}`);
        }

        const promptTemplate = promptLink.prompt;

        promptSpan.end({
            output: { promptTemplate },
        });

        return { promptLink, promptTemplate };
    } catch (error) {
        console.error(`Failed to fetch prompt "${promptName}":`, error);
        
        promptSpan.end({
            output: { error: error instanceof Error ? error.message : 'Unknown error' },
            level: 'ERROR',
        });

        throw new Error(`Failed to fetch prompt "${promptName}". Please check the prompt name and try again.`);
    }
}
