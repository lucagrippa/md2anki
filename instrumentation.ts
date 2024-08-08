import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
    registerOTel({
        serviceName: "md2anki",
        traceExporter: new LangfuseExporter({
            publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.NEXT_PUBLIC_LANGFUSE_HOST,
            debug: process.env.NODE_ENV === "development",
        }),
    });
}