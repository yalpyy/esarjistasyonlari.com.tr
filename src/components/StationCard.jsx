import { useTranslation } from 'react-i18next';

export default function StationCard({ station, isSelected, onClick, onGetDirections }) {
  const { t } = useTranslation();

  return (
    <div className={`station-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
      <div className="station-card-header">
        <h3 className="station-title">{station.title}</h3>
        <span className={`station-badge ${station.isDC ? 'dc' : 'ac'}`}>
          {station.isDC ? 'DC' : 'AC'}
        </span>
      </div>
      <p className="station-address">{station.address}</p>
      <div className="station-meta">
        <span className="station-operator">{station.operator}</span>
        {station.maxPower > 0 && (
          <span className="station-power">{station.maxPower} kW</span>
        )}
        {station.isFree && <span className="station-free">{t('free')}</span>}
        {station.calculatedDistance != null && (
          <span className="station-distance">
            {station.calculatedDistance.toFixed(1)} {t('km')}
          </span>
        )}
      </div>
      <button
        className="directions-btn"
        onClick={(e) => {
          e.stopPropagation();
          onGetDirections();
        }}
      >
        {t('getDirections')}
      </button>
    </div>
  );
}
