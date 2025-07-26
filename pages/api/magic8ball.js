export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get current ML prediction score
        const { tide, wind, pt_reyes, sf_bar } = req.body;
        let mlScore = null;

        if (tide !== undefined && wind !== undefined && pt_reyes !== undefined && sf_bar !== undefined) {
            try {
                const predictResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/predict`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ tide, wind, pt_reyes, sf_bar }),
                });

                if (predictResponse.ok) {
                    const predictData = await predictResponse.json();
                    mlScore = predictData.score;
                }
            } catch (error) {
                console.error('Error fetching ML score:', error);
            }
        }

        const positiveResponses = [
            "Signs point to YES! 🌊",
            "Outlook good, dude! 🏄‍♂️",
            "Without a doubt! ⚡",
            "Yes definitely! 🔥",
            "You may rely on it! 🌟",
            "As I see it, yes! 👁️",
            "Most likely! 📈",
            "Totally gnarly! Go for it! 🤙",
            "The waves are calling! 📞",
            "Surf's up, my dude! 🏄‍♀️"
        ];

        const neutralResponses = [
            "Reply hazy, try again... 🌫️",
            "Ask again later, bro! ⏰",
            "Better not tell you now... 🤐",
            "Cannot predict now! 🔮",
            "Concentrate and ask again! 🧘‍♂️"
        ];

        const negativeResponses = [
            "Don't count on it! ❌",
            "My reply is no! 🚫",
            "My sources say no! 📰",
            "Outlook not so good... 😬",
            "Very doubtful! 🤔",
            "Maybe hit the gym instead? 💪",
            "The ocean says not today... 🌊❌",
            "Save your energy for tomorrow! ⚡"
        ];

        let responses;
        if (mlScore !== null && mlScore < 3) {
            // Use only negative/neutral responses when ML score is poor
            responses = [...negativeResponses, ...neutralResponses];
        } else {
            // Use all responses when ML score is good or unknown
            responses = [...positiveResponses, ...neutralResponses, ...negativeResponses];
        }

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');

        return res.status(200).json({
            answer: randomResponse,
            timestamp: new Date().toISOString(),
            mlScore: mlScore
        });
    } catch (error) {
        console.error('Error in magic8ball handler:', error);
        
        // Fallback to neutral/negative responses on error
        const fallbackResponses = [
            "Reply hazy, try again... 🌫️",
            "Ask again later, bro! ⏰",
            "Cannot predict now! 🔮",
            "Concentrate and ask again! 🧘‍♂️"
        ];

        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');

        return res.status(200).json({
            answer: randomResponse,
            timestamp: new Date().toISOString(),
            mlScore: null
        });
    }
}