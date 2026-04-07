/**
 * Server-side data fetching helpers for getServerSideProps.
 * These run on the Vercel edge — keep timeouts tight.
 */

function withTimeout(promise, ms = 5000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    return Promise.race([
        promise(controller.signal),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
        ),
    ]).finally(() => clearTimeout(timer))
}

export async function fetchBuoyData(station = '142') {
    try {
        return await withTimeout(async (signal) => {
            const res = await fetch(
                `https://cdip.ucsd.edu/data_access/justdar.cdip?${station}+sp`,
                { headers: { 'User-Agent': 'obsuf.surf/2.0' }, signal }
            )
            if (!res.ok) return null
            const text = await res.text()
            const m = text.match(/Hs\(m\):\s*([\d.]+)\s+Tp\(s\):\s*([\d.]+)\s+Dp\(deg\):\s*(\d+)/)
            if (!m) return null
            return {
                Hs: (parseFloat(m[1]) * 3.28084).toFixed(2),
                Tp: parseFloat(m[2]),
                Dp: parseInt(m[3]),
                timestamp: new Date().toISOString(),
            }
        })
    } catch {
        return null
    }
}

export async function fetchTideData() {
    try {
        return await withTimeout(async (signal) => {
            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const fmt = (d) => d.toISOString().split('T')[0].replace(/-/g, '')

            const url =
                `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
                `?product=predictions&application=obsuf_surf_app` +
                `&begin_date=${fmt(yesterday)}&end_date=${fmt(tomorrow)}` +
                `&datum=MLLW&station=9414290&time_zone=lst_ldt&units=english&interval=hilo&format=json`

            const res = await fetch(url, { headers: { 'User-Agent': 'obsuf.surf/2.0' }, signal })
            if (!res.ok) return null
            return await res.json()
        })
    } catch {
        return null
    }
}

export async function fetchWindData() {
    try {
        // Try KSFO first — fastest, most reliable
        return await withTimeout(async (signal) => {
            const res = await fetch(
                'https://api.weather.gov/stations/KSFO/observations/latest',
                {
                    headers: {
                        'User-Agent': 'obsuf.surf/2.0 (contact@obsuf.surf)',
                        Accept: 'application/json',
                    },
                    signal,
                }
            )
            if (res.ok) {
                const data = await res.json()
                const p = data.properties
                if (p?.windSpeed?.value != null && p?.windDirection?.value != null) {
                    const speed = Math.round(p.windSpeed.value * 0.539957 * 10) / 10
                    const direction = p.windDirection.value
                    const gust = p.windGust?.value
                        ? Math.round(p.windGust.value * 0.539957 * 10) / 10
                        : null
                    return {
                        speed,
                        direction,
                        directionText: degreesToCompass(direction),
                        gust,
                        timestamp: p.timestamp,
                        source: 'KSFO',
                    }
                }
            }
            throw new Error('KSFO unavailable')
        }, 4000)
    } catch {
        // Fall through to OWM
    }

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY
        if (!apiKey) return null
        return await withTimeout(async (signal) => {
            const res = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=37.76&lon=-122.51&appid=${apiKey}&units=metric`,
                { headers: { 'User-Agent': 'obsuf.surf/2.0' }, signal }
            )
            if (!res.ok) return null
            const data = await res.json()
            if (data.wind?.speed == null || data.wind?.deg == null) return null
            const speed = Math.round(data.wind.speed * 1.944 * 10) / 10
            return {
                speed,
                direction: data.wind.deg,
                directionText: degreesToCompass(data.wind.deg),
                gust: data.wind.gust ? Math.round(data.wind.gust * 1.944 * 10) / 10 : null,
                timestamp: new Date(data.dt * 1000).toISOString(),
                source: 'OWM',
            }
        }, 4000)
    } catch {
        return null
    }
}

function degreesToCompass(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return dirs[Math.round(deg / 22.5) % 16]
}

/**
 * Parse a Pacific local-time string "YYYY-MM-DD HH:MM" into a UTC timestamp.
 * NOAA lst_ldt = PDT (UTC-7) in DST months (Mar-Nov), PST (UTC-8) otherwise.
 */
function parsePacificTime(timeStr) {
    const [datePart, timePart] = timeStr.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour, minute] = timePart.split(':').map(Number)
    const offsetMs = (month >= 3 && month <= 11 ? 7 : 8) * 60 * 60 * 1000
    return Date.UTC(year, month - 1, day, hour, minute) + offsetMs
}

export function calculateCurrentTideState(predictions) {
    if (!predictions?.length) return null

    const now = Date.now()
    let pastTide = null
    let futureTide = null

    for (const p of predictions) {
        const t = parsePacificTime(p.t)
        if (t <= now) {
            pastTide = { ...p, time: t }
        } else if (!futureTide) {
            futureTide = { ...p, time: t }
            break
        }
    }

    if (!pastTide || !futureTide) return null

    const progress = (now - pastTide.time) / (futureTide.time - pastTide.time)
    const height = (
        parseFloat(pastTide.v) +
        (parseFloat(futureTide.v) - parseFloat(pastTide.v)) * progress
    ).toFixed(1)
    const isRising = parseFloat(futureTide.v) > parseFloat(pastTide.v)

    return {
        height,
        direction: isRising ? 'rising' : 'falling',
        arrow: isRising ? '↑' : '↓',
        status: isRising ? 'Rising' : 'Falling',
    }
}
