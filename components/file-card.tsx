import React, { MouseEventHandler } from 'react';
import { X, File as FileIcon } from 'lucide-react';
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FileCardProps {
    file: File;
    handleFileRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function FileCard({ file, handleFileRemove }: FileCardProps) {
    return (
        <Card key={file.name} className="flex items-center justify-between p-4 rounded-md bg-card hover:bg-card-hover transition-colors w-full">
            <div className="flex items-center gap-4">

                <div className="bg-muted rounded-md p-2 flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                    <h4 className="text-base font-medium">{file.name}</h4>
                    <p className="text-sm font-mono text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>
            {handleFileRemove && (
                <Button variant="ghost" size="icon" onClick={handleFileRemove} className="text-muted-foreground hover:bg-muted">
                    <X className="w-5 h-5" />
                    <span className="sr-only">Remove</span>
                </Button>
            )}
        </Card>
    )
}