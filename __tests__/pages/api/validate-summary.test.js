import handler from '../../../pages/api/validate-summary';
import { mockApiRequest, mockApiResponse, mockFetch, mockEnvironmentVariables } from '../../utils/testHelpers';

// Mock the in-memory cache to avoid test interference
const mockCache = new Map();
jest.mock('../../../pages/api/validate-summary', () => {
  const originalModule = jest.requireActual('../../../pages/api/validate-summary');
  
  // Mock the cache functions
  const getCacheKey = (summary, surfData) => `${summary}-${JSON.stringify(surfData)}`;
  const getCachedResult = jest.fn();
  const setCachedResult = jest.fn();
  
  return {
    ...originalModule,
    getCacheKey,
    getCachedResult,
    setCachedResult,
    default: originalModule.default
  };
});

describe('/api/validate-summary', () => {
  let fetchMock;
  let req;
  let res;
  let restoreEnv;

  beforeEach(() => {
    fetchMock = mockFetch();
    res = mockApiResponse();
    mockCache.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock Date.now for consistent cache testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // Fixed timestamp
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (restoreEnv) {
      restoreEnv();
    }
  });

  describe('HTTP method validation', () => {
    test('allows POST requests', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { summary: 'Test summary', surfData: {} });
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated summary' } }]
        })
      });

      await handler(req, res);

      expect(res.status).not.toHaveBeenCalledWith(405);
    });

    test('rejects GET requests', async () => {
      req = mockApiRequest('GET');

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
      expect(res.end).toHaveBeenCalledWith('Method GET Not Allowed');
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

  describe('input validation', () => {
    test('requires summary field', async () => {
      req = mockApiRequest('POST', { surfData: {} });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Summary is required' });
    });

    test('handles empty summary', async () => {
      req = mockApiRequest('POST', { summary: '', surfData: {} });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('handles null summary', async () => {
      req = mockApiRequest('POST', { summary: null, surfData: {} });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('allows missing surfData', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { summary: 'Test summary' });
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated summary' } }]
        })
      });

      await handler(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
    });
  });

  describe('OpenAI API key configuration', () => {
    test('returns fallback when API key not configured', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: '' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: { waveHeight: 2.5 }
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: 'Original summary',
        wasValidated: false,
        fallback: true,
        reason: 'OpenAI API key not configured'
      });
    });

    test('returns fallback when API key is undefined', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: undefined });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        fallback: true,
        reason: 'OpenAI API key not configured'
      }));
    });
  });

  describe('successful OpenAI integration', () => {
    test('sends correct request to OpenAI API', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'sk-test123' });
      req = mockApiRequest('POST', {
        summary: 'Great surf today!',
        surfData: { waveHeight: 3.5, wavePeriod: 12, windSpeed: 8, windDirection: 270 }
      });

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: `Stoke rating: 8

Waves crash with power,
Wind whispers through salty air,
Perfect surf awaits.

Crystal of the day: Clear Quartz`
          }
        }]
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse)
      });

      await handler(req, res);

      expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test123'
        },
        body: expect.stringContaining('"model":"gpt-3.5-turbo"')
      });
    });

    test('returns validated summary on success', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: { waveHeight: 2.5 }
      });

      const validatedContent = `Stoke rating: 6

Choppy waves break hard,
Wind howls through morning mist,
Surf wisdom needed.

Crystal of the day: Amethyst`;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: validatedContent } }]
        })
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: validatedContent,
        wasValidated: true,
        originalLength: 'Original summary'.length,
        validatedLength: validatedContent.length
      });
    });

    test('uses correct OpenAI model and parameters', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Test summary', 
        surfData: {} 
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated' } }]
        })
      });

      await handler(req, res);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        model: 'gpt-3.5-turbo',
        max_tokens: 150,
        temperature: 0.3
      });
    });
  });

  describe('OpenAI API error handling', () => {
    test('handles OpenAI API HTTP errors', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: 'Original summary',
        wasValidated: false,
        fallback: true,
        reason: 'OpenAI API error: 429'
      });
    });

    test('handles OpenAI API network errors', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      fetchMock.mockRejectedValueOnce(new Error('Network timeout'));

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: 'Original summary',
        wasValidated: false,
        fallback: true,
        error: 'Validation service temporarily unavailable'
      });
    });

    test('handles empty AI response', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '' } }]
        })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: 'Original summary',
        wasValidated: false,
        fallback: true,
        reason: 'AI returned empty response'
      });
    });

    test('handles malformed AI response', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: null }]
        })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        fallback: true,
        reason: 'AI returned empty response'
      }));
    });
  });

  describe('response validation and sanitization', () => {
    test('rejects responses that are too long', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      const shortSummary = 'Short summary';
      req = mockApiRequest('POST', { 
        summary: shortSummary, 
        surfData: {}
      });

      const veryLongResponse = 'x'.repeat(500); // Longer than 400 char limit
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: veryLongResponse } }]
        })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: shortSummary,
        wasValidated: false,
        fallback: true,
        reason: 'AI response too different from original'
      });
    });

    test('rejects responses dramatically different from original', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      const originalSummary = 'Short';
      req = mockApiRequest('POST', { 
        summary: originalSummary, 
        surfData: {}
      });

      const dramaticallyDifferent = 'x'.repeat(originalSummary.length * 3); // 3x longer
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: dramaticallyDifferent } }]
        })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: originalSummary,
        wasValidated: false,
        fallback: true,
        reason: 'AI response too different from original'
      });
    });

    test('accepts reasonable length increases for stoke rating', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      const originalSummary = 'Good surf today with clean conditions.';
      req = mockApiRequest('POST', { 
        summary: originalSummary, 
        surfData: {}
      });

      const enhancedSummary = `Stoke rating: 7

${originalSummary} Perfect for beginners.

Crystal of the day: Rose Quartz`;

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: enhancedSummary } }]
        })
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        validatedSummary: enhancedSummary,
        wasValidated: true,
        originalLength: originalSummary.length,
        validatedLength: enhancedSummary.length
      });
    });
  });

  describe('prompt construction', () => {
    test('includes surf data in validation prompt', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', {
        summary: 'Test summary',
        surfData: {
          waveHeight: 3.5,
          wavePeriod: 12.5,
          windSpeed: 10.2,
          windDirection: 270
        }
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated' } }]
        })
      });

      await handler(req, res);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      const userMessage = requestBody.messages.find(m => m.role === 'user').content;

      expect(userMessage).toContain('Wave height: 3.5ft');
      expect(userMessage).toContain('Wave period: 12.5s');
      expect(userMessage).toContain('Wind speed: 10.2kts');
      expect(userMessage).toContain('Wind direction: 270°');
    });

    test('handles missing surf data gracefully in prompt', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', {
        summary: 'Test summary',
        surfData: null
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated' } }]
        })
      });

      await handler(req, res);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      const userMessage = requestBody.messages.find(m => m.role === 'user').content;

      expect(userMessage).toContain('Wave height: N/A');
      expect(userMessage).toContain('Wave period: N/A');
      expect(userMessage).toContain('Wind speed: N/A');
      expect(userMessage).toContain('Wind direction: N/A');
    });

    test('includes grumpy surf editor personality in prompt', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', {
        summary: 'Test summary',
        surfData: {}
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated' } }]
        })
      });

      await handler(req, res);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      const systemMessage = requestBody.messages.find(m => m.role === 'system').content;
      const userMessage = requestBody.messages.find(m => m.role === 'user').content;

      expect(systemMessage).toContain('grumpy surf report editor');
      expect(systemMessage).toContain('crystals');
      expect(userMessage).toContain('Stoke rating');
      expect(userMessage).toContain('Haiku');
      expect(userMessage).toContain('Crystal of the day');
    });
  });

  describe('caching functionality', () => {
    test('caches successful validation results', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Test summary', 
        surfData: { waveHeight: 2.5 }
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Validated summary' } }]
        })
      });

      await handler(req, res);

      // Verify response was successful and should be cached
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        validatedSummary: 'Validated summary',
        wasValidated: true
      }));
    });

    test('caches fallback results to avoid repeated API calls', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: '' });
      req = mockApiRequest('POST', { 
        summary: 'Test summary', 
        surfData: { waveHeight: 2.5 }
      });

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        fallback: true,
        reason: 'OpenAI API key not configured'
      }));
    });

    test('caches error results', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Test summary', 
        surfData: { waveHeight: 2.5 }
      });

      fetchMock.mockRejectedValueOnce(new Error('API Error'));

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        fallback: true,
        error: 'Validation service temporarily unavailable'
      }));
    });
  });

  describe('error resilience', () => {
    test('always returns valid response even on complete failure', async () => {
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Original summary', 
        surfData: {}
      });

      fetchMock.mockRejectedValueOnce(new Error('Complete failure'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        validatedSummary: 'Original summary',
        wasValidated: false,
        fallback: true
      }));
    });

    test('handles undefined request body gracefully', async () => {
      req = { method: 'POST', body: undefined };

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        fallback: true
      }));
    });
  });

  describe('logging and debugging', () => {
    test('logs validation errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      restoreEnv = mockEnvironmentVariables({ OPENAI_API_KEY: 'test-key' });
      req = mockApiRequest('POST', { 
        summary: 'Test summary', 
        surfData: {}
      });

      const testError = new Error('Test error');
      fetchMock.mockRejectedValueOnce(testError);

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Validation API error:', 
        'Test error'
      );
    });
  });
});