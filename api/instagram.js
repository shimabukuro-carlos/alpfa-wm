// Vercel serverless function: returns the latest @alpfawm Instagram posts.
// Requires the INSTAGRAM_TOKEN environment variable (set in Vercel project settings).

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

module.exports = async (req, res) => {
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) {
    res.status(503).json({ error: 'INSTAGRAM_TOKEN is not set' });
    return;
  }

  try {
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=9&access_token=${encodeURIComponent(token)}`;
    const ig  = await fetch(url);
    const data = await ig.json();
    if (!ig.ok) throw new Error((data.error && data.error.message) || 'Instagram request failed');

    const posts = data.data.map((p) => ({
      id:        p.id,
      caption:   p.caption || '',
      image:     p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
      isVideo:   p.media_type === 'VIDEO',
      permalink: p.permalink,
      timestamp: p.timestamp,
    })).filter((p) => p.image);

    // Cache at Vercel's edge for 1 hour so Instagram isn't hit on every page view
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ posts });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};
