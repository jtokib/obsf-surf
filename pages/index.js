import Head from 'next/head';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SurfConditions from '../components/SurfConditions';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>jTokiB | Things Toki Burke Is Not</title>
                <meta property="og:title" content="jTokiB | Things Toki Burke Is Not" />
                <meta property="og:description" content="Retro surf site with real-time Ocean Beach conditions" />
                <meta property="og:image" content="https://jtokib.com/og-image.jpg" />
                <meta property="og:url" content="https://jtokib.com" />
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