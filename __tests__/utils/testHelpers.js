// Test utilities and helpers for Ocean Beach SF Surf Conditions App
import { render } from '@testing-library/react';
import React from 'react';

// Mock localStorage for theme persistence testing
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  return localStorageMock;
};

// Mock fetch for API testing
export const mockFetch = () => {
  const mockFetchImpl = jest.fn();
  global.fetch = mockFetchImpl;
  return mockFetchImpl;
};

// Default props for components
export const defaultBuoyData = {
  Hs: '2.5',
  Tp: '10.2',
  Dp: '275',
  timestamp: '2024-01-15T12:00:00Z'
};

export const defaultWindData = {
  speed: '8.1',
  direction: 240,
  gust: '12.5',
  description: 'WSW Light'
};

export const defaultTideData = {
  predictions: [
    {
      t: '2024-01-15 06:12',
      v: '1.234',
      type: 'L'
    },
    {
      t: '2024-01-15 12:36',
      v: '5.678',
      type: 'H'
    }
  ]
};

export const defaultSurfPrediction = {
  prediction: {
    confidence: 0.75,
    recommendation: 'GO SURF!'
  },
  summary: {
    should_go: true,
    recommendation: 'GO SURF!'
  }
};

// Mock Framer Motion components
export const mockFramerMotion = () => {
  jest.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }) => {
        const { initial, animate, transition, whileHover, variants, ...otherProps } = props;
        return <div data-testid="motion-div" {...otherProps}>{children}</div>;
      },
      section: ({ children, ...props }) => {
        const { initial, animate, transition, whileHover, variants, ...otherProps } = props;
        return <section data-testid="motion-section" {...otherProps}>{children}</section>;
      }
    },
    AnimatePresence: ({ children }) => <div data-testid="animate-presence">{children}</div>
  }));
};

// Mock Next.js components
export const mockNextImage = () => {
  jest.mock('next/image', () => {
    return function MockImage({ src, alt, width, height, priority, ...props }) {
      return (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          data-priority={priority}
          {...props}
        />
      );
    };
  });
};

// Mock Next.js router
export const mockNextRouter = () => {
  jest.mock('next/router', () => ({
    useRouter: () => ({
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
      events: {
        on: jest.fn(),
        off: jest.fn()
      }
    })
  }));
};

// Custom render function with common providers
export const renderWithProviders = (ui, options = {}) => {
  return render(ui, {
    ...options,
  });
};

// Mock successful API responses
export const mockSuccessfulApiResponse = (data) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
  headers: new Headers(),
});

// Mock failed API responses
export const mockFailedApiResponse = (status = 500, message = 'Internal Server Error') => ({
  ok: false,
  status,
  statusText: message,
  json: () => Promise.resolve({ error: message }),
  headers: new Headers(),
});

// Mock environment variables
export const mockEnvironmentVariables = (vars) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...vars };
  return () => {
    process.env = originalEnv;
  };
};

// Utility to wait for async operations in tests
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 5000;
    const interval = options.interval || 50;
    const startTime = Date.now();

    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
          return;
        }
      } catch (error) {
        // Continue trying
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
};

// Mock HTTP request/response for API route testing
export const mockApiRequest = (method = 'GET', body = null, query = {}) => ({
  method,
  body: body ? JSON.stringify(body) : undefined,
  query,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mockApiResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

// Common test data generators
export const generateBuoyData = (overrides = {}) => ({
  ...defaultBuoyData,
  ...overrides,
});

export const generateWindData = (overrides = {}) => ({
  ...defaultWindData,
  ...overrides,
});

export const generateTideData = (overrides = {}) => ({
  predictions: [
    ...defaultTideData.predictions,
    ...(overrides.predictions || [])
  ],
  ...overrides,
});

// Accessibility testing helpers
export const checkAccessibility = (component) => {
  // Basic accessibility checks
  const headings = component.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const images = component.querySelectorAll('img');
  const buttons = component.querySelectorAll('button');

  return {
    hasHeadings: headings.length > 0,
    imagesHaveAltText: Array.from(images).every(img => img.hasAttribute('alt')),
    buttonsHaveAccessibleName: Array.from(buttons).every(btn => 
      btn.textContent.trim() || btn.getAttribute('aria-label')
    ),
  };
};

// Performance testing utilities
export const measureRenderTime = (renderFn) => {
  const start = performance.now();
  const result = renderFn();
  const end = performance.now();
  return {
    result,
    renderTime: end - start,
  };
};

// Error boundary for testing error scenarios
export class TestErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Error: {this.state.error.message}</div>;
    }

    return this.props.children;
  }
}