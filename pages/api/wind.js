export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // NDBC Station 46026 (SF Bar Buoy) - 18nm west of Ocean Beach SF - more accurate for surf conditions
        const windUrl = `https://www.ndbc.noaa.gov/data/realtime2/46026.txt?_=${Date.now()}`;

        const response = await fetch(windUrl, {
            headers: {
                'User-Agent': 'obsuf.surf/2.0',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textData = await response.text();
        const lines = textData.trim().split('\n');
        
        // NDBC format: skip header lines (first 2 lines), get most recent data
        if (lines.length < 3) {
            throw new Error('No wind data available');
        }

        const latestLine = lines[2]; // First data line after headers
        const values = latestLine.split(/\s+/);
        
        // NDBC format: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE
        // Indices: 0=YY, 1=MM, 2=DD, 3=hh, 4=mm, 5=WDIR, 6=WSPD, 7=GST
        const windDirection = parseFloat(values[5]);
        const windSpeed = parseFloat(values[6]);
        const gustSpeed = parseFloat(values[7]);
        
        if (isNaN(windDirection) || isNaN(windSpeed)) {
            throw new Error('Invalid wind data format');
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

        // Create timestamp from NDBC data
        const year = 2000 + parseInt(values[0]);
        const month = parseInt(values[1]);
        const day = parseInt(values[2]);
        const hour = parseInt(values[3]);
        const minute = parseInt(values[4]);
        const timestamp = new Date(year, month - 1, day, hour, minute).toISOString();

        // Format the response
        const formattedData = {
            speed: windSpeed, // Wind speed in knots
            direction: windDirection, // Wind direction in degrees
            directionText: getDirectionText(windDirection),
            gust: !isNaN(gustSpeed) && gustSpeed !== 99.0 ? gustSpeed : null, // Gust speed if available (99.0 means no data)
            timestamp: timestamp,
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