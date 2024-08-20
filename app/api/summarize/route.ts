import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";
import { ref, uploadBytes } from "firebase/storage";
import { getLangfuse } from "@/lib/langfuse";
import { stackServerApp } from "@/stack";
import { storage } from "@/utils/firebase/config";
import { MODEL_PRICING } from "@/utils/llm/pricing";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash-001";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID!;

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;
    const instructions = formData.get("instructions") as string;
    const mimeType = file.type;

    if (!file) {
        return NextResponse.json(
            { error: "No file provided" },
            { status: 400 }
        );
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
                systemInstruction:
                    "You are a helpful assistant that can summarize files and extract information from them. When provided with a file, you should generate a summary of the content or do what the user asks. Provide your answer in markdown format.",
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
                                    ? `Instructions: ${instructions}`
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
                if (chunk.candidates && chunk.candidates.length > 0) {
                    await writer.write(
                        chunk.candidates[0].content.parts[0].text
                    );
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

    return new NextResponse(stream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
