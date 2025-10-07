const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdip.ucsd.edu',
            },
            {
                protocol: 'http',
                hostname: 'cdip.ucsd.edu',
            },
        ],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    async rewrites() {
        return [
            {
                source: '/sitemap.xml',
                destination: '/api/seo/sitemap',
            },
            {
                source: '/robots.txt',
                destination: '/api/seo/robots',
            },
        ];
    },
};

export default nextConfig;
