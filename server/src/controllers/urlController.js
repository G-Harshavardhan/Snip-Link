const { nanoid } = require('nanoid');
const prisma = require('../utils/prisma');
const QRCode = require('qrcode');

const checkUrlLive = async (url) => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: AbortSignal.timeout(5000) 
    });
    return response.ok || response.status < 400;
  } catch (error) {
    return false;
  }
};

exports.createUrl = async (req, res) => {
  try {
    const { originalUrl, customAlias, title, expiresAt } = req.body;

    // Live URL Validation
    const isLive = await checkUrlLive(originalUrl);
    if (!isLive) {
      return res.status(400).json({ error: 'This URL appears to be offline or invalid. Please provide a live destination.' });
    }

    // Generate short code or use custom alias
    let shortCode;
    if (customAlias) {
      // Check alias availability
      const existing = await prisma.url.findFirst({
        where: { OR: [{ shortCode: customAlias }, { customAlias }] }
      });
      if (existing) {
        return res.status(409).json({ error: 'This custom alias is already taken.' });
      }
      shortCode = customAlias;
    } else {
      shortCode = nanoid(7);
      // Ensure uniqueness (very unlikely collision but safe)
      while (await prisma.url.findUnique({ where: { shortCode } })) {
        shortCode = nanoid(7);
      }
    }

    const url = await prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        customAlias: customAlias || null,
        title: title || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId: req.userId
      },
      include: {
        _count: { select: { clicks: true } }
      }
    });

    res.status(201).json({
      message: 'Short URL created successfully!',
      url: {
        ...url,
        totalClicks: url._count.clicks,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`
      }
    });
  } catch (error) {
    console.error('Create URL error:', error);
    res.status(500).json({ error: 'Failed to create short URL.' });
  }
};

exports.createUrlsBulk = async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of URLs.' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < urls.length; i++) {
        const { originalUrl, customAlias, title, expiresAt } = urls[i];
        
        if (!originalUrl || !/^https?:\/\//.test(originalUrl)) {
             errors.push({ row: i+1, url: originalUrl, error: 'Invalid or missing original URL.' });
             continue;
        }

        // Live URL Validation
        const isLive = await checkUrlLive(originalUrl);
        if (!isLive) {
          errors.push({ row: i+1, url: originalUrl, error: 'URL appears to be offline or unreachable.' });
          continue;
        }

        let shortCode;
        if (customAlias) {
          const existing = await prisma.url.findFirst({
            where: { OR: [{ shortCode: customAlias }, { customAlias }] }
          });
          if (existing) {
            errors.push({ row: i+1, url: originalUrl, error: `Custom alias "${customAlias}" is already taken.` });
            continue;
          }
          if (customAlias.length < 3 || customAlias.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
            errors.push({ row: i+1, url: originalUrl, error: `Custom alias "${customAlias}" is invalid (must be 3-30 chars, alphanumeric).` });
            continue;
          }
          shortCode = customAlias;
        } else {
          shortCode = nanoid(7);
          while (await prisma.url.findUnique({ where: { shortCode } })) {
            shortCode = nanoid(7);
          }
        }

        try {
            let parsedDate = null;
            if (expiresAt) {
               // Support standard formats or strict dd-mm-yyyy parsing from CSV
               if (/^\d{2}-\d{2}-\d{4}$/.test(expiresAt)) {
                  const [dd, mm, yyyy] = expiresAt.split('-');
                  parsedDate = new Date(`${yyyy}-${mm}-${dd}T23:59:59Z`);
               } else {
                  parsedDate = new Date(expiresAt);
               }
               if (isNaN(parsedDate.getTime())) parsedDate = null;
            }

            const url = await prisma.url.create({
              data: {
                originalUrl,
                shortCode,
                customAlias: customAlias || null,
                title: title || null,
                expiresAt: parsedDate,
                userId: req.userId
              }
            });
            successCount++;
            results.push(url);
        } catch (dbErr) {
            console.error(dbErr);
            errors.push({ row: i+1, url: originalUrl, error: 'Database creation failed for this row.' });
        }
    }

    res.status(201).json({
      message: `Processed ${urls.length} rows. ${successCount} successful, ${errors.length} failed.`,
      successCount,
      errors,
      results
    });
  } catch (error) {
    console.error('Bulk Create URL error:', error);
    res.status(500).json({ error: 'Failed to process bulk URLs.' });
  }
};

exports.getUserUrls = async (req, res) => {
  try {
    const { search, sort = 'createdAt', order = 'desc' } = req.query;

    const where = { userId: req.userId };
    if (search) {
      where.OR = [
        { originalUrl: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    const urls = await prisma.url.findMany({
      where,
      include: {
        _count: { select: { clicks: true } },
        clicks: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true }
        }
      },
      orderBy: { [sort]: order }
    });

    const formatted = urls.map(url => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      customAlias: url.customAlias,
      title: url.title,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
      totalClicks: url._count.clicks,
      lastClickedAt: url.clicks[0]?.timestamp || null,
      shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`,
      isExpired: url.expiresAt ? new Date(url.expiresAt) < new Date() : false
    }));

    res.json({ urls: formatted, total: formatted.length });
  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Failed to fetch URLs.' });
  }
};

