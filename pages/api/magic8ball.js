export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const responses = [
        "Yeaaa brah!",
        "Maybe tomorrow kook!",
        "Totally tubular!",
        "Don't be a kook!",
        "Gnarly waves await!",
        "Check the tides first!",
        "Send it!",
        "Nah, stay home today",
        "Epic session incoming!",
        "Surf's up, dude!"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');

    return res.status(200).json({ answer: randomResponse });
}
  