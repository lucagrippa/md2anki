import { DeepPartial } from "ai";
import { Trash2 } from 'lucide-react';

import { Button } from "@/components/ui/button"
import {
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Flashcard } from "@/lib/schema";

interface DialogProps {
    flashcard: DeepPartial<Flashcard> | undefined;
    index: number;
    updateFlashcard: (index: number, flashcard: { question: string; answer: string }) => void;
    deleteFlashcard: (index: number) => void;
}


export function FlashcardDialog({ flashcard, index, updateFlashcard, deleteFlashcard }: DialogProps) {
    return (
        <>
            <DialogHeader>
                <DialogTitle>Edit flashcard</DialogTitle>
                <DialogDescription>
                    Make changes to your flashcard here. Click save when you&apos;re done.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedFlashcard = {
                    question: formData.get('question') as string,
                    answer: formData.get('answer') as string,
                };
                updateFlashcard(index, updatedFlashcard);
            }}>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col">
                        <Label htmlFor={`question-${index}`} className="text-left pb-2">
                            Question
                        </Label>
                        <Textarea
                            id={`question-${index}`}
                            name="question"
                            // value={flashcard?.question}
                            defaultValue={flashcard?.question}
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label htmlFor={`answer-${index}`} className="text-left pb-2">
                            Answer
                        </Label>
                        <Textarea
                            id={`answer-${index}`}
                            name="answer"
                            // value={flashcard?.answer}
                            defaultValue={flashcard?.answer}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <DialogClose asChild className="my-0.5 sm:my-0">
                        <Button type="button" variant="destructive" onClick={() => { deleteFlashcard(index) }}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogClose>
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end sm:space-x-2">
                        <DialogClose asChild className="my-0.5 sm:my-0">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose asChild className="my-0.5 sm:my-0">
                            <Button type="submit">Save changes</Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </form>
        </>

    )
}
