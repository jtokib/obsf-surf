// Fallback surf logic for when Cloud Function is unavailable
function generateFallbackPrediction(conditions) {
    const {
        sf_bar_height,
        sf_bar_period, 
        sf_bar_direction,
        wind_category,
        size_category,
        tide_category
    } = conditions;

    const waveHeight = parseFloat(sf_bar_height) || 0;
    const wavePeriod = parseFloat(sf_bar_period) || 0;
    const waveDirection = parseInt(sf_bar_direction) || 0;

    let score = 0;
    let confidence = 0.5;
    let issues = [];

    // Wave size scoring (0-0.3)
    if (waveHeight < 1) {
        score += 0.0;
        issues.push("Too small");
    } else if (waveHeight < 2) {
        score += 0.1;
    } else if (waveHeight < 4) {
        score += 0.25;
    } else if (waveHeight < 7) {
        score += 0.3;
    } else {
        score += 0.15;
        issues.push("Very large");
    }

    // Wave period scoring (0-0.25)
    if (wavePeriod < 8) {
        score += 0.05;
        issues.push("Short period");
    } else if (wavePeriod < 12) {
        score += 0.15;
    } else if (wavePeriod < 18) {
        score += 0.25;
    } else {
        score += 0.2;
    }

    // Wave direction scoring (0-0.2) - WSW to WNW is best for OB
    const optimalDir = waveDirection >= 225 && waveDirection <= 315;
    if (optimalDir) {
        score += 0.2;
    } else if (waveDirection >= 200 && waveDirection <= 350) {
        score += 0.1;
    } else {
        score += 0.0;
        issues.push("Poor wave direction");
    }

    // Wind impact (can override everything) (0-0.25)
    if (wind_category === 'offshore') {
        score += 0.25;
    } else if (wind_category === 'light') {
        score += 0.15;
    } else if (wind_category === 'moderate') {
        score += 0.05;
        issues.push("Moderate wind");
    } else {
        score = Math.min(score, 0.2); // Cap score for strong onshore
        issues.push("Strong onshore wind");
    }

    // Normalize score to 0-1
    score = Math.max(0, Math.min(1, score));

    // Adjust confidence based on data completeness
    confidence = waveHeight > 0 && wavePeriod > 0 ? 0.7 : 0.4;

    const prediction = score > 0.6 ? 1 : 0;
    const shouldGo = prediction === 1;
    const recommendation = shouldGo ? "GO SURF!" : 
        issues.length > 0 ? `Poor conditions: ${issues.join(", ")}` : "Poor conditions";

    return {
        timestamp: new Date().toISOString(),
        target_datetime: new Date().toISOString(),
        conditions: conditions,
        prediction: {
            prediction: prediction,
            confidence: confidence,
            recommendation: recommendation
        },
        summary: {
            should_go: shouldGo,
            confidence_level: confidence >= 0.7 ? "High" : confidence >= 0.4 ? "Medium" : "Low",
            recommendation: recommendation
        },
        data_sources: {
            pt_reyes_available: false,
            sf_bar_available: true,
            prediction_mode: "fallback"
        }
    };
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Try Cloud Function first, fallback only if it fails

    // Call Cloud Function
    try {
        const apiUrl = 'https://us-central1-jtokib.cloudfunctions.net/surf-predictor';
        
        let fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'obsuf.surf/2.0',
            },
        };

        // For POST requests, forward the body
        if (req.method === 'POST' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(apiUrl, fetchOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Cache for 5 minutes since predictions can change frequently
        res.setHeader('Cache-Control', 's-maxage=300');
        
        return res.status(200).json(data);
    } catch (error) {
        console.error('Cloud Function failed, using fallback:', error);
        
        // Use fallback prediction for POST requests with body
        if (req.method === 'POST' && req.body) {
            console.log('Using fallback prediction logic for conditions:', req.body);
            const prediction = generateFallbackPrediction(req.body);
            
            // Cache for 5 minutes
            res.setHeader('Cache-Control', 's-maxage=300');
            return res.status(200).json(prediction);
        }
        
        // For GET requests or requests without body, return error
        return res.status(503).json({
            error: 'Surf prediction unavailable',
            message: 'Unable to retrieve surf prediction from API',
            timestamp: new Date().toISOString()
        });
    }
} 