export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
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
            const errorText = await response.text();
            console.error("Error from Cloud Function:", response.status, errorText);
            throw new Error(`Prediction service returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in API route:", error.message);
        res.status(500).json({ error: error.message });
    }
}