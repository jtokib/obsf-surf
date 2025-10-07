import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createAISummary, surfUtils } from './surfApi';
import { createBasicSurfSummary } from '../lib/utils/formatting.js';

const SurfAISummary = ({ buoyData, windData, tideData, surfPrediction, predictionLoading, loading }) => {
    // Helper functions for surf prediction display - imported from surfUtils
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

    // Simplified data check for validation trigger
    const hasRequiredData = !loading && buoyData && windData;

    // Prevent infinite validation loop by tracking last validated summary
    const validationTimeoutRef = useRef(null);
    const validationInProgress = useRef(false);
    const debounceTimeoutRef = useRef(null);
    const hasMountedRef = useRef(false); // Guard against React Strict Mode double execution
    
    useEffect(() => {
        // Guard against React Strict Mode double execution and duplicate runs
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }
        
        // Start validation when data is available and not already validating
        if (
            hasRequiredData &&
            !summaryValidating &&
            !validationInProgress.current &&
            !validatedSummary
        ) {
            // Debounce validation calls to prevent rapid successive calls
            debounceTimeoutRef.current = setTimeout(() => {
                setSummaryValidating(true);
                setValidationTimeout(false);
                validationInProgress.current = true;
            
                // Set timeout for validation
                validationTimeoutRef.current = setTimeout(() => {
                    setValidationTimeout(true);
                    setSummaryValidating(false);
                    validationInProgress.current = false;
                    setValidatedSummary("bad juju today. can't see the surf");
                }, 10000); // 10 second timeout
                
                const surfData = {
                    waveHeight: parseFloat(buoyData?.Hs) || 0,
                    wavePeriod: parseFloat(buoyData?.Tp) || 0,
                    windSpeed: parseFloat(windData?.speed) || 0,
                    windDirection: windData?.direction || 0
                };

                const basicSummary = createBasicSurfSummary(buoyData, windData, tideData, surfData);
                createAISummary(basicSummary, surfData)
                    .then(result => {
                        if (validationTimeoutRef.current) {
                            clearTimeout(validationTimeoutRef.current);
                            setValidatedSummary(result.validatedSummary);
                            setSummaryValidating(false);
                            validationInProgress.current = false;
                        }
                    })
                    .catch(() => {
                        if (validationTimeoutRef.current) {
                            clearTimeout(validationTimeoutRef.current);
                            setValidationTimeout(true);
                            setValidatedSummary("bad juju today. can't see the surf");
                            setSummaryValidating(false);
                            validationInProgress.current = false;
                        }
                    });
            }, 500); // 500ms debounce delay
        }
        
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [hasRequiredData, summaryValidating, validatedSummary]);

    // Only show validated summary or loading state
    const shouldShowLoading = loading || summaryValidating || !validatedSummary;

    // Helper function to determine recommendation badge
    const getRecommendationBadge = () => {
        if (!surfPrediction || predictionLoading) return null;
        
        const recommendation = surfPrediction.summary?.recommendation || surfPrediction.prediction?.recommendation || '';
        const confidence = surfPrediction.prediction?.confidence || 0;
        const shouldGo = recommendation.includes('GO SURF') || surfPrediction.summary?.should_go;
        
        return {
            text: shouldGo ? 'Go Surf!' : 'Skip Surfing!',
            className: shouldGo ? 'go-surf' : 'skip-surf',
            confidence: Math.round(confidence * 100)
        };
    };

    return (
        <motion.div
            className="surf-ai-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            {/* CONSOLIDATED SURF AI Section */}
            <motion.div
                className="surf-ai-unified"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <div className="surf-ai-header">
                    <span className="ai-label">🤖 SURF AI</span>
                    <div className="recommendation-section">
                        {predictionLoading ? (
                            <div className="loading-spinner">🌊 Loading...</div>
                        ) : getRecommendationBadge() ? (
                            <>
                                <div className={`recommendation-badge ${getRecommendationBadge().className}`}>
                                    {getRecommendationBadge().text}
                                </div>
                                <div className="confidence-score">
                                    {getRecommendationBadge().confidence}%
                                </div>
                            </>
                        ) : (
                            <div className="confidence-indicator">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <span
                                        key={i}
                                        className={`confidence-dot ${i < 3 ? 'active' : ''}`}
                                    >
                                        •
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="ai-content">
                    {shouldShowLoading 
                        ? <div className="spinner">🌊 Loading surf wisdom...</div>
                        : formatAISummary(validatedSummary) || validatedSummary
                    }
                </div>
            </motion.div>
        </motion.div>
    );
};


// ...existing code...
export default SurfAISummary;