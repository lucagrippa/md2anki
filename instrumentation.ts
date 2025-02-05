import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
    registerOTel({
        serviceName: "langfuse-vercel-ai-nextjs-example",
        // traceExporter: new LangfuseExporter(),
        traceExporter: new LangfuseExporter({
            secretKey: process.env.LANGFUSE_API_KEY,
            publicKey: process.env.LANGFUSE_API_KEY,
            baseUrl: "https://cloud.langfuse.com", // 🇪🇺 EU region
            // baseUrl: "https://us.cloud.langfuse.com", // 🇺🇸 US region
        })
    });
}