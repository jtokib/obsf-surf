export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
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

    // Calculate average wind direction (handles circular nature of angles)
    const averageWindDirection = (directions) => {
        if (directions.length === 0) return null;
        
        // Convert to radians and calculate x,y components
        let sumX = 0, sumY = 0;
        directions.forEach(deg => {
            const rad = (deg * Math.PI) / 180;
            sumX += Math.cos(rad);
            sumY += Math.sin(rad);
        });
        
        // Calculate average angle
        const avgRad = Math.atan2(sumY / directions.length, sumX / directions.length);
        let avgDeg = (avgRad * 180) / Math.PI;
        
        // Ensure positive angle
        if (avgDeg < 0) avgDeg += 360;
        
        return Math.round(avgDeg);
    };

    const sources = [];
    const errors = [];

    // Fetch from all three sources simultaneously
    const promises = [
        // KSFO (San Francisco Airport)
        fetch('https://api.weather.gov/stations/KSFO/observations/latest', {
            headers: {
                'User-Agent': 'obsuf.surf/2.0 (contact@obsuf.surf)',
                'Accept': 'application/json',
            },
        }).then(async response => {
            if (response.ok) {
                const data = await response.json();
                const properties = data.properties;
                
                if (properties && properties.windSpeed && properties.windDirection) {
                    // Convert km/h to knots (1 km/h = 0.539957 knots)
                    const windSpeedKmh = properties.windSpeed.value;
                    const windSpeed = windSpeedKmh ? Math.round(windSpeedKmh * 0.539957 * 10) / 10 : null;
                    const windDirection = properties.windDirection.value;
                    const gustSpeedKmh = properties.windGust ? properties.windGust.value : null;
                    const gustSpeed = gustSpeedKmh ? Math.round(gustSpeedKmh * 0.539957 * 10) / 10 : null;

                    if (windSpeed !== null && windDirection !== null) {
                        return {
                            source: 'KSFO',
                            speed: windSpeed,
                            direction: windDirection,
                            gust: gustSpeed,
                            timestamp: properties.timestamp,
                            weight: 1.5 // Higher weight as it's closest to shore
                        };
                    }
                }
            }
            throw new Error('KSFO data unavailable');
        }).catch(error => {
            errors.push(`KSFO: ${error.message}`);
            return null;
        }),

        // OpenWeatherMap for Ocean Beach coordinates
        (async () => {
            const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
            if (!openWeatherApiKey) {
                errors.push('OpenWeatherMap: API key not configured');
                return null;
            }

            try {
                const lat = 37.76;
                const lon = -122.51;
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherApiKey}&units=metric`, {
                    headers: { 'User-Agent': 'obsuf.surf/2.0' },
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.wind && data.wind.speed !== undefined && data.wind.deg !== undefined) {
                        // Convert m/s to knots
                        const windSpeed = Math.round(data.wind.speed * 1.944 * 10) / 10;
                        const windDirection = data.wind.deg;
                        const gustSpeed = data.wind.gust ? Math.round(data.wind.gust * 1.944 * 10) / 10 : null;

                        return {
                            source: 'OpenWeatherMap',
                            speed: windSpeed,
                            direction: windDirection,
                            gust: gustSpeed,
                            timestamp: new Date(data.dt * 1000).toISOString(),
                            weight: 2.0 // Highest weight as it's most specific to Ocean Beach
                        };
                    }
                }
                throw new Error('OpenWeatherMap data unavailable');
            } catch (error) {
                errors.push(`OpenWeatherMap: ${error.message}`);
                return null;
            }
        })(),

        // NDBC Offshore Buoy
        fetch(`https://www.ndbc.noaa.gov/data/realtime2/46026.txt?_=${Date.now()}`, {
            headers: { 'User-Agent': 'obsuf.surf/2.0' },
        }).then(async response => {
            if (response.ok) {
                const textData = await response.text();
                const lines = textData.trim().split('\n');
                
                if (lines.length >= 3) {
                    const latestLine = lines[2];
                    const values = latestLine.split(/\s+/);
                    
                    const windDirection = parseFloat(values[5]);
                    const windSpeed = parseFloat(values[6]); // Already in knots from NDBC
                    const gustSpeed = parseFloat(values[7]);
                    
                    if (!isNaN(windDirection) && !isNaN(windSpeed)) {
                        const year = 2000 + parseInt(values[0]);
                        const month = parseInt(values[1]);
                        const day = parseInt(values[2]);
                        const hour = parseInt(values[3]);
                        const minute = parseInt(values[4]);
                        const timestamp = new Date(year, month - 1, day, hour, minute).toISOString();

                        return {
                            source: 'NDBC-46026',
                            speed: windSpeed,
                            direction: windDirection,
                            gust: !isNaN(gustSpeed) && gustSpeed !== 99.0 ? gustSpeed : null,
                            timestamp: timestamp,
                            weight: 1.0 // Lower weight as it's offshore
                        };
                    }
                }
            }
            throw new Error('NDBC data unavailable');
        }).catch(error => {
            errors.push(`NDBC: ${error.message}`);
            return null;
        })
    ];

    try {
        const results = await Promise.all(promises);
        const validSources = results.filter(result => result !== null);
        
        if (validSources.length === 0) {
            throw new Error('No valid wind data sources available');
        }

        // Calculate weighted averages
        const totalWeight = validSources.reduce((sum, source) => sum + source.weight, 0);
        const weightedSpeedSum = validSources.reduce((sum, source) => sum + (source.speed * source.weight), 0);
        const averageSpeed = Math.round((weightedSpeedSum / totalWeight) * 10) / 10;
        
        // Get all directions for averaging
        const directions = validSources.map(source => source.direction);
        const averageDirection = averageWindDirection(directions);
        
        // Calculate average gust (simple average of non-null values)
        const gustSpeeds = validSources.filter(source => source.gust !== null).map(source => source.gust);
        const averageGust = gustSpeeds.length > 0 
            ? Math.round((gustSpeeds.reduce((sum, gust) => sum + gust, 0) / gustSpeeds.length) * 10) / 10 
            : null;

        // Use the most recent timestamp
        const mostRecentTimestamp = validSources
            .map(source => new Date(source.timestamp))
            .sort((a, b) => b - a)[0]
            .toISOString();

        const formattedData = {
            speed: averageSpeed,
            direction: averageDirection,
            directionText: getDirectionText(averageDirection),
            gust: averageGust,
            timestamp: mostRecentTimestamp,
            source: 'averaged',
            sources: validSources.map(s => ({
                name: s.source,
                speed: s.speed,
                direction: s.direction,
                gust: s.gust,
                weight: s.weight,
                timestamp: s.timestamp
            })),
            errors: errors.length > 0 ? errors : undefined
        };

        res.setHeader('Cache-Control', 's-maxage=900'); // Cache for 15 minutes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        return res.status(200).json(formattedData);

    } catch (error) {
        console.error('All wind API sources failed:', error);

        // Fallback data if all APIs fail
        return res.status(200).json({
            speed: Math.floor(Math.random() * 15) + 5,
            direction: Math.floor(Math.random() * 360),
            directionText: 'W',
            gust: null,
            timestamp: new Date().toISOString(),
            fallback: true,
            source: 'fallback',
            errors: errors
        });
    }
}