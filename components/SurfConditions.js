import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TideTable from './TideTable';
import Image from 'next/image';

export default function SurfConditions() {
    const [buoyData, setBuoyData] = useState(null);
    const [tideData, setTideData] = useState(null);
    const [windData, setWindData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [windLoading, setWindLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('nowcast');
    const [magic8Result, setMagic8Result] = useState('');
    const [magic8Loading, setMagic8Loading] = useState(false);

    useEffect(() => {
        fetchBuoyData();
        fetchTideData();
        fetchWindData();
    }, []);

    const fetchBuoyData = async () => {
        try {
            const response = await fetch('/api/buoy');
            const data = await response.json();
            setBuoyData(data);
        } catch (error) {
            console.error('Error fetching buoy data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTideData = async () => {
        try {
            const response = await fetch('/api/tides');
            const data = await response.json();
            setTideData(data);
        } catch (error) {
            console.error('Error fetching tide data:', error);
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

    const handleMagic8Ball = async () => {
        setMagic8Loading(true);

        // Add some suspense with retro loading animation
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const response = await fetch('/api/magic8ball', { method: 'POST' });
            const data = await response.json();
            setMagic8Result(data.answer);
        } catch (error) {
            console.error('Error with magic 8 ball:', error);
            setMagic8Result('System Error! Try again, kook!');
        } finally {
            setMagic8Loading(false);
        }
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

            <motion.div className="conditions-summary" variants={itemVariants}>
                <motion.div className="condition-item" whileHover={{ scale: 1.05 }}>
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-bar">
                                <div className="loading-indicator"></div>
                            </div>
                            <p>Loading wave data...</p>
                        </div>
                    ) : buoyData ? (
                        <>
                            <h3>🌊 SF Buoy</h3>
                            <div className="wave-data">
                                <div className="wave-height">
                                    {(buoyData.Hs * 3.281).toFixed(1)}ft
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
                        <div className="error-state">
                            <h3>⚠️ Buoy Offline</h3>
                            <p>Data temporarily unavailable</p>
                        </div>
                    )}
                </motion.div>

                <motion.div className="condition-item" whileHover={{ scale: 1.05 }}>
                    <h3>💨 Wind</h3>
                    {windLoading ? (
                        <div className="loading-container">
                            <div className="loading-bar">
                                <div className="loading-indicator"></div>
                            </div>
                            <p>Loading wind data...</p>
                        </div>
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
                    <h3>🎱 Go Surf?</h3>
                    <AnimatePresence mode="wait">
                        {magic8Loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="magic-loading"
                            >
                                <div className="magic-ball-loading">
                                    <div className="ball-animation"></div>
                                </div>
                                <p>Consulting the ocean spirits...</p>
                            </motion.div>
                        ) : !magic8Result ? (
                            <motion.button
                                key="button"
                                onClick={handleMagic8Ball}
                                className="magic-button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                🎱 Magic 8 Ball
                            </motion.button>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="magic-result-container"
                            >
                                <div className="magic-result">{magic8Result}</div>
                                <button
                                    onClick={() => setMagic8Result('')}
                                    className="ask-again-button"
                                >
                                    Ask Again?
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                                <h3>🌙 Today's Tide Schedule</h3>
                                <p>High and low tide predictions for Ocean Beach</p>
                                <TideTable tideData={tideData} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <motion.div className="footer-text" variants={itemVariants}>
                <p>See ya in the water, kook! 🤙</p>
            </motion.div>
        </motion.div>
    );
}