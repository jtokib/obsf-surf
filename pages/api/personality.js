import { validateSurfSummary } from '../../lib/services/openai.js'

const CACHE_MS = 30 * 60 * 1000 // 30 minutes
const cache = new Map()

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end()
    }

    try {
        const { summary, surfData } = req.body
        if (!summary) return res.status(400).json({ error: 'Summary required' })

        const key = `${summary}-${JSON.stringify(surfData)}`
        const cached = cache.get(key)
        if (cached && Date.now() - cached.ts < CACHE_MS) {
            return res.status(200).json({ ...cached.result, cached: true })
        }

        const result = await validateSurfSummary(summary, surfData)
        cache.set(key, { result, ts: Date.now() })
        return res.status(200).json(result)
    } catch (error) {
        console.error('Personality API error:', error.message)
        return res.status(200).json({
            validatedSummary: req.body?.summary,
            wasValidated: false,
            fallback: true,
        })
    }
}
