import { useTranslation } from 'react-i18next';

export default function DirectionsModal({ station, onClose }) {
  const { t } = useTranslation();
  const dest = `${station.lat},${station.lng}`;

  const openGoogle = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank');
    onClose();
  };

  const openApple = () => {
    const url = `https://maps.apple.com/?daddr=${dest}&dirflg=d`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="directions-overlay" onClick={onClose}>
      <div className="directions-modal" onClick={(e) => e.stopPropagation()}>
        <button className="directions-modal-close" onClick={onClose}>✕</button>
        <h3 className="directions-modal-title">{t('chooseMapApp')}</h3>
        <p className="directions-modal-station">{station.title}</p>
        <div className="directions-modal-buttons">
          <button className="directions-modal-btn google" onClick={openGoogle}>
            <span className="directions-modal-icon">G</span>
            Google Maps
          </button>
          <button className="directions-modal-btn apple" onClick={openApple}>
            <span className="directions-modal-icon">A</span>
            Apple Maps
          </button>
        </div>
      </div>
    </div>
  );
}
