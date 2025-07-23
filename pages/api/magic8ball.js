export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const responses = [
        "Signs point to YES! 🌊",
        "Outlook good, dude! 🏄‍♂️",
        "Without a doubt! ⚡",
        "Yes definitely! 🔥",
        "You may rely on it! 🌟",
        "As I see it, yes! 👁️",
        "Most likely! 📈",
        "Reply hazy, try again... 🌫️",
        "Ask again later, bro! ⏰",
        "Better not tell you now... 🤐",
        "Cannot predict now! 🔮",
        "Concentrate and ask again! 🧘‍♂️",
        "Don't count on it! ❌",
        "My reply is no! 🚫",
        "My sources say no! 📰",
        "Outlook not so good... 😬",
        "Very doubtful! 🤔",
        "Totally gnarly! Go for it! 🤙",
        "The waves are calling! 📞",
        "Surf's up, my dude! 🏄‍♀️"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    return res.status(200).json({
        answer: randomResponse,
        timestamp: new Date().toISOString()
    });
}