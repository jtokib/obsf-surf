/**
 * Application Constants
 * Configuration and constant values used throughout the application
 */

// Cache configuration
export const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
export const DUPLICATE_PROTECTION_WINDOW = 2000; // 2 seconds

// OpenAI configuration
export const OPENAI_CONFIG = {
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.3,
    // Cloudflare AI Gateway endpoint (with 1hr caching and 50 req/hr rate limiting)
    apiUrl: 'https://gateway.ai.cloudflare.com/v1/0852d047408236af6d0ffc88540d90b9/obsf-surf-ai/openai/chat/completions',
    // Fallback to direct OpenAI if needed
    directApiUrl: 'https://api.openai.com/v1/chat/completions'
};

// Validation thresholds
export const VALIDATION_THRESHOLDS = {
    minSummaryLength: 10,
    maxSummaryLength: 500,
    validationTimeout: 10000 // 10 seconds
};

// Wind thresholds (in knots)
export const WIND_THRESHOLDS = {
    glassy: 5,      // 0-5kts = Glassy
    light: 10,      // 5-10kts = Light
    moderate: 15,   // 10-15kts = Moderate
    strong: 25,     // 15-25kts = Strong
    unsurfable: 12  // >12kts onshore = generally unsurfable
};

// Wave height thresholds (in meters, will be converted to feet)
export const WAVE_THRESHOLDS = {
    flat: 2,      // <2ft = Flat
    funSize: 4,   // 2-4ft = Fun Size
    epic: 6       // 4-6ft = Epic, >6ft = Gnarly
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
    high: 0.7,   // >=70% = High confidence
    medium: 0.4  // 40-70% = Medium, <40% = Low
};

// API debounce and timeout settings
export const API_SETTINGS = {
    debounceDelay: 500,        // 500ms debounce for AI requests
    validationTimeout: 10000   // 10 second timeout for validation
};
