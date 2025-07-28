import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="description" content="Ocean Beach SF Surf Conditions - Real-time surf reports, buoy data, tides, and wind conditions for San Francisco's Ocean Beach." />
                <meta name="author" content="Ocean Beach SF Surf Conditions" />
                <meta name="apple-mobile-web-app-title" content="OBSF.surf" />
                
                {/* Favicons */}
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
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