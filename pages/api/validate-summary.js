// Simple in-memory cache for validation results
const validationCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

function getCacheKey(summary, surfData) {
    return `${summary}-${JSON.stringify(surfData)}`;
}

function getCachedResult(cacheKey) {
    const cached = validationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
    }
    if (cached) {
        validationCache.delete(cacheKey); // Remove expired entry
    }
    return null;
}

function setCachedResult(cacheKey, result) {
    validationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
    });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { summary, surfData } = req.body;

        if (!summary) {
            return res.status(400).json({ error: 'Summary is required' });
        }

        // Check cache first to avoid burning API credits
        const cacheKey = getCacheKey(summary, surfData);
        const cachedResult = getCachedResult(cacheKey);
        if (cachedResult) {
            return res.status(200).json({
                ...cachedResult,
                cached: true
            });
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

        // Check if OPENAI_API_KEY is configured
        if (typeof process.env.OPENAI_API_KEY !== 'string' || process.env.OPENAI_API_KEY.length === 0) {
            const fallbackResult = { 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'OpenAI API key not configured'
            };
            // Cache fallback result to avoid repeated checks
            setCachedResult(cacheKey, fallbackResult);
            return res.status(200).json(fallbackResult);
        }

        // Use OpenAI to validate/improve the summary
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
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
                max_tokens: 150,
                temperature: 0.3 // Lower temperature for more consistent, conservative edits
            })
        });

        if (!aiResponse.ok) {
            const fallbackResult = { 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: `OpenAI API error: ${aiResponse.status}`
            };
            // Cache fallback result for failed API calls
            setCachedResult(cacheKey, fallbackResult);
            return res.status(200).json(fallbackResult);
        }

        const aiData = await aiResponse.json();
        const validatedSummary = aiData.choices?.[0]?.message?.content?.trim();

        if (!validatedSummary || validatedSummary.length === 0) {
            const fallbackResult = { 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'AI returned empty response'
            };
            // Cache fallback result
            setCachedResult(cacheKey, fallbackResult);
            return res.status(200).json(fallbackResult);
        }

        // Basic sanity check - if AI response is dramatically different or too long, use original
        // Allow more length for stoke rating addition
        if (validatedSummary.length > summary.length * 2.0 || validatedSummary.length > 400) {
            const fallbackResult = { 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'AI response too different from original'
            };
            // Cache fallback result
            setCachedResult(cacheKey, fallbackResult);
            return res.status(200).json(fallbackResult);
        }

        const result = { 
            validatedSummary: validatedSummary,
            wasValidated: true,
            originalLength: summary.length,
            validatedLength: validatedSummary.length
        };
        
        // Cache the successful result
        setCachedResult(cacheKey, result);
        
        res.status(200).json(result);

    } catch (error) {
        console.error('Validation API error:', error.message);
        // Always fallback to original summary on error
        const fallbackResult = { 
            validatedSummary: req.body.summary,
            wasValidated: false,
            fallback: true,
            error: 'Validation service temporarily unavailable'
        };
        // Cache error result to avoid repeated failures
        if (req.body.summary && req.body.surfData) {
            const errorCacheKey = getCacheKey(req.body.summary, req.body.surfData);
            setCachedResult(errorCacheKey, fallbackResult);
        }
        res.status(200).json(fallbackResult);
    }
}