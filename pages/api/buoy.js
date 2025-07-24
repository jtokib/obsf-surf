export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Access CDIP station 142 spectral parameters (sp) data using justdar API
        // This should return recent wave height, period, and direction data
        const apiUrl = `https://cdip.ucsd.edu/data_access/justdar.cdip?142+sp`;
        
        console.log('=== CDIP API Request ===');
        console.log('API URL:', apiUrl);
        console.log('Attempting direct station access');
        console.log('=== End API Request ===');
        
        const response = await fetch(
            apiUrl,
            {
                headers: {
                    'User-Agent': 'jtokib.com/2.0',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textData = await response.text();
        
        // Log the raw text response for troubleshooting
        console.log('=== CDIP Text Response ===');
        console.log('Response length:', textData.length);
        console.log('First 500 characters:', textData.substring(0, 500));
        console.log('=== End Text Response ===');
        
        // Parse text response - look for the wave parameters line
        // Format: Hs(m):  0.82   Tp(s): 15.38   Dp(deg): 222   Ta(s):  8.48
        const waveParamsMatch = textData.match(/Hs\(m\):\s*([\d.]+)\s+Tp\(s\):\s*([\d.]+)\s+Dp\(deg\):\s*(\d+)/);
        
        // Log parsing results
        console.log('=== Text Parsing Results ===');
        console.log('Wave params match:', waveParamsMatch);
        console.log('=== End Parsing Results ===');
        
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
            throw new Error('Invalid text data format from CDIP - could not parse wave parameters');
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