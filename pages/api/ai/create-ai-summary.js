import { validateSurfSummary } from '../../../lib/services/openai.js';
import { CACHE_DURATION, DUPLICATE_PROTECTION_WINDOW } from '../../../lib/constants.js';

// Simple in-memory cache for validation results
const validationCache = new Map();

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

// Track validation calls to prevent duplicates
const validationCallsLog = new Map();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { summary, surfData } = req.body;

        // Debug logging with timestamp
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] create-ai-summary called with summary length: ${summary?.length || 0}`);

        // Check for duplicate calls in rapid succession
        const callKey = getCacheKey(summary, surfData);
        const lastCall = validationCallsLog.get(callKey);
        const now = Date.now();

        if (lastCall && (now - lastCall) < DUPLICATE_PROTECTION_WINDOW) {
            console.log(`[${timestamp}] Duplicate call detected within ${DUPLICATE_PROTECTION_WINDOW}ms, ignoring`);
            return res.status(429).json({
                error: 'Duplicate request',
                validatedSummary: summary,
                wasValidated: false,
                reason: 'Duplicate call protection'
            });
        }

        validationCallsLog.set(callKey, now);

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

        // Use the OpenAI service to validate the summary
        const result = await validateSurfSummary(summary, surfData);

        // Cache the result
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
