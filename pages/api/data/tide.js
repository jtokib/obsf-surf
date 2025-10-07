export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get yesterday's date for begin_date (previous 24 hours)
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const beginDate = yesterday.toISOString().split('T')[0].replace(/-/g, '');
        
        // Get tomorrow's date for end_date (future 24 hours)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
        
        // Corrected NOAA API URL with proper parameters
        const tidesUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=obsuf_surf_app&begin_date=${beginDate}&end_date=${endDate}&datum=MLLW&station=9414290&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

        const response = await fetch(tidesUrl, {
            headers: {
                'User-Agent': 'obsuf.surf/2.0',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        res.setHeader('Cache-Control', 's-maxage=1800'); // Cache for 30 minutes
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        return res.status(200).json(data);
    } catch (error) {
        console.error('Tides API error:', error);
        
        // Fallback tide data if API fails
        const now = new Date();
        const mockTides = [
            {
                t: now.toISOString().split('T')[0] + ' 06:15',  
                v: '5.2',
                type: 'H'
            },
            {
                t: now.toISOString().split('T')[0] + ' 12:30',
                v: '1.8', 
                type: 'L'
            },
            {
                t: now.toISOString().split('T')[0] + ' 18:45',
                v: '4.9',
                type: 'H'
            }
        ];
        
        return res.status(200).json({
            predictions: mockTides,
            fallback: true,
            message: 'Using fallback data - external API unavailable'
        });
    }
  }