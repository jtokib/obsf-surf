// API utility functions and shared utilities for surf components
// Re-export surfUtils from the centralized location
export { default as surfUtils } from '../lib/utils/surfUtils.js';

export async function createAISummary(summary, surfData) {
    try {
        const response = await fetch('/api/ai/create-ai-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ summary, surfData }),
        });
        if (!response.ok) {
            return { validatedSummary: summary, wasValidated: false };
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('AI summary creation failed:', error);
        return { validatedSummary: summary, wasValidated: false };
    }
}

