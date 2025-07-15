import { motion } from 'framer-motion';

export default function TideTable({ tideData }) {
    if (!tideData || !tideData.predictions) {
        return (
            <div className="tide-error">
                <div className="error-icon">🌊</div>
                <p>Tide data currently unavailable</p>
                <p className="error-subtext">Check back in a few minutes</p>
            </div>
        );
    }

    const getTideIcon = (type) => {
        return type === 'H' ? '🌊' : '🏖️';
    };

    const getTideLabel = (type) => {
        return type === 'H' ? 'High' : 'Low';
    };

    const rowVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: i * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        })
    };

    return (
        <div className="tide-table">
            <motion.table
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <thead>
                    <tr>
                        <th>📅 Time</th>
                        <th>📏 Height</th>
                        <th>🌊 Type</th>
                    </tr>
                </thead>
                <tbody>
                    {tideData.predictions.map((prediction, index) => (
                        <motion.tr
                            key={index}
                            custom={index}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{
                                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                scale: 1.02
                            }}
                        >
                            <td>
                                <div className="time-cell">
                                    <span className="time-text">{prediction.t.slice(5)}</span>
                                </div>
                            </td>
                            <td>
                                <div className="height-cell">
                                    <span className="height-value">{prediction.v}</span>
                                    <span className="height-unit">ft</span>
                                </div>
                            </td>
                            <td>
                                <div className="type-cell">
                                    <span className="tide-icon">{getTideIcon(prediction.type)}</span>
                                    <span className="tide-label">{getTideLabel(prediction.type)}</span>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </motion.table>
        </div>
    );
}