import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import SurfAISummary from '../components/SurfAISummary';

// Mock the surfApi module to track API calls
const mockValidateSummary = jest.fn();
jest.mock('../components/surfApi', () => ({
    validateSummary: (...args) => mockValidateSummary(...args)
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>
    }
}));

describe('SurfAISummary API Call Prevention', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockValidateSummary.mockResolvedValue({
            validatedSummary: 'Validated surf summary'
        });
    });

    const defaultProps = {
        buoyData: { Hs: '2.5', Tp: '10', Dp: '275' },
        windData: { speed: '8', direction: 240 },
        tideData: { predictions: [] },
        surfPrediction: null,
        predictionLoading: false,
        loading: false
    };

    test('should not make duplicate validate-summary API calls when props change rapidly', async () => {
        const { rerender } = render(<SurfAISummary {...defaultProps} />);

        // Wait for initial API call (with debounce delay)
        await waitFor(() => {
            expect(mockValidateSummary).toHaveBeenCalledTimes(1);
        }, { timeout: 2000 });

        // Update buoyData rapidly multiple times
        const changes = [
            { Hs: '2.6', Tp: '10', Dp: '275' },
            { Hs: '2.7', Tp: '10', Dp: '275' },
            { Hs: '2.8', Tp: '10', Dp: '275' }
        ];
        
        // Make rapid changes that would normally trigger multiple validations
        for (const buoyData of changes) {
            act(() => {
                rerender(<SurfAISummary {...defaultProps} buoyData={buoyData} />);
            });
        }

        // Wait longer than the debounce period to ensure any debounced calls complete
        await new Promise(resolve => setTimeout(resolve, 800));

        // Should have been debounced to prevent rapid successive calls
        // Without debouncing this would be 4+ calls, with debouncing it should be at most 2
        expect(mockValidateSummary).toHaveBeenCalledTimes(2); // Initial + final debounced call
        expect(mockValidateSummary).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                waveHeight: expect.any(Number),
                wavePeriod: expect.any(Number),
                windSpeed: expect.any(Number),
                windDirection: expect.any(Number)
            })
        );
    });

    test('should make a new API call only when summary content changes significantly', async () => {
        const { rerender } = render(<SurfAISummary {...defaultProps} />);

        // Wait for initial API call
        await waitFor(() => {
            expect(mockValidateSummary).toHaveBeenCalledTimes(1);
        });

        // Make a significant change that would alter the summary
        const significantWindChange = { speed: '20', direction: 90 }; // Strong onshore wind
        
        act(() => {
            rerender(<SurfAISummary {...defaultProps} windData={significantWindChange} />);
        });

        // Should make a new API call since the summary content changed significantly
        await waitFor(() => {
            expect(mockValidateSummary).toHaveBeenCalledTimes(2);
        });
    });

    test('should not make API call during loading state', async () => {
        render(<SurfAISummary {...defaultProps} loading={true} />);

        // Give some time for any potential API calls
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should not make any API calls while loading
        expect(mockValidateSummary).toHaveBeenCalledTimes(0);
    });

    test('should prevent API call when already validating', async () => {
        // Mock a slow API response
        mockValidateSummary.mockImplementation(() => 
            new Promise(resolve => 
                setTimeout(() => resolve({ validatedSummary: 'Validated' }), 1000)
            )
        );

        const { rerender } = render(<SurfAISummary {...defaultProps} />);

        // Wait for initial API call to start
        await waitFor(() => {
            expect(mockValidateSummary).toHaveBeenCalledTimes(1);
        });

        // Try to trigger another update while still validating
        act(() => {
            rerender(<SurfAISummary {...defaultProps} windData={{ speed: '9', direction: 240 }} />);
        });

        // Should not make a second call while the first is still in progress
        expect(mockValidateSummary).toHaveBeenCalledTimes(1);
    });
});