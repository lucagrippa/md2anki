import { ArrowDownToLine } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function DownloadButton() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={() => downloadDeck()} className="">
                        <ArrowDownToLine className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Download as .apkg</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// Implement the downloadDeck function
function downloadDeck() {
    // Logic to download the deck
}