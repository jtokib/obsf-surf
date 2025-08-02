# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is obsuf.surf - a specialized surf conditions website for Ocean Beach, San Francisco. The site provides real-time surf data, buoy readings, tide schedules, and wind conditions with a modern surf-inspired design featuring clean cards and intelligent AI analysis.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server on http://localhost:3000
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm start` - Runs production server
- **Linting**: `npm run lint` - Runs ESLint with Next.js config

## Project Architecture

This is a Next.js surf conditions website for Ocean Beach, San Francisco. The app features:

### Core Structure
- **Pages Router**: Uses Next.js pages directory structure (not App Router)
- **API Routes**: Located in `pages/api/` for surf data endpoints
- **Components**: Reusable React components in `/components`
- **Styling**: Global CSS in `styles/globals.css` with CSS-in-JS patterns

### Key Components
- **Layout.js**: Main layout wrapper with dark/light mode toggle (defaults to dark), easter eggs, and footer
- **SurfConditions.js**: Main surf data dashboard with tabbed interface for buoy data, winds, tides, and real-time tide status with current height/direction
- **SurfAISummary.js**: Advanced AI-powered surf analysis with BigQuery ML predictions, wind-weighted conditions, and AI validation
- **HeroSection.js**: Hero section with full-width ocean background image
- **TideTable.js**: Interactive tide schedule with chart and clean data rows
- **ParallaxSection.js**: Parallax image sections using Framer Motion

### API Endpoints
- `/api/buoy` - SF Bar Buoy wave data (cleaned up console logging)
- `/api/wind` - Wind conditions with multiple fallback sources
- `/api/tide` - Tide predictions with comprehensive analysis and real-time current state calculation
- `/api/predict` - BigQuery ML surf score predictions via Google Cloud Function (enhanced error handling)
- `/api/validate-summary` - AI-powered summary validation and improvement using OpenAI
- `/api/sitemap` - Dynamic sitemap generation
- `/api/robots` - Robots.txt generation

### External Data Sources
- CDIP (Coastal Data Information Program) for buoy and wave model data
- Windy.com embedded widget for wind visualization
- Google Cloud BigQuery ML for surf condition predictions
- OpenAI GPT-3.5-turbo for summary validation and improvement (optional)
- Unsplash for hero background imagery
- Various oceanographic APIs for real-time conditions

### Special Features
- **Wind-Weighted AI Analysis**: Intelligent surf assessment that properly weights wind conditions as the primary limiting factor
- **AI Summary Validation**: Optional OpenAI integration to ensure all summaries are grammatically correct and human-readable
- **BigQuery ML Integration**: Real-time surf score predictions with confidence ratings
- **Real-Time Tide Status**: Live current tide height and direction (rising/falling) with interpolated calculations
- **Comprehensive Tide Analysis**: Advanced tide timing recommendations with optimal session windows
- **Surf-Themed Loading Animations**: Custom wave bounce spinners for enhanced user experience
- **Smart Content Overlap**: Hero image with overlapping content for better space utilization
- **Clean Card Design**: Simplified UI with borders/shadows only where they add value
- **Dark Mode Default**: Automatically defaults to dark theme for better surf aesthetic
- **Interactive Tide Tables**: Visual charts combined with organized data rows
- **Centered Image Display**: Properly centered buoy and nowcast images
- **Clean Error Handling**: Graceful fallbacks for all API failures
- **Responsive Design**: Mobile-first approach with optimized layouts and improved mobile formatting
- **Easter Eggs**: Secret keyboard sequence "saki" triggers love message
- **Framer Motion**: Smooth animations and micro-interactions

### Deployment
- Configured for Vercel deployment
- Custom routing for sitemap.xml and robots.txt
- CORS headers configured for API routes
- Image optimization for external sources (Unsplash, CDIP)

### Development Notes
- Uses ES modules (`"type": "module"` in package.json)
- Google Tag Manager integration in _app.js
- Framer Motion for animations and micro-interactions
- localStorage for user preferences (dark mode, etc.)
- Console logging minimized for cleaner development experience
- Optional OpenAI integration (graceful degradation without API key)
- Wind conditions properly override good swell/tide when >12kts onshore
- All API endpoints have robust error handling and fallbacks

### Git Configuration
- Remote is named dev main not origin master