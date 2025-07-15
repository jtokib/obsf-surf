import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
    const [darkMode, setDarkMode] = useState(true);
    const [loveMessage, setLoveMessage] = useState('');
    const [scanlineEffect, setScanlineEffect] = useState(false);
    const [keySequence, setKeySequence] = useState([]);

    useEffect(() => {
        // Check localStorage for dark mode preference
        const savedMode = localStorage.getItem('dm');
        if (savedMode !== null) {
            setDarkMode(savedMode === '1');
        }

        // Add scanline effect periodically
        const scanlineInterval = setInterval(() => {
            setScanlineEffect(true);
            setTimeout(() => setScanlineEffect(false), 3000);
        }, 15000);

        // Keyboard listener for secret sequence "saki"
        const handleKeyPress = (event) => {
            const key = event.key.toLowerCase();

            setKeySequence(prev => {
                const newSequence = [...prev, key].slice(-4); // Keep only last 4 keys

                // Check if sequence spells "saki"
                if (newSequence.join('') === 'saki') {
                    // Trigger love message
                    setLoveMessage('I LOVE YOU KIM!');

                    // Add screen flash effect
                    document.body.style.animation = 'flash 0.1s ease-in-out 3';
                    setTimeout(() => {
                        document.body.style.animation = '';
                    }, 300);

                    // Auto-hide after 4 seconds
                    setTimeout(() => {
                        setLoveMessage('');
                    }, 4000);

                    // Reset sequence
                    return [];
                }

                return newSequence;
            });
        };

        document.addEventListener('keydown', handleKeyPress);

        return () => {
            clearInterval(scanlineInterval);
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    useEffect(() => {
        // Apply theme classes to body
        if (darkMode) {
            document.body.className = 'dark-mode';
        } else {
            document.body.className = 'light-mode';
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('dm', newMode ? '1' : '0');
    };

    const handleLoveClick = () => {
        const message = "I LOVE YOU KIM!";
        setLoveMessage(loveMessage ? '' : message);

        // Add some retro sound effect simulation
        if (!loveMessage) {
            document.body.style.animation = 'flash 0.1s ease-in-out 3';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 300);

            // Auto-hide after 4 seconds
            setTimeout(() => {
                setLoveMessage('');
            }, 4000);
        }
    };

    return (
        <div className={`layout ${darkMode ? 'dark-mode' : 'light-mode'} ${scanlineEffect ? 'scanline-effect' : ''}`}>
            {children}

            {loveMessage && (
                <motion.div
                    className="love-message"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                >
                    <h2>{loveMessage}</h2>
                </motion.div>
            )}

            <footer className="footer">
                <div className="container">
                    <p className="footer-text">
                        Things <span onClick={handleLoveClick} className="clickable">Toki Burke</span> Is Not |
                        &copy;{new Date().getFullYear()}&nbsp;|&nbsp;
                        <span onClick={toggleDarkMode} className="clickable">
                            {darkMode ? '🌅 Light Mode' : '🌙 Dark Mode'}
                        </span>
                    </p>
                </div>
            </footer>
        </div>
    );
}