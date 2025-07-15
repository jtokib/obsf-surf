export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // CDIP API endpoint for SF Bar Buoy (Station 142)
        const response = await fetch(
            'https://cdip.ucsd.edu/data_access/MEM_2d_download.cdip?sp=142p1&ep=142p1&file_type=json&num_pts=1&all_data=1',
            {
                headers: {
                    'User-Agent': 'jtokib.com/2.0',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the latest data point
        const latestData = data.data?.[0];

        if (!latestData) {
            throw new Error('No data available');
        }

        // Format the response to match your original structure
        const formattedData = {
            Hs: latestData.waveHeight, // Significant wave height
            Tp: latestData.wavePeriod, // Peak wave period
            Dp: latestData.waveDirection, // Wave direction
            timestamp: latestData.timestamp,
        };

        res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        return res.status(200).json(formattedData);
    } catch (error) {
        console.error('Buoy API error:', error);
        return res.status(500).json({
            error: 'Failed to fetch buoy data',
            message: error.message
        });
    }
  }