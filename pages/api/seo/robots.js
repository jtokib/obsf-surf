export default function handler(req, res) {
    const robots = `# Robots.txt for obsuf.surf updated ${new Date().toISOString().split('T')[0]}
  
  # Global rules
  User-agent: *
  Allow: /
  
  # Sitemap
  Sitemap: https://obsuf.surf/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 's-maxage=86400'); // Cache for 24 hours
    res.status(200).send(robots);
  }