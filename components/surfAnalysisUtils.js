// Surf analysis utility functions extracted from SurfAISummary.js

// Wind analysis function
export function analyzeWind(direction, speed) {
    const directionText = getWindDirectionText(direction);
    if (direction >= 45 && direction <= 135) {
        return {
            quality: 'excellent',
            description: 'offshore',
            text: `${speed}kts ${directionText} offshore`,
            score: speed < 25 ? 5 : 3,
            isOffshore: true
        };
    }
    if (speed <= 3) {
        return {
            quality: 'excellent',
            description: 'light',
            text: `${speed}kts ${directionText}`,
            score: 5,
            isOffshore: false
        };
    } else if (speed <= 5) {
        return {
            quality: 'good',
            description: 'light',
            text: `${speed}kts ${directionText}`,
            score: 4,
            isOffshore: false
        };
    } else if (speed <= 8) {
        return {
            quality: 'fair',
            description: 'moderate',
            text: `${speed}kts ${directionText}`,
            score: 2.5,
            isOffshore: false
        };
    } else if (speed <= 12) {
        return {
            quality: 'poor',
            description: 'strong',
            text: `${speed}kts ${directionText}`,
            score: 2,
            isOffshore: false
        };
    } else if (speed <= 18) {
        return {
            quality: 'poor',
            description: 'very strong',
            text: `${speed}kts ${directionText}`,
            score: 1,
            isOffshore: false
        };
    } else {
        return {
            quality: 'dangerous',
            description: 'extreme',
            text: `${speed}kts ${directionText}`,
            score: 0,
            isOffshore: false
        };
    }
}

// Tide analysis function
export function analyzeTide(tideData) {
    if (!tideData?.predictions || tideData.predictions.length < 2) {
        return {
            quality: 'unknown',
            direction: 'unknown',
            text: 'tide data unavailable',
            score: 2.5,
            nextHighTide: null,
            isDropping: false,
            timeToNextHigh: null
        };
    }
    const now = new Date();
    const predictions = tideData.predictions;
    let currentTideDirection = 'unknown';
    let nextHighTide = null;
    let isDropping = false;
    const sortedPredictions = predictions
        .map(p => ({ ...p, datetime: new Date(p.t.replace(' ', 'T')) }))
        .sort((a, b) => a.datetime - b.datetime);
    const currentIndex = sortedPredictions.findIndex(p => p.datetime > now);
    if (currentIndex > 0) {
        const lastTide = sortedPredictions[currentIndex - 1];
        const nextTide = sortedPredictions[currentIndex];
        if (lastTide.type === 'H' && nextTide.type === 'L') {
            currentTideDirection = 'dropping';
            isDropping = true;
        } else if (lastTide.type === 'L' && nextTide.type === 'H') {
            currentTideDirection = 'rising';
            nextHighTide = nextTide;
        }
    }
    if (!nextHighTide && currentIndex >= 0) {
        for (let i = currentIndex; i < sortedPredictions.length; i++) {
            if (sortedPredictions[i].type === 'H') {
                nextHighTide = sortedPredictions[i];
                break;
            }
        }
    }
    let timeToNextHigh = null;
    if (nextHighTide) {
        const timeDiff = nextHighTide.datetime - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        timeToNextHigh = `${hours}h ${minutes}m`;
    }
    let score, quality, description;
    if (isDropping) {
        score = 4.5;
        quality = 'excellent';
        description = 'dropping';
    } else if (currentTideDirection === 'rising') {
        score = 2;
        quality = 'fair';
        description = 'rising';
    } else {
        score = 2.5;
        quality = 'unknown';
        description = 'direction unclear';
    }
    return {
        quality,
        direction: currentTideDirection,
        text: `tide ${description}`,
        score,
        nextHighTide,
        isDropping,
        timeToNextHigh
    };
}

// Swell analysis function
export function analyzeSwell(height, period) {
    if (height >= 5 && period >= 15) {
        return {
            quality: 'excellent',
            description: 'long period',
            text: `${height}ft @ ${period}s`,
            score: 5,
            type: 'long-period'
        };
    } else if (height < 5 && period >= 15) {
        return {
            quality: 'good',
            description: 'small',
            text: `${height}ft @ ${period}s`,
            score: 4,
            type: 'small-good'
        };
    } else if (height >= 5 && period < 12) {
        return {
            quality: 'fair',
            description: 'short period',
            text: `${height}ft @ ${period}s`,
            score: 2,
            type: 'windswell'
        };
    } else if (period >= 12 && period < 15) {
        return {
            quality: 'fair',
            description: 'mid period',
            text: `${height}ft @ ${period}s`,
            score: 3,
            type: 'mid-period'
        };
    } else {
        return {
            quality: 'poor',
            description: 'small',
            text: `${height}ft @ ${period}s`,
            score: 1,
            type: 'poor'
        };
    }
}

