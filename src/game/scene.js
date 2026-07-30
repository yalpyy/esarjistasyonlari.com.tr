/**
 * 3B sahne parçaları: gökyüzü, ışık, binalar ve istasyon sütunları.
 *
 * fog3d.js sadece sisin geometrisiyle ilgileniyor; sahnenin geri kalanı burada.
 * Hepsi savunmacı yazıldı: bir stil beklenen katmanı sunmuyorsa ilgili parça
 * sessizce atlanıyor, oyun çökmüyor. Harita stili değiştirilebilir olduğu için
 * (OpenFreeMap / MapTiler / Protomaps) hiçbir şey stil şemasına gömülü değil.
 */

import { circlePolygon } from './geo';
import { FOG_LAYER, WORLD_RING } from './fog3d';

export const PILLAR_SOURCE = 'pillars-src';
export const PILLAR_LAYER = 'stations-pillar-3d';
export const PILLAR_CAP_LAYER = 'stations-pillar-cap';
export const BUILDING_LAYER = 'game-buildings';

export const TINT_LAYER = 'basemap-tint';

/**
 * Basemap'i karart.
 *
 * Oyun koyu temalı ama hangi stilin geleceği garanti değil: OpenFreeMap'in
 * koyu stili kaldırılabilir, MapTiler/Protomaps'e geçilebilir ya da açık temalı
 * bir stil kullanılabilir. Stile bağlı kalmak yerine dünyayı kaplayan yarı
 * saydam koyu bir katman koyuyoruz — böylece her stil oyunun paletine uyuyor.
 *
 * Oyunun kendi katmanlarından ÖNCE eklenmeli: stilin üstünde, binaların ve
 * sisin altında kalsın.
 */
export function addBasemapTint(map, { color = '#070b10', opacity = 0.45 } = {}) {
  if (map.getLayer(TINT_LAYER)) return;

  map.addSource(TINT_LAYER, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [WORLD_RING] }
    }
  });

  map.addLayer({
    id: TINT_LAYER,
    type: 'fill',
    source: TINT_LAYER,
    paint: { 'fill-color': color, 'fill-opacity': opacity }
  });
}

/* ---------------------------------------------------------------- Gökyüzü */

/**
 * Ufuk çizgisi ve atmosfer. Eğimli kamerada ekranın üst yarısı boş gri
 * kalmasın diye: 3B hissinin yarısı gökyüzünden geliyor.
 */
export function addSky(map) {
  if (typeof map.setSky !== 'function') return false;
  try {
    map.setSky({
      'sky-color': '#0a1524',
      'horizon-color': '#1b2735',
      'fog-color': '#0b0d0f',
      // Zeminde sise, ufukta gökyüzüne doğru yumuşak geçiş.
      'fog-ground-blend': 0.55,
      'horizon-fog-blend': 0.65,
      'sky-horizon-blend': 0.8,
      'atmosphere-blend': [
        'interpolate', ['linear'], ['zoom'],
        6, 0.7,
        13, 0.35,
        17, 0.08
      ]
    });
    return true;
  } catch (e) {
    console.warn('[Oyun] Gökyüzü eklenemedi:', e.message);
    return false;
  }
}

/* ------------------------------------------------------------------- Işık */

/** Yükseltilmiş yüzeylerin gölgelenmesi — binalar düz bloklar gibi durmasın. */
export function addLighting(map) {
  if (typeof map.setLight !== 'function') return false;
  try {
    map.setLight({
      anchor: 'viewport',
      color: '#cfe0f5',
      intensity: 0.32,
      position: [1.5, 210, 28]
    });
    return true;
  } catch (e) {
    console.warn('[Oyun] Işık ayarlanamadı:', e.message);
    return false;
  }
}

/* ---------------------------------------------------------------- Binalar */

/**
 * Stildeki bina kaynağını şemaya gömmeden bul.
 *
 * Eski sürüm 'openmaptiles' + 'building' değerlerini sabit yazıyordu; stil
 * değişince binalar sessizce kayboluyordu. Burada önce stilin kendi
 * katmanlarına, sonra vektör kaynak tanımlarına bakılıyor.
 */
export function detectBuildingSource(map) {
  const style = map.getStyle?.();
  if (!style) return null;

  for (const layer of style.layers || []) {
    if (layer['source-layer'] === 'building' && layer.source) {
      return { source: layer.source, sourceLayer: 'building' };
    }
  }
  for (const [id, src] of Object.entries(style.sources || {})) {
    const vectorLayers = src.vector_layers || src.vectorLayers;
    if (Array.isArray(vectorLayers) && vectorLayers.some((l) => l.id === 'building')) {
      return { source: id, sourceLayer: 'building' };
    }
  }
  return null;
}

