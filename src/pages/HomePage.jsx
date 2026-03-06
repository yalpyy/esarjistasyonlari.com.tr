import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MapContainerComponent from '../components/MapContainer';
import Sidebar from '../components/Sidebar';
import FullScreenAd from '../components/FullScreenAd';
import DirectionsModal from '../components/DirectionsModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { useStations } from '../hooks/useStations';
import { useAdInterstitial } from '../hooks/useAdInterstitial';

const COLLAPSED_PERCENT = 30;
const EXPANDED_PERCENT = 100;

export default function HomePage() {
  const { t } = useTranslation();
  const { position, error: geoError } = useGeolocation();
  const { stations, loading, filters, setFilters, operators } = useStations(position);
  const [selectedStation, setSelectedStation] = useState(null);
  const { showAd, triggerAdOnDirections, trackFilterChange, closeAd } = useAdInterstitial();
  const [directionsStation, setDirectionsStation] = useState(null);

  // Bottom sheet state: 'collapsed' (30%) or 'expanded' (100%)
  const [sheetState, setSheetState] = useState('collapsed');
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false });

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

  // Wraps setFilters to auto-expand the bottom sheet on filter change
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

    // Snap: if dragged past 55%, expand; otherwise collapse
    if (percent > 55) {
      setSheetState('expanded');
    } else {
      setSheetState('collapsed');
    }
  }, []);

  // Apply height based on state
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    // Only apply on mobile via CSS (desktop ignores these)
  }, [sheetState]);

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
        >
          <div className="bottom-sheet-handle-bar" />
        </div>

        {sheetState === 'expanded' && (
          <button
            className="bottom-sheet-collapse-btn"
            onClick={() => setSheetState('collapsed')}
            aria-label={t('close') || 'Küçült'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 13L5 8h10L10 13z" fill="currentColor" />
            </svg>
          </button>
        )}

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
