import { useState, useEffect } from 'react'
import { createBasicSurfSummary } from '../lib/utils/formatting.js'

function parseContent(summary) {
    if (!summary) return null
    const stokeMatch = summary.match(/Stoke rating:\s*(\d+(?:\/10)?)/i)
    const haikuMatch = summary.match(/\n([^\n]+)\n([^\n]+)\n([^\n]+)\n/)
    const crystalMatch = summary.match(/Crystal of the day:\s*(.+)/i)
    if (!stokeMatch && !crystalMatch) return null
    return {
        stoke: stokeMatch ? stokeMatch[1] : null,
        haiku: haikuMatch
            ? { line1: haikuMatch[1], line2: haikuMatch[2], line3: haikuMatch[3] }
            : null,
        crystal: crystalMatch ? crystalMatch[1].trim() : null,
    }
}

export default function Personality({ buoyData, windData, tideData }) {
    const [content, setContent] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!buoyData || !windData) {
            setLoading(false)
            return
        }

        const surfData = {
            waveHeight: parseFloat(buoyData.Hs) || 0,
            wavePeriod: parseFloat(buoyData.Tp) || 0,
            windSpeed: parseFloat(windData.speed) || 0,
            windDirection: windData.direction || 0,
        }

        const summary = createBasicSurfSummary(buoyData, windData, tideData, surfData)

        const timer = setTimeout(() => {
            fetch('/api/personality', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary, surfData }),
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    if (data?.validatedSummary) {
                        setContent(parseContent(data.validatedSummary))
                    }
                })
                .catch(() => null)
                .finally(() => setLoading(false))
        }, 300)

        return () => clearTimeout(timer)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="personality-section">
                <div className="personality-skeleton" />
            </div>
        )
    }

    if (!content) return null

    return (
        <div className="personality-section">
            <div className="personality-content">
                {content.stoke && (
                    <p className="stoke-rating">Stoke: {content.stoke}</p>
                )}
                {content.haiku && (
                    <p className="surf-haiku">
                        {content.haiku.line1}
                        <br />
                        {content.haiku.line2}
                        <br />
                        {content.haiku.line3}
                    </p>
                )}
                {content.crystal && (
                    <p className="crystal-recommendation">Crystal: {content.crystal}</p>
                )}
            </div>
        </div>
    )
}
