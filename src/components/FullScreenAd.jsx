import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdsenseSafePush } from '../hooks/useAdsenseSafePush';

const AD_CLIENT = 'ca-pub-8596736740004807';
const CLOSE_DELAY = 3; // seconds

export default function FullScreenAd({ onClose }) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(CLOSE_DELAY);
  const canClose = countdown <= 0;
  const { insRef } = useAdsenseSafePush();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Prevent body scroll while ad is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    if (canClose) onClose();
  }, [canClose, onClose]);

  return (
    <div className="fullscreen-ad-overlay" onClick={handleClose}>
      <div className="fullscreen-ad-container" onClick={(e) => e.stopPropagation()}>
        <button
          className={`fullscreen-ad-close ${canClose ? 'active' : ''}`}
          onClick={handleClose}
          disabled={!canClose}
          aria-label={t('close') || 'Kapat'}
        >
          {canClose ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <span className="fullscreen-ad-countdown">{countdown}</span>
          )}
        </button>

        <div className="fullscreen-ad-label">{t('adLabel') || 'Reklam'}</div>

        <div className="fullscreen-ad-content" style={{ width: '100%', minWidth: '300px' }}>
          <ins
            className="adsbygoogle"
            ref={insRef}
            style={{ display: 'block', width: '100%', minHeight: '250px' }}
            data-ad-client={AD_CLIENT}
            data-ad-slot="FULLSCREEN_AD_SLOT"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
