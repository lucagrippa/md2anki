import React, { useState, useEffect } from "react";
import {
    X,
    File as FileIcon,
    Image as ImageIcon,
    Video as VideoIcon,
    AudioLines as AudioIcon,
    FileText as PDFIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileCardProps {
    file: File;
    handleFileRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function FileCard({ file, handleFileRemove }: FileCardProps) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (
            file.type.startsWith("image/") ||
            file.type.startsWith("video/") ||
            file.type.startsWith("audio/")
        ) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, [file]);

    const renderPreview = () => {
        if (file.type.startsWith("image/")) {
            return (
                <img
                    src={preview!}
                    alt={file.name}
                    className="w-64 h-64 object-cover rounded-md"
                />
            );
        } else if (file.type.startsWith("video/")) {
            return (
                <video
                    src={preview!}
                    className="w-64 h-64 object-cover rounded-md"
                />
            );
        } else if (file.type.startsWith("audio/")) {
            return <audio src={preview!} controls className="w-full px-5" />;
        } else if (file.type === "application/pdf") {
            return (
                <div className="bg-muted rounded-md p-2 flex items-center justify-center">
                    <PDFIcon className="h-6 w-6 text-muted-foreground" />
                </div>
            );
        } else {
            return (
                <div className="bg-muted rounded-md p-2 flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
            );
        }
    };

    return (
        <Card
            key={file.name}
            className="flex items-center justify-between p-4 rounded-md bg-card hover:bg-card-hover transition-colors w-full"
        >
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-start">
                    <h4 className="text-base font-medium">{file.name}</h4>
                    <p className="text-sm font-mono text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                    </p>
                </div>
                {renderPreview()}
            </div>
            {handleFileRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFileRemove}
                    className="text-muted-foreground hover:bg-muted"
                >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Remove</span>
                </Button>
            )}
        </Card>
    );
}

