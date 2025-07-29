export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { summary, surfData } = req.body;

        if (!summary) {
            console.log('[validate-summary] No summary provided');
            return res.status(400).json({ error: 'Summary is required' });
        }

        // Create a prompt for AI validation and improvement
        const validationPrompt = `You are a grumpy surf report editor. Review this surf summary for grammar, clarity, and readability. Provide an overall stoke rating. 

        Original summary: "${summary}"

        Surf data context:
        - Wave height: ${surfData?.waveHeight || 'N/A'}ft
        - Wave period: ${surfData?.wavePeriod || 'N/A'}s  
        - Wind speed: ${surfData?.windSpeed || 'N/A'}kts
        - Wind direction: ${surfData?.windDirection || 'N/A'}°

        Rules:
        1. Keep the same emoji and overall tone/urgency
        2. Fix any grammar issues or awkward phrasing
        3. Ensure technical surf terms are used correctly
        4. Keep it under 200 characters if possible
        5. Maintain the surfer slang and personality

        Return ONLY the improved summary text, no explanations.`;

        // Debug log: check if OPENAI_API_KEY is defined (do not log the key value)
        if (typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.length > 0) {
            // console.log('[validate-summary] OPENAI_API_KEY is defined and non-empty');
        } else {
            // console.log('[validate-summary] OPENAI_API_KEY is NOT defined or empty, returning original summary');
            // If no API key, return original summary (graceful degradation)
            return res.status(200).json({ 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'OpenAI API key not configured'
            });
        }

        // Use OpenAI to validate/improve the summary
        // console.log('[validate-summary] Calling OpenAI API for summary validation...');
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
                        content: 'You are a professional surf report editor who ensures surf summaries are grammatically correct and readable while maintaining their authentic surf culture voice.'
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
            // If AI validation fails, return original summary
            // console.warn('[validate-summary] AI validation failed, returning original summary. Status:', aiResponse.status);
            return res.status(200).json({ 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true 
            });
        }

        const aiData = await aiResponse.json();
        // console.log('[validate-summary] OpenAI API response:', JSON.stringify(aiData));
        const validatedSummary = aiData.choices?.[0]?.message?.content?.trim();

        if (!validatedSummary || validatedSummary.length === 0) {
            // Fallback to original if AI returns empty
            // console.warn('[validate-summary] AI returned empty summary, using original');
            return res.status(200).json({ 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true 
            });
        }

        // Basic sanity check - if AI response is dramatically different or too long, use original
        if (validatedSummary.length > summary.length * 1.5 || validatedSummary.length > 300) {
            // console.warn('[validate-summary] AI response too long or too different, using original');
            return res.status(200).json({ 
                validatedSummary: summary,
                wasValidated: false,
                fallback: true,
                reason: 'AI response too different from original'
            });
        }

        // console.log('[validate-summary] Returning validated summary:', validatedSummary);
        res.status(200).json({ 
            validatedSummary: validatedSummary,
            wasValidated: true,
            originalLength: summary.length,
            validatedLength: validatedSummary.length
        });

    } catch (error) {
        // console.error('[validate-summary] Summary validation error:', error);
        // Always fallback to original summary on error
        res.status(200).json({ 
            validatedSummary: req.body.summary,
            wasValidated: false,
            fallback: true,
            error: error.message 
        });
    }
}