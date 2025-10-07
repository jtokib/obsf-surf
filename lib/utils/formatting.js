/**
 * Formatting Utilities
 * Helper functions for formatting data in surf components
 */

import { getWindDirectionText, getCurrentTideDirection } from './surfUtils.js';

/**
 * Creates a basic surf conditions summary from raw data
 * @param {Object} buoyData - Buoy data
 * @param {Object} windData - Wind data
 * @param {Object} tideData - Tide data
 * @param {Object} surfData - Processed surf data (waveHeight, wavePeriod, windSpeed, windDirection)
 * @returns {string} - Formatted summary string
 */
export function createBasicSurfSummary(buoyData, windData, tideData, surfData) {
    const waveHeight = surfData.waveHeight.toFixed(1);
    const wavePeriod = surfData.wavePeriod;
    const windSpeed = surfData.windSpeed;
    const windDir = windData?.directionText || getWindDirectionText(surfData.windDirection);
    const tideDirection = getCurrentTideDirection(tideData);

    return `Current surf conditions: ${waveHeight}ft waves at ${wavePeriod}s period, ${windSpeed}kt ${windDir} wind, tide ${tideDirection}`;
}

/**
 * Parses and extracts components from AI-generated surf summary
 * @param {string} summary - AI summary text
 * @returns {Object|null} - { stokeRating, haiku, crystal } or null if not formatted
 */
export function parseAISummary(summary) {
    if (!summary) return null;

    const stokeMatch = summary.match(/Stoke rating:\s*(\d+(?:\/10)?)/i);
    const haikuMatch = summary.match(/\n([^\n]+)\n([^\n]+)\n([^\n]+)\n/);
    const crystalMatch = summary.match(/Crystal of the day:\s*(.+)/i);

    if (!stokeMatch && !crystalMatch) {
        return null;
    }

    return {
        stokeRating: stokeMatch ? stokeMatch[1] : null,
        haiku: haikuMatch ? {
            line1: haikuMatch[1],
            line2: haikuMatch[2],
            line3: haikuMatch[3]
        } : null,
        crystal: crystalMatch ? crystalMatch[1] : null
    };
}
