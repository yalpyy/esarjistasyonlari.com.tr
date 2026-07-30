import * as h3 from 'h3-js';

/**
 * 3B sis geometrisi.
 *
 * Neden H3: sisi "dünya çokgeni eksi keşfedilen alan" olarak kurmak gerekiyor.
 * Yüzlerce daireyi birleştirmek (turf.union) pahalı ve üst üste binen delikler
 * doldurma kuralı yüzünden hayalet lekeler bırakıyor. H3 hücrelerinin birleşimi
 * ise tanım gereği örtüşmez; h3.cellsToMultiPolygon tek bir temiz sınır veriyor.
 *
 * Sis düz bir gölge değil, fill-extrusion ile yükseltilmiş bir duvar:
 * oyuncu keşfettiği açıklığın içinde durur, etrafı karanlık duvarla çevrilidir.
 * Duvarın dibinde ayrıca yumuşak bir pus katmanı var — duvar zeminle bıçak gibi
 * kesişmesin, keşfedilmemiş alan sise doğru sönümlensin diye.
 */

export const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85]
];

export const FOG_SOURCE = 'fog-src';
export const FOG_LAYER = 'fog-wall';
export const FOG_HAZE_LAYER = 'fog-haze';
export const FOG_EDGE_LAYER = 'fog-edge';
export const FOG_EDGE_GLOW_LAYER = 'fog-edge-glow';

const GLOW_BASE_WIDTH = 9;
const GLOW_BASE_OPACITY = 0.3;

function closeRing(ring) {
  if (!ring.length) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring : [...ring, [fx, fy]];
}

/** Keşfedilen hücrelerin dış sınırları (delik olarak kullanılacak halkalar). */
export function exploredRings(cells) {
  const list = Array.from(cells || []);
  if (!list.length) return [];
  // formatAsGeoJson = true -> [lng, lat] sırası
  const multi = h3.cellsToMultiPolygon(list, true);
  // Her poligonun dış halkasını al. İç halkalar (keşfedilmiş alanın ortasında
  // kalan boşluklar) tek seviye delik desteği yüzünden yok sayılır — nadir durum.
  return multi.map((poly) => closeRing(poly[0]));
}

/** Sis çokgeni: dünya + keşfedilen alanlar delik olarak. */
export function fogFeature(cells) {
  const holes = exploredRings(cells);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] }
  };
}

/** Keşif sınırındaki ışıklı çizgi. */
export function edgeFeature(cells) {
  const rings = exploredRings(cells);
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiLineString', coordinates: rings }
  };
}

/**
 * Haritaya sis kaynak ve katmanlarını ekler.
 *
 * wallHeight ilk ayarlanacak değer: çok yüksekse yakın manzarayı tamamen
 * kapatıyor, çok alçaksa eğimli kamerada duvarın üstünden bakılıp sis hissi
 * kayboluyor. 260 m, zoom 16 civarında ufku kapatmadan çevreyi kapatıyor.
 */
export function addFogLayers(map, { wallHeight = 260, color = '#04060a', edge = '#00E676' } = {}) {
  if (map.getSource(FOG_SOURCE)) return;

  map.addSource(FOG_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });
  map.addSource(`${FOG_SOURCE}-edge`, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  // Zemin pusu: duvarın altında kalan, keşfedilmemiş alanı karartan düz katman.
  map.addLayer({
    id: FOG_HAZE_LAYER,
    type: 'fill',
    source: FOG_SOURCE,
    paint: {
      'fill-color': color,
      'fill-opacity': 0.72
    }
  });

  map.addLayer({
    id: FOG_LAYER,
    type: 'fill-extrusion',
    source: FOG_SOURCE,
    paint: {
      'fill-extrusion-color': color,
      // Uzaklaşınca duvarı alçalt: Türkiye ölçeğine bakarken duvar değil düz
      // karartma istiyoruz, mahalle ölçeğinde ise tam yükseklik.
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        10, 0,
        13, wallHeight * 0.35,
        16, wallHeight
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.94,
      'fill-extrusion-vertical-gradient': true
    }
  });

  // İki katlı kenar: geniş yumuşak parıltı + ince keskin çizgi.
  map.addLayer({
    id: FOG_EDGE_GLOW_LAYER,
    type: 'line',
    source: `${FOG_SOURCE}-edge`,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': edge,
      'line-width': GLOW_BASE_WIDTH,
      'line-blur': 9,
      'line-opacity': GLOW_BASE_OPACITY
    }
  });

  map.addLayer({
    id: FOG_EDGE_LAYER,
    type: 'line',
    source: `${FOG_SOURCE}-edge`,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': edge,
      'line-width': 1.8,
      'line-blur': 0.4,
      'line-opacity': 0.85
    }
  });
}

/** Hücre kümesi değiştiğinde çağır. */
export function updateFog(map, cells) {
  const fog = map.getSource(FOG_SOURCE);
  const edge = map.getSource(`${FOG_SOURCE}-edge`);
  if (!fog || !edge) return;
  fog.setData({ type: 'FeatureCollection', features: [fogFeature(cells)] });
  edge.setData({ type: 'FeatureCollection', features: [edgeFeature(cells)] });
}

/**
 * Yeni mahalle açıldığında sınırı bir kez parlatır.
 *
 * Keşif sessizce olursa oyuncu ilerlediğini fark etmiyor; bu kısa nabız
 * "burayı yeni açtın" geri bildirimini veriyor.
 */
export function pulseEdge(map, duration = 900) {
  if (!map.getLayer(FOG_EDGE_GLOW_LAYER)) return;
  const start = performance.now();

  const step = (now) => {
    if (!map.getLayer?.(FOG_EDGE_GLOW_LAYER)) return;
    const t = Math.min((now - start) / duration, 1);
    const k = Math.sin(t * Math.PI);   // 0 -> 1 -> 0 yumuşak nabız
    try {
      map.setPaintProperty(FOG_EDGE_GLOW_LAYER, 'line-width', GLOW_BASE_WIDTH + k * 22);
      map.setPaintProperty(FOG_EDGE_GLOW_LAYER, 'line-opacity', GLOW_BASE_OPACITY + k * 0.45);
    } catch {
      return;   // harita bu arada kaldırıldıysa sessizce bırak
    }
    if (t < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}
