import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TideTable from './TideTable';
import SurfAISummary from './SurfAISummary';
import Image from 'next/image';

export default function SurfConditions() {
    const [buoyData, setBuoyData] = useState(null);
    const [tideData, setTideData] = useState(null);
    const [windData, setWindData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [windLoading, setWindLoading] = useState(true);
    const [tideLoading, setTideLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('nowcast');
    const [currentTide, setCurrentTide] = useState(null);

    useEffect(() => {
        fetchBuoyData();
        fetchTideData();
        fetchWindData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchBuoyData = async () => {
        try {
            const response = await fetch('/api/buoy');
            const data = await response.json();
            
            // Check if the response indicates an error (503 or error field)
            if (!response.ok || data.error) {
                setBuoyData(null);
            } else {
                setBuoyData(data);
            }
        } catch (error) {
            console.error('Error fetching buoy data:', error);
            setBuoyData(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchTideData = async () => {
        try {
            const response = await fetch('/api/tide');
            const data = await response.json();
            setTideData(data);
            
            // Calculate current tide state
            if (data?.predictions && Array.isArray(data.predictions)) {
                const currentTideState = calculateCurrentTideState(data.predictions);
                setCurrentTide(currentTideState);
            }
        } catch (error) {
            console.error('Error fetching tide data:', error);
        } finally {
            setTideLoading(false);
        }
    };

    const fetchWindData = async () => {
        try {
            const response = await fetch('/api/wind');
            const data = await response.json();
            setWindData(data);
        } catch (error) {
            console.error('Error fetching wind data:', error);
        } finally {
            setWindLoading(false);
        }
    };

    const calculateCurrentTideState = (predictions) => {
        if (!predictions || !Array.isArray(predictions)) return null;
        
        const now = new Date();
        const currentTime = now.getTime();
        
        // Find the most recent past tide and next future tide
        let pastTide = null;
        let futureTide = null;
        
        for (const prediction of predictions) {
            const tideTime = new Date(`${prediction.t} PDT`).getTime();
            
            if (tideTime <= currentTime) {
                pastTide = { ...prediction, time: tideTime };
            } else if (tideTime > currentTime && !futureTide) {
                futureTide = { ...prediction, time: tideTime };
                break;
            }
        }
        
        if (!pastTide || !futureTide) return null;
        
        // Calculate current height by interpolating between past and future tides
        const timeDiff = futureTide.time - pastTide.time;
        const timeProgress = (currentTime - pastTide.time) / timeDiff;
        const heightDiff = parseFloat(futureTide.v) - parseFloat(pastTide.v);
        const currentHeight = parseFloat(pastTide.v) + (heightDiff * timeProgress);
        
        // Determine if tide is rising or falling
        const isRising = parseFloat(futureTide.v) > parseFloat(pastTide.v);
        
        return {
            height: currentHeight.toFixed(1),
            direction: isRising ? 'rising' : 'falling',
            arrow: isRising ? '↗️' : '↘️',
            status: isRising ? 'Rising' : 'Falling'
        };
    };


    const getWaveQuality = (height) => {
        if (!height) return { emoji: '❓', status: 'Unknown' };
        const ft = height * 3.281;
        if (ft < 2) return { emoji: '😴', status: 'Flat City' };
        if (ft < 4) return { emoji: '🏄‍♂️', status: 'Fun Size' };
        if (ft < 6) return { emoji: '🔥', status: 'Epic!' };
        return { emoji: '⚡', status: 'GNARLY!' };
    };

    const getWindCondition = (speed) => {
        if (!speed) return { emoji: '❓', status: 'Unknown', color: 'var(--text-color)' };
        if (speed < 5) return { emoji: '😴', status: 'Glassy', color: 'var(--electric-green)' };
        if (speed < 10) return { emoji: '👌', status: 'Light', color: 'var(--neon-cyan)' };
        if (speed < 15) return { emoji: '💨', status: 'Moderate', color: 'var(--sunset-orange)' };
        if (speed < 25) return { emoji: '🌪️', status: 'Strong', color: 'var(--coral-pink)' };
        return { emoji: '⚡', status: 'Howling!', color: 'var(--coral-pink)' };
    };

    const tabs = [
        { id: 'nowcast', label: 'Nowcast', icon: '🌊' },
        { id: 'sfbuoy', label: 'Buoy', icon: '📊' },
        { id: 'winds', label: 'Winds', icon: '💨' },
        { id: 'tides', label: 'Tides', icon: '🌙' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    };

    // Surf-themed loading spinner component
    const SurfSpinner = ({ text = "Loading..." }) => (
        <div className="surf-loading-container">
            <div className="surf-spinner">
                <div className="wave-animation">🌊</div>
            </div>
            <p className="loading-text">{text}</p>
        </div>
    );

    return (
        <motion.div
            className="surf-conditions"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="conditions-header" variants={itemVariants}>
                <h2>🏄‍♂️ SURF STATUS 🏄‍♂️</h2>
                <p>Ocean Beach • San Francisco • Real-time data</p>
            </motion.div>

            <SurfAISummary 
                buoyData={buoyData} 
                windData={windData} 
                tideData={tideData}
                loading={loading || windLoading || tideLoading} 
            />

            <motion.div className="conditions-summary" variants={itemVariants}>
                <motion.div className="condition-item" whileHover={{ scale: 1.05 }}>
                    <h3>🌊 SF Buoy</h3>
                    {loading ? (
                        <SurfSpinner text="Loading wave data..." />
                    ) : buoyData ? (
                        <>
                            <div className="wave-data">
                                <div className="wave-height">
                                    {parseFloat(buoyData.Hs).toFixed(1)}ft
                                </div>
                                <div className="wave-details">
                                    @ {buoyData.Tp}s • {buoyData.Dp}°
                                </div>
                                <div className="wave-quality">
                                    {getWaveQuality(buoyData.Hs).emoji} {getWaveQuality(buoyData.Hs).status}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="wave-data">
                            <div className="wave-height">N/A</div>
                            <div className="wave-details">N/A • N/A</div>
                            <div className="wave-quality">⚠️ Data Unavailable</div>
                        </div>
                    )}
                </motion.div>

                <motion.div className="condition-item" whileHover={{ scale: 1.05 }}>
                    <h3>💨 Wind</h3>
                    {windLoading ? (
                        <SurfSpinner text="Loading wind data..." />
                    ) : windData ? (
                        <div className="wind-data">
                            <div className="wind-speed" style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.8rem',
                                fontWeight: '700',
                                color: getWindCondition(windData.speed).color,
                                textShadow: `0 0 10px ${getWindCondition(windData.speed).color}`
                            }}>
                                {windData.speed} kts
                            </div>
                            <div className="wind-direction" style={{
                                fontSize: '1rem',
                                color: 'var(--text-color)',
                                opacity: '0.8',
                                fontWeight: '500'
                            }}>
                                {windData.direction}° • {windData.directionText}
                            </div>
                            <div className="wind-quality">
                                {getWindCondition(windData.speed).emoji} {getWindCondition(windData.speed).status}
                            </div>
                        </div>
                    ) : (
                        <div className="error-state">
                            <h3>⚠️ Wind Data Offline</h3>
                            <p>Check winds tab for forecast</p>
                        </div>
                    )}
                </motion.div>

                <motion.div className="condition-item" whileHover={{ scale: 1.05 }}>
                    <h3>🌊 Tide Status</h3>
                    {tideLoading ? (
                        <SurfSpinner text="Loading tide data..." />
                    ) : currentTide ? (
                        <div className="tide-data">
                            <div className="tide-height" style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.8rem',
                                fontWeight: '700',
                                color: 'var(--accent-primary)',
                                textShadow: '0 0 10px var(--accent-primary)'
                            }}>
                                {currentTide.arrow} {currentTide.height} ft
                            </div>
                            <div className="tide-direction" style={{
                                fontSize: '1rem',
                                color: 'var(--text-color)',
                                opacity: '0.8',
                                fontWeight: '500'
                            }}>
                                {currentTide.status}
                            </div>
                            <div className="tide-quality">
                                🌙 Current Tide
                            </div>
                        </div>
                    ) : (
                        <div className="error-state">
                            <h3>⚠️ Tide Data Offline</h3>
                            <p>Check tides tab for schedule</p>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            <motion.div className="tabs-container" variants={itemVariants}>
                <div className="tabs">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        className="tab-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'nowcast' && (
                            <div className="tab-panel">
                                <h3>🌊 Point Reyes Buoy Model</h3>
                                <p>Current surf conditions and wave model</p>
                                <div className="image-container">
                                    <Image
                                        src="https://cdip.ucsd.edu/recent/model_images/sf.png"
                                        alt="Latest Surf Model from CDIP"
                                        width={600}
                                        height={400}
                                        className="responsive-image"
                                    />
                                </div>
                                <p className="data-source">
                                    Data courtesy of{' '}
                                    <a
                                        href="http://cdip.ucsd.edu/m/classic_models/"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        CDIP Coastal Data Information Program
                                    </a>
                                </p>
                            </div>
                        )}

                        {activeTab === 'sfbuoy' && (
                            <div className="tab-panel">
                                <h3>📊 SF Bar Buoy Data</h3>
                                <p>Real-time measurements from the offshore buoy</p>
                                <div className="image-container">
                                    <Image
                                        src="http://cdip.ucsd.edu/themes/media/images/plots/buoy_ww3.gd?stn=142&stream=p1&pub=public&tz=PDT&units=english"
                                        alt="Latest Data from CDIP"
                                        width={600}
                                        height={400}
                                        className="responsive-image"
                                    />
                                </div>
                                <p className="data-source">
                                    Data courtesy of{' '}
                                    <a
                                        href="http://cdip.ucsd.edu/m/products/?stn=142p1&tz=PDT"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        CDIP Station 142
                                    </a>
                                </p>
                            </div>
                        )}

                        {activeTab === 'winds' && (
                            <div className="tab-panel">
                                <h3>💨 Local Wind Conditions</h3>
                                <p>Real-time wind data for Ocean Beach</p>
                                <div className="wind-widget">
                                    <iframe
                                        width="100%"
                                        height="500"
                                        src="https://embed.windy.com/embed2.html?lat=37.748&lon=-122.513&detailLat=37.748&detailLon=-122.513&width=600&height=500&zoom=11&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0F&radarRange=-1"
                                        frameBorder="0"
                                        title="Local Wind Conditions"
                                    />
                                </div>
                                <p className="data-source">
                                    Data courtesy of{' '}
                                    <a
                                        href="https://www.windy.com/?37.748,-122.513,11"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        Windy.com
                                    </a>
                                </p>
                            </div>
                        )}

                        {activeTab === 'tides' && (
                            <div className="tab-panel">
                                <h3>🌙 Today&apos;s Tide Schedule</h3>
                                <p>High and low tide predictions for Ocean Beach</p>
                                <TideTable tideData={tideData} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

        </motion.div>
    );
}