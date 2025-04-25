import { DeepPartial } from "ai";
import { X } from 'lucide-react';

import {
    Card,
} from "@/components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { FlashcardDialog } from "@/components/flashcard-dialog"
import { Flashcard } from "@/lib/schema";

interface FlashcardProps {
    flashcard: DeepPartial<Flashcard> | undefined;
    index: number;
    updateFlashcard: (index: number, flashcard: { question: string; answer: string }) => void;
    deleteFlashcard: (index: number, event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function FlashcardCard({ flashcard, index, updateFlashcard, deleteFlashcard }: FlashcardProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card
                    key={flashcard?.question}
                    className="flex flex-row relative group cursor-pointer hover:shadow-md border-2"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                >
                    <div
                        className="absolute right-2 top-2 rounded-sm invisible group-hover:visible opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-muted-foreground hover:text-primary"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            deleteFlashcard(index, event);
                        }}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Delete flashcard</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4 my-4 mx-4">
                        <div className="flex flex-row flex-wrap col-span-2 text-sm items-center">
                            <div className="flex-1 min-w-0">
                                {flashcard?.question ? flashcard?.question : <Skeleton className="w-[100px] h-[20px] rounded-full" />}
                            </div>
                            <Separator className="ml-4 col-span-1" orientation="vertical" />
                        </div>
                        <div className="col-span-3 text-sm">
                            {flashcard?.answer ? flashcard?.answer : <Skeleton className="w-[100px] h-[20px] rounded-full" />}
                        </div>
                    </div>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <FlashcardDialog
                    flashcard={flashcard}
                    index={index}
                    updateFlashcard={updateFlashcard}
                    deleteFlashcard={deleteFlashcard}
                />
            </DialogContent>
        </Dialog >
    );
}