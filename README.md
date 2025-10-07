# 🌊 Ocean Beach SF Surf Conditions

A modern Next.js web application providing real-time surf conditions for Ocean Beach, San Francisco. Features intelligent AI analysis, live buoy data, tide schedules, wind conditions, and a clean surf-inspired design with advanced wind weighting algorithms.

## 🏄‍♂️ Features

- **🤖 Consolidated AI Summary**: Single unified section combining ML predictions with personality elements (stoke rating, haiku, crystal recommendations)
- **🎯 Smart Recommendation Badges**: Clear "Go Surf!" or "Skip Surfing!" badges with confidence percentages
- **⚡ Fallback Surf Prediction**: Local surf analysis when Cloud Function fails, using real surf science principles
- **🔧 Buoy Maintenance Handling**: Graceful offline buoy support with "Maintenance Mode" display for Pt Reyes station
- **🤖 Wind-Weighted AI Analysis**: Intelligent surf assessment that properly prioritizes wind as the primary limiting factor
- **✨ AI Summary Validation**: Optional OpenAI integration ensures all summaries are grammatically correct and human-readable
- **📊 Multi-Station Buoy Data**: Live readings from SF Bar Buoy (46026) and Pt Reyes (029) with offline handling
- **🌊 Advanced Tide Analysis**: Comprehensive tide timing recommendations with visual charts and organized data rows
- **💨 Smart Wind Assessment**: Properly weighs wind conditions - if it's >12kts onshore, you can't surf regardless of swell
- **🌅 Full-Width Hero**: Beautiful ocean background imagery with smart content overlap
- **🎨 Clean Modern Design**: Simplified UI with strategic use of borders and shadows
- **🌙 Dark Mode Default**: Automatically starts in dark theme for optimal surf viewing
- **📱 Mobile Optimized**: Responsive design with reduced hero height and better content flow
- **🔄 Graceful Fallbacks**: Robust error handling across all APIs and data sources
- **🎭 Easter Eggs**: Hidden keyboard sequences and special effects

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

- **Pages Router**: Uses Next.js pages directory structure (not App Router)
- **API Routes**: Organized in `pages/api/` subdirectories:
  - `pages/api/ai/` - AI-powered features (OpenAI integration)
  - `pages/api/data/` - Data endpoints (buoy, tide, wind, predictions)
  - `pages/api/seo/` - SEO endpoints (sitemap, robots)
- **Components**: Reusable React components in `/components`
- **Library**: Business logic and utilities in `/lib`:
  - `lib/services/` - Service layer (OpenAI, external APIs)
  - `lib/utils/` - Utility functions (surf calculations, formatting)
  - `lib/constants.js` - Application constants and configuration
- **Styling**: Global CSS with retro styling and Framer Motion animations

### Key Components

- `SurfConditions.js` - Main surf data dashboard with multi-station buoy support and offline handling
- `SurfAISummary.js` - Consolidated AI analysis with recommendation badges and fallback logic
- `Layout.js` - Main layout wrapper with dark mode default and theme toggle
- `HeroSection.js` - Full-width hero section with ocean background imagery
- `TideTable.js` - Interactive tide display with charts and organized data rows

### API Endpoints

#### Data Endpoints (`/api/data/`)
- `/api/data/buoy` - Multi-station buoy data with support for SF Bar (142) and Pt Reyes (029) stations
- `/api/data/wind` - Wind conditions with multiple fallback sources
- `/api/data/tide` - Tide predictions with comprehensive analysis and real-time calculations
- `/api/data/predict` - Surf predictions with local fallback logic when Cloud Function fails

#### AI Endpoints (`/api/ai/`)
- `/api/ai/create-ai-summary` - AI-powered surf summary generation using OpenAI GPT-3.5-turbo (optional)

#### SEO Endpoints (`/api/seo/`)
- `/api/seo/sitemap` - Dynamic sitemap generation
- `/api/seo/robots` - Robots.txt generation

## 🌊 Data Sources

- **CDIP** (Coastal Data Information Program) for buoy and wave model data
- **Google Cloud BigQuery ML** for surf condition predictions and ML scoring
- **OpenAI GPT-3.5-turbo** for summary validation and improvement (optional)
- **Windy.com** embedded widget for wind visualization
- **Unsplash** for beautiful hero background imagery
- **Various oceanographic APIs** for real-time conditions

## 🎨 Special Features

### 🧠 Intelligent Wind Analysis
- **Wind Override Logic**: When onshore winds >12kts, conditions are automatically downgraded regardless of swell quality
- **Surf Reality Check**: Properly reflects that wind is the #1 factor - perfect waves don't matter if it's blown out
- **Graduated Thresholds**: 0-5kts (great), 5-8kts (manageable), 8-12kts (challenging), 12+kts (unsurfable)

### ✨ AI-Powered Quality Control
- **Summary Validation**: Optional OpenAI integration reviews all summaries for grammar and clarity
- **Graceful Degradation**: Works perfectly without API keys - validation is enhancement, not requirement
- **Conservative Improvements**: AI only fixes obvious issues, preserves authentic surf language

### 🎨 Clean Modern Design
- **Strategic Simplification**: Removed unnecessary borders/shadows, kept them only where they add value
- **Content Overlap**: Hero image with smart content positioning for better space utilization
- **Dark Mode Priority**: Defaults to dark theme for optimal surf viewing experience
- **Mobile Optimization**: Reduced hero heights and improved content flow on mobile devices

### 📊 Advanced Data Presentation
- **Interactive Tide Tables**: Visual charts combined with clean data rows
- **Centered Image Display**: Properly centered buoy cam and nowcast images
- **Clean Error States**: Meaningful error messages with graceful fallbacks
- **Real-time Updates**: Live data with loading states and confidence indicators

## 🚢 Deployment

- Configured for Vercel deployment
- Custom routing for sitemap.xml and robots.txt
- CORS headers configured for API routes
- Image optimization for external sources

## 🛠️ Development

This project uses:
- **Next.js** with Pages Router (not App Router)
- **Framer Motion** for smooth animations and micro-interactions
- **ES modules** configuration (`"type": "module"` in package.json)
- **Google Tag Manager** integration for analytics
- **OpenAI GPT-3.5-turbo** for summary validation (optional)
- **BigQuery ML** integration for surf predictions (with local fallback)
- **Modern CSS** with custom properties and consolidated UI design
- **Multi-station CDIP API** support for robust buoy data collection
- **External project documentation** in `/prompts` folder for Cloud Function fixes

### Environment Variables (Optional)
```bash
OPENAI_API_KEY=your_openai_key_here  # For AI summary validation
NEXT_PUBLIC_PREDICT_API_URL=your_cloud_function_url  # For ML predictions
```

> **Note**: All features work without these keys - they enable enhancements but aren't required.

## 📝 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

Check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) for feedback and contributions.

## 🌐 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.