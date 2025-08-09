import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroSection from '../../components/HeroSection';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, transition, ...otherProps } = props;
      return (
        <div 
          data-testid="motion-div" 
          data-initial={JSON.stringify(initial)}
          data-animate={JSON.stringify(animate)}
          data-transition={JSON.stringify(transition)}
          {...otherProps}
        >
          {children}
        </div>
      );
    }
  }
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, priority, style, ...props }) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-priority={priority?.toString()}
        style={style}
        data-testid="hero-image"
        {...props}
      />
    );
  };
});

describe('HeroSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders hero section with correct structure', () => {
      render(<HeroSection />);

      const heroSection = screen.getByTestId('motion-div');
      expect(heroSection).toBeInTheDocument();
      expect(heroSection).toHaveClass('ocean-hero');
    });

    test('renders hero logo container', () => {
      render(<HeroSection />);

      const heroLogo = screen.getByRole('img').closest('.hero-logo');
      expect(heroLogo).toBeInTheDocument();
      expect(heroLogo).toHaveClass('hero-logo');
    });

    test('renders main hero image', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toBeInTheDocument();
    });
  });

  describe('image properties', () => {
    test('image has correct src and alt text', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toHaveAttribute('src', '/images/website/obsf.png');
      expect(heroImage).toHaveAttribute('alt', 'OBSF Surf Conditions');
    });

    test('image has correct dimensions', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toHaveAttribute('width', '400');
      expect(heroImage).toHaveAttribute('height', '240');
    });

    test('image has priority loading enabled', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toHaveAttribute('data-priority', 'true');
    });

    test('image has correct styling properties', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      const style = heroImage.style;
      
      expect(style.objectFit).toBe('cover');
      expect(style.objectPosition).toBe('center 35%');
    });
  });

  describe('Framer Motion animation properties', () => {
    test('has correct initial animation state', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      const initialData = JSON.parse(motionDiv.getAttribute('data-initial'));
      
      expect(initialData).toEqual({
        opacity: 0,
        y: 20
      });
    });

    test('has correct animate state', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      const animateData = JSON.parse(motionDiv.getAttribute('data-animate'));
      
      expect(animateData).toEqual({
        opacity: 1,
        y: 0
      });
    });

    test('has correct transition properties', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      const transitionData = JSON.parse(motionDiv.getAttribute('data-transition'));
      
      expect(transitionData).toEqual({
        duration: 0.8,
        ease: 'easeOut'
      });
    });
  });

  describe('CSS classes and styling', () => {
    test('applies ocean-hero class to main container', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      expect(motionDiv).toHaveClass('ocean-hero');
    });

    test('applies hero-logo class to image container', () => {
      render(<HeroSection />);

      const heroLogo = screen.getByRole('img').closest('div');
      expect(heroLogo).toHaveClass('hero-logo');
    });
  });

  describe('accessibility', () => {
    test('image has proper alt text for screen readers', () => {
      render(<HeroSection />);

      const heroImage = screen.getByRole('img');
      expect(heroImage).toHaveAccessibleName('OBSF Surf Conditions');
    });

    test('image alt text is descriptive', () => {
      render(<HeroSection />);

      const heroImage = screen.getByAltText('OBSF Surf Conditions');
      expect(heroImage).toBeInTheDocument();
    });

    test('component structure is semantic', () => {
      render(<HeroSection />);

      // Should have a main image element
      const heroImage = screen.getByRole('img');
      expect(heroImage).toBeInTheDocument();
      
      // Image should be contained within proper structure
      const container = heroImage.closest('[data-testid="motion-div"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe('responsive design considerations', () => {
    test('image dimensions are fixed for layout stability', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toHaveAttribute('width', '400');
      expect(heroImage).toHaveAttribute('height', '240');
    });

    test('image uses object-fit cover for responsive scaling', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage.style.objectFit).toBe('cover');
    });

    test('image has custom object position for optimal cropping', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage.style.objectPosition).toBe('center 35%');
    });
  });

  describe('performance optimizations', () => {
    test('image has priority loading for above-the-fold content', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toHaveAttribute('data-priority', 'true');
    });

    test('uses Next.js Image component for optimization', () => {
      // This is verified by the mock implementation
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      expect(heroImage).toBeInTheDocument();
    });
  });

  describe('component isolation', () => {
    test('renders without external dependencies', () => {
      // Should not require props or context
      expect(() => {
        render(<HeroSection />);
      }).not.toThrow();
    });

    test('is stateless and pure', () => {
      const { container: container1 } = render(<HeroSection />);
      const { container: container2 } = render(<HeroSection />);

      // Should render identically each time
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });
  });

  describe('error handling', () => {
    test('renders gracefully if image fails to load', () => {
      render(<HeroSection />);

      const heroImage = screen.getByTestId('hero-image');
      
      // Component should still be in DOM even if image has issues
      expect(heroImage).toBeInTheDocument();
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  describe('animation integration', () => {
    test('integrates properly with Framer Motion', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      
      // Should have all motion properties
      expect(motionDiv).toHaveAttribute('data-initial');
      expect(motionDiv).toHaveAttribute('data-animate');
      expect(motionDiv).toHaveAttribute('data-transition');
    });

    test('has smooth entry animation timing', () => {
      render(<HeroSection />);

      const motionDiv = screen.getByTestId('motion-div');
      const transitionData = JSON.parse(motionDiv.getAttribute('data-transition'));
      
      // Should have reasonable animation duration
      expect(transitionData.duration).toBe(0.8);
      expect(transitionData.ease).toBe('easeOut');
    });
  });

  describe('integration compatibility', () => {
    test('works within layout components', () => {
      render(
        <div className="page-wrapper">
          <HeroSection />
        </div>
      );

      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('maintains styling when nested', () => {
      render(
        <main>
          <section>
            <HeroSection />
          </section>
        </main>
      );

      const heroSection = screen.getByTestId('motion-div');
      expect(heroSection).toHaveClass('ocean-hero');
    });
  });
});