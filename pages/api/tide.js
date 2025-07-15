export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const tidesUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=NOS.COOPS.TAC.WL&date=${today}&datum=MLLW&station=9414290&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

        const response = await fetch(tidesUrl, {
            headers: {
                'User-Agent': 'jtokib.com/2.0',
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
        return res.status(500).json({
            error: 'Failed to fetch tide data',
            message: error.message
        });
    }
  }