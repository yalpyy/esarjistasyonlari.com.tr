import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import LocationSearchInput from '../components/tools/LocationSearchInput';

// Birincil: FOSSGIS (osm.org'un kullandığı, güvenilir sunucu)
// Yedek: OSRM demo sunucusu (zaman zaman yanıt vermeyebiliyor)
const OSRM_HOSTS = [
  'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  'https://router.project-osrm.org/route/v1/driving',
];

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
};

const TURKEY_CENTER = [39.0, 35.0];

function makePointIcon(color) {
  return L.divIcon({
    className: 'route-point-wrapper',
    html: `<span class="route-point" style="--rp-color:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const startIcon = makePointIcon('#22c55e');
const endIcon = makePointIcon('#f97316');

function FitToRoute({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function formatDuration(seconds, isTr) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} ${isTr ? 'dk' : 'min'}`;
  return `${h} ${isTr ? 'sa' : 'h'} ${m} ${isTr ? 'dk' : 'min'}`;
}

export default function RoutePlanner() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const { theme } = useTheme();

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [route, setRoute] = useState(null); // { positions, distance, duration }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canCalculate = Boolean(from && to) && !loading;

  const swap = () => {
    setFrom(to);
    setTo(from);
    setRoute(null);
  };

  const calculateRoute = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError('');
    setRoute(null);

    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      alternatives: 'false',
      steps: 'false',
    });

    let lastError = null;

    // Sunucular sırayla denenir; biri yanıt vermezse diğerine geçilir
    for (const host of OSRM_HOSTS) {
      try {
        const res = await fetch(`${host}/${coords}?${params}`);
        if (!res.ok) throw new Error(`OSRM ${res.status}`);
        const data = await res.json();

        const r = data.routes?.[0];
        if (!r) throw new Error('no-route');

        setRoute({
          // GeoJSON [lng, lat] → Leaflet [lat, lng]
          positions: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          distance: r.distance, // metre
          duration: r.duration, // saniye
        });
        setLoading(false);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    console.warn('Rota hesaplanamadı:', lastError);
    setError(
      isTr
        ? 'Rota hesaplanamadı. Lütfen farklı konumlar deneyin veya biraz sonra tekrar deneyin.'
        : 'Route could not be calculated. Try different locations or retry shortly.'
    );
    setLoading(false);
  }, [from, to, isTr]);

  // İki konum da seçildiğinde rota otomatik hesaplanır
  useEffect(() => {
    if (from && to) {
      calculateRoute();
    }
  }, [from, to, calculateRoute]);

  const stats = useMemo(() => {
    if (!route) return null;
    return {
      km: (route.distance / 1000).toFixed(0),
      duration: formatDuration(route.duration, isTr),
    };
  }, [route, isTr]);

  return (
    <div className="legal-page">
      <article className="legal-content route-planner">
        <h1>{isTr ? 'Rota Planlayıcı' : 'Route Planner'}</h1>
        <p className="guide-intro">
          {isTr
            ? 'Nereden nereye gideceğinizi seçin; güzergahınızı harita üzerinde çizelim. Ardından haritamızdan rota üzerindeki şarj istasyonlarını inceleyebilirsiniz.'
            : 'Pick your origin and destination; we will draw your route on the map. You can then explore charging stations along the way.'}
        </p>

        <section className="route-form">
          <div className="route-inputs">
            <label className="route-field">
              <span className="route-field-label route-field-label--start">
                {isTr ? 'Nereden' : 'From'}
              </span>
              <LocationSearchInput
                placeholder={isTr ? 'Örn: Kadıköy, İstanbul' : 'e.g. Kadıköy, İstanbul'}
                value={from}
                onSelect={setFrom}
                onClear={() => { setFrom(null); setRoute(null); }}
              />
            </label>

            <button
              type="button"
              className="route-swap-btn"
              onClick={swap}
              aria-label={isTr ? 'Konumları değiştir' : 'Swap locations'}
              title={isTr ? 'Konumları değiştir' : 'Swap locations'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M7 4v13M7 4L4 7m3-3l3 3M17 20V7m0 13l3-3m-3 3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <label className="route-field">
              <span className="route-field-label route-field-label--end">
                {isTr ? 'Nereye' : 'To'}
              </span>
              <LocationSearchInput
                placeholder={isTr ? 'Örn: Eskişehir' : 'e.g. Eskişehir'}
                value={to}
                onSelect={setTo}
                onClear={() => { setTo(null); setRoute(null); }}
              />
            </label>
          </div>

          <button
            type="button"
            className="route-calc-btn"
            onClick={calculateRoute}
            disabled={!canCalculate}
          >
            {loading
              ? (isTr ? 'Hesaplanıyor…' : 'Calculating…')
              : (isTr ? 'Rotayı Yenile' : 'Recalculate Route')}
          </button>

          {error && <p className="route-error" role="alert">{error}</p>}
        </section>

        {/* Sonuç kartları: sabit yükseklikli alan, CLS önlemi */}
        <section className="route-stats" aria-live="polite">
          <div className="route-stat-card">
            <span className="route-stat-label">{isTr ? 'Mesafe' : 'Distance'}</span>
            <span className="route-stat-value">{stats ? `${stats.km} km` : '—'}</span>
          </div>
          <div className="route-stat-card">
            <span className="route-stat-label">{isTr ? 'Tahmini Süre' : 'Est. Duration'}</span>
            <span className="route-stat-value">{stats ? stats.duration : '—'}</span>
          </div>
        </section>

        <section className="route-map-wrapper">
          <MapContainer
            center={TURKEY_CENTER}
            zoom={6}
            className="route-map"
            zoomControl={true}
          >
            <InvalidateSizeOnMount />
            <TileLayer
              key={theme}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={TILE_URLS[theme] || TILE_URLS.dark}
            />

            {from && <Marker position={[from.lat, from.lng]} icon={startIcon} keyboard={false} />}
            {to && <Marker position={[to.lat, to.lng]} icon={endIcon} keyboard={false} />}

            {route && (
              <>
                {/* Neon efekti: geniş yarı saydam glow + ince parlak çekirdek */}
                <Polyline
                  positions={route.positions}
                  pathOptions={{ color: '#22c55e', weight: 12, opacity: 0.25, lineCap: 'round' }}
                />
                <Polyline
                  positions={route.positions}
                  className="route-neon-line"
                  pathOptions={{ color: '#4ade80', weight: 4, opacity: 0.95, lineCap: 'round' }}
                />
                <FitToRoute positions={route.positions} />
              </>
            )}
          </MapContainer>
        </section>

        <p className="charge-disclaimer">
          {isTr
            ? 'Rota, OSRM (Open Source Routing Machine) açık kaynak servisi ile hesaplanır. Süreler trafik yoğunluğunu içermez.'
            : 'Routes are calculated with the open-source OSRM service. Durations do not include live traffic.'}
        </p>

        <section className="guide-cta">
          <h2>{isTr ? 'Güzergahtaki İstasyonlar' : 'Stations Along the Way'}</h2>
          <p>
            {isTr
              ? 'Rota üzerindeki şarj istasyonlarını görmek için haritamızı açın; DC hızlı şarj noktalarını turuncu pinlerden ayırt edebilirsiniz.'
              : 'Open our map to explore charging stations along your route; DC fast chargers are shown with orange pins.'}
          </p>
          <Link to="/" className="guide-cta-btn">
            {isTr ? 'Haritayı Aç' : 'Open Map'}
          </Link>
        </section>
      </article>
    </div>
  );
}
