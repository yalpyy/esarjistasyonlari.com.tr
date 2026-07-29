/**
 * Konum oyunu için saf coğrafi yardımcılar.
 * Buradaki kontroller sadece anlık geri bildirim içindir; nihai karar
 * her zaman sunucudadır (schema.sql / schema_v2.sql).
 */
import * as h3 from 'h3-js';

export const EARTH_R = 6371008.8; // metre

export const RULES = {
  H3_RES: 8,               // kenar ~460 m, alan ~0,74 km²
  DISCOVERY_RING: 1,       // merkez + 6 komşu ≈ 1 km açılım
  CELL_AREA_KM2: 0.74,
  BUILD_RANGE: 200,        // oyuncudan istasyona izin verilen mesafe (m)
  MIN_STATION_GAP: 100,    // iki istasyon arası minimum mesafe (m)
  CLAIM_RANGE: 50,         // gerçek istasyonu ele geçirme mesafesi (m)
  MAX_ACCURACY: 100,       // bundan kötü GPS doğruluğu sayılmaz (m)
  MAX_SPEED_KMH: 120       // üstü ışınlanma sayılır
};

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

/** İki koordinat arası mesafe (metre). */
export function distance(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
}

/** Bir noktadan verilen yön ve mesafedeki koordinat. */
export function destination(origin, bearingDeg, meters) {
  const d = meters / EARTH_R;
  const br = rad(bearingDeg);
  const lat1 = rad(origin.lat);
  const lng1 = rad(origin.lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: deg(lat2), lng: ((deg(lng2) + 540) % 360) - 180 };
}

/** Yarıçapı harita üzerinde göstermek için çokgen (GeoJSON, [lng,lat]). */
export function circlePolygon(center, meters, steps = 64) {
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const p = destination(center, (i / steps) * 360, meters);
    ring.push([p.lng, p.lat]);
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

/* ---------- H3 keşif ---------- */

export const cellOf = (point, res = RULES.H3_RES) => h3.latLngToCell(point.lat, point.lng, res);

/** Bu konumun açtığı hücreler (istemci tahmini; sunucu aynısını hesaplar). */
export const cellsAround = (point, ring = RULES.DISCOVERY_RING) =>
  h3.gridDisk(cellOf(point), ring);

export const isExplored = (point, cells) => cells.has(cellOf(point));

/** Konum yeni hücre açıyor mu? */
export const opensNewCells = (point, cells) =>
  cellsAround(point).some((c) => !cells.has(c));

export const cellCount = (cells) =>
  cells instanceof Set ? cells.size : (cells?.length ?? 0);

export const exploredArea = (cells) => +(cellCount(cells) * RULES.CELL_AREA_KM2).toFixed(2);

/** Türkiye yüzölçümü (km²) — keşif ilerlemesinin paydası. */
export const TURKEY_AREA_KM2 = 783562;

/**
 * Türkiye'nin yüzde kaçı açıldı.
 *
 * Bir res-8 hücre ~0,74 km², yani ülkenin tamamı ~1,06 milyon hücre. Oran
 * uzun süre binde birin altında kalıyor; bu yüzden yüzdeyi sabit basamakla
 * değil, anlamlı ilk basamağa göre biçimlendiriyoruz — oyuncu ilk mahallesini
 * açtığında "%0,00" görüp hiç ilerlemediğini sanmasın.
 */
export function turkeyProgress(cells) {
  const pct = (cellCount(cells) * RULES.CELL_AREA_KM2 * 100) / TURKEY_AREA_KM2;
  if (pct === 0) return '0';
  const digits = pct >= 1 ? 1 : pct >= 0.01 ? 3 : 5;
  return pct.toFixed(digits).replace('.', ',');
}

/* ---------- Kurulum ön kontrolü ---------- */

export function canBuildAt(target, ctx) {
  const { player, cells = new Set(), stations = [], balance = 0, cost = 0, quota = 3, owned = 0 } = ctx;

  if (!player) return { ok: false, reason: 'no_position', message: 'Konumun henüz alınamadı.' };

  if (!isExplored(target, cells)) {
    return { ok: false, reason: 'unexplored', message: 'Burası keşfedilmedi — önce oraya git.' };
  }
  const d = distance(player, target);
  if (d > RULES.BUILD_RANGE) {
    return {
      ok: false,
      reason: 'too_far',
      message: `Çok uzak (${Math.round(d)} m). En fazla ${RULES.BUILD_RANGE} m yakınına kurabilirsin.`
    };
  }
  const clash = stations.find((s) => distance(s, target) < RULES.MIN_STATION_GAP);
  if (clash) {
    return {
      ok: false,
      reason: 'too_close',
      message: `Başka bir istasyona çok yakın (${Math.round(distance(clash, target))} m).`
    };
  }
  if (owned >= quota) {
    return { ok: false, reason: 'quota', message: `İstasyon kotan dolu (${quota}). Seviye atla.` };
  }
  if (balance < cost) return { ok: false, reason: 'funds', message: 'Bakiyen yetersiz.' };
  return { ok: true };
}

/** İki konum arası geçiş fiziksel olarak mümkün mü? */
export function isPlausibleMove(prev, next, maxKmh = RULES.MAX_SPEED_KMH) {
  if (!prev) return true;
  const meters = distance(prev, next);
  const seconds = Math.max((next.t - prev.t) / 1000, 1);
  return !((meters / seconds) * 3.6 > maxKmh && meters > 500);
}

export function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
