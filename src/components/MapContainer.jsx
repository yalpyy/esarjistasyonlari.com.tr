import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { createStationIcon, createClusterIcon } from './map/stationIcons';

// NOT: MarkerCluster.Default.css importu kaldırıldı; cluster görünümü
// artık tamamen styles/markers.css içindeki .ev-cluster sınıflarından geliyor.

function svgToDataUri(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

const userIcon = new L.Icon({
  iconUrl: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#3b82f6"/>
      <circle cx="15" cy="14" r="7" fill="white"/>
      <circle cx="15" cy="14" r="4" fill="#3b82f6"/>
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

// Tema bazlı tile katmanları (Carto)
const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

// Leaflet black screen fix (SPA sayfa geçişleri)
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * İstasyon pinleri + cluster.
 * Popup yok: tıklama, HomePage'deki StationDetailPanel'i açar.
 */
function StationClusterLayer({ stations, selectedStationId, onStationClick }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!stations || stations.length === 0) return undefined;

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 60,
      iconCreateFunction: createClusterIcon,
    });

    stations.forEach((station) => {
      if (station.lat == null || station.lng == null) return;

      const isSelected = station.id === selectedStationId;
      const marker = L.marker([station.lat, station.lng], {
        icon: createStationIcon(station, isSelected),
        stationType: station.isDC ? 'dc' : 'ac', // cluster rengi için
        keyboard: false,
        title: station.title,
      });

      marker.on('click', () => onStationClick(station));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
  }, [stations, selectedStationId, map, onStationClick]);

  return null;
}

function FlyToUser({ position }) {
  const map = useMap();
  const hasFlewRef = useRef(false);

  useEffect(() => {
    if (position && !hasFlewRef.current) {
      hasFlewRef.current = true;
      map.flyTo([position.lat, position.lng], 13, { duration: 1.5 });
    }
  }, [position, map]);

  return null;
}

function FlyToLocation({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], zoom, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
}

const TURKEY_CENTER = { lat: 39.0, lng: 35.0 };
const DEFAULT_ZOOM = 6.5;

export default function MapContainerComponent({
  userPosition,
  stations,
  selectedStation,
  onStationClick,
}) {
  useTranslation(); // dil değişiminde yeniden render
  const { theme } = useTheme();

  return (
    <div className="map-wrapper">
      <LeafletMap
        center={[TURKEY_CENTER.lat, TURKEY_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        className="leaflet-map"
        zoomControl={true}
      >
        <InvalidateSizeOnMount />
        <TileLayer
          key={theme} /* tema değişince katmanı yeniden kur */
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={TILE_URLS[theme] || TILE_URLS.dark}
        />

        {userPosition && (
          <Marker
            position={[userPosition.lat, userPosition.lng]}
            icon={userIcon}
            keyboard={false}
          />
        )}

        <FlyToUser position={userPosition} />

        <StationClusterLayer
          stations={stations}
          selectedStationId={selectedStation?.id ?? null}
          onStationClick={onStationClick}
        />

        {selectedStation && (
          <FlyToLocation
            position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
            zoom={16}
          />
        )}
      </LeafletMap>
    </div>
  );
}
