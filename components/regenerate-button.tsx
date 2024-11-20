import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type RegenerateButtonProps = {
    submitObject: (input: any) => void;
    isLoading: boolean;
};

export function RegenerateButton({ submitObject, isLoading }: RegenerateButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading === true} onClick={() => submitObject(null)} className="p-2">
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Re-generate flashcards
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

// Implement the downloadDeck function
function regenerateFlashcards() {
    // Logic to download the deck
}