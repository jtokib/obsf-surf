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

