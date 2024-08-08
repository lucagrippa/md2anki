import { UploadIcon } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ControllerRenderProps } from 'react-hook-form';

type FileInputProps = {
    // field: ControllerRenderProps<{
    //     document?: File | undefined;
    // }, "document">
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FileInput({ handleFileChange }: FileInputProps) {
    return (
        <div className="relative flex items-center justify-center h-[250px] rounded-md border-2 border-dashed">
            <div className="flex flex-col items-center justify-center space-y-2 m-4">
                <UploadIcon className="mx-auto h-8 w-8 text-primary" />
                <h3 className="text-md font-medium text-center">Click to upload or drag and drop a markdown file</h3>
                <p className="text-sm text-muted-foreground">Supported formats: MD</p>
            </div>
            <Input
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 "
                type="file"
                accept=".md"
                onChange={handleFileChange}
                // {...field}
            />
        </div>
    )
}