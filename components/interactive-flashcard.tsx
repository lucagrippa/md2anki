"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export const InteractiveFlashcard = ({
    flashcard,
    showAnswer,
    handleFlip,
}: {
    flashcard: {
        type: "basic" | "reversible" | "cloze";
        question: string;
        answer: string;
        tags: string[];
    };
    showAnswer: boolean;
    handleFlip: () => void;
}) => {

    const renderQuestion = () => {
        switch (flashcard.type) {
            case "basic":
            case "reversible":
                return flashcard.question;
            case "cloze":
                // Replace cloze deletions with underscores
                return flashcard.question.replace(/{{c\d+::(.+?)}}/g, "____");
            default:
                return "Invalid flashcard type";
        }
    };

    const renderAnswer = () => {
        switch (flashcard.type) {
            case "basic":
            case "reversible":
                return flashcard.answer;
            case "cloze":
                return flashcard.question;
            default:
                return "Invalid flashcard type";
        }
    };

    return (
        <div className="relative w-[600px] h-[400px]">
            <motion.div
                className="w-full h-full absolute bg-white rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center p-6"
                animate={{ rotateY: showAnswer ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                style={{ backfaceVisibility: "hidden" }}
            >
                <FileQuestion className="w-8 h-8 text-primary" />
                <p className="text-lg text-center">{renderQuestion()}</p>
            </motion.div>
            <motion.div
                className="w-full h-full absolute bg-white rounded-lg shadow-md cursor-pointer flex flex-col items-center justify-center p-6"
                initial={{ rotateY: 180 }}
                animate={{ rotateY: showAnswer ? 0 : -180 }}
                transition={{ duration: 0.4 }}
                style={{ backfaceVisibility: "hidden" }}
            >
                <p className="text-lg text-center text-blue-400">{renderAnswer()}</p>
            </motion.div>
            <Button
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                onClick={handleFlip}
            >
                Flip
            </Button>
        </div>
    );
};
