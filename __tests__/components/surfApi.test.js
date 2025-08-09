import { validateSummary, getPrediction } from '../../components/surfApi';
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

  describe('validateSummary function', () => {
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

        await validateSummary(mockSummary, mockSurfData);

        expect(fetchMock).toHaveBeenCalledWith('/api/validate-summary', {
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

        const result = await validateSummary(mockSummary, mockSurfData);

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

        const result = await validateSummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('returns original summary when API returns 404', async () => {
        fetchMock.mockResolvedValueOnce(mockFailedApiResponse(404, 'Not Found'));

        const result = await validateSummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('handles network errors gracefully', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await validateSummary(mockSummary, mockSurfData);

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

        const result = await validateSummary(mockSummary, mockSurfData);

        expect(result).toEqual({
          validatedSummary: mockSummary,
          wasValidated: false
        });
      });

      test('logs warning when validation fails', async () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn');
        fetchMock.mockRejectedValueOnce(new Error('API unavailable'));

        await validateSummary(mockSummary, mockSurfData);

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

        expect(fetchMock).toHaveBeenCalledWith('/api/validate-summary', {
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

  describe('getPrediction function', () => {
    const mockSurfConditions = {
      sf_bar_height: '2.5',
      sf_bar_period: 10.2,
      sf_bar_direction: 275,
      wind_category: 'light',
      size_category: 'knee_high',
      tide_category: 'mid_flood'
    };

    describe('successful API calls', () => {
      test('makes POST request with correct parameters', async () => {
        const mockResponse = { predicted_score: 0.75 };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        await getPrediction(mockSurfConditions);

        expect(fetchMock).toHaveBeenCalledWith('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockSurfConditions),
        });
      });

      test('returns predicted score for old format response', async () => {
        const mockResponse = { predicted_score: 0.85 };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(0.85);
      });

      test('converts "Good" prediction to numeric score', async () => {
        const mockResponse = { prediction: 'Good' };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(1);
      });

      test('converts "Bad" prediction to numeric score', async () => {
        const mockResponse = { prediction: 'Bad' };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(0);
      });

      test('handles mixed format response (prioritizes predicted_score)', async () => {
        const mockResponse = { 
          predicted_score: 0.65,
          prediction: 'Good'
        };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(0.65);
      });
    });

    describe('failed API calls', () => {
      test('returns null on non-ok HTTP status', async () => {
        fetchMock.mockResolvedValueOnce(mockFailedApiResponse(500));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBeNull();
      });

      test('logs error for HTTP error status', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');
        fetchMock.mockResolvedValueOnce(mockFailedApiResponse(404));

        await getPrediction(mockSurfConditions);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Prediction API error:', 404);
      });

      test('returns null on network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network timeout'));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBeNull();
      });

      test('logs error on network failure', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error');
        const networkError = new Error('Connection failed');
        fetchMock.mockRejectedValueOnce(networkError);

        await getPrediction(mockSurfConditions);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting prediction:', networkError);
      });

      test('returns null when response has no prediction data', async () => {
        const mockResponse = { message: 'No prediction available' };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBeNull();
      });
    });

    describe('response format handling', () => {
      test('handles undefined predicted_score', async () => {
        const mockResponse = { 
          predicted_score: undefined,
          prediction: 'Good'
        };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(1);
      });

      test('handles null prediction values', async () => {
        const mockResponse = { 
          predicted_score: null,
          prediction: null
        };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBeNull();
      });

      test('handles unexpected prediction string values', async () => {
        const mockResponse = { prediction: 'Unknown' };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(0); // Should default to 0 for non-"Good" values
      });

      test('handles case insensitive prediction values', async () => {
        const mockResponse = { prediction: 'GOOD' };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction(mockSurfConditions);

        expect(result).toBe(1);
      });
    });

    describe('input validation', () => {
      test('handles empty surf conditions', async () => {
        const mockResponse = { predicted_score: 0.5 };
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse(mockResponse));

        const result = await getPrediction({});

        expect(result).toBe(0.5);
      });

      test('handles null surf conditions', async () => {
        fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse({ predicted_score: 0.3 }));

        const result = await getPrediction(null);

        expect(fetchMock).toHaveBeenCalledWith('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(null),
        });
      });
    });
  });

  describe('error resilience', () => {
    test('validateSummary continues working after network failure', async () => {
      const mockSummary = 'Test summary';
      const mockSurfData = { waveHeight: 2 };

      // First call fails
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      let result1 = await validateSummary(mockSummary, mockSurfData);

      expect(result1).toEqual({
        validatedSummary: mockSummary,
        wasValidated: false
      });

      // Second call succeeds
      fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse({
        validatedSummary: 'Validated summary',
        wasValidated: true
      }));

      let result2 = await validateSummary(mockSummary, mockSurfData);

      expect(result2).toEqual({
        validatedSummary: 'Validated summary',
        wasValidated: true
      });
    });

    test('getPrediction continues working after API failure', async () => {
      const mockConditions = { wave_height: 2.5 };

      // First call fails
      fetchMock.mockResolvedValueOnce(mockFailedApiResponse(503));
      let result1 = await getPrediction(mockConditions);
      expect(result1).toBeNull();

      // Second call succeeds
      fetchMock.mockResolvedValueOnce(mockSuccessfulApiResponse({ predicted_score: 0.8 }));
      let result2 = await getPrediction(mockConditions);
      expect(result2).toBe(0.8);
    });
  });

  describe('concurrent requests', () => {
    test('handles multiple validateSummary calls simultaneously', async () => {
      const summaries = ['Summary 1', 'Summary 2', 'Summary 3'];
      const mockSurfData = { waveHeight: 2.5 };

      // Mock responses for each call
      fetchMock.mockResolvedValue(mockSuccessfulApiResponse({
        validatedSummary: 'Validated',
        wasValidated: true
      }));

      const promises = summaries.map(summary => 
        validateSummary(summary, mockSurfData)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.wasValidated).toBe(true);
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    test('handles multiple getPrediction calls simultaneously', async () => {
      const conditions = [
        { wave_height: 2.5 },
        { wave_height: 3.0 },
        { wave_height: 1.5 }
      ];

      fetchMock.mockResolvedValue(mockSuccessfulApiResponse({ predicted_score: 0.7 }));

      const promises = conditions.map(condition => 
        getPrediction(condition)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBe(0.7);
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});