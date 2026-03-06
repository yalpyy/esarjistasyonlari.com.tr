import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function InterstitialAd({ onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="interstitial-overlay" onClick={onClose}>
      <div className="interstitial-modal" onClick={(e) => e.stopPropagation()}>
        <button className="interstitial-close" onClick={onClose}>✕</button>
        <div className="interstitial-content">
          <div className="ad-loading-spinner" />
          <p className="ad-loading-text">{t('adLoading')}</p>
          <div className="ad-mockup">
            <div className="ad-mockup-placeholder">
              <span>{t('adPlaceholder')}</span>
              <span className="ad-size">320x250</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
