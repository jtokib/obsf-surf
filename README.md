# Ocean Beach SF Surf Conditions

A retro-styled Next.js web application providing real-time surf conditions for Ocean Beach, San Francisco. Features live buoy data, tide schedules, wind conditions, and an 80s synthwave aesthetic.

## 🏄‍♂️ Features

- **AI-Powered Surf Analysis**: Smart surf condition assessment with BigQuery ML predictions
- **Real-time Surf Data**: Live buoy readings from SF Bar Buoy (46026)
- **Advanced Tide Analysis**: Comprehensive tide timing recommendations for optimal sessions
- **Wind Conditions**: Embedded Windy.com wind visualization
- **Retro Design**: 80s-inspired neon/synthwave aesthetic with animations
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Responsive Design**: Mobile-first responsive layout
- **Easter Eggs**: Hidden keyboard sequences and animations

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
- **API Routes**: Located in `pages/api/` for surf data endpoints
- **Components**: Reusable React components in `/components`
- **Styling**: Global CSS with retro styling and Framer Motion animations

### Key Components

- `SurfConditions.js` - Main surf data dashboard with tabbed interface
- `SurfAISummary.js` - AI-powered surf analysis with BigQuery ML predictions
- `Layout.js` - Main layout wrapper with theme toggle and footer
- `HeroSection.js` - Landing section component
- `TideTable.js` - Tide schedule display with advanced analysis

### API Endpoints

- `/api/buoy` - SF Bar Buoy wave data
- `/api/wind` - Wind conditions
- `/api/tide` - Tide predictions
- `/api/predict` - BigQuery ML surf score predictions via Google Cloud Function
- `/api/magic8ball` - Random surf advice
- `/api/sitemap` - Dynamic sitemap generation
- `/api/robots` - Robots.txt generation

## 🌊 Data Sources

- **CDIP** (Coastal Data Information Program) for buoy and wave model data
- **Google Cloud BigQuery ML** for surf condition predictions
- **Windy.com** embedded widget for wind visualization
- **Various oceanographic APIs** for real-time conditions

## 🎨 Special Features

- **Smart AI Analysis**: Real-time surf condition assessment with machine learning
- **Tide Intelligence**: Advanced tide timing recommendations for optimal sessions
- **Retro Styling**: 80s-inspired neon/synthwave aesthetic
- **Animations**: Framer Motion throughout for smooth transitions
- **Theme Switching**: Persistent dark/light mode with localStorage
- **Easter Eggs**: Secret keyboard sequences and screen effects

## 🚢 Deployment

- Configured for Vercel deployment
- Custom routing for sitemap.xml and robots.txt
- CORS headers configured for API routes
- Image optimization for external sources

## 🛠️ Development

This project uses:
- Next.js with Pages Router
- Framer Motion for animations
- ES modules configuration
- Google Tag Manager integration

## 📝 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

Check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) for feedback and contributions.

## 🌐 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.