const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['source.unsplash.com', 'images.unsplash.com', 'cdip.ucsd.edu'],
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    async rewrites() {
        return [
            {
                source: '/sitemap.xml',
                destination: '/api/sitemap',
            },
            {
                source: '/robots.txt',
                destination: '/api/robots',
            },
        ];
    },
};

export default nextConfig;
