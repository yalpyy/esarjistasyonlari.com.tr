const OCM_API = 'https://api.openchargemap.io/v3/poi';
const OCM_KEY = ''; // Free tier works without key for moderate usage

export async function fetchStations({ lat, lng, distance = 100, maxResults = 500 } = {}) {
  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'TR',
    maxresults: String(maxResults),
    compact: 'true',
    verbose: 'false',
  });

  if (lat && lng) {
    params.set('latitude', String(lat));
    params.set('longitude', String(lng));
    params.set('distance', String(distance));
    params.set('distanceunit', 'KM');
  }

  if (OCM_KEY) {
    params.set('key', OCM_KEY);
  }

  const response = await fetch(`${OCM_API}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return response.json();
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

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

export async function fetchBlogPosts(mediumUser = '@esarjistasyonlari') {
  const feedUrl = `https://medium.com/feed/${mediumUser}`;
  const params = new URLSearchParams({
    rss_url: feedUrl,
  });

  const response = await fetch(`${RSS2JSON_API}?${params}`);
  if (!response.ok) throw new Error('Failed to fetch blog posts');
  const data = await response.json();
  return data.items || [];
}
