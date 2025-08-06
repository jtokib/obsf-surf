export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get station parameter - default to 142 (SF Bar Buoy), 029 is Pt Reyes
        const station = req.query.station || '142';
        
        // Access CDIP station spectral parameters (sp) data using justdar API
        // Station 142: SF Bar Buoy, Station 029: Pt Reyes
        const apiUrl = `https://cdip.ucsd.edu/data_access/justdar.cdip?${station}+sp`;
        
        
        const response = await fetch(
            apiUrl,
            {
                headers: {
                    'User-Agent': 'obsuf.surf/2.0',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textData = await response.text();
        
        
        // Parse text response - look for the wave parameters line
        // Format: Hs(m):  0.82   Tp(s): 15.38   Dp(deg): 222   Ta(s):  8.48
        const waveParamsMatch = textData.match(/Hs\(m\):\s*([\d.]+)\s+Tp\(s\):\s*([\d.]+)\s+Dp\(deg\):\s*(\d+)/);
        
        
        if (waveParamsMatch) {
            const formattedData = {
                Hs: parseFloat(waveParamsMatch[1]) || null, // Wave height in meters
                Tp: parseFloat(waveParamsMatch[2]) || null, // Peak period in seconds
                Dp: parseInt(waveParamsMatch[3]) || null, // Direction in degrees
                timestamp: new Date().toISOString(),
            };

            // Convert wave height from meters to feet
            if (formattedData.Hs) {
                formattedData.Hs = (formattedData.Hs * 3.28084).toFixed(2);
            }

            res.setHeader('Cache-Control', 's-maxage=1800'); // Cache for 30 minutes
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET');

            return res.status(200).json(formattedData);
        } else {
            // Check if response is completely empty (buoy offline) vs malformed data
            const isEmptyResponse = !textData || textData.trim() === '';
            const errorMessage = isEmptyResponse 
                ? 'Buoy temporarily offline or under maintenance'
                : 'Invalid text data format from CDIP - could not parse wave parameters';
                
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Buoy API error:', error);
        
        return res.status(503).json({
            error: 'Buoy data unavailable',
            message: 'Unable to retrieve current buoy data from CDIP',
            timestamp: new Date().toISOString()
        });
    }
  }