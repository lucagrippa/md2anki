import { useChat, Message } from "ai/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardTitle,
    CardHeader,
    CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    PaperclipIcon,
    SendIcon,
    FileTextIcon,
    CodeIcon,
    LightbulbIcon,
    CopyIcon,
    RefreshCwIcon,
    PencilIcon,
    TrashIcon,
    SearchIcon,
    StopCircleIcon,
    AlertCircleIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "@/components/ui/use-toast";
import { ToolInvocation } from "ai";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default function Component({
    knowledge,
    filePath,
    className,
}: {
    knowledge: string;
    filePath: string;
    className?: string; // Added className prop
}) {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        reload,
        setInput,
        isLoading,
        stop,
        error,
        setMessages,
    } = useChat({
        maxToolRoundtrips: 5,
        async onToolCall({ toolCall }) {
            console.log("Tool call", toolCall);
        },
        keepLastMessageOnError: true,
        onError(error) {
            console.error(error);
            toast({
                title: "An error occurred",
                description: "Please try again.",
                variant: "destructive",
            });
        },
    });
    const [files, setFiles] = useState<FileList | undefined>(undefined);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleSubmit(event, {
            experimental_attachments: files,
            body: {
                knowledge,
                filePath,
            },
        });
        setFiles(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSubmit(
            { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>,
            { body: { knowledge, filePath }, data: { message: suggestion } }
        );
    };

    const handleCopy = () => {
        toast({
            title: "Copied to clipboard",
            description: "The message has been copied to your clipboard.",
        });
    };

    const handleRetry = (messageId: string) => {
        //@ts-ignore
        reload({ id: messageId });
    };

    const handleEdit = (messageId: string, content: string) => {
        setEditingId(messageId);
        setInput(content);
    };

    const handleDelete = (id: string) => {
        toast({
            title: "Message deleted",
            description: "The message has been removed from the chat.",
        });

        setMessages(messages.filter((message) => message.id !== id));
    };

    //@ts-ignore
    const renderMessage = (message) => {
        return (
            <ReactMarkdown
                components={{
                    code({
                        node,
                        //@ts-ignore
                        inline,
                        className,
                        children,
                        ...props
                    }) {
                        const match = /language-(\w+)/.exec(className || "");
                        if (inline) {
                            return (
                                <InlineMath
                                    math={String(children).replace(/\n/g, " ")}
                                />
                            );
                        }
                        return match && match[1] === "math" ? (
                            <BlockMath
                                math={String(children).replace(/\n/g, " ")}
                            />
                        ) : (
                            <div className="bg-gray-100 p-2 rounded-md relative">
                                <code
                                    className={cn(
                                        className,
                                        "bg-red-200 text-black rounded-sm"
                                    )}
                                    {...props}
                                    style={{ whiteSpace: "pre-wrap" }} // Added line wrapping
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
                {message.content}
            </ReactMarkdown>
        );
    };

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardContent className="p-6">
                <ScrollArea className="h-[60vh] pr-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <p className="text-lg font-semibold text-gray-500">
                                Start a conversation or try a suggestion:
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                    onClick={() =>
                                        handleSuggestionClick(
                                            "Summarize the file"
                                        )
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <FileTextIcon className="w-4 h-4" />
                                    Summarize the file
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleSuggestionClick(
                                            "Explain the code"
                                        )
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <CodeIcon className="w-4 h-4" />
                                    Explain the code
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleSuggestionClick(
                                            "Suggest improvements"
                                        )
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <LightbulbIcon className="w-4 h-4" />
                                    Suggest improvements
                                </Button>
                            </div>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className="flex gap-3 mb-4">
                                <Avatar>
                                    <AvatarFallback>
                                        {m.role === "user"
                                            ? "U"
                                            : m.role === "assistant"
                                            ? "AI"
                                            : "FN"}
                                    </AvatarFallback>
                                    <AvatarImage
                                        src={
                                            m.role === "user"
                                                ? "/user-avatar.png"
                                                : m.role === "assistant"
                                                ? "/ai-avatar.png"
                                                : "/function-avatar.png"
                                        }
                                    />
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold">
                                            {m.role === "user"
                                                ? "You"
                                                : m.role === "assistant"
                                                ? "AI"
                                                : `Function: ${m.name}`}
                                        </p>
                                        <div className="flex gap-2">
                                            <CopyToClipboard
                                                text={m.content}
                                                onCopy={handleCopy}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <CopyIcon className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Copy message
                                                    </span>
                                                </Button>
                                            </CopyToClipboard>
                                            {m.role === "assistant" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() =>
                                                        handleRetry(m.id)
                                                    }
                                                >
                                                    <RefreshCwIcon className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Retry
                                                    </span>
                                                </Button>
                                            )}
                                            {m.role === "user" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            handleEdit(
                                                                m.id,
                                                                m.content
                                                            )
                                                        }
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Edit message
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            handleDelete(m.id)
                                                        }
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Delete message
                                                        </span>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {m.toolInvocations?.map(
                                            (
                                                toolInvocation: ToolInvocation
                                            ) => {
                                                const toolCallId =
                                                    toolInvocation.toolCallId;

                                                return "result" in
                                                    toolInvocation
                                                    ? renderResultToolCall(
                                                          toolInvocation
                                                      )
                                                    : renderPartialToolCall(
                                                          toolInvocation
                                                      );
                                            }
                                        )}
                                        {renderMessage(m)}
                                    </div>
                                    {m?.experimental_attachments
                                        ?.filter((attachment) =>
                                            attachment?.contentType?.startsWith(
                                                "image/"
                                            )
                                        )
                                        .map((attachment, index) => (
                                            <img
                                                key={`${m.id}-${index}`}
                                                src={attachment.url}
                                                className="mt-2 rounded-lg max-w-full h-auto"
                                                alt={attachment.name}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center justify-center p-4 text-red-500">
                            <AlertCircleIcon className="mr-2" />
                            An error occurred. Please try again.
                        </div>
                    )}
                </ScrollArea>
                <form onSubmit={onSubmit} className="mt-4 flex gap-2">
                    <Input
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            if (event.target.files) {
                                setFiles(event.target.files);
                            }
                        }}
                        multiple
                        ref={fileInputRef}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PaperclipIcon className="h-4 w-4" />
                        <span className="sr-only">Attach files</span>
                    </Button>
                    <Input
                        className="flex-1"
                        placeholder="Type your message..."
                        value={input}
                        onChange={handleInputChange}
                    />
                    {isLoading ? (
                        <Button onClick={stop} size="icon" className="shrink-0">
                            <StopCircleIcon className="h-4 w-4" />
                            <span className="sr-only">Stop generating</span>
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            size="icon"
                            className="shrink-0"
                            disabled={isLoading}
                        >
                            <SendIcon className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const renderPartialToolCall = (toolCall: ToolInvocation) => {
    return (
        <Card className="mb-4 border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{toolCall.toolName}</span>
                    <Badge variant="outline" className="ml-2">
                        Tool Call
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            Arguments:
                        </h4>
                        <ScrollArea className="h-24 rounded-md border p-2">
                            <pre className="text-sm">
                                {JSON.stringify(toolCall.args, null, 2)}
                            </pre>
                        </ScrollArea>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            Result:
                        </h4>
                        <ScrollArea className="h-24 rounded-md border p-2">
                            <pre className="text-sm">
                                {JSON.stringify(toolCall.state)}
                            </pre>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const renderResultToolCall = (toolCall: ToolInvocation) => {
    if (!("result" in toolCall)) {
        return null;
    }

    return <TavilyResultToolCall toolCall={toolCall} />;
};

const TavilyResultToolCall = ({ toolCall }: { toolCall: any }) => {
    const result = toolCall.result;

    return (
        <Card className="mb-4 border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center space-x-2">
                    <SearchIcon className="w-5 h-5" />
                    <span>Search Results</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            Query:
                        </h4>
                        <p className="text-sm">{result.query}</p>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                            Results:
                        </h4>
                        <ScrollArea className="h-[400px]">
                            {result.results.map((item: any, index: number) => (
                                <Card key={index} className="mb-4">
                                    <CardHeader>
                                        <CardTitle className="text-md">
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {item.title}
                                            </a>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600">
                                            {item.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </ScrollArea>
                    </div>
                    {result.images && result.images.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                                Images:
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {result.images.map(
                                    (image: string, index: number) => (
                                        <img
                                            key={index}
                                            src={image}
                                            alt={`Result ${index + 1}`}
                                            className="rounded-md"
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
