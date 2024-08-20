type ModelPricing = {
    [key: string]: {
        unitInput: number;
        unitOutput: number;
    };
};

export const MODEL_PRICING: ModelPricing = {
    "gpt-4o-mini": {
        unitInput: 0.15 / 1_000_000,
        unitOutput: 0.6 / 1_000_000,
    },
    "gpt-4o-mini-2024-07-18": {
        unitInput: 0.15 / 1_000_000,
        unitOutput: 0.6 / 1_000_000,
    },
    "gpt-4o": {
        unitInput: 5 / 1_000_000,
        unitOutput: 15 / 1_000_000,
    },
    "text-embedding-3-small": {
        unitInput: 0.02 / 1_000_000,
        unitOutput: 0.02 / 1_000_000,
    },
    "text-embedding-3-large": {
        unitInput: 0.13 / 1_000_000,
        unitOutput: 0.13 / 1_000_000,
    },
    "claude-3.5-sonnet": {
        unitInput: 3 / 1_000_000,
        unitOutput: 15 / 1_000_000,
    },
    "gemini-1.5-flash-001": {
        unitInput: 0.075 / 1_000_000,
        unitOutput: 0.3 / 1_000_000,
    },
    "gemini-1.5-pro-001": {
        unitInput: 3.5 / 1_000_000,
        unitOutput: 7 / 1_000_000,
    },
    "llama-3.1": {
        unitInput: 0.7 / 1_000_000,
        unitOutput: 0.8 / 1_000_000,
    },
};

// Helper function to calculate price
export function calculatePrice(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    if (!MODEL_PRICING[model]) {
        throw new Error(`Pricing for model "${model}" not found`);
    }
    const { unitInput, unitOutput } = MODEL_PRICING[model];
    return inputTokens * unitInput + outputTokens * unitOutput;
}
