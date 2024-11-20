import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge"

interface NudgesProps {
    setInstructions: React.Dispatch<React.SetStateAction<string>>;
}

export function Nudges({ setInstructions }: NudgesProps) {
    // store a hash map of example strings

    const examplesNudges = {
        "Focus on key terms": "Focus on key terms and definitions.",
        "Summary-based cards": "Create summary-based flashcards.",
        "Multiple-choice cards": "I want multiple-choice flashcards.",
        "Target complex topics": "Focus on difficult or complex topics.",
        "Fill-in-the-blank": "Make fill-in-the-blank flashcards.",
        "Key phrases": "Make flashcards from key phrases."
    }

    // Convert the object to an array of key-value pairs and pick 3 random ones
    // const randomNudges = Object.entries(examplesNudges)
    //     .sort(() => Math.random() - 0.5) // Randomize the order
    //     .slice(0, 3); // Take the first 3 random elements

    const randomNudges = useMemo(() => {
        return Object.entries(examplesNudges)
            .sort(() => Math.random() - 0.5) // Randomize the order
            .slice(0, 3); // Take the first 3 random elements
    }, []); // Empty dependency array means this will only run once when the component mounts

    const handleNudgeClick = (value: string) => {
        setInstructions(value);
    };

    return (
        <div className="flex flex-row items-center justify-center text-xs font-light space-x-2">
            {/* Pick a random 4 nudges and for each nudge create a badge */}
            {randomNudges.map(([key, value], index) => (
                <Badge 
                key={index} 
                variant="outline" 
                onClick={() => handleNudgeClick(value)}
                className="border-none bg-primary/75 hover:bg-primary/90 text-background px-2 py-1 text-xs font-medium overflow-hidden hover:cursor-pointer shadow-sm">
                    {key} <ArrowUpRight className="h-4 w-3" />
                </Badge>
            ))}
        </div>

    )
}