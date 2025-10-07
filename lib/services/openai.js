/**
 * OpenAI Service
 * Handles all OpenAI API interactions for surf summary generation
 * Routes through Cloudflare AI Gateway for caching and rate limiting
 */

import { OPENAI_CONFIG, VALIDATION_THRESHOLDS } from '../constants.js';

/**
 * Validates and enhances surf summary using OpenAI GPT-3.5-turbo
 * Routes through Cloudflare AI Gateway for better performance and cost savings
 * @param {string} summary - Basic surf conditions summary
 * @param {Object} surfData - Surf data context (waveHeight, wavePeriod, windSpeed, windDirection)
 * @returns {Promise<Object>} - { validatedSummary, wasValidated, fallback?, reason?, errorDetails? }
 */
export async function validateSurfSummary(summary, surfData) {
    // Check if OPENAI_API_KEY is configured
    if (typeof process.env.OPENAI_API_KEY !== 'string' || process.env.OPENAI_API_KEY.length === 0) {
        return {
            validatedSummary: summary,
            wasValidated: false,
            fallback: true,
            reason: 'OpenAI API key not configured'
        };
    }

    // Create a prompt for AI validation and improvement
    const validationPrompt = `You are a grumpy surf report editor who's really into crystals and haiku poetry. Based on the surf conditions provided, create a structured response in the exact format below.

Surf data context:
- Wave height: ${surfData?.waveHeight || 'N/A'}ft
- Wave period: ${surfData?.wavePeriod || 'N/A'}s
- Wind speed: ${surfData?.windSpeed || 'N/A'}kts
- Wind direction: ${surfData?.windDirection || 'N/A'}°
- Current conditions summary: "${summary}"

Return ONLY this exact format, nothing else:

Stoke rating: [number 1-10]

[Haiku line 1 - exactly 5 syllables about the surf]
[Haiku line 2 - exactly 7 syllables about the conditions]
[Haiku line 3 - exactly 5 syllables about the vibe]

Crystal of the day: [Crystal name that matches the surf energy]

Rules:
- Stoke rating should reflect how good the surf actually is (1=terrible, 10=perfect)
- Haiku must follow 5-7-5 syllable pattern exactly
- Haiku should capture the essence of the current surf conditions
- Crystal should match the energy/vibe of the conditions
- Keep it authentic to surf culture
- No extra text, explanations, or formatting`;

    try {
        // Call OpenAI API via Cloudflare AI Gateway
        // Gateway provides: 1hr caching, 50 req/hr rate limiting, analytics, and cost savings
        const aiResponse = await fetch(OPENAI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a grumpy surf report editor who ensures surf summaries are grammatically correct and readable while maintaining their authentic surf culture voice, but you\'re also really into crystals and vibes. Make sure to provide a stoke rating and recommend a crystal of the day based on the summary vibe.'
                    },
                    {
                        role: 'user',
                        content: validationPrompt
                    }
                ],
                max_tokens: OPENAI_CONFIG.maxTokens,
                temperature: OPENAI_CONFIG.temperature
            })
        });

        if (!aiResponse.ok) {
            const errorBody = await aiResponse.text();
            console.error(`OpenAI API error (${aiResponse.status}):`, errorBody);
            return {
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: `OpenAI API error: ${aiResponse.status}`,
                errorDetails: errorBody.substring(0, 200)
            };
        }

        const aiData = await aiResponse.json();
        const validatedSummary = aiData.choices?.[0]?.message?.content?.trim();

        if (!validatedSummary || validatedSummary.length === 0) {
            return {
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'AI returned empty response'
            };
        }

        // Basic sanity check - only reject if way too long or too short
        // Allow longer responses for formatted output with stoke rating, haiku, and crystal
        if (validatedSummary.length > VALIDATION_THRESHOLDS.maxSummaryLength ||
            validatedSummary.length < VALIDATION_THRESHOLDS.minSummaryLength) {
            return {
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'AI response invalid length'
            };
        }

        return {
            validatedSummary: validatedSummary,
            wasValidated: true,
            originalLength: summary.length,
            validatedLength: validatedSummary.length
        };

    } catch (error) {
        console.error('OpenAI service error:', error.message);
        return {
            validatedSummary: summary,
            wasValidated: false,
            fallback: true,
            error: 'Validation service temporarily unavailable'
        };
    }
}
