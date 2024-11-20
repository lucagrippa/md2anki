import React, { MouseEventHandler } from 'react';
import { X, File as FileIcon } from 'lucide-react';
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FileCardProps {
    file: File;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function FileCard({ file, setFile }: FileCardProps) {
    const handleRemove = () => {
        setFile(null);
    };

    return (
        <Card key={file.name} className="flex items-center justify-between p-4 border-2 rounded-2xl bg-card hover:bg-card-hover transition-colors w-full">
            <div className="flex items-center gap-4">

                <div className="bg-muted rounded-lg p-2 flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                    <h4 className="text-base font-medium">{file.name}</h4>
                    <p className="text-sm font-mono text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleRemove} className="text-muted-foreground hover:bg-muted">
                <X className="w-5 h-5" />
                <span className="sr-only">Remove</span>
            </Button>

        </Card>
    )
}