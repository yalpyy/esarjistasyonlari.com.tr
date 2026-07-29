import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { addFogLayers, updateFog, addBuildings } from './fog3d';
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
 * Yoğun trafikte MapTiler/Protomaps'e geçmek tek satır (STYLE_URL).
 */

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

const SRC = { stations: 'stations-src', range: 'range-src' };

export default function GameMap({
  position,
  cells,
  stations = [],
  buildMode = null,        // 'AC' | 'DC' | null
  followPlayer = true,
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

  handlers.current = { onMapTap, onStationTap };
  followRef.current = followPlayer;

  /* ---------- Kurulum ---------- */
  useEffect(() => {
    const map = new maplibregl.Map({
      container: holder.current,
      style: STYLE_URL,
      center: [28.9784, 41.0082],   // konum gelene kadar İstanbul
      zoom: 15.5,
      pitch: 55,                    // 3B görünüm
      bearing: -20,
      antialias: true,
      attributionControl: { compact: true }
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.touchZoomRotate.enableRotation();

    map.on('load', () => {
      readyRef.current = true;

      addBuildings(map);
      addFogLayers(map);
      updateFog(map, cells);

      // Kurulum yarıçapı
      map.addSource(SRC.range, { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'build-range',
        type: 'fill',
        source: SRC.range,
        paint: { 'fill-color': '#00E676', 'fill-opacity': 0.12 }
      });
      map.addLayer({
        id: 'build-range-line',
        type: 'line',
        source: SRC.range,
        paint: { 'line-color': '#00E676', 'line-width': 1.5, 'line-opacity': 0.6 }
      });

      // İstasyonlar — dikey sütun olarak, 3B'de uzaktan görünsün
      map.addSource(SRC.stations, { type: 'geojson', data: emptyFC() });
      map.addLayer({
        id: 'stations-pillar',
        type: 'circle',
        source: SRC.stations,
        paint: {
          'circle-radius': ['case', ['==', ['get', 'kind'], 'real'], 9, 7],
          'circle-color': [
            'case',
            ['==', ['get', 'kind'], 'real'], '#FFB74D',
            ['==', ['get', 'power'], 150], '#00B0FF',
            '#00E676'
          ],
          'circle-stroke-width': ['case', ['get', 'mine'], 3, 1],
          'circle-stroke-color': '#0b0d0f',
          'circle-opacity': 0.95
        }
      });
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
      });

      map.on('click', 'stations-pillar', (e) => {
        const f = e.features?.[0];
        if (f) {
          e.originalEvent.stopPropagation();
          handlers.current.onStationTap?.({ ...f.properties, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
        }
      });
      map.on('click', (e) => {
        handlers.current.onMapTap?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
      map.on('mouseenter', 'stations-pillar', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'stations-pillar', () => { map.getCanvas().style.cursor = ''; });

      onReady?.(map);
    });

    return () => {
      readyRef.current = false;
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Sis ---------- */
  useEffect(() => {
    if (readyRef.current && mapRef.current) updateFog(mapRef.current, cells);
  }, [cells]);

  /* ---------- Oyuncu ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'player-dot';
      el.innerHTML = '<span class="pulse"></span><span class="core"></span>';
      markerRef.current = new maplibregl.Marker({ element: el, pitchAlignment: 'map' })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
      map.jumpTo({ center: [position.lng, position.lat], zoom: 16.5 });
    } else {
      markerRef.current.setLngLat([position.lng, position.lat]);
      if (followRef.current) {
        map.easeTo({ center: [position.lng, position.lat], duration: 800 });
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
