import { useEffect, useRef } from 'react';
// maplibre-gl 5'ten itibaren ESM derlemesinde default export yok; isimli
// içe aktarma şart (`import maplibregl from ...` build'i kırıyor).
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { addFogLayers, updateFog, pulseEdge, FOG_LAYER } from './fog3d';
import { addSky, addLighting, addBuildings, addPillars, updatePillars } from './scene';
import { circlePolygon, RULES } from './geo';

/**
 * 3B oyun haritası.
 *
 * Leaflet burada kullanılamıyor: Leaflet 2B raster bir kütüphane, eğim (pitch),
 * yükseltilmiş bina veya 3B sis duvarı yapamaz. Ana sitenin haritası Leaflet'te
 * kalıyor; sadece oyun rotası MapLibre GL kullanıyor ve tembel yükleniyor
 * (React.lazy) ki normal ziyaretçi bu paketi indirmesin.
 *
 * Karo kaynağı: OpenFreeMap — ücretsiz, anahtar istemiyor, OSM verisi.
 * `styleUrl` prop'u ile değiştirilebilir (MapTiler/Protomaps'e geçiş ya da
 * karo sunucusuna çıkamayan ortamlarda görsel test için).
 */

export const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

const SRC = { stations: 'stations-src', range: 'range-src' };

export default function GameMap({
  position,
  cells,
  stations = [],
  buildMode = null,        // 'AC' | 'DC' | null
  followPlayer = true,
  styleUrl = STYLE_URL,
  onMapTap,                // ({lat,lng}) => void
  onStationTap,            // (station) => void
  onReady                  // (map) => void
}) {
  const holder = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const readyRef = useRef(false);
  const followRef = useRef(followPlayer);
  const handlers = useRef({ onMapTap, onStationTap });
  const prevCellCount = useRef(0);

  handlers.current = { onMapTap, onStationTap };
  followRef.current = followPlayer;

  /* ---------- Kurulum ---------- */
  useEffect(() => {
    const map = new MapLibreMap({
      container: holder.current,
      style: styleUrl,
      center: [28.9784, 41.0082],   // konum gelene kadar İstanbul
      zoom: 15.5,
      pitch: 60,                    // 3B görünüm
      bearing: -20,
      antialias: true,
      maxPitch: 75,
      attributionControl: { compact: true }
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.touchZoomRotate.enableRotation();

    map.on('load', () => {
      readyRef.current = true;

      // Sıra önemli: sis katmanları önce kurulmalı ki binalar ve sütunlar
      // `beforeId: FOG_LAYER` ile sisin ALTINA yerleşebilsin.
      addFogLayers(map);
      addSky(map);
      addLighting(map);
      addBuildings(map);
      addPillars(map);
      updateFog(map, cells);
      updatePillars(map, stations);

      const beforeFog = map.getLayer(FOG_LAYER) ? FOG_LAYER : undefined;

      // Kurulum yarıçapı
      map.addSource(SRC.range, { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'build-range',
        type: 'fill',
        source: SRC.range,
        paint: { 'fill-color': '#00E676', 'fill-opacity': 0.12 }
      }, beforeFog);
      map.addLayer({
        id: 'build-range-line',
        type: 'line',
        source: SRC.range,
        paint: { 'line-color': '#00E676', 'line-width': 1.5, 'line-opacity': 0.6 }
      }, beforeFog);

      // Tıklama hedefi ve etiketler için nokta kaynağı. Sütunlar
      // fill-extrusion olduğu için isabetli tıklama alanı olarak bu kullanılıyor.
      map.addSource(SRC.stations, { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'stations-hit',
        type: 'circle',
        source: SRC.stations,
        paint: {
          'circle-radius': 14,
          'circle-color': '#000000',
          'circle-opacity': 0.01   // görünmez ama tıklanabilir
        }
      }, beforeFog);
      map.addLayer({
        id: 'stations-label',
        type: 'symbol',
        source: SRC.stations,
        minzoom: 15,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#e8eef4',
          'text-halo-color': '#05070a',
          'text-halo-width': 1.2
        }
      }, beforeFog);

      map.on('click', 'stations-hit', (e) => {
        const f = e.features?.[0];
        if (f) {
          e.originalEvent.stopPropagation();
          handlers.current.onStationTap?.({ ...f.properties, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
        }
      });
      map.on('click', (e) => {
        handlers.current.onMapTap?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
      map.on('mouseenter', 'stations-hit', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'stations-hit', () => { map.getCanvas().style.cursor = ''; });

      onReady?.(map);
    });

    return () => {
      readyRef.current = false;
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  /* ---------- Sis ---------- */
  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    updateFog(mapRef.current, cells);

    // Yeni mahalle açıldıysa sınırı parlat.
    const count = cells instanceof Set ? cells.size : (cells?.length ?? 0);
    if (count > prevCellCount.current && prevCellCount.current > 0) {
      pulseEdge(mapRef.current);
    }
    prevCellCount.current = count;
  }, [cells]);

  /* ---------- Oyuncu ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'player-dot';
      el.innerHTML = '<span class="pulse"></span><span class="core"></span>';
      markerRef.current = new Marker({ element: el, pitchAlignment: 'map' })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
      map.jumpTo({ center: [position.lng, position.lat], zoom: 16.5, pitch: 62 });
    } else {
      markerRef.current.setLngLat([position.lng, position.lat]);
      if (followRef.current) {
        map.easeTo({
          center: [position.lng, position.lat],
          // Yürüme yönü biliniyorsa kamerayı ona çevir: oyuncu hep "ileri"
          // bakıyor, mahalleyi keşfe giderken yön duygusu kaybolmuyor.
          bearing: Number.isFinite(position.heading) ? position.heading : map.getBearing(),
          duration: 900,
          essential: true
        });
      }
    }

    if (readyRef.current) {
      const src = map.getSource(SRC.range);
      if (src) {
        src.setData(
          buildMode
            ? { type: 'FeatureCollection', features: [circlePolygon(position, RULES.BUILD_RANGE)] }
            : emptyFC()
        );
      }
    }
  }, [position, buildMode]);

  /* ---------- İstasyonlar ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    updatePillars(map, stations);

    const src = map.getSource(SRC.stations);
    if (!src) return;
    src.setData({
      type: 'FeatureCollection',
      features: stations.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          id: String(s.id),
          kind: s.kind === 'real' ? 'real' : 'virtual',
          power: Number(s.power) || 0,
          mine: Boolean(s.mine),
          owner: s.owner || '',
          // Gerçek ve sanal istasyon etiketleri belirgin şekilde ayrı:
          // kullanıcı sanal istasyonu gerçek sanıp yola çıkmamalı.
          label: s.kind === 'real' ? `⚡ ${s.title || 'İstasyon'}` : `◈ ${s.title || 'Sanal'}`
        }
      }))
    });
  }, [stations]);

  return <div ref={holder} className="game-map" />;
}

function emptyFC() {
  return { type: 'FeatureCollection', features: [] };
}
