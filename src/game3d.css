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
 */

const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85]
];

export const FOG_SOURCE = 'fog-src';
export const FOG_LAYER = 'fog-wall';
export const FOG_EDGE_LAYER = 'fog-edge';

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

/** Haritaya sis kaynak ve katmanlarını ekler. */
export function addFogLayers(map, { wallHeight = 180, color = '#04060a', edge = '#00E676' } = {}) {
  if (map.getSource(FOG_SOURCE)) return;

  map.addSource(FOG_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });
  map.addSource(`${FOG_SOURCE}-edge`, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addLayer({
    id: FOG_LAYER,
    type: 'fill-extrusion',
    source: FOG_SOURCE,
    paint: {
      'fill-extrusion-color': color,
      'fill-extrusion-height': wallHeight,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.92
    }
  });

  map.addLayer({
    id: FOG_EDGE_LAYER,
    type: 'line',
    source: `${FOG_SOURCE}-edge`,
    paint: {
      'line-color': edge,
      'line-width': 2,
      'line-blur': 2,
      'line-opacity': 0.55
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

/** Binaları 3B yükselt. Stil dosyasında 'building' katmanı yoksa sessizce atlanır. */
export function addBuildings(map, { source = 'openmaptiles', sourceLayer = 'building' } = {}) {
  if (!map.getSource(source)) return false;
  if (map.getLayer('game-buildings')) return true;
  try {
    map.addLayer({
      id: 'game-buildings',
      type: 'fill-extrusion',
      source,
      'source-layer': sourceLayer,
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#1b2027',
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.9
      }
    }, FOG_LAYER);   // binalar sisin ALTINDA kalsın
    return true;
  } catch (e) {
    console.warn('[Oyun] 3B bina katmanı eklenemedi:', e.message);
    return false;
  }
}
