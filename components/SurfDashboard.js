import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const TideTable = dynamic(() => import('./TideTable'), {
    ssr: false,
    loading: () => <div className="tide-skeleton" />,
})

const Personality = dynamic(() => import('./Personality'), {
    ssr: false,
    loading: () => <div className="personality-skeleton" />,
})

const TABS = [
    { id: 'nowcast', label: 'Nowcast' },
    { id: 'sfbuoy', label: 'Buoy' },
    { id: 'winds', label: 'Wind' },
    { id: 'tides', label: 'Tides' },
]

function buildConditions(buoy, wind, tideState, ptReyes) {
    const waveHeight = parseFloat(buoy.Hs) || 0
    const wavePeriod = parseFloat(buoy.Tp) || 0
    const waveDirection = parseInt(buoy.Dp) || 0
    const windSpeed = parseFloat(wind.speed) || 0

    const windCategory = windSpeed < 5 ? 'offshore' : windSpeed < 7 ? 'light' : 'onshore'

    let sizeCategory = 'unknown'
    if (waveHeight < 2) sizeCategory = 'ankle_high'
    else if (waveHeight < 4) sizeCategory = 'knee_high'
    else if (waveHeight < 6) sizeCategory = 'head_high'
    else sizeCategory = 'overhead'

    const tideCategory = tideState?.direction === 'rising' ? 'mid_flood' : 'mid_ebb'

    const conditions = {
        sf_bar_height: waveHeight.toFixed(1),
        sf_bar_period: wavePeriod,
        sf_bar_direction: waveDirection,
        wind_category: windCategory,
        size_category: sizeCategory,
        tide_category: tideCategory,
    }

    if (ptReyes) {
        conditions.pt_reyes_height = (parseFloat(ptReyes.Hs) || 0).toFixed(1)
        conditions.pt_reyes_period = parseFloat(ptReyes.Tp) || 0
        conditions.pt_reyes_direction = parseInt(ptReyes.Dp) || 0
    }

    return conditions
}

export default function SurfDashboard({
    initialBuoy,
    initialWind,
    initialTide,
    initialPtReyes,
    initialTideState,
}) {
    const [activeTab, setActiveTab] = useState('nowcast')

    // Prefetch surf prediction immediately on mount — uses server-rendered data
    useEffect(() => {
        if (!initialBuoy || !initialWind) return
        const conditions = buildConditions(initialBuoy, initialWind, initialTideState, initialPtReyes)
        fetch('/api/surf-predictor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conditions),
        }).catch(() => null)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="surf-conditions">
            <Personality
                buoyData={initialBuoy}
                windData={initialWind}
                tideData={initialTide}
            />

            <div className="tabs-container">
                <div className="tabs">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'nowcast' && (
                        <div className="tab-panel">
                            <h3>Point Reyes Buoy Model</h3>
                            <p>Current wave model from CDIP</p>
                            <div className="image-container">
                                <Image
                                    src="https://cdip.ucsd.edu/recent/model_images/sf.png"
                                    alt="CDIP SF Wave Model"
                                    width={600}
                                    height={400}
                                    className="responsive-image"
                                />
                            </div>
                            <p className="data-source">
                                Data courtesy of{' '}
                                <a
                                    href="http://cdip.ucsd.edu/m/classic_models/"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    CDIP Coastal Data Information Program
                                </a>
                            </p>
                        </div>
                    )}

                    {activeTab === 'sfbuoy' && (
                        <div className="tab-panel">
                            <h3>SF Bar Buoy</h3>
                            <p>Real-time measurements from station 142</p>
                            <div className="image-container">
                                <Image
                                    src="http://cdip.ucsd.edu/themes/media/images/plots/buoy_ww3.gd?stn=142&stream=p1&pub=public&tz=PDT&units=english"
                                    alt="CDIP Station 142 Data"
                                    width={600}
                                    height={400}
                                    className="responsive-image"
                                />
                            </div>
                            <p className="data-source">
                                Data courtesy of{' '}
                                <a
                                    href="http://cdip.ucsd.edu/m/products/?stn=142p1&tz=PDT"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    CDIP Station 142
                                </a>
                            </p>
                        </div>
                    )}

                    {activeTab === 'winds' && (
                        <div className="tab-panel">
                            <h3>Local Wind Conditions</h3>
                            <p>Real-time wind data for Ocean Beach</p>
                            <div className="wind-widget">
                                <iframe
                                    width="100%"
                                    height="500"
                                    src="https://embed.windy.com/embed2.html?lat=37.748&lon=-122.513&detailLat=37.748&detailLon=-122.513&width=600&height=500&zoom=11&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0F&radarRange=-1"
                                    frameBorder="0"
                                    title="Local Wind Conditions"
                                />
                            </div>
                            <p className="data-source">
                                Data courtesy of{' '}
                                <a
                                    href="https://www.windy.com/?37.748,-122.513,11"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    Windy.com
                                </a>
                            </p>
                        </div>
                    )}

                    {activeTab === 'tides' && (
                        <div className="tab-panel">
                            <h3>Today&apos;s Tide Schedule</h3>
                            <p>High and low tide predictions for Ocean Beach</p>
                            <TideTable tideData={initialTide} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
