import { ChevronLeft } from 'lucide-react';
import { Button } from "@/components/ui/button"

export function BackButton() {
    return (
        <Button variant="secondary" size="icon" onClick={() => setIsFormVisible(true)}>
            <ChevronLeft className="h-4 w-4" />
        </Button>
    )
}