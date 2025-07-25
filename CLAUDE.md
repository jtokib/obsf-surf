# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is obsuf.surf - a specialized surf conditions website for Ocean Beach, San Francisco. The site provides real-time surf data, buoy readings, tide schedules, and wind conditions with a retro 80s synthwave aesthetic.

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
- **Layout.js**: Main layout wrapper with dark/light mode toggle, easter eggs, and footer
- **SurfConditions.js**: Main surf data dashboard with tabbed interface for buoy data, winds, tides
- **HeroSection.js**: Landing section component
- **ParallaxSection.js**: Parallax image sections using Framer Motion
- **TideTable.js**: Tide schedule display component

### API Endpoints
- `/api/buoy` - SF Bar Buoy wave data
- `/api/wind` - Wind conditions
- `/api/tide` - Tide predictions
- `/api/magic8ball` - Random surf advice
- `/api/sitemap` - Dynamic sitemap generation
- `/api/robots` - Robots.txt generation

### External Data Sources
- CDIP (Coastal Data Information Program) for buoy and wave model data
- Windy.com embedded widget for wind visualization
- Various oceanographic APIs for real-time conditions

### Special Features
- **Dark/Light Mode**: Persistent theme switching with localStorage
- **Easter Eggs**: Secret keyboard sequence "saki" triggers love message
- **Animations**: Framer Motion throughout for smooth transitions
- **Retro Styling**: 80s-inspired neon/synthwave aesthetic
- **Responsive**: Mobile-first design

### Deployment
- Configured for Vercel deployment
- Custom routing for sitemap.xml and robots.txt
- CORS headers configured for API routes
- Image optimization for external sources (Unsplash, CDIP)

### Development Notes
- Uses ES modules (`"type": "module"` in package.json)
- Google Tag Manager integration in _app.js
- Framer Motion for animations and micro-interactions
- localStorage for user preferences