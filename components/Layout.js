import { useState, useEffect } from 'react';

export default function Layout({ children }) {
    const [darkMode, setDarkMode] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('dm');
        if (saved !== null) {
            setDarkMode(saved === '1');
        } else {
            localStorage.setItem('dm', '1');
        }
    }, []);

    useEffect(() => {
        document.body.className = darkMode ? 'dark-mode' : 'light-mode';
    }, [darkMode]);

    const toggleDarkMode = () => {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('dm', next ? '1' : '0');
    };

    return (
        <div className={`layout ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            {children}

            <footer className="footer">
                <div className="container">
                    <p className="footer-text">
                        Ocean Beach, San Francisco &middot; obsf.surf &middot;&nbsp;
                        <span onClick={toggleDarkMode} className="clickable">
                            {darkMode ? 'Light Mode' : 'Dark Mode'}
                        </span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