/**
 * Binaları 3B yükselt. Yüksekliğe göre renk rampası veriyor: alçak yapılar
 * zemine karışıyor, yüksek bloklar öne çıkıyor — düz tek renk yükseltmede
 * şehir tek parça bir kütle gibi görünüyordu.
 */
export function addBuildings(map, opts = {}) {
  if (map.getLayer(BUILDING_LAYER)) return true;

  const detected = opts.source ? opts : detectBuildingSource(map);
  if (!detected) {
    console.warn('[Oyun] Stilde bina katmanı yok — binalar düz kalıyor.');
    return false;
  }

  const height = ['coalesce', ['get', 'render_height'], ['get', 'height'], 8];

  try {
    map.addLayer(
      {
        id: BUILDING_LAYER,
        type: 'fill-extrusion',
        source: detected.source,
        // GeoJSON kaynaklarında source-layer yok; vektör karolarda zorunlu.
        ...(detected.sourceLayer ? { 'source-layer': detected.sourceLayer } : {}),
        minzoom: 13,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], height,
            0, '#161b22',
            25, '#1e2530',
            60, '#28323f',
            150, '#35424f'
          ],
          // Yakınlaşırken yükselsinler: uzakta düz, yaklaşınca hacimli.
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            15.5, height
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-vertical-gradient': true
        }
      },
      map.getLayer(FOG_LAYER) ? FOG_LAYER : undefined   // binalar sisin ALTINDA
    );
    return true;
  } catch (e) {
    console.warn('[Oyun] 3B bina katmanı eklenemedi:', e.message);
    return false;
  }
}

/* ------------------------------------------------------- İstasyon sütunları */

/** Güç ve türe göre sütun profili. Gerçek istasyonlar en yüksek ve ayrı renkte. */
function profile(station) {
  if (station.kind === 'real') {
    return { height: 70, radius: 10, color: '#FFB74D', cap: '#FFE0B2' };
  }
  if (Number(station.power) >= 150) {
    return { height: 54, radius: 9, color: '#00B0FF', cap: '#82DFFF' };
  }
  return { height: 32, radius: 7, color: '#00E676', cap: '#B9F6CA' };
}

function pillarFeature(station) {
  const p = profile(station);
  // Sekizgen: 3B'de silindir izlenimi veriyor, 64 kenarlı daireye göre
  // yüzlerce istasyonda çok daha ucuz.
  const poly = circlePolygon({ lat: station.lat, lng: station.lng }, p.radius, 8);
  return {
    ...poly,
    properties: {
      id: String(station.id),
      kind: station.kind === 'real' ? 'real' : 'virtual',
      mine: Boolean(station.mine),
      height: p.height,
      color: p.color,
      cap: p.cap
    }
  };
}

export function pillarCollection(stations = []) {
  return { type: 'FeatureCollection', features: stations.map(pillarFeature) };
}

/**
 * İstasyonları dikey sütun olarak ekler.
 *
 * Önceki sürümde bunlar `circle` katmanıydı — yorumda "dikey sütun" yazmasına
 * rağmen 3B'de yere yapışık düz lekelerdi ve eğimli kamerada binaların
 * arkasında kayboluyorlardı. fill-extrusion ile artık gerçekten yükseliyorlar.
 */
export function addPillars(map) {
  if (map.getSource(PILLAR_SOURCE)) return;

  map.addSource(PILLAR_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  const before = map.getLayer(FOG_LAYER) ? FOG_LAYER : undefined;

  map.addLayer(
    {
      id: PILLAR_LAYER,
      type: 'fill-extrusion',
      source: PILLAR_SOURCE,
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          12, 0,
          15, ['get', 'height']
        ],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.85,
        'fill-extrusion-vertical-gradient': true
      }
    },
    before
  );

  // Parlak tepe başlığı: sütunun ucundaki ışık. Sahibi oyuncuysa daha kalın.
  map.addLayer(
    {
      id: PILLAR_CAP_LAYER,
      type: 'fill-extrusion',
      source: PILLAR_SOURCE,
      paint: {
        'fill-extrusion-color': ['get', 'cap'],
        'fill-extrusion-height': [
          '+',
          ['get', 'height'],
          ['case', ['get', 'mine'], 9, 4]
        ],
        'fill-extrusion-base': ['get', 'height'],
        'fill-extrusion-opacity': 0.95
      }
    },
    before
  );
}

export function updatePillars(map, stations) {
  const src = map.getSource(PILLAR_SOURCE);
  if (src) src.setData(pillarCollection(stations));
}
