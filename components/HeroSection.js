import { motion } from 'framer-motion';

export default function HeroSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-section"
        >
            <h1 className="hero-title">
                OBSF Surf Conditions
            </h1>
        </motion.div>
    );
}
