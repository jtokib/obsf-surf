import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ParallaxSection({ imageUrl, alt, overlay = true }) {
    const parallaxRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (parallaxRef.current) {
                const scrolled = window.pageYOffset;
                const parallax = parallaxRef.current;
                const speed = scrolled * 0.5;
                parallax.style.transform = `translateY(${speed}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.div
            ref={parallaxRef}
            className="parallax-container parallax-image"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
        >
            <Image
                src={imageUrl}
                alt={alt}
                fill
                style={{ objectFit: 'cover' }}
                priority
            />
            {overlay && (
                <motion.div
                    className="parallax-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
        </motion.div>
    );
}