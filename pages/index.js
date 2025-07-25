import Head from 'next/head';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SurfConditions from '../components/SurfConditions';

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>Ocean Beach SF Surf Conditions | Real-time Surf Reports</title>
                <meta property="og:title" content="Ocean Beach SF Surf Conditions | Real-time Surf Reports" />
                <meta property="og:description" content="Real-time surf conditions, buoy data, tides, and wind reports for Ocean Beach, San Francisco. Get the latest wave heights, periods, and surf forecasts." />
                <meta property="og:image" content="https://obsuf.surf/og-image.jpg" />
                <meta property="og:url" content="https://obsuf.surf" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <main className="main-content">
                <div className="container">
                    <HeroSection />
                    <SurfConditions />
                </div>
            </main>
        </Layout>
    );
}