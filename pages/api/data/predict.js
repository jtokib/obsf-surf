// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(clientId) {
    const now = Date.now();
    const clientData = rateLimitMap.get(clientId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    } else {
        clientData.count++;
    }
    
    rateLimitMap.set(clientId, clientData);
    return clientData.count <= RATE_LIMIT_MAX_REQUESTS;
}

function validateInput(body) {
    const { tide, wind, pt_reyes, sf_bar } = body || {};
    
    // Validate required fields
    if (!tide || !wind || pt_reyes === undefined || sf_bar === undefined) {
        return { valid: false, error: 'Missing required parameters' };
    }
    
    // Validate tide values
    const validTides = ['RISING', 'FALLING', 'HIGH', 'LOW', 'MID', 'UNKNOWN'];
    if (!validTides.includes(tide)) {
        return { valid: false, error: 'Invalid tide value' };
    }
    
    // Validate wind (basic string check)
    if (typeof wind !== 'string' || wind.length > 10) {
        return { valid: false, error: 'Invalid wind value' };
    }
    
    // Validate buoy readings (numeric, reasonable range)
    const ptReyes = parseFloat(pt_reyes);
    const sfBar = parseFloat(sf_bar);
    
    if (isNaN(ptReyes) || ptReyes < 0 || ptReyes > 50) {
        return { valid: false, error: 'Invalid pt_reyes value' };
    }
    
    if (isNaN(sfBar) || sfBar < 0 || sfBar > 50) {
        return { valid: false, error: 'Invalid sf_bar value' };
    }
    
    return { valid: true };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientId)) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    // Input validation
    const validation = validateInput(req.body);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    try {
        const { tide, wind, pt_reyes, sf_bar } = req.body;

        // Check if the prediction API URL is configured
        if (!process.env.NEXT_PUBLIC_PREDICT_API_URL) {
            throw new Error('NEXT_PUBLIC_PREDICT_API_URL environment variable is not configured');
        }

        // Build URL with query parameters if any exist
        const url = new URL(process.env.NEXT_PUBLIC_PREDICT_API_URL);
        if (req.url.includes('?')) {
            const queryString = req.url.split('?')[1];
            url.search = queryString;
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tide: tide,
                wind: wind,
                pt_reyes: pt_reyes,
                sf_bar: sf_bar,
            }),
        });

        if (!response.ok) {
            console.error("Prediction service error:", response.status, await response.text());
            return res.status(503).json({ error: 'Prediction service temporarily unavailable' });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Prediction API error:", error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}