exports.getUrlById = async (req, res) => {
  try {
    const url = await prisma.url.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        _count: { select: { clicks: true } },
        clicks: {
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: { timestamp: true }
        }
      }
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    res.json({
      url: {
        ...url,
        totalClicks: url._count.clicks,
        lastClickedAt: url.clicks[0]?.timestamp || null,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`
      }
    });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({ error: 'Failed to fetch URL.' });
  }
};

exports.updateUrl = async (req, res) => {
  try {
    const { originalUrl, title, expiresAt } = req.body;

    // Verify ownership
    const existing = await prisma.url.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    const updateData = {};
    if (originalUrl) updateData.originalUrl = originalUrl;
    if (title !== undefined) updateData.title = title;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const url = await prisma.url.update({
      where: { id: req.params.id },
      data: updateData,
      include: { _count: { select: { clicks: true } } }
    });

    res.json({
      message: 'URL updated successfully!',
      url: {
        ...url,
        totalClicks: url._count.clicks,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`
      }
    });
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Failed to update URL.' });
  }
};

exports.deleteUrl = async (req, res) => {
  try {
    // Verify ownership
    const existing = await prisma.url.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    await prisma.url.delete({ where: { id: req.params.id } });

    res.json({ message: 'URL deleted successfully!' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Failed to delete URL.' });
  }
};

exports.getUrlAnalytics = async (req, res) => {
  try {
    // Verify ownership
    const url = await prisma.url.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { _count: { select: { clicks: true } } }
    });
    if (!url) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    // Recent visits (last 50)
    const recentVisits = await prisma.click.findMany({
      where: { urlId: url.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: {
        id: true,
        timestamp: true,
        country: true,
        city: true,
        device: true,
        browser: true,
        os: true,
        referrer: true
      }
    });

    // Daily click trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clicksByDay = await prisma.$queryRaw`
      SELECT DATE("timestamp") as date, COUNT(*)::int as clicks
      FROM "Click"
      WHERE "urlId" = ${url.id} AND "timestamp" >= ${thirtyDaysAgo}
      GROUP BY DATE("timestamp")
      ORDER BY date ASC
    `;

    // Browser breakdown
    const browserStats = await prisma.$queryRaw`
      SELECT "browser", COUNT(*)::int as count
      FROM "Click"
      WHERE "urlId" = ${url.id} AND "browser" IS NOT NULL
      GROUP BY "browser"
      ORDER BY count DESC
      LIMIT 10
    `;

    // Device breakdown
    const deviceStats = await prisma.$queryRaw`
      SELECT "device", COUNT(*)::int as count
      FROM "Click"
      WHERE "urlId" = ${url.id} AND "device" IS NOT NULL
      GROUP BY "device"
      ORDER BY count DESC
      LIMIT 10
    `;

    // OS breakdown
    const osStats = await prisma.$queryRaw`
      SELECT "os", COUNT(*)::int as count
      FROM "Click"
      WHERE "urlId" = ${url.id} AND "os" IS NOT NULL
      GROUP BY "os"
      ORDER BY count DESC
      LIMIT 10
    `;

    // Country breakdown
    const countryStats = await prisma.$queryRaw`
      SELECT "country", COUNT(*)::int as count
      FROM "Click"
      WHERE "urlId" = ${url.id} AND "country" IS NOT NULL
      GROUP BY "country"
      ORDER BY count DESC
      LIMIT 10
    `;

    res.json({
      url: {
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        title: url.title,
        createdAt: url.createdAt,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`
      },
      analytics: {
        totalClicks: url._count.clicks,
        lastVisit: recentVisits[0]?.timestamp || null,
        clicksByDay,
        browserStats,
        deviceStats,
        osStats,
        countryStats,
        recentVisits
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};

exports.getQrCode = async (req, res) => {
  try {
    const url = await prisma.url.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!url) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    const shortUrl = `${req.protocol}://${req.get('host')}/${url.shortCode}`;
    // Get theme from query param
    const { bg } = req.query;
    const isLight = bg === 'white';
    
    const qrDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#a855f7', // Purple pixels
        light: isLight ? '#ffffff' : '#000000', // Pure black for dark theme
      },
    });

    res.json({ qrCode: qrDataUrl, shortUrl });
  } catch (error) {
    console.error('QR Code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
};
