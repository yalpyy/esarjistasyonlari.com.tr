import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MapContainerComponent from '../components/MapContainer';
import Sidebar from '../components/Sidebar';
import FullScreenAd from '../components/FullScreenAd';
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
  const [directionsStation, setDirectionsStation] = useState(null);

  // Bottom sheet state: 'collapsed' or 'expanded'
  const [sheetState, setSheetState] = useState('collapsed');
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false });

  const toggleSheet = useCallback(() => {
    setSheetState((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'));
  }, []);

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
    setSheetState('collapsed');
  }, []);

  const handleFilterChange = useCallback(
    (updater) => {
      setFilters(updater);
      trackFilterChange();
      setSheetState('expanded');
    },
    [setFilters, trackFilterChange]
  );

  // Touch drag handlers for handle bar
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const sheet = sheetRef.current;
    if (!sheet) return;
    dragRef.current = {
      startY: touch.clientY,
      startHeight: sheet.getBoundingClientRect().height,
      dragging: true,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const touch = e.touches[0];
    const delta = dragRef.current.startY - touch.clientY;
    const newHeight = dragRef.current.startHeight + delta;
    const vh = window.innerHeight;
    const percent = Math.min(Math.max((newHeight / vh) * 100, 15), 100);
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.transition = 'none';
      sheet.style.height = `${percent}vh`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const vh = window.innerHeight;
    const currentHeight = sheet.getBoundingClientRect().height;
    const percent = (currentHeight / vh) * 100;
    sheet.style.transition = '';
    sheet.style.height = '';

    if (percent > 55) {
      setSheetState('expanded');
    } else {
      setSheetState('collapsed');
    }
  }, []);

  return (
    <div className="home-page">
      {geoError && (
        <div className="geo-notice">{t('locationPermission')}</div>
      )}

      <div
        ref={sheetRef}
        className={`sidebar-wrapper bottom-sheet bottom-sheet--${sheetState}`}
      >
        <div
          className="bottom-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleSheet}
        >
          <div className="bottom-sheet-handle-bar" />
          <button
            className="bottom-sheet-toggle-btn"
            aria-label={sheetState === 'collapsed' ? 'Genişlet' : 'Küçült'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {sheetState === 'collapsed' ? (
                <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <Sidebar
          stations={stations}
          loading={loading}
          filters={filters}
          setFilters={handleFilterChange}
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

      {showAd && <FullScreenAd onClose={closeAd} />}
      {directionsStation && (
        <DirectionsModal
          station={directionsStation}
          onClose={() => setDirectionsStation(null)}
        />
      )}
    </div>
  );
}
