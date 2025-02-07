import { ArrowDownToLine } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type DownloadButtonProps = {
    isLoading: boolean;
};

export function DownloadButton({ isLoading }: DownloadButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading === true} onClick={() => downloadDeck()} className="rounded-lg">
                        <ArrowDownToLine className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Download as .apkg
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// Implement the downloadDeck function
function downloadDeck() {
    // Logic to download the deck
}