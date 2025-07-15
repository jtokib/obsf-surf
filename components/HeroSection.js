import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PersonalityGenerator from '../lib/personality-generator';

export default function HeroSection() {
    const [currentPersonality, setCurrentPersonality] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showCursor, setShowCursor] = useState(true);
    const generatorRef = useRef(null);
    const intervalRef = useRef(null);

    // Initialize generator
    useEffect(() => {
        generatorRef.current = new PersonalityGenerator();

        // Set initial personality
        const initialPersonality = generatorRef.current.generateUniqueCombination();
        setCurrentPersonality(initialPersonality);

        // Analytics tracking
        if (typeof window !== 'undefined' && window.jtokib) {
            window.jtokib.push({
                personality: initialPersonality,
                timestamp: new Date().toISOString()
            });
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Typewriter effect
    const typeText = async (text, speed = 80) => {
        if (isTyping) return;

        setIsTyping(true);
        setShowCursor(true);

        // Clear current text
        for (let i = displayedText.length; i >= 0; i--) {
            setDisplayedText(text.substring(0, i));
            await new Promise(resolve => setTimeout(resolve, speed / 2));
        }

        // Pause briefly
        await new Promise(resolve => setTimeout(resolve, 200));

        // Type new text
        for (let i = 0; i <= text.length; i++) {
            setDisplayedText(text.substring(0, i));
            await new Promise(resolve => setTimeout(resolve, speed));
        }

        setIsTyping(false);
    };

    // Handle personality changes
    useEffect(() => {
        if (currentPersonality) {
            typeText(currentPersonality);
        }
    }, [currentPersonality]);

    // Set up rotation timer
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            if (!isTyping && generatorRef.current) {
                const newPersonality = generatorRef.current.generateUniqueCombination();
                setCurrentPersonality(newPersonality);

                // Analytics tracking
                if (typeof window !== 'undefined' && window.jtokib) {
                    window.jtokib.push({
                        personality: newPersonality,
                        timestamp: new Date().toISOString(),
                        trigger: 'automatic'
                    });
                }
            }
        }, 10000); // 10 seconds

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isTyping]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-section"
        >
            <h1 className="hero-title">
                Toki is not a...
                <span className="typed-text">
                    {displayedText}
                </span>
                <span
                    className={`cursor ${showCursor ? 'visible' : 'hidden'}`}
                    style={{
                        opacity: isTyping ? 1 : showCursor ? 1 : 0,
                        transition: 'opacity 0.1s ease'
                    }}
                >
                    |
                </span>
            </h1>
        </motion.div>
    );
}
