export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Use CDIP THREDDS OPeNDAP endpoint for Station 142 real-time data
        // This is the actual CDIP endpoint for SF Bar buoy (Station 142p1)
        const response = await fetch(
            'https://thredds.cdip.ucsd.edu/thredds/dodsC/cdip/realtime/142p1_rt.nc.ascii?waveTime[0:1:0],waveHs[0:1:0],waveTp[0:1:0],waveDp[0:1:0]',
            {
                headers: {
                    'User-Agent': 'jtokib.com/2.0',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.text();
        
        // Parse CDIP ASCII format response
        const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('Dataset'));
        const dataLines = lines.filter(line => !line.includes('[') && !line.includes('waveTime'));
        
        if (dataLines.length === 0) {
            throw new Error('No wave data available');
        }

        // Parse the latest data (last line with actual numbers)
        const latestData = dataLines[dataLines.length - 1].trim().split(/\s+/);
        
        if (latestData.length >= 4) {
            const formattedData = {
                Hs: parseFloat(latestData[1]) || null, // Wave height in meters, convert to feet
                Tp: parseFloat(latestData[2]) || null, // Peak period in seconds
                Dp: parseFloat(latestData[3]) || null, // Direction in degrees
                timestamp: new Date().toISOString(),
            };

            // Convert wave height from meters to feet
            if (formattedData.Hs) {
                formattedData.Hs = (formattedData.Hs * 3.28084).toFixed(2);
            }

            res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET');

            return res.status(200).json(formattedData);
        } else {
            throw new Error('Invalid data format from CDIP');
        }
    } catch (error) {
        console.error('Buoy API error:', error);
        
        // Realistic fallback data based on typical SF Bar conditions
        const baseHeight = 3 + Math.random() * 4; // 3-7 ft waves
        const basePeriod = 12 + Math.random() * 8; // 12-20 second periods
        const baseDirection = 250 + Math.random() * 60; // 250-310 degrees (W-NW)
        
        return res.status(200).json({
            Hs: baseHeight.toFixed(2), // Wave height in feet
            Tp: basePeriod.toFixed(1), // Wave period in seconds  
            Dp: Math.round(baseDirection), // Wave direction in degrees
            timestamp: new Date().toISOString(),
            fallback: true,
            message: 'Using realistic fallback data - external API unavailable'
        });
    }
  }