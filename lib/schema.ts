import { z } from "zod";

export const flashcardSchema = z.object({
    question: z.string().describe("The front of the flashcard that contains the question."),
    answer: z.string().describe("The back of the flashcard that contains the answer to the question."),
    type: z.enum(['basic', 'reversible', 'cloze']).describe("The type of flashcard, 'basic' flashcards have a question and answer, 'reversible' flashcards the question and answer can be swapped, 'cloze' aka cloze deletion flashcards have a part of the question missing and replaced by 3 underscores."),
});

export const flashcardsSchema = z.array(flashcardSchema);
export const flashcardSchemaObject = z.object({ flashcards: flashcardsSchema });

export type Flashcard = z.infer<typeof flashcardSchema>;

export const suggestionSchema = z.object({
    suggestion: z.string().describe("The front of the flashcard that contains the question."),
});

export const suggestionsSchema = z.array(suggestionSchema);
export const suggestionSchemaObject = z.object({ suggestions: suggestionsSchema });

export type Suggestion = z.infer<typeof suggestionSchema>;