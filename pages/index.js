import Head from 'next/head'
import Image from 'next/image'
import Layout from '../components/Layout'
import StatusBar from '../components/StatusBar'
import ConditionCards from '../components/ConditionCards'
import SurfDashboard from '../components/SurfDashboard'
import { fetchBuoyData, fetchTideData, fetchWindData, calculateCurrentTideState } from '../lib/serverFetch'

export default function Home({ initialBuoy, initialWind, initialTide, initialPtReyes, initialTideState, fetchedAt }) {
    return (
        <Layout>
            <Head>
                <title>Ocean Beach Surf &middot; SF</title>
                <meta property="og:title" content="Ocean Beach Surf · SF" />
                <meta
                    property="og:description"
                    content="Real-time surf conditions for Ocean Beach, San Francisco. Wave heights, wind, tides."
                />
                <meta property="og:image" content="https://obsuf.surf/og-image.jpg" />
                <meta property="og:url" content="https://obsuf.surf" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <main>
                {/* Hero with logo — full-width background, LCP image */}
                <div className="ocean-hero">
                    <div className="container">
                        <div className="hero-logo">
                            <Image
                                src="/images/website/obsf.png"
                                alt="OBSF Surf Conditions"
                                width={400}
                                height={240}
                                priority
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Server-rendered conditions — no loading states */}
                <div className="above-fold">
                    <div className="container">
                        <StatusBar
                            buoy={initialBuoy}
                            wind={initialWind}
                            tide={initialTideState}
                            fetchedAt={fetchedAt}
                        />
                        <ConditionCards
                            buoy={initialBuoy}
                            wind={initialWind}
                            tide={initialTideState}
                            ptReyes={initialPtReyes}
                        />
                    </div>
                </div>

                {/* Dashboard — tabs, personality, detail views */}
                <div className="main-content">
                    <div className="container">
                        <SurfDashboard
                            initialBuoy={initialBuoy}
                            initialWind={initialWind}
                            initialTide={initialTide}
                            initialPtReyes={initialPtReyes}
                            initialTideState={initialTideState}
                        />
                    </div>
                </div>
            </main>
        </Layout>
    )
}

export async function getServerSideProps({ res }) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60')

    const [buoyResult, windResult, tideResult, ptReyesResult] = await Promise.allSettled([
        fetchBuoyData('142'),
        fetchWindData(),
        fetchTideData(),
        fetchBuoyData('029'),
    ])

    const initialBuoy = buoyResult.status === 'fulfilled' ? buoyResult.value : null
    const initialWind = windResult.status === 'fulfilled' ? windResult.value : null
    const initialTide = tideResult.status === 'fulfilled' ? tideResult.value : null
    const initialPtReyes = ptReyesResult.status === 'fulfilled' ? ptReyesResult.value : null

    const initialTideState =
        initialTide?.predictions ? calculateCurrentTideState(initialTide.predictions) : null

    return {
        props: {
            initialBuoy,
            initialWind,
            initialTide,
            initialPtReyes,
            initialTideState,
            fetchedAt: Date.now(),
        },
    }
}
