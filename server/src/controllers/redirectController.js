const prisma = require('../utils/prisma');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

exports.handleRedirect = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await prisma.url.findUnique({
      where: { shortCode }
    });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found.' });
    }

    // Check expiry
    if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'This link has expired.' });
    }

    // Parse user agent for analytics
    const parser = new UAParser(req.headers['user-agent']);
    const browserInfo = parser.getBrowser();
    const deviceInfo = parser.getDevice();
    const osInfo = parser.getOS();

    // Determine IP address reliably (handling proxies)
    let ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
    if (ip && ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1') ip = '127.0.0.1'; // Standardize localhost IPv6 to IPv4

    // Geo lookup (Automatic)
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : null;
    const city = geo ? geo.city : null;

    // Record click asynchronously (don't block redirect)
    prisma.click.create({
      data: {
        urlId: url.id,
        ip: ip || null,
        device: deviceInfo.type || 'desktop',
        browser: browserInfo.name || null,
        os: osInfo.name || null,
        referrer: req.headers.referer || req.headers.referrer || null,
        country: country,
        city: city
      }
    }).then(() => {
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${url.userId}`).emit('urlClicked', { urlId: url.id });
        }
    }).catch(err => console.error('Click recording error:', err));

    // 302 redirect to original URL
    res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Redirect failed.' });
  }
};
