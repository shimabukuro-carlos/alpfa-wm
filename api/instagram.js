// Vercel serverless function: returns the latest @alpfawm Instagram posts.
// Requires the INSTAGRAM_TOKEN environment variable (set in Vercel project settings).
// Accepts either token type Meta hands out:
//   - Instagram Login token (starts with "IG")  -> graph.instagram.com
//   - Facebook Login token  (starts with "EA")  -> graph.facebook.com, via the
//     Facebook Page that's linked to the Instagram account

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const FB_API = 'https://graph.facebook.com/v21.0';

async function getJson(url) {
  const r    = await fetch(url);
  const data = await r.json();
  if (!r.ok || data.error) throw new Error((data.error && data.error.message) || 'Instagram request failed');
  return data;
}

// Finds the Instagram business account ID that a Facebook token can reach
async function findInstagramId(token) {
  const t = encodeURIComponent(token);

  // Page token: the Page itself is "me"
  try {
    const page = await getJson(`${FB_API}/me?fields=instagram_business_account&access_token=${t}`);
    if (page.instagram_business_account) return page.instagram_business_account.id;
  } catch (e) { /* not a Page token, fall through */ }

  // User token: look through the Pages this person manages
  const pages = await getJson(`${FB_API}/me/accounts?fields=instagram_business_account&access_token=${t}`);
  const linked = (pages.data || []).find((p) => p.instagram_business_account);
  if (!linked) throw new Error('No Instagram business account is linked to a Facebook Page this token can access');
  return linked.instagram_business_account.id;
}

async function fetchMedia(token) {
  const t = encodeURIComponent(token);
  if (token.startsWith('EA')) {
    const igId = process.env.INSTAGRAM_USER_ID || await findInstagramId(token);
    return getJson(`${FB_API}/${igId}/media?fields=${FIELDS}&limit=9&access_token=${t}`);
  }
  return getJson(`https://graph.instagram.com/me/media?fields=${FIELDS}&limit=9&access_token=${t}`);
}

module.exports = async (req, res) => {
  // Trim stray whitespace/quotes that often sneak in when pasting the token
  const token = (process.env.INSTAGRAM_TOKEN || '').trim().replace(/^["']+|["']+$/g, '');
  if (!token) {
    res.status(503).json({ error: 'INSTAGRAM_TOKEN is not set' });
    return;
  }

  try {
    const data = await fetchMedia(token);

    const posts = (data.data || []).map((p) => ({
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
