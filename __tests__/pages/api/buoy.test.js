import handler from '../../../pages/api/buoy';
import { mockApiRequest, mockApiResponse, mockFetch } from '../../utils/testHelpers';

describe('/api/buoy', () => {
  let fetchMock;
  let req;
  let res;

  beforeEach(() => {
    fetchMock = mockFetch();
    res = mockApiResponse();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HTTP method validation', () => {
    test('allows GET requests', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275   Ta(s):  8.48')
      });

      await handler(req, res);

      expect(res.status).not.toHaveBeenCalledWith(405);
    });

    test('rejects non-GET requests', async () => {
      req = mockApiRequest('POST');

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ message: 'Method not allowed' });
    });

    test('rejects PUT requests', async () => {
      req = mockApiRequest('PUT');

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });

    test('rejects DELETE requests', async () => {
      req = mockApiRequest('DELETE');

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('station parameter handling', () => {
    test('defaults to station 142 when no station specified', async () => {
      req = mockApiRequest('GET', null, {});
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://cdip.ucsd.edu/data_access/justdar.cdip?142+sp',
        expect.objectContaining({
          headers: { 'User-Agent': 'obsuf.surf/2.0' }
        })
      );
    });

    test('uses specified station parameter', async () => {
      req = mockApiRequest('GET', null, { station: '029' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  1.80   Tp(s): 12.50   Dp(deg): 290')
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://cdip.ucsd.edu/data_access/justdar.cdip?029+sp',
        expect.objectContaining({
          headers: { 'User-Agent': 'obsuf.surf/2.0' }
        })
      );
    });

    test('handles custom station numbers', async () => {
      req = mockApiRequest('GET', null, { station: '100' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  3.20   Tp(s): 8.50   Dp(deg): 180')
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://cdip.ucsd.edu/data_access/justdar.cdip?100+sp',
        expect.any(Object)
      );
    });
  });

  describe('successful data fetching and parsing', () => {
    test('parses valid wave data correctly', async () => {
      req = mockApiRequest('GET');
      const mockCdipData = 'Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275   Ta(s):  8.48';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockCdipData)
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        Hs: '8.20', // 2.50m * 3.28084 = ~8.20ft
        Tp: 10.20,
        Dp: 275,
        timestamp: expect.any(String)
      });
    });

    test('handles decimal wave heights correctly', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  1.25   Tp(s): 15.75   Dp(deg): 220')
      });

      await handler(req, res);

      const expectedHeight = (1.25 * 3.28084).toFixed(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: expectedHeight,
        Tp: 15.75,
        Dp: 220
      }));
    });

    test('handles integer values correctly', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  3   Tp(s): 12   Dp(deg): 180')
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: '9.84', // 3m * 3.28084
        Tp: 12,
        Dp: 180
      }));
    });

    test('handles zero values', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  0.00   Tp(s): 0.00   Dp(deg): 0')
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: '0.00',
        Tp: 0,
        Dp: 0
      }));
    });
  });

  describe('response headers', () => {
    test('sets correct cache headers', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=1800');
    });

    test('sets CORS headers correctly', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET');
    });
  });

  describe('data parsing edge cases', () => {
    test('handles extra whitespace in data', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('  Hs(m):   2.50    Tp(s):  10.20   Dp(deg):  275  ')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: '8.20',
        Tp: 10.20,
        Dp: 275
      }));
    });

    test('handles data with additional text', async () => {
      req = mockApiRequest('GET');
      const textWithExtra = `
        Station 142 Data:
        Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275   Ta(s):  8.48
        Other data follows...
      `;
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(textWithExtra)
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: '8.20',
        Tp: 10.20,
        Dp: 275
      }));
    });
  });

  describe('error handling', () => {
    test('handles CDIP API HTTP errors', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Buoy data unavailable',
        message: 'Unable to retrieve current buoy data from CDIP',
        timestamp: expect.any(String)
      });
    });

    test('handles network errors', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockRejectedValueOnce(new Error('Network timeout'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Buoy data unavailable',
        message: 'Unable to retrieve current buoy data from CDIP'
      }));
    });

    test('handles malformed data response', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Invalid data format without proper wave params')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Buoy data unavailable'
      }));
    });

    test('handles empty response (buoy offline)', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(console.error).toHaveBeenCalledWith(
        'Buoy API error:', 
        expect.objectContaining({
          message: 'Buoy temporarily offline or under maintenance'
        })
      );
    });

    test('handles whitespace-only response', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('   \n   \t   ')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(console.error).toHaveBeenCalledWith(
        'Buoy API error:', 
        expect.objectContaining({
          message: 'Buoy temporarily offline or under maintenance'
        })
      );
    });
  });

  describe('data validation', () => {
    test('handles null values in parsed data', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  null   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503); // Should fail to parse properly
    });

    test('handles missing wave height', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Tp(s): 10.20   Dp(deg): 275   Ta(s):  8.48')
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
    });

    test('handles partial data parsing', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): invalid   Dp(deg): 275')
      });

      await handler(req, res);

      // Should still parse what it can or fail gracefully
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe('unit conversion', () => {
    test('converts meters to feet correctly', async () => {
      req = mockApiRequest('GET');
      
      const testCases = [
        { meters: 1.0, expectedFeet: '3.28' },
        { meters: 2.5, expectedFeet: '8.20' },
        { meters: 0.5, expectedFeet: '1.64' },
        { meters: 5.0, expectedFeet: '16.40' }
      ];

      for (const testCase of testCases) {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`Hs(m):  ${testCase.meters}   Tp(s): 10.00   Dp(deg): 270`)
        });

        await handler(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          Hs: testCase.expectedFeet
        }));
        
        res.json.mockClear();
      }
    });

    test('preserves precision in conversion', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  1.234   Tp(s): 9.876   Dp(deg): 123')
      });

      await handler(req, res);

      const expectedHeight = (1.234 * 3.28084).toFixed(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        Hs: expectedHeight,
        Tp: 9.876,
        Dp: 123
      }));
    });
  });

  describe('external API integration', () => {
    test('uses correct User-Agent header', async () => {
      req = mockApiRequest('GET');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': 'obsuf.surf/2.0'
          }
        })
      );
    });

    test('constructs correct CDIP API URL', async () => {
      req = mockApiRequest('GET', null, { station: '029' });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith(
        'https://cdip.ucsd.edu/data_access/justdar.cdip?029+sp',
        expect.any(Object)
      );
    });
  });

  describe('timestamp handling', () => {
    test('includes current timestamp in response', async () => {
      req = mockApiRequest('GET');
      const testStartTime = new Date().toISOString();
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('Hs(m):  2.50   Tp(s): 10.20   Dp(deg): 275')
      });

      await handler(req, res);

      const responseCall = res.json.mock.calls[0][0];
      const responseTime = new Date(responseCall.timestamp);
      const testEndTime = new Date().toISOString();

      expect(responseTime.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(responseTime >= new Date(testStartTime)).toBe(true);
      expect(responseTime <= new Date(testEndTime)).toBe(true);
    });
  });
});