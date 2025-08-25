// API utility functions and shared utilities for surf components

// Shared utility functions
export const surfUtils = {
    // Wind direction utilities
    getWindDirectionText: (degrees) => {
        if (degrees >= 337.5 || degrees < 22.5) return 'N';
        if (degrees >= 22.5 && degrees < 67.5) return 'NE';
        if (degrees >= 67.5 && degrees < 112.5) return 'E';
        if (degrees >= 112.5 && degrees < 157.5) return 'SE';
        if (degrees >= 157.5 && degrees < 202.5) return 'S';
        if (degrees >= 202.5 && degrees < 247.5) return 'SW';
        if (degrees >= 247.5 && degrees < 292.5) return 'W';
        if (degrees >= 292.5 && degrees < 337.5) return 'NW';
        return 'N/A';
    },

    // Tide analysis utilities
    getCurrentTideDirection: (tideData) => {
        if (!tideData?.predictions || tideData.predictions.length < 2) {
            return 'unknown';
        }
        const now = new Date();
        const predictions = tideData.predictions;
        const sortedPredictions = predictions
            .map(p => ({ ...p, datetime: new Date(p.t.replace(' ', 'T')) }))
            .sort((a, b) => a.datetime - b.datetime);
        const currentIndex = sortedPredictions.findIndex(p => p.datetime > now);
        if (currentIndex > 0) {
            const lastTide = sortedPredictions[currentIndex - 1];
            const nextTide = sortedPredictions[currentIndex];
            if (lastTide.type === 'H' && nextTide.type === 'L') {
                return 'dropping';
            } else if (lastTide.type === 'L' && nextTide.type === 'H') {
                return 'rising';
            }
        }
        return 'unknown';
    },

    // Wave quality assessment
    getWaveQuality: (height) => {
        if (!height) return { emoji: '❓', status: 'Unknown' };
        const ft = height * 3.281;
        if (ft < 2) return { emoji: '😴', status: 'Flat City' };
        if (ft < 4) return { emoji: '🏄‍♂️', status: 'Fun Size' };
        if (ft < 6) return { emoji: '🔥', status: 'Epic!' };
        return { emoji: '⚡', status: 'GNARLY!' };
    },

    // Wind condition assessment
    getWindCondition: (speed) => {
        if (!speed) return { emoji: '❓', status: 'Unknown', color: 'var(--text-color)' };
        if (speed < 5) return { emoji: '😴', status: 'Glassy', color: 'var(--electric-green)' };
        if (speed < 10) return { emoji: '👌', status: 'Light', color: 'var(--neon-cyan)' };
        if (speed < 15) return { emoji: '💨', status: 'Moderate', color: 'var(--sunset-orange)' };
        if (speed < 25) return { emoji: '🌪️', status: 'Strong', color: 'var(--coral-pink)' };
        return { emoji: '⚡', status: 'Howling!', color: 'var(--coral-pink)' };
    },

    // Confidence color mapping
    getConfidenceColor: (confidence) => {
        if (confidence >= 0.7) return 'var(--electric-green)';
        if (confidence >= 0.4) return 'var(--sunset-orange)';
        return 'var(--coral-pink)';
    },

    // Confidence level text
    getConfidenceLevel: (confidence) => {
        if (confidence >= 0.7) return 'High';
        if (confidence >= 0.4) return 'Medium';
        return 'Low';
    },

    // Recommendation emoji
    getRecommendationEmoji: (recommendation) => {
        return recommendation?.includes('GO SURF') ? '🏄‍♂️' : '😴';
    }
};

export async function createAISummary(summary, surfData) {
    try {
        const response = await fetch('/api/create-ai-summary', {
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

