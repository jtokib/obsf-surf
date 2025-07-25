import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="description" content="Ocean Beach SF Surf Conditions - Real-time surf reports, buoy data, tides, and wind conditions for San Francisco's Ocean Beach." />
                <meta name="author" content="Ocean Beach SF Surf Conditions" />

                {/* Favicon and app icons */}
                <link rel="apple-touch-icon" sizes="57x57" href="/images/favicon/apple-icon-57x57.png" />
                <link rel="apple-touch-icon" sizes="60x60" href="/images/favicon/apple-icon-60x60.png" />
                <link rel="apple-touch-icon" sizes="72x72" href="/images/favicon/apple-icon-72x72.png" />
                <link rel="apple-touch-icon" sizes="76x76" href="/images/favicon/apple-icon-76x76.png" />
                <link rel="apple-touch-icon" sizes="114x114" href="/images/favicon/apple-icon-114x114.png" />
                <link rel="apple-touch-icon" sizes="120x120" href="/images/favicon/apple-icon-120x120.png" />
                <link rel="apple-touch-icon" sizes="144x144" href="/images/favicon/apple-icon-144x144.png" />
                <link rel="apple-touch-icon" sizes="152x152" href="/images/favicon/apple-icon-152x152.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/images/favicon/apple-icon-180x180.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/images/favicon/android-icon-192x192.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="96x96" href="/images/favicon/favicon-96x96.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon/favicon-16x16.png" />
                <link rel="manifest" href="/images/favicon/manifest.json" />
                <meta name="msapplication-TileColor" content="#000" />
                <meta name="msapplication-TileImage" content="/images/favicon/ms-icon-144x144.png" />
                <meta name="theme-color" content="#000" />

                {/* Schema.org structured data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org/",
                            "@type": "WebSite",
                            "name": "Ocean Beach SF Surf Conditions",
                            "url": "https://obsuf.surf",
                            "about": {
                                "@type": "Place",
                                "name": "Ocean Beach, San Francisco",
                                "geo": {
                                    "@type": "GeoCoordinates",
                                    "latitude": 37.7694,
                                    "longitude": -122.5107
                                }
                            }
                        })
                    }}
                />

                {/* Google Tag Manager */}
                <Script
                    id="gtm-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','GTM-PQHL9L66');
                        `,
                    }}
                />
            </Head>
            <body>
                {/* Google Tag Manager (noscript) */}
                <noscript>
                    <iframe 
                        src="https://www.googletagmanager.com/ns.html?id=GTM-PQHL9L66"
                        height="0" 
                        width="0" 
                        style={{ display: "none", visibility: "hidden" }}
                    />
                </noscript>
                
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}