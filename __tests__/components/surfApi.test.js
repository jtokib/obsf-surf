import { createAISummary, surfUtils } from '../../components/surfApi';
import { mockFetch, mockSuccessfulApiResponse, mockFailedApiResponse } from '../utils/testHelpers';

describe('surfApi Utilities', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = mockFetch();
    jest.clearAllMocks();
    // Clear console warnings for cleaner test output
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAISummary function', () => {
    const mockSummary = "Today's surf conditions are epic with 6ft waves!";
    const mockSurfData = {
      waveHeight: 2.5,
      wavePeriod: 10.2,
      windSpeed: 8.1,
      windDirection: 240
    };

    describe('successful API calls', () => {
      test('makes POST request with correct parameters', async () => {
        const mockResponse = {
          validatedSummary: "Today's surf conditions are epic with 6ft waves! Perfect for intermediate surfers.",
          wasValidated: true
        };

        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        await createAISummary(mockSummary, mockSurfData);

        expect(fetchMock).toHaveBeenCalledWith('/api/create-ai-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            summary: mockSummary, 
            surfData: mockSurfData 
          }),
        });
      });

      test('returns validated summary on successful response', async () => {
        const mockResponse = {
          validatedSummary: "Enhanced summary with better grammar and flow.",
          wasValidated: true
        };

        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await createAISummary(mockSummary, mockSurfData);

        expect(result).toEqual(mockResponse);
        expect(result.validatedSummary).toBe("Enhanced summary with better grammar and flow.");
        expect(result.wasValidated).toBe(true);
      });

      test('handles empty summary gracefully', async () => {
        const mockResponse = {
          validatedSummary: '',
          wasValidated: false
        };

        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await validateSummary('', mockSurfData);

        expect(result).toEqual(mockResponse);
      });
    });

    describe('failed API calls', () => {
      test('returns original summary when API returns non-ok status', async () => {
        fetchMock.mockResolvedValueOnce(mockFailedApiResponse(500));

        const result = await createAISummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('returns original summary when API returns 404', async () => {
        fetchMock.mockResolvedValueOnce(mockFailedApiResponse(404, 'Not Found'));

        const result = await createAISummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('handles network errors gracefully', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await createAISummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('handles JSON parsing errors', async () => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error('Invalid JSON')),
        });

        const result = await createAISummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('logs warning when validation fails', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn');
        fetchMock.mockRejectedValueOnce(new Error('API unavailable'));

        await createAISummary(mockSummary, mockSurfData);

        expect(consoleWarnSpy).toHaveBeenCalledWith('Summary validation failed:', expect.any(Error));
      });
    });

    describe('input validation', () => {
      test('handles null summary', async () => {
        const mockResponse = {
          validatedSummary: null,
          wasValidated: false
        };

        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await validateSummary(null, mockSurfData);

        expect(result).toEqual(mockResponse);
      });

      test('handles undefined surf data', async () => {
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse({ 
          validatedSummary: mockSummary, 
          wasValidated: true 
        }));

        const result = await validateSummary(mockSummary, undefined);

        expect(fetchMock).toHaveBeenCalledWith('/api/create-ai-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            summary: mockSummary, 
            surfData: undefined 
          }),
        });
      });
    });
  });

  describe('surfUtils utility functions', () => {
    describe('getWindDirectionText', () => {
      test('returns correct cardinal directions', () => {
        expect(surfUtils.getWindDirectionText(0)).toBe('N');
        expect(surfUtils.getWindDirectionText(90)).toBe('E');
        expect(surfUtils.getWindDirectionText(180)).toBe('S');
        expect(surfUtils.getWindDirectionText(270)).toBe('W');
      });

      test('returns correct intermediate directions', () => {
        expect(surfUtils.getWindDirectionText(45)).toBe('NE');
        expect(surfUtils.getWindDirectionText(135)).toBe('SE');
        expect(surfUtils.getWindDirectionText(225)).toBe('SW');
        expect(surfUtils.getWindDirectionText(315)).toBe('NW');
      });
    });

    describe('getWaveQuality', () => {
      test('categorizes wave sizes correctly', () => {
        expect(surfUtils.getWaveQuality(0.3)).toEqual({ emoji: '😴', status: 'Flat City' });
        expect(surfUtils.getWaveQuality(1.0)).toEqual({ emoji: '🏄‍♂️', status: 'Fun Size' });
        expect(surfUtils.getWaveQuality(1.5)).toEqual({ emoji: '🔥', status: 'Epic!' });
        expect(surfUtils.getWaveQuality(2.5)).toEqual({ emoji: '⚡', status: 'GNARLY!' });
      });
    });

    describe('getWindCondition', () => {
      test('categorizes wind speeds correctly', () => {
        expect(surfUtils.getWindCondition(2).status).toBe('Glassy');
        expect(surfUtils.getWindCondition(8).status).toBe('Light');
        expect(surfUtils.getWindCondition(12).status).toBe('Moderate');
        expect(surfUtils.getWindCondition(20).status).toBe('Strong');
        expect(surfUtils.getWindCondition(30).status).toBe('Howling!');
      });
    });
  });

  describe('error resilience', () => {
    test('createAISummary continues working after network failure', async () => {
      const mockSummary = 'Test summary';
      const mockSurfData = { waveHeight: 2 };

      // First call fails
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      let result1 = await createAISummary(mockSummary, mockSurfData);

      expect(result1).toEqual({
        validatedSummary: mockSummary,
        wasValidated: false
      });

      // Second call succeeds
      fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse({
        validatedSummary: 'Validated summary',
        wasValidated: true
      }));

      let result2 = await createAISummary(mockSummary, mockSurfData);

      expect(result2).toEqual({
        validatedSummary: 'Validated summary',
        wasValidated: true
      });
    });

  });

  describe('concurrent requests', () => {
    test('handles multiple createAISummary calls simultaneously', async () => {
      const summaries = ['Summary 1', 'Summary 2', 'Summary 3'];
      const mockSurfData = { waveHeight: 2.5 };

      // Mock responses for each call
      fetchMock.mockResolvedValue(mockSuccessfulApiResponse({
        validatedSummary: 'Validated',
        wasValidated: true
      }));

      const promises = summaries.map(summary => 
        createAISummary(summary, mockSurfData)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.wasValidated).toBe(true);
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

  });
});