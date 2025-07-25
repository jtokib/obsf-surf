import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
    const [darkMode, setDarkMode] = useState(true);
    const [scanlineEffect, setScanlineEffect] = useState(false);

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


        return () => {
            clearInterval(scanlineInterval);
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


    return (
        <div className={`layout ${darkMode ? 'dark-mode' : 'light-mode'} ${scanlineEffect ? 'scanline-effect' : ''}`}>
            {children}


            <footer className="footer">
                <div className="container">
                    <p className="footer-text">
                        Ocean Beach SF Surf Conditions |
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