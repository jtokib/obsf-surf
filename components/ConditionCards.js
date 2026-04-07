function getWaveQuality(hsFeet) {
    const ft = parseFloat(hsFeet)
    if (!ft) return 'Unknown'
    if (ft < 2) return 'Flat City'
    if (ft < 4) return 'Fun Size'
    if (ft < 6) return 'Epic'
    return 'Gnarly'
}

function getWindStatus(speed) {
    if (!speed && speed !== 0) return 'Unknown'
    if (speed < 5) return 'Glassy'
    if (speed < 10) return 'Light'
    if (speed < 15) return 'Moderate'
    if (speed < 25) return 'Strong'
    return 'Howling'
}

function getWindColor(speed) {
    if (!speed && speed !== 0) return 'var(--text-secondary)'
    if (speed < 5) return '#00c87a'
    if (speed < 10) return 'var(--accent-primary)'
    if (speed < 15) return '#f4a261'
    return '#e63946'
}

export default function ConditionCards({ buoy, wind, tide, ptReyes }) {
    return (
        <div className="conditions-summary">
            {/* Ocean Beach (SF Bar Buoy) */}
            <div className="condition-item">
                <h3>Ocean Beach</h3>
                {buoy ? (
                    <div className="wave-data">
                        <div className="wave-height">{parseFloat(buoy.Hs).toFixed(1)} ft</div>
                        <div className="wave-details">@ {buoy.Tp}s &middot; {buoy.Dp}&deg;</div>
                        <div className="condition-quality">{getWaveQuality(buoy.Hs)}</div>
                    </div>
                ) : (
                    <div className="wave-data">
                        <div className="wave-height data-na">N/A</div>
                        <div className="wave-details">Data unavailable</div>
                    </div>
                )}
            </div>

            {/* Point Reyes */}
            <div className="condition-item">
                <h3>Point Reyes</h3>
                {ptReyes ? (
                    <div className="wave-data">
                        <div className="wave-height">{parseFloat(ptReyes.Hs).toFixed(1)} ft</div>
                        <div className="wave-details">@ {ptReyes.Tp}s &middot; {ptReyes.Dp}&deg;</div>
                        <div className="condition-quality">{getWaveQuality(ptReyes.Hs)}</div>
                    </div>
                ) : (
                    <div className="wave-data">
                        <div className="wave-height data-offline">Offline</div>
                        <div className="wave-details">Buoy temporarily offline</div>
                    </div>
                )}
            </div>

            {/* Wind */}
            <div className="condition-item">
                <h3>Wind</h3>
                {wind ? (
                    <div className="wind-data">
                        <div
                            className="wind-speed"
                            style={{ color: getWindColor(wind.speed) }}
                        >
                            {wind.speed} kts
                        </div>
                        <div className="wind-direction">
                            {wind.direction}&deg; &middot; {wind.directionText}
                        </div>
                        <div className="condition-quality">{getWindStatus(wind.speed)}</div>
                    </div>
                ) : (
                    <div className="wind-data">
                        <div className="wind-speed data-na">N/A</div>
                        <div className="wind-direction">Data unavailable</div>
                    </div>
                )}
            </div>

            {/* Tide */}
            <div className="condition-item">
                <h3>Tide</h3>
                {tide ? (
                    <div className="tide-data">
                        <div className="tide-height">
                            {tide.arrow} {tide.height} ft
                        </div>
                        <div className="tide-direction">{tide.status}</div>
                        <div className="condition-quality">Current</div>
                    </div>
                ) : (
                    <div className="tide-data">
                        <div className="tide-height data-na">N/A</div>
                        <div className="tide-direction">Data unavailable</div>
                    </div>
                )}
            </div>
        </div>
    )
}
