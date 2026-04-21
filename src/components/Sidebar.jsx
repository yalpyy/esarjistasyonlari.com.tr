import { useTranslation } from 'react-i18next';
import StationCard from './StationCard';
import AdBanner from './AdBanner';
import QuickGuideCards from './QuickGuideCards';

export default function Sidebar({
  stations,
  loading,
  filters,
  setFilters,
  operators,
  onStationClick,
  selectedStation,
  onGetDirections,
}) {
  const { t } = useTranslation();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{t('stationsNearby')}</h2>
        <input
          type="text"
          className="search-input"
          placeholder={t('searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
        />
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filters.dc ? 'active' : ''}`}
          onClick={() => handleFilterChange('dc', !filters.dc)}
        >
          {t('filterDC')}
        </button>
        <button
          className={`filter-btn ${filters.ac ? 'active' : ''}`}
          onClick={() => handleFilterChange('ac', !filters.ac)}
        >
          {t('filterAC')}
        </button>
        <button
          className={`filter-btn ${filters.free ? 'active' : ''}`}
          onClick={() => handleFilterChange('free', !filters.free)}
        >
          {t('filterFree')}
        </button>
        <select
          className="filter-select"
          value={filters.operator}
          onChange={(e) => handleFilterChange('operator', e.target.value)}
        >
          <option value="">{t('allOperators')}</option>
          {operators.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      </div>

      <div className="station-list">
        <QuickGuideCards />
        {loading && <div className="loading-text">{t('loading')}</div>}
        {!loading && stations.length === 0 && (
          <div className="empty-text">{t('noStationsFound')}</div>
        )}
        {stations.map((station, index) => (
          <div key={station.id}>
            <StationCard
              station={station}
              isSelected={selectedStation?.id === station.id}
              onClick={() => onStationClick(station)}
              onGetDirections={() => onGetDirections(station)}
            />
            {(index + 1) % 5 === 0 && (
              <div className="sidebar-ad-slot">
                <AdBanner slot="SIDEBAR_SLOT" format="fluid" className="sidebar-ad" />
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
