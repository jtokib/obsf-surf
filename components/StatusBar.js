import { useState, useEffect } from 'react'

function computeVerdict(buoy, wind) {
    const windSpeed = wind?.speed ?? 0

    // Wind >= 7kts is the hard stop for OB
    if (windSpeed >= 7) return { go: false }

    if (!buoy) return null

    const waveHeight = parseFloat(buoy.Hs) || 0
    const wavePeriod = parseFloat(buoy.Tp) || 0
    const waveDir = parseInt(buoy.Dp) || 0

    let score = 0
    if (waveHeight >= 2 && waveHeight < 7) score += 0.3
    else if (waveHeight >= 1) score += 0.1

    if (wavePeriod >= 12) score += 0.25
    else if (wavePeriod >= 8) score += 0.15
    else score += 0.05

    if (waveDir >= 225 && waveDir <= 315) score += 0.2
    else if (waveDir >= 200 && waveDir <= 350) score += 0.1

    if (windSpeed < 5) score += 0.25
    else score += 0.15

    return { go: score > 0.6 }
}

function degreesToCompass(deg) {
    if (!deg && deg !== 0) return ''
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return dirs[Math.round(deg / 22.5) % 16]
}

export default function StatusBar({ buoy, wind, tide, fetchedAt }) {
    const [minutesAgo, setMinutesAgo] = useState(null)

    useEffect(() => {
        if (!fetchedAt) return
        const update = () => setMinutesAgo(Math.round((Date.now() - fetchedAt) / 60000))
        update()
        const interval = setInterval(update, 60000)
        return () => clearInterval(interval)
    }, [fetchedAt])

    const verdict = computeVerdict(buoy, wind)

    const waveStr = buoy
        ? `${parseFloat(buoy.Hs).toFixed(1)} ft @ ${buoy.Tp}s ${degreesToCompass(buoy.Dp)}`
        : null

    const windStr = wind ? `${wind.speed} kts ${wind.directionText}` : null
    const tideStr = tide ? tide.status : null

    return (
        <div className="status-bar">
            <div className="status-left">
                {verdict !== null && (
                    <span className={`verdict-pill ${verdict.go ? 'go' : 'skip'}`}>
                        {verdict.go ? 'Go Surf' : 'Skip It'}
                    </span>
                )}
                <div className="status-conditions">
                    {waveStr && <span className="status-item">{waveStr}</span>}
                    {windStr && <span className="status-item">Wind {windStr}</span>}
                    {tideStr && <span className="status-item">Tide {tideStr}</span>}
                    {!waveStr && !windStr && !tideStr && (
                        <span className="status-item status-na">Conditions unavailable</span>
                    )}
                </div>
            </div>
            {minutesAgo !== null && (
                <span className="status-updated">
                    Updated {minutesAgo < 1 ? 'just now' : `${minutesAgo} min ago`}
                </span>
            )}
        </div>
    )
}
