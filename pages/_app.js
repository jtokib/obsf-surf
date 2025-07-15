import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.jtokib = window.jtokib || [];
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','jtokib','GTM-TM7DV4L');
            `,
                    }}
                />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;