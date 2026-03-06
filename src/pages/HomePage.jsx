import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MapContainerComponent from '../components/MapContainer';
import Sidebar from '../components/Sidebar';
import InterstitialAd from '../components/InterstitialAd';
import DirectionsModal from '../components/DirectionsModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStations } from '../hooks/useStations';
import { useAdInterstitial } from '../hooks/useAdInterstitial';

export default function HomePage() {
  const { t } = useTranslation();
  const { position, error: geoError } = useGeolocation();
  const { stations, loading, filters, setFilters, operators } = useStations(position);
  const [selectedStation, setSelectedStation] = useState(null);
  const { showAd, triggerAdOnDirections, trackFilterChange, closeAd } = useAdInterstitial();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [directionsStation, setDirectionsStation] = useState(null);

  const handleGetDirections = useCallback(
    (station) => {
      triggerAdOnDirections(() => {
        setDirectionsStation(station);
      });
    },
    [triggerAdOnDirections]
  );

  const handleStationClick = useCallback((station) => {
    setSelectedStation(station);
    setSidebarOpen(false);
  }, []);

  return (
    <div className="home-page">
      {geoError && (
        <div className="geo-notice">{t('locationPermission')}</div>
      )}

      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '✕' : '☰'} {t('stationsNearby')}
      </button>

      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          stations={stations}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          operators={operators}
          onStationClick={handleStationClick}
          selectedStation={selectedStation}
          onGetDirections={handleGetDirections}
          trackFilterChange={trackFilterChange}
        />
      </div>

      <MapContainerComponent
        userPosition={position}
        stations={stations}
        selectedStation={selectedStation}
        onStationClick={handleStationClick}
      />

      {showAd && <InterstitialAd onClose={closeAd} />}
      {directionsStation && (
        <DirectionsModal
          station={directionsStation}
          onClose={() => setDirectionsStation(null)}
        />
      )}
    </div>
  );
}
