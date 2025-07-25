export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // NOAA Weather Station at Ocean Beach SF (Station ID: 9414290)
        const windUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=wind&application=NOS.COOPS.TAC.MET&date=latest&station=9414290&time_zone=lst_ldt&units=english&format=json`;

        const response = await fetch(windUrl, {
            headers: {
                'User-Agent': 'obsuf.surf/2.0',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the latest wind data
        const latestWind = data.data?.[0];

        if (!latestWind) {
            throw new Error('No wind data available');
        }

        // Convert direction to compass text
        const getDirectionText = (degrees) => {
            const directions = [
                'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
            ];
            const index = Math.round(degrees / 22.5) % 16;
            return directions[index];
        };

        // Format the response
        const formattedData = {
            speed: parseFloat(latestWind.s), // Wind speed in knots
            direction: parseInt(latestWind.d), // Wind direction in degrees
            directionText: getDirectionText(parseInt(latestWind.d)),
            gust: latestWind.g ? parseFloat(latestWind.g) : null, // Gust speed if available
            timestamp: latestWind.t,
        };

        res.setHeader('Cache-Control', 's-maxage=1800'); // Cache for 30 minutes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        return res.status(200).json(formattedData);
    } catch (error) {
        console.error('Wind API error:', error);

        // Fallback data if API fails
        return res.status(200).json({
            speed: Math.floor(Math.random() * 15) + 5, // Random 5-20 knots
            direction: Math.floor(Math.random() * 360),
            directionText: 'W',
            gust: null,
            timestamp: new Date().toISOString(),
            fallback: true
        });
    }
  }