import { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 25 15 25s15-13.75 15-25C30 6.7 23.3 0 15 0z" fill="#3b82f6"/>
      <circle cx="15" cy="14" r="7" fill="white"/>
      <circle cx="15" cy="14" r="4" fill="#3b82f6"/>
    </svg>
  `),
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

const stationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
      <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.3 21.7 0 14 0z" fill="#22c55e"/>
      <text x="14" y="18" text-anchor="middle" fill="white" font-size="14">⚡</text>
    </svg>
  `),
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -38],
});

function MarkerClusterGroup({ stations, onStationClick }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (c) => {
        const count = c.getChildCount();
        return L.divIcon({
          html: `<div class="cluster-icon">${count}</div>`,
          className: 'custom-cluster',
          iconSize: L.point(40, 40),
        });
      },
    });

    stations.forEach((station) => {
      if (!station.lat || !station.lng) return;
      const marker = L.marker([station.lat, station.lng], { icon: stationIcon });
      marker.bindPopup(`
        <div class="popup-content">
          <strong>${station.title}</strong><br/>
          <span>${station.operator}</span><br/>
          <span>${station.isDC ? 'DC' : 'AC'} - ${station.maxPower} kW</span>
        </div>
      `);
      marker.on('click', () => onStationClick(station));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [stations, map, onStationClick]);

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

export default function MapContainerComponent({
  userPosition,
  stations,
  selectedStation,
  onStationClick,
}) {
  const { t } = useTranslation();
  const center = userPosition || { lat: 39.9334, lng: 32.8597 };
  const zoom = userPosition ? 13 : 6;

  return (
    <div className="map-wrapper">
      <LeafletMap
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="leaflet-map"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>{t('stationsNearby')}</Popup>
          </Marker>
        )}

        <MarkerClusterGroup stations={stations} onStationClick={onStationClick} />

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
