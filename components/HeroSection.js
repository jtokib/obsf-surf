import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HeroSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="ocean-hero"
        >
            <div className="hero-logo">
                <Image
                    src="/images/website/obsf.png"
                    alt="OBSF Surf Conditions"
                    width={400}
                    height={240}
                    style={{
                        objectFit: 'cover',
                        objectPosition: 'center 35%'
                    }}
                    priority
                />
            </div>
        </motion.div>
    );
}
