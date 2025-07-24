import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import ReactECharts to avoid SSR issues and improve performance
const ReactECharts = dynamic(() => import('echarts-for-react'), { 
    ssr: false,
    loading: () => <div className="chart-loading">📊 Loading Epic Tide Matrix...</div>
});

const TideTable = memo(function TideTable({ tideData }) {
    const getTideIcon = (type) => {
        return type === 'H' ? '⬆️' : '⬇️';
    };

    const getTideLabel = (type) => {
        return type === 'H' ? 'High Tide' : 'Low Tide';
    };

    const getTideColor = (type) => {
        return type === 'H' ? '#00bcd4' : '#ff7043';
    };

    // Create tide graph data for eCharts - optimized for performance
    const tideGraphData = useMemo(() => {
        if (!tideData?.predictions) return null;
        
        const predictions = tideData.predictions.slice(0, 8); // Show 8 data points
        
        return predictions.map((prediction) => {
            const time = prediction.t.split(' ')[1]; // Extract time part
            
            return {
                ...prediction,
                time,
                value: parseFloat(prediction.v), // Pre-parse for performance
                fullDateTime: new Date(prediction.t.replace(' ', 'T')), // For current time comparison
            };
        });
    }, [tideData]);

    // Find current time position for vertical line
    const currentTimeData = useMemo(() => {
        if (!tideGraphData) return null;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeDecimal = currentHour + currentMinute / 60;
        
        // Find the position between tide points where current time falls
        let currentTimeIndex = -1;
        for (let i = 0; i < tideGraphData.length - 1; i++) {
            const currentPoint = tideGraphData[i];
            const nextPoint = tideGraphData[i + 1];
            
            const currentPointTime = currentPoint.fullDateTime.getHours() + currentPoint.fullDateTime.getMinutes() / 60;
            const nextPointTime = nextPoint.fullDateTime.getHours() + nextPoint.fullDateTime.getMinutes() / 60;
            
            if (currentTimeDecimal >= currentPointTime && currentTimeDecimal <= nextPointTime) {
                // Interpolate position between the two points
                const ratio = (currentTimeDecimal - currentPointTime) / (nextPointTime - currentPointTime);
                currentTimeIndex = i + ratio;
                break;
            }
        }
        
        return {
            index: currentTimeIndex,
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    }, [tideGraphData]);

    // Memoize chart options for performance
    const chartOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut',
        grid: {
            left: '10%',
            right: '10%',
            top: '15%',
            bottom: '20%',
            backgroundColor: 'rgba(0, 20, 40, 0.3)',
            borderColor: '#00ffff',
            borderWidth: 1,
        },
        xAxis: {
            type: 'category',
            data: tideGraphData?.map(point => point.time) || [],
            axisLine: {
                lineStyle: {
                    color: '#00ffff',
                    width: 2,
                }
            },
            axisLabel: {
                color: '#00ffff',
                fontSize: 10,
                fontFamily: 'Orbitron, monospace',
                fontWeight: 'bold',
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(0, 255, 255, 0.1)',
                    type: 'dashed',
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Height (ft)',
            nameTextStyle: {
                color: '#00ffff',
                fontSize: 12,
                fontFamily: 'Orbitron, monospace',
            },
            axisLine: {
                lineStyle: {
                    color: '#00ffff',
                    width: 2,
                }
            },
            axisLabel: {
                color: '#00ffff',
                fontSize: 10,
                fontFamily: 'Orbitron, monospace',
                fontWeight: 'bold',
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(0, 255, 255, 0.1)',
                    type: 'dashed',
                }
            }
        },
        series: [{
            type: 'line',
            data: tideGraphData?.map(point => point.value) || [],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
                color: (params) => {
                    const point = tideGraphData?.[params.dataIndex];
                    return point?.type === 'H' ? '#00bcd4' : '#ff7043';
                },
                borderColor: '#ffffff',
                borderWidth: 2,
            },
            lineStyle: {
                color: '#00ffff',
                width: 3,
                shadowColor: '#00ffff',
                shadowBlur: 10,
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: 'rgba(0, 188, 212, 0.4)'
                    }, {
                        offset: 1,
                        color: 'rgba(0, 188, 212, 0.05)'
                    }]
                }
            },
            emphasis: {
                focus: 'series',
                itemStyle: {
                    shadowBlur: 20,
                    shadowColor: '#00ffff'
                }
            },
            markLine: currentTimeData?.index >= 0 ? {
                symbol: 'none',
                data: [{
                    name: 'Current Time',
                    xAxis: currentTimeData.index,
                    lineStyle: {
                        type: 'dashed',
                        color: '#ffff00',
                        width: 2,
                        shadowColor: '#ffff00',
                        shadowBlur: 5,
                    },
                    label: {
                        show: true,
                        position: 'insideEndTop',
                        formatter: `NOW\n${currentTimeData.time}`,
                        color: '#ffff00',
                        fontFamily: 'Orbitron, monospace',
                        fontSize: 10,
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: [4, 8],
                        borderRadius: 4,
                        borderColor: '#ffff00',
                        borderWidth: 1,
                    }
                }],
                animation: true,
                animationDuration: 1000,
            } : undefined
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 20, 40, 0.9)',
            borderColor: '#00ffff',
            borderWidth: 1,
            textStyle: {
                color: '#00ffff',
                fontFamily: 'Orbitron, monospace',
            },
            formatter: (params) => {
                const point = tideGraphData?.[params[0]?.dataIndex];
                if (!point) return '';
                return `
                    <div style="font-family: Orbitron, monospace; font-weight: bold;">
                        🌊 ${point.type === 'H' ? 'HIGH TIDE' : 'LOW TIDE'}<br/>
                        ⏰ Time: ${point.time}<br/>
                        📏 Height: ${point.v} ft<br/>
                        ${point.type === 'H' ? '⬆️' : '⬇️'} ${getTideLabel(point.type)}
                    </div>
                `;
            }
        }
    }), [tideGraphData, currentTimeData]);

    if (!tideData || !tideData.predictions) {
        return (
            <div className="tide-error">
                <div className="error-icon">🌊</div>
                <p>Tide data currently unavailable</p>
                <p className="error-subtext">Check back in a few minutes</p>
            </div>
        );
    }

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
        <div className="tide-section">
            {/* eCharts Tide Graph */}
            <motion.div 
                className="tide-graph-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h3 className="tide-graph-title">🌊 Tide Chart 🌊</h3>
                <div className="tide-graph">
                    <ReactECharts
                        option={chartOptions}
                        style={{ height: '450px', width: '100%' }}
                        theme="dark"
                        lazyUpdate={true}
                        notMerge={false}
                        opts={{ renderer: 'canvas' }}
                    />
                </div>
            </motion.div>

            {/* Tide Table */}
            <motion.div 
                className="tide-table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h3 className="tide-table-title">🌊 High & Low Tides</h3>
                <div className="tide-table">
                    <div className="tide-table-header">
                        <div className="header-cell">Time</div>
                        <div className="header-cell">Height</div>
                        <div className="header-cell">Tide</div>
                    </div>
                    <div className="tide-table-body">
                        {tideData.predictions.slice(0, 6).map((prediction, index) => {
                            const isHigh = prediction.type === 'H';
                            const time = prediction.t.split(' ')[1]; // Extract time
                            const date = prediction.t.split(' ')[0]; // Extract date
                            
                            return (
                                <motion.div
                                    key={index}
                                    className={`tide-row ${isHigh ? 'high-tide' : 'low-tide'}`}
                                    custom={index}
                                    variants={rowVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover={{
                                        scale: 1.02,
                                        backgroundColor: isHigh ? 'rgba(0, 188, 212, 0.1)' : 'rgba(255, 112, 67, 0.1)'
                                    }}
                                >
                                    <div className="tide-cell time-cell">
                                        <div className="time-main">{time}</div>
                                        <div className="time-date">{date.slice(5)}</div>
                                    </div>
                                    <div className="tide-cell height-cell">
                                        <div className="height-value" style={{color: getTideColor(prediction.type)}}>
                                            {prediction.v}
                                        </div>
                                        <div className="height-unit">feet</div>
                                    </div>
                                    <div className="tide-cell type-cell">
                                        <div className="tide-type" style={{color: getTideColor(prediction.type)}}>
                                            {getTideIcon(prediction.type)} {getTideLabel(prediction.type)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

export default TideTable;