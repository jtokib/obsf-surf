import React, { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
    ssr: false,
    loading: () => <div className="chart-loading">Loading tide chart...</div>,
});

const TideTable = memo(function TideTable({ tideData }) {
    const getTideLabel = (type) => (type === 'H' ? 'High Tide' : 'Low Tide');
    const getTideArrow = (type) => (type === 'H' ? '↑' : '↓');
    const getTideColor = (type) => (type === 'H' ? '#00bcd4' : '#ff7043');

    const tideGraphData = useMemo(() => {
        if (!tideData?.predictions) return null;
        return tideData.predictions.slice(0, 8).map((p) => ({
            ...p,
            time: p.t.split(' ')[1],
            value: parseFloat(p.v),
            fullDateTime: new Date(p.t.replace(' ', 'T')),
        }));
    }, [tideData]);

    const currentTimeData = useMemo(() => {
        if (!tideGraphData) return null;
        const now = new Date();
        const nowDecimal = now.getHours() + now.getMinutes() / 60;
        let idx = -1;
        for (let i = 0; i < tideGraphData.length - 1; i++) {
            const a = tideGraphData[i].fullDateTime.getHours() + tideGraphData[i].fullDateTime.getMinutes() / 60;
            const b = tideGraphData[i + 1].fullDateTime.getHours() + tideGraphData[i + 1].fullDateTime.getMinutes() / 60;
            if (nowDecimal >= a && nowDecimal <= b) {
                idx = i + (nowDecimal - a) / (b - a);
                break;
            }
        }
        return {
            index: idx,
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    }, [tideGraphData]);

    const chartOptions = useMemo(() => ({
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 800,
        grid: { left: '10%', right: '10%', top: '15%', bottom: '20%' },
        xAxis: {
            type: 'category',
            data: tideGraphData?.map((p) => p.time) || [],
            axisLine: { lineStyle: { color: '#00ffff', width: 2 } },
            axisLabel: { color: '#00ffff', fontSize: 10 },
            splitLine: { show: true, lineStyle: { color: 'rgba(0,255,255,0.1)', type: 'dashed' } },
        },
        yAxis: {
            type: 'value',
            name: 'Height (ft)',
            nameTextStyle: { color: '#00ffff', fontSize: 12 },
            axisLine: { lineStyle: { color: '#00ffff', width: 2 } },
            axisLabel: { color: '#00ffff', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0,255,255,0.1)', type: 'dashed' } },
        },
        series: [{
            type: 'line',
            data: tideGraphData?.map((p) => p.value) || [],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
                color: (params) => {
                    const p = tideGraphData?.[params.dataIndex];
                    return p?.type === 'H' ? '#00bcd4' : '#ff7043';
                },
                borderColor: '#ffffff',
                borderWidth: 2,
            },
            lineStyle: { color: '#00ffff', width: 3, shadowColor: '#00ffff', shadowBlur: 10 },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(0,188,212,0.4)' },
                        { offset: 1, color: 'rgba(0,188,212,0.05)' },
                    ],
                },
            },
            markLine: currentTimeData?.index >= 0 ? {
                symbol: 'none',
                data: [{
                    name: 'Now',
                    xAxis: currentTimeData.index,
                    lineStyle: { type: 'dashed', color: '#ffff00', width: 2 },
                    label: {
                        show: true,
                        position: 'insideEndTop',
                        formatter: `NOW\n${currentTimeData.time}`,
                        color: '#ffff00',
                        fontSize: 10,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: [4, 8],
                        borderRadius: 4,
                    },
                }],
            } : undefined,
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0,20,40,0.9)',
            borderColor: '#00ffff',
            borderWidth: 1,
            textStyle: { color: '#00ffff' },
            formatter: (params) => {
                const p = tideGraphData?.[params[0]?.dataIndex];
                if (!p) return '';
                return `<div>
                    ${p.type === 'H' ? 'High Tide' : 'Low Tide'}<br/>
                    Time: ${p.time}<br/>
                    Height: ${p.v} ft
                </div>`;
            },
        },
    }), [tideGraphData, currentTimeData]);

    if (!tideData?.predictions) {
        return (
            <div className="tide-error">
                <p>Tide data currently unavailable</p>
                <p className="error-subtext">Check back in a few minutes</p>
            </div>
        );
    }

    return (
        <div className="tide-section">
            <div className="tide-graph-container">
                <h3 className="tide-graph-title">Tide Chart</h3>
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
            </div>

            <div className="tide-table-container">
                <h3 className="tide-table-title">High &amp; Low Tides</h3>
                <div className="tide-table">
                    <div className="tide-table-header">
                        <div className="header-cell">Time</div>
                        <div className="header-cell">Height</div>
                        <div className="header-cell">Tide</div>
                    </div>
                    <div className="tide-table-body">
                        {tideData.predictions.slice(0, 6).map((prediction, index) => {
                            const isHigh = prediction.type === 'H';
                            const time = prediction.t.split(' ')[1];
                            const date = prediction.t.split(' ')[0];
                            return (
                                <div
                                    key={index}
                                    className={`tide-row ${isHigh ? 'high-tide' : 'low-tide'}`}
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    <div className="tide-cell time-cell">
                                        <div className="time-main">{time}</div>
                                        <div className="time-date">{date.slice(5)}</div>
                                    </div>
                                    <div className="tide-cell height-cell">
                                        <div className="height-value" style={{ color: getTideColor(prediction.type) }}>
                                            {prediction.v}
                                        </div>
                                        <div className="height-unit">feet</div>
                                    </div>
                                    <div className="tide-cell type-cell">
                                        <div className="tide-type" style={{ color: getTideColor(prediction.type) }}>
                                            {getTideArrow(prediction.type)} {getTideLabel(prediction.type)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TideTable;
