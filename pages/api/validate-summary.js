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
        const validationPrompt = `You are a grumpy surf report editor who's really into crystals. Review this surf summary for grammar, clarity, and readability. Provide an overall stoke rating and the crystal of the day that you recommend based on the vibe of the summary. 

        Original summary: "${summary}"

        Surf data context:
        - Wave height: ${surfData?.waveHeight || 'N/A'}ft
        - Wave period: ${surfData?.wavePeriod || 'N/A'}s  
        - Wind speed: ${surfData?.windSpeed || 'N/A'}kts
        - Wind direction: ${surfData?.windDirection || 'N/A'}°

        Rules:
        1. Recap the summary and conditions in haiku form
        2. Maintain the surfer slang and culture
        3. Maintain the surfer slang and personality
        4. Provide a stoke rating from 1 to 10 based on the overall vibe of the summary

        Return ONLY the improved summary text, no explanations.`;

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
        // Always fallback to original summary on error
        const fallbackResult = { 
            validatedSummary: req.body.summary,
            wasValidated: false,
            fallback: true,
            error: error.message 
        };
        // Cache error result to avoid repeated failures
        if (req.body.summary && req.body.surfData) {
            const errorCacheKey = getCacheKey(req.body.summary, req.body.surfData);
            setCachedResult(errorCacheKey, fallbackResult);
        }
        res.status(200).json(fallbackResult);
    }
}