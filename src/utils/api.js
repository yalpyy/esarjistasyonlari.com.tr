// Vite projelerinde ortam değişkenleri import.meta.env ile okunur
const OCM_API = 'https://api.openchargemap.io/v3/poi';
const OCM_KEY = import.meta.env.VITE_OCM_API_KEY || '';

if (!OCM_KEY) {
  console.warn('[EV Charging] VITE_OCM_API_KEY is not set. OpenChargeMap requests may fail with 403.');
}

export async function fetchStations({ maxResults = 500 } = {}) {
  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'TR',
    maxresults: String(maxResults),
    compact: 'true',
    verbose: 'false',
  });

  if (OCM_KEY) {
    params.set('key', OCM_KEY);
  }

  try {
    // BURASI DÜZELTİLDİ: try bloğu ve fetch komutu eklendi
    const response = await fetch(`${OCM_API}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error Response:', errorData);
      throw new Error(`Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch stations failed:', error);
    return [];
  }
}

export function normalizeStation(raw) {
  const addr = raw.AddressInfo || {};
  const conn = raw.Connections || [];
  const op = raw.OperatorInfo || {};

  const isDC = conn.some(c => {
    const levelId = c.LevelID || (c.Level && c.Level.ID);
    return levelId === 3;
  });

  const isFree = raw.UsageCost === null ||
    raw.UsageCost === '' ||
    (typeof raw.UsageCost === 'string' && raw.UsageCost.toLowerCase().includes('free')) ||
    (typeof raw.UsageCost === 'string' && raw.UsageCost.toLowerCase().includes('ücretsiz'));

  return {
    id: raw.ID,
    title: addr.Title || 'Bilinmeyen İstasyon',
    address: [addr.AddressLine1, addr.Town, addr.StateOrProvince].filter(Boolean).join(', '),
    lat: addr.Latitude,
    lng: addr.Longitude,
    operator: op.Title || 'Bilinmiyor',
    connections: conn.map(c => ({
      type: (c.ConnectionType && c.ConnectionType.Title) || 'Unknown',
      power: c.PowerKW || 0,
      levelId: c.LevelID || (c.Level && c.Level.ID) || 0,
    })),
    isDC,
    isAC: !isDC,
    isFree,
    statusId: raw.StatusTypeID || (raw.StatusType && raw.StatusType.ID) || 0,
    isOperational: (raw.StatusTypeID || (raw.StatusType && raw.StatusType.ID)) === 50,
    maxPower: Math.max(...conn.map(c => c.PowerKW || 0), 0),
    distance: addr.Distance || null,
    distanceUnit: addr.DistanceUnit || 'KM',
    usageCost: raw.UsageCost || null,
  };
}

// ===== Blog: Medium RSS Feed =====
const MEDIUM_USER = '@softcorptr';
const MEDIUM_FEED_URL = `https://medium.com/feed/${MEDIUM_USER}`;
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

function extractImageFromContent(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/);
  return match ? match[1] : null;
}

function stripHtmlRaw(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function parseMediumRssWithDOMParser(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const items = doc.querySelectorAll('item');
  const posts = [];

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    const pubDate = item.querySelector('pubDate')?.textContent || '';
    const creator = item.getElementsByTagName('dc:creator')[0]?.textContent || '';

    const contentEncoded =
      item.getElementsByTagName('content:encoded')[0]?.textContent || '';
    const description =
      item.querySelector('description')?.textContent || contentEncoded;

    const thumbnail = extractImageFromContent(contentEncoded || description);
    // Açıklama kısmı isteğin üzerine 450 karaktere çıkarıldı
    const excerpt = stripHtmlRaw(description).substring(0, 450);

    const categories = [];
    item.querySelectorAll('category').forEach((cat) => {
      categories.push(cat.textContent);
    });

    posts.push({ title, link, pubDate, author: creator, thumbnail, description: excerpt, categories });
  });

  return posts;
}

export async function fetchBlogPosts() {
  // Strategy 1: rss2json API
  try {
    const params = new URLSearchParams({ rss_url: MEDIUM_FEED_URL });
    const response = await fetch(`${RSS2JSON_API}?${params}`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        return data.items.map((item) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          author: item.author,
          thumbnail: item.thumbnail || extractImageFromContent(item.content || item.description),
          description: stripHtmlRaw(item.description || item.content).substring(0, 450),
          categories: item.categories || [],
        }));
      }
    }
  } catch { /* fall through */ }

  // Strategy 2: CORS proxy + DOMParser
  try {
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(MEDIUM_FEED_URL));
    if (response.ok) {
      const xmlText = await response.text();
      return parseMediumRssWithDOMParser(xmlText);
    }
  } catch { /* fall through */ }

  return [];
}
