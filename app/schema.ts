import { DeepPartial } from "ai";
import { z } from "zod";

// define a schema for the anki deck cards
export const generationSchema = z.object({
  deck_name: z.string().describe("The name of the deck that the flashcards belong to."),
  flashcards: z.array(
    z.object({
      question: z.string().describe("The front of the flashcard that contains the question."),
      answer: z.string().describe("The back of the flashcard that contains the answer to the question."),
      type: z.enum(['basic', 'reversible', 'cloze']).describe("The type of flashcard, 'basic' flashcards have a question and answer, 'reversible' flashcards the question and answer can be swapped, 'cloze' aka cloze deletion flashcards have a part of the question missing and replaced by 3 underscores."),
      tags: z.array(
        z.string().describe("A tag for categorizing or organizing flashcards.")
      ).describe("A list of tags associated with the flashcard, used for categorization or filtering.")
    }),
  ),
});

// define a type for the partial cards during generation
export type PartialGeneration = DeepPartial<typeof generationSchema>;

// Extract the type for a single flashcard
export type Flashcard = z.infer<typeof generationSchema>["flashcards"][number];

// Create a partial version of the Flashcard type
export type PartialFlashcard = DeepPartial<Flashcard>;

// Type guard function
export function isValidFlashcard(flashcard: unknown): flashcard is Flashcard {
  return (
      typeof flashcard === 'object' &&
      flashcard !== null &&
      'question' in flashcard &&
      'answer' in flashcard &&
      'type' in flashcard &&
      'tags' in flashcard &&
      typeof flashcard.question === 'string' &&
      typeof flashcard.answer === 'string' &&
      ['basic', 'reversible', 'cloze'].includes(flashcard.type as string) &&
      Array.isArray(flashcard.tags)
  );
}