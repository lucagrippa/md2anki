import { useCallback, useState } from "react";
import { UploadIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type FileInputProps = {
    handleFileChange: (file: File) => void;
};

export function FileInput({ handleFileChange }: FileInputProps) {
    const { toast } = useToast();
    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(false);
        },
        []
    );

    const fileCheck = (files: FileList) => {
        if (files.length > 0) {
            console.log(files[0]);
            if (
                files[0].name.endsWith(".md") ||
                files[0].name.endsWith(".pdf") ||
                files[0].name.endsWith(".txt") ||
                files[0].type.startsWith("image/") ||
                files[0].type.startsWith("video/") ||
                files[0].type.startsWith("audio/")
            ) {
                handleFileChange(files[0]);
            } else {
                toast({
                    description:
                        "Unsupported file type. Please upload a supported file type (.md, .txt, image, video, audio).",
                    variant: "destructive",
                });
            }
        }
    };

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(false);
            const files = event.dataTransfer.files;
            fileCheck(files);
        },
        [handleFileChange]
    );

    const onChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (files) {
                fileCheck(files);
            }
        },
        [handleFileChange]
    );

    // Disclaimer for file uploads
    const disclaimer = (
        <div className="text-[12px] text-red-600 p-2">
            Please note that PDF, audio files & images are stored temporarily
        </div>
    );

    return (
        <div
            // className="relative flex items-center justify-center h-[250px] rounded-md border-2 border-dashed"
            className={`relative flex items-center justify-center h-[250px] rounded-md border-2 border-dashed transition-colors 
                ${
                    isDragging
                        ? "border-primary/10 bg-primary/5"
                        : "border-border"
                }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className="flex flex-col items-center justify-center space-y-2 m-4">
                <UploadIcon className="mx-auto h-8 w-8 text-primary" />
                <h3 className="text-md font-medium text-center">
                    {isDragging
                        ? "Drop the file here"
                        : "Click to upload or drag and drop supported file"}
                </h3>
                <p className="text-sm text-muted-foreground">
                    Supported formats: MD, PDF, TXT, image, video, audio
                </p>
                {disclaimer}
            </div>
            <Input
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 "
                type="file"
                accept=".md,.pdf,.txt,image/*,video/*,audio/*"
                onChange={onChange}
            />
        </div>
    );
}
