"use client";

import { useState } from "react";
import { FileInput } from "@/components/file-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@stackframe/stack";
import { CopyIcon, FileIcon, XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { BlockMath, InlineMath } from "react-katex";
import { cn } from "@/lib/utils";
import "@cyntler/react-doc-viewer/dist/index.css";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";

export default function SummarizePage() {
    const user = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [summary, setSummary] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [instructions, setInstructions] = useState<string>("");
    const { toast } = useToast();

    const handleFileChange = (selectedFile: File) => {
        setFile(selectedFile);
        setSummary("");
    };

    const handleRemoveFile = () => {
        setFile(null);
        setSummary("");
    };

    const handleSummarize = async () => {
        if (!file) {
            toast({
                description: "Please upload a file first.",
                variant: "destructive",
            });
            return;
        }

        const userId = user?.id;
        if (!userId) {
            toast({
                description: "Please sign in to summarize a file.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        setSummary("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            const filePath = `upload/${userId}/${file.type}/${file.name}`;
            formData.append("filePath", filePath);
            formData.append("instructions", instructions);

            const response = await fetch("/api/summarize", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                const chunk = decoder.decode(value);
                setSummary((prev) => prev + chunk);
            }
        } catch (error) {
            console.error("Error summarizing file:", error);
            toast({
                description: "An error occurred while summarizing the file.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        toast({
            description: "Summary copied to clipboard!",
        });
    };

    const renderFilePreview = () => {
        if (!file) return null;
        const fileURL = URL.createObjectURL(file);

        return (
            <DocViewer
                documents={[
                    {
                        uri: fileURL,
                        fileName: file.name,
                    },
                ]}
                pluginRenderers={DocViewerRenderers}
            />
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="container mx-auto p-4 max-w-3xl mt-5">
            {!file ? (
                <FileInput handleFileChange={handleFileChange} />
            ) : (
                <div className="mt-4 p-4 border rounded-md flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <FileIcon size={24} />
                        <div>
                            <p className="font-semibold">{file.name}</p>
                            <p className="text-sm text-gray-500">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRemoveFile}
                        variant="ghost"
                        size="sm"
                    >
                        <XIcon size={20} />
                    </Button>
                    {/* {renderFilePreview()} */}
                </div>
            )}
            <div className="mt-4">
                <Input
                    placeholder="Enter additional instructions (optional)"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="mb-2"
                />
                <div className="flex justify-center">
                    <Button
                        onClick={handleSummarize}
                        disabled={!file || isLoading}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Summarizing...
                            </>
                        ) : (
                            "Summarize"
                        )}
                    </Button>
                </div>
            </div>
            {(summary || isLoading) && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold">Summary</h2>
                        <Button
                            onClick={handleCopy}
                            disabled={!summary}
                            size="sm"
                        >
                            <CopyIcon className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                    </div>
                    <div className="border rounded-md p-4 bg-white dark:bg-gray-800">
                        {isLoading && summary === "" ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-11/12" />
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-4 w-9/12" />
                            </div>
                        ) : (
                            <ReactMarkdown
                                components={{
                                    code({
                                        node,
                                        // @ts-ignore
                                        inline,
                                        className,
                                        children,
                                        ...props
                                    }) {
                                        const match = /language-(\w+)/.exec(
                                            className || ""
                                        );
                                        if (inline) {
                                            return (
                                                <InlineMath
                                                    math={String(
                                                        children
                                                    ).replace(/\n/g, " ")}
                                                />
                                            );
                                        }
                                        return match && match[1] === "math" ? (
                                            <BlockMath
                                                math={String(children).replace(
                                                    /\n/g,
                                                    " "
                                                )}
                                            />
                                        ) : (
                                            <div className="bg-gray-100 p-2 rounded-md relative">
                                                <code
                                                    className={cn(
                                                        className,
                                                        "bg-red-200 text-black rounded-sm"
                                                    )}
                                                    {...props}
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    {children}
                                                </code>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            String(children)
                                                        );
                                                        toast({
                                                            title: "Copied to clipboard",
                                                            description:
                                                                "The code has been copied to your clipboard.",
                                                        });
                                                    }}
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                        );
                                    },
                                }}
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {summary}
                            </ReactMarkdown>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