// Calculate overall surf quality with tide weighting and ML prediction
export function calculateOverallQuality(windAnalysis, swellAnalysis, tideAnalysis, predictionScore = null) {
    // Convert string prediction to numeric score for calculations
    let numericPrediction = null;
    if (predictionScore === 'Good') {
        numericPrediction = 8; // High score for good conditions
    } else if (predictionScore === 'Bad') {
        numericPrediction = 2; // Low score for bad conditions  
    } else if (typeof predictionScore === 'number') {
        numericPrediction = predictionScore; // Support legacy numeric scores
    }
    if (windAnalysis.score <= 1 && !windAnalysis.isOffshore) {
        return {
            quality: 'terrible',
            emoji: '💨',
            confidence: 5,
            score: 0.5,
            isFiring: false,
            hasMLPrediction: predictionScore !== null && predictionScore !== undefined,
            mlPrediction: predictionScore,
            windOverride: true
        };
    }
    if (windAnalysis.score <= 2 && !windAnalysis.isOffshore) {
        let combinedScore = Math.min(2.5, (windAnalysis.score * 0.6 + swellAnalysis.score * 0.3 + tideAnalysis.score * 0.1));
        if (numericPrediction !== null) {
            const normalizedPrediction = Math.max(0, Math.min(2.5, numericPrediction / 4));
            combinedScore = Math.min(2.5, combinedScore * 0.8 + normalizedPrediction * 0.2);
        }
        let quality, emoji;
        if (combinedScore >= 2.0) {
            quality = 'poor';
            emoji = '💨';
        } else {
            quality = 'terrible';
            emoji = '🌪️';
        }
        return {
            quality,
            emoji,
            confidence: 4,
            score: combinedScore,
            isFiring: false,
            hasMLPrediction: predictionScore !== null && predictionScore !== undefined,
            mlPrediction: predictionScore,
            windOverride: true
        };
    }
    let combinedScore = (windAnalysis.score * 0.4 + swellAnalysis.score * 0.4 + tideAnalysis.score * 0.2);
    if (numericPrediction !== null) {
        const normalizedPrediction = Math.max(0, Math.min(5, numericPrediction / 2));
        combinedScore = combinedScore * 0.7 + normalizedPrediction * 0.3;
    }
    let quality, emoji, confidence;
    const waveHeight = parseFloat(swellAnalysis.text.match(/[\d.]+/)?.[0]) || 0;
    const wavePeriod = parseFloat(swellAnalysis.text.match(/@ ([\d.]+)s/)?.[1]) || 0;
    const isFiring = waveHeight >= 10 && wavePeriod >= 18 && tideAnalysis.isDropping;
    const hasMLPrediction = predictionScore !== null && predictionScore !== undefined;
    if (isFiring) {
        quality = 'firing';
        emoji = '🔥';
        confidence = hasMLPrediction ? 5 : 5;
    } else if (combinedScore >= 4.2) {
        quality = 'epic';
        emoji = '⚡';
        confidence = hasMLPrediction ? 5 : 5;
    } else if (combinedScore >= 3.5) {
        quality = 'good';
        emoji = '👌';
        confidence = hasMLPrediction ? 5 : 4;
    } else if (combinedScore >= 2.5) {
        quality = 'fair';
        emoji = '🤷‍♂️';
        confidence = hasMLPrediction ? 4 : 3;
    } else if (combinedScore >= 1.5) {
        quality = 'poor';
        emoji = '😬';
        confidence = hasMLPrediction ? 3 : 2;
    } else {
        quality = 'terrible';
        emoji = '💀';
        confidence = hasMLPrediction ? 2 : 1;
    }
    return { quality, emoji, confidence, score: combinedScore, isFiring, hasMLPrediction, mlPrediction: predictionScore };
}

// Generate AI summary text
export function generateSummary(windAnalysis, swellAnalysis, tideAnalysis, overallQuality, data) {
    try {
        if (!windAnalysis || !swellAnalysis || !tideAnalysis || !overallQuality) {
            return 'Surf summary unavailable.';
        }

        // Compose a readable summary from the analysis objects
        const wind = windAnalysis.text || '';
        const swell = swellAnalysis.text || '';
        const tide = tideAnalysis.text || '';
        const quality = overallQuality.quality || '';
        const emoji = overallQuality.emoji || '';
        const firing = '';
        const confidence = overallQuality.confidence ? `Confidence: ${overallQuality.confidence}/5.` : '';

        // Include ML prediction if present
        let prediction = '';
        if (data && data.predictionScore !== null && data.predictionScore !== undefined) {
            if (data.predictionScore === 1 || data.predictionScore === 'Good') {
                prediction = '🏄‍♂️ Go surfing! ';
            } else if (data.predictionScore === 0 || data.predictionScore === 'Bad') {
                prediction = '🚫 Don\'t go surfing. ';
            } else if (typeof data.predictionScore === 'number') {
                // Legacy numeric score handling
                prediction = data.predictionScore >= 0.5 ? '🏄‍♂️ Go surfing! ' : '🚫 Don\'t go surfing. ';
            }
        }

        // Remove tide recommendations from summary

        return `${emoji} Surf quality: ${quality}. ${swell} | ${wind} | ${tide}. ${prediction}${confidence}`.replace(/\s+/g, ' ').trim();
    } catch (err) {
        console.error('[surfAnalysisUtils] generateSummary error:', err);
        return 'Surf summary unavailable.';
    }
}

// Generate tide-specific recommendations (deprecated - personality removed)
export function getTideRecommendation(tideAnalysis, windAnalysis, swellAnalysis) {
    return ''; // No recommendations in factual summary
}

// Helper function to get wind direction text
export function getWindDirectionText(degrees) {
    if (degrees >= 337.5 || degrees < 22.5) return 'N';
    if (degrees >= 22.5 && degrees < 67.5) return 'NE';
    if (degrees >= 67.5 && degrees < 112.5) return 'E';
    if (degrees >= 112.5 && degrees < 157.5) return 'SE';
    if (degrees >= 157.5 && degrees < 202.5) return 'S';
    if (degrees >= 202.5 && degrees < 247.5) return 'SW';
    if (degrees >= 247.5 && degrees < 292.5) return 'W';
    if (degrees >= 292.5 && degrees < 337.5) return 'NW';
    return 'N/A';
}

// Helper function to get simple wind direction for ML prediction
export function getSimpleWindDirection(degrees) {
    if (degrees >= 315 || degrees < 45) return 'N';
    if (degrees >= 45 && degrees < 135) return 'E';
    if (degrees >= 135 && degrees < 225) return 'S';
    if (degrees >= 225 && degrees < 315) return 'W';
    return 'W';
}
