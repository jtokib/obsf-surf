import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    analyzeWind,
    analyzeTide,
    analyzeSwell,
    calculateOverallQuality,
    generateSummary
} from './surfAnalysisUtils';
import { validateSummary, getPrediction } from './surfApi';

const SurfAISummary = ({ buoyData, windData, tideData, loading }) => {
    const [predictionScore, setPredictionScore] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [validatedSummary, setValidatedSummary] = useState(null);
    const [summaryValidating, setSummaryValidating] = useState(false);
    const [validationTimeout, setValidationTimeout] = useState(false);

    // Function to parse and format AI summary into separate elements
    const formatAISummary = (summary) => {
        if (!summary) return null;

        // Check if this is the formatted AI summary with stoke rating, haiku, and crystal
        const stokeMatch = summary.match(/Stoke rating:\s*(\d+(?:\/10)?)/i);
        const haikuMatch = summary.match(/\n([^\n]+)\n([^\n]+)\n([^\n]+)\n/);
        const crystalMatch = summary.match(/Crystal of the day:\s*(.+)/i);

        if (stokeMatch || crystalMatch) {
            const elements = [];

            // Extract stoke rating
            if (stokeMatch) {
                elements.push(
                    <p key="stoke" className="stoke-rating">
                        🔥 Stoke Rating: {stokeMatch[1]}
                    </p>
                );
            }

            // Extract haiku
            if (haikuMatch) {
                elements.push(
                    <p key="haiku" className="surf-haiku">
                        🎋 Surf Haiku:<br/>
                        {haikuMatch[1]}<br/>
                        {haikuMatch[2]}<br/>
                        {haikuMatch[3]}
                    </p>
                );
            }

            // Extract crystal
            if (crystalMatch) {
                elements.push(
                    <p key="crystal" className="crystal-recommendation">
                        💎 Crystal of the Day: {crystalMatch[1]}
                    </p>
                );
            }

            return elements.length > 0 ? elements : <div className="ai-summary-text">{summary}</div>;
        }

        // Return original summary if not in expected format
        return <div className="ai-summary-text">{summary}</div>;
    };



    // Fetch prediction when surf data changes
    useEffect(() => {
        // Always attempt to get a prediction, but summary/validation will proceed regardless of prediction result
        if (buoyData && windData && tideData && !loading) {
            setPredictionLoading(true);
            const waveHeight = parseFloat(buoyData.Hs) || 0;
            const windDirection = windData.direction || 0;
            let tidePhase = 'UNKNOWN';
            if (tideData?.predictions) {
                const tideAnalysis = analyzeTide(tideData);
                tidePhase = tideAnalysis.isDropping ? 'FALLING' :
                    tideAnalysis.direction === 'rising' ? 'RISING' : 'UNKNOWN';
            }
            // Use utility for ML wind direction
            const { getSimpleWindDirection } = require('./surfAnalysisUtils');
            const windDir = getSimpleWindDirection(windDirection);
            const surfConditions = {
                tide: tidePhase,
                wind: windDir,
                pt_reyes: waveHeight.toFixed(1),
                sf_bar: waveHeight.toFixed(1)
            };
            getPrediction(surfConditions)
                .then(score => {
                    setPredictionScore(score);
                    setPredictionLoading(false);
                })
                .catch(() => {
                    // If prediction fails, set score to null and proceed
                    setPredictionScore(null);
                    setPredictionLoading(false);
                });
        }
    }, [buoyData, windData, tideData, loading]);

    const surfAnalysis = useMemo(() => {
        if (loading || !buoyData || !windData) {
            return {
                summary: "🤖 Analyzing current surf conditions...",
                quality: "unknown",
                emoji: "🔄",
                confidence: 0
            };
        }
        const waveHeight = parseFloat(buoyData.Hs) || 0;
        const wavePeriod = parseFloat(buoyData.Tp) || 0;
        const waveDirection = parseInt(buoyData.Dp) || 0;
        const windSpeed = parseFloat(windData.speed) || 0;
        const windDirection = windData.direction || 0;
        const windAnalysis = analyzeWind(windDirection, windSpeed);
        const swellAnalysis = analyzeSwell(waveHeight, wavePeriod);
        const tideAnalysis = analyzeTide(tideData);
        const overallQuality = calculateOverallQuality(windAnalysis, swellAnalysis, tideAnalysis, predictionScore);
        const summary = generateSummary(windAnalysis, swellAnalysis, tideAnalysis, overallQuality, {
            waveHeight,
            wavePeriod,
            windSpeed,
            windDirection,
            predictionScore,
            predictionLoading
        });
        return {
            summary,
            quality: overallQuality.quality,
            emoji: overallQuality.emoji,
            confidence: overallQuality.confidence,
            predictionScore,
            details: {
                wind: windAnalysis,
                swell: swellAnalysis,
                tide: tideAnalysis,
                mlPrediction: predictionScore
            }
        };
    }, [buoyData, windData, tideData, loading, predictionScore, predictionLoading]);

    // Prevent infinite validation loop by tracking last validated summary
    const lastValidatedSummary = useRef(null);
    const validationTimeoutRef = useRef(null);
    
    useEffect(() => {
        // Always validate the summary, even if prediction failed (score is null)
        if (
            surfAnalysis.summary &&
            !loading &&
            !summaryValidating &&
            surfAnalysis.summary !== lastValidatedSummary.current
        ) {
            setSummaryValidating(true);
            setValidationTimeout(false);
            lastValidatedSummary.current = surfAnalysis.summary;
            
            // Set timeout for validation
            validationTimeoutRef.current = setTimeout(() => {
                setValidationTimeout(true);
                setSummaryValidating(false);
                setValidatedSummary("bad juju today. can't see the surf");
            }, 10000); // 10 second timeout
            
            const surfData = {
                waveHeight: parseFloat(buoyData?.Hs) || 0,
                wavePeriod: parseFloat(buoyData?.Tp) || 0,
                windSpeed: parseFloat(windData?.speed) || 0,
                windDirection: windData?.direction || 0
            };
            validateSummary(surfAnalysis.summary, surfData)
                .then(result => {
                    if (validationTimeoutRef.current) {
                        clearTimeout(validationTimeoutRef.current);
                        setValidatedSummary(result.validatedSummary);
                        setSummaryValidating(false);
                    }
                })
                .catch(() => {
                    if (validationTimeoutRef.current) {
                        clearTimeout(validationTimeoutRef.current);
                        setValidationTimeout(true);
                        setValidatedSummary("bad juju today. can't see the surf");
                        setSummaryValidating(false);
                    }
                });
        }
        
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        };
    }, [surfAnalysis.summary, loading, summaryValidating, buoyData, windData]);

    // Use validated summary if available, otherwise use original
    const displaySummary = validatedSummary || surfAnalysis.summary;

    return (
        <motion.div
            className="surf-ai-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            {/* CONDITIONS SUMMARY Section */}
            <motion.div
                className={`ai-summary-content ${surfAnalysis.quality}`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <div className="conditions-summary-header">
                    <span className="ai-emoji">{surfAnalysis.emoji}</span>
                    <span className="ai-label">CONDITIONS SUMMARY</span>
                    <span className="confidence-indicator">
                        {Array.from({ length: 5 }, (_, i) => (
                            <span
                                key={i}
                                className={`confidence-dot ${i < surfAnalysis.confidence ? 'active' : ''}`}
                            >
                                •
                            </span>
                        ))}
                    </span>
                </div>
                <div className="ai-summary-text">
                    {surfAnalysis.summary}
                </div>
            </motion.div>

            {/* SURF AI Section */}
            <motion.div
                className="surf-ai-content"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, hover: { type: "spring", stiffness: 400, damping: 25 } }}
            >
                <div className="surf-ai-header">
                    <span className="ai-label">🤖 SURF AI</span>
                </div>
                <div className="ai-summary-text">
                    {summaryValidating 
                        ? <div className="spinner">🌊 Loading surf wisdom...</div>
                        : formatAISummary(displaySummary) || displaySummary
                    }
                </div>
            </motion.div>
        </motion.div>
    );
};


// ...existing code...
export default SurfAISummary;