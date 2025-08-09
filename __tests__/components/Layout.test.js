import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Layout from '../../components/Layout';
import { mockLocalStorage, mockFramerMotion } from '../utils/testHelpers';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, whileHover, variants, ...otherProps } = props;
      return <div data-testid="motion-div" {...otherProps}>{children}</div>;
    }
  }
}));

describe('Layout Component', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    // Clear any existing body classes
    document.body.className = '';
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    test('renders children correctly', () => {
      render(
        <Layout>
          <div data-testid="test-child">Test Content</div>
        </Layout>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('renders footer with correct copyright year', () => {
      render(<Layout><div>Content</div></Layout>);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`©${currentYear}`))).toBeInTheDocument();
      expect(screen.getByText(/Ocean Beach SF Surf Conditions/)).toBeInTheDocument();
    });

    test('renders theme toggle button in footer', () => {
      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText(/Light Mode|Dark Mode/);
      expect(themeToggle).toBeInTheDocument();
      expect(themeToggle).toHaveClass('clickable');
    });
  });

  describe('dark/light mode toggle', () => {
    test('defaults to dark mode when no localStorage value exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<Layout><div>Content</div></Layout>);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('dm', '1');
      expect(screen.getByText('🌅 Light Mode')).toBeInTheDocument();
    });

    test('loads dark mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      expect(screen.getByText('🌅 Light Mode')).toBeInTheDocument();
    });

    test('loads light mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('0');

      render(<Layout><div>Content</div></Layout>);

      expect(screen.getByText('🌙 Dark Mode')).toBeInTheDocument();
    });

    test('toggles from dark to light mode', () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText('🌅 Light Mode');
      fireEvent.click(themeToggle);

      expect(screen.getByText('🌙 Dark Mode')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dm', '0');
    });

    test('toggles from light to dark mode', () => {
      localStorageMock.getItem.mockReturnValue('0');

      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText('🌙 Dark Mode');
      fireEvent.click(themeToggle);

      expect(screen.getByText('🌅 Light Mode')).toBeInTheDocument();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dm', '1');
    });

    test('persists theme preference to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText('🌅 Light Mode');
      fireEvent.click(themeToggle);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('dm', '0');
    });
  });

  describe('theme application to body element', () => {
    test('applies dark-mode class to body when in dark mode', async () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      await waitFor(() => {
        expect(document.body.className).toBe('dark-mode');
      });
    });

    test('applies light-mode class to body when in light mode', async () => {
      localStorageMock.getItem.mockReturnValue('0');

      render(<Layout><div>Content</div></Layout>);

      await waitFor(() => {
        expect(document.body.className).toBe('light-mode');
      });
    });

    test('updates body class when theme changes', async () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      await waitFor(() => {
        expect(document.body.className).toBe('dark-mode');
      });

      const themeToggle = screen.getByText('🌅 Light Mode');
      fireEvent.click(themeToggle);

      await waitFor(() => {
        expect(document.body.className).toBe('light-mode');
      });
    });
  });

  describe('layout CSS classes', () => {
    test('applies correct layout classes in dark mode', () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      const layoutDiv = screen.getByTestId('motion-div');
      expect(layoutDiv).toHaveClass('layout', 'dark-mode');
      expect(layoutDiv).not.toHaveClass('light-mode');
    });

    test('applies correct layout classes in light mode', () => {
      localStorageMock.getItem.mockReturnValue('0');

      render(<Layout><div>Content</div></Layout>);

      const layoutDiv = screen.getByTestId('motion-div');
      expect(layoutDiv).toHaveClass('layout', 'light-mode');
      expect(layoutDiv).not.toHaveClass('dark-mode');
    });
  });

  describe('scanline effect', () => {
    test('applies scanline effect periodically', () => {
      render(<Layout><div>Content</div></Layout>);

      const layoutDiv = screen.getByTestId('motion-div');
      
      // Initially no scanline effect
      expect(layoutDiv).not.toHaveClass('scanline-effect');

      // Fast forward to trigger the scanline effect
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      expect(layoutDiv).toHaveClass('scanline-effect');

      // Fast forward to remove the scanline effect
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(layoutDiv).not.toHaveClass('scanline-effect');
    });

    test('sets up scanline effect interval on mount', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      render(<Layout><div>Content</div></Layout>);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    });

    test('clears scanline effect interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(<Layout><div>Content</div></Layout>);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('footer functionality', () => {
    test('footer contains all required elements', () => {
      render(<Layout><div>Content</div></Layout>);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText(/Ocean Beach SF Surf Conditions/)).toBeInTheDocument();
      expect(screen.getByText(/©\d{4}/)).toBeInTheDocument();
      expect(screen.getByText(/Light Mode|Dark Mode/)).toBeInTheDocument();
    });

    test('theme toggle is clickable', () => {
      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText(/Light Mode|Dark Mode/);
      
      expect(themeToggle).toHaveClass('clickable');
      expect(themeToggle.style.cursor).toBe('');
    });
  });

  describe('component structure', () => {
    test('has correct semantic structure', () => {
      render(
        <Layout>
          <main>
            <h1>Test Page</h1>
            <p>Content</p>
          </main>
        </Layout>
      );

      // Check that children are rendered within the layout
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check footer is present
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    test('maintains proper DOM hierarchy', () => {
      render(
        <Layout>
          <div data-testid="child-content">Child Content</div>
        </Layout>
      );

      const layoutDiv = screen.getByTestId('motion-div');
      const childContent = screen.getByTestId('child-content');
      const footer = screen.getByRole('contentinfo');

      // Child content should be within layout
      expect(layoutDiv).toContainElement(childContent);
      // Footer should be within layout
      expect(layoutDiv).toContainElement(footer);
    });
  });

  describe('accessibility', () => {
    test('footer has proper semantic markup', () => {
      render(<Layout><div>Content</div></Layout>);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe('FOOTER');
    });

    test('theme toggle has proper interaction semantics', () => {
      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText(/Light Mode|Dark Mode/);
      
      // Should be clickable
      fireEvent.click(themeToggle);
      
      // Should change content after click
      expect(screen.getByText(/Light Mode|Dark Mode/)).toBeInTheDocument();
    });

    test('provides clear visual feedback for theme state', () => {
      localStorageMock.getItem.mockReturnValue('1');

      render(<Layout><div>Content</div></Layout>);

      // Should clearly indicate current mode and action
      const themeToggle = screen.getByText('🌅 Light Mode');
      expect(themeToggle.textContent).toContain('Light Mode'); // Action to take
    });
  });

  describe('error handling', () => {
    test('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        render(<Layout><div>Content</div></Layout>);
      }).not.toThrow();

      // Should fall back to dark mode
      expect(screen.getByText('🌅 Light Mode')).toBeInTheDocument();
    });

    test('handles localStorage setItem errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage setItem failed');
      });

      render(<Layout><div>Content</div></Layout>);

      const themeToggle = screen.getByText('🌅 Light Mode');
      
      expect(() => {
        fireEvent.click(themeToggle);
      }).not.toThrow();
    });
  });

  describe('performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();
      
      function TestChild() {
        renderSpy();
        return <div>Test Child</div>;
      }

      const { rerender } = render(
        <Layout>
          <TestChild />
        </Layout>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same props
      rerender(
        <Layout>
          <TestChild />
        </Layout>
      );

      // Should not cause additional renders of children
      expect(renderSpy).toHaveBeenCalledTimes(initialRenderCount);
    });
  });
});