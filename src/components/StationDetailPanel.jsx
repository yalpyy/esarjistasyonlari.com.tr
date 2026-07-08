import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdBanner from './AdBanner';

/**
 * Pin'e tıklanınca açılan detay paneli.
 * Masaüstü: sağdan kayarak açılır. Mobil: alttan yukarı kayar (bottom sheet).
 * Popup'ın yerini alır; fixed konumlandırıldığı için CLS oluşturmaz.
 *
 * @param {object|null} station  normalizeStation çıktısı
 * @param {() => void} onClose
 * @param {(station) => void} onGetDirections  Mevcut DirectionsModal akışını tetikler
 */
export default function StationDetailPanel({ station, onClose, onGetDirections }) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  // ESC ile kapatma
  useEffect(() => {
    if (!station) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [station, onClose]);

  if (!station) return null;

  return (
    <>
      {/* Arka plan karartması: tıklayınca kapanır */}
      <div className="sdp-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="sdp-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('stationDetails')}
      >
        <div className="sdp-handle" aria-hidden="true" />

        <header className="sdp-header">
          <div>
            <span className={`sdp-type-badge ${station.isDC ? 'sdp-type-badge--dc' : ''}`}>
              {station.isDC ? 'DC · ' + (isTr ? 'Hızlı' : 'Fast') : 'AC'}
            </span>
            <h2 className="sdp-title">{station.title}</h2>
            {station.operator && (
              <p className="sdp-operator">{station.operator}</p>
            )}
          </div>
          <button
            type="button"
            className="sdp-close"
            onClick={onClose}
            aria-label={t('close')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="sdp-body">
          {station.address && (
            <p className="sdp-address">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              {station.address}
            </p>
          )}

          <div className="sdp-stats">
            <div className="sdp-stat">
              <span className="sdp-stat-label">{t('power')}</span>
              <span className="sdp-stat-value">
                {station.maxPower > 0 ? `${station.maxPower} kW` : '—'}
              </span>
            </div>
            <div className="sdp-stat">
              <span className="sdp-stat-label">{t('status')}</span>
              <span className={`sdp-stat-value ${station.isOperational ? 'sdp-stat-value--ok' : ''}`}>
                {station.isOperational ? t('operational') : t('unknown')}
              </span>
            </div>
            <div className="sdp-stat">
              <span className="sdp-stat-label">{isTr ? 'Ücret' : 'Cost'}</span>
              <span className="sdp-stat-value">
                {station.isFree ? t('free') : station.usageCost || t('paid')}
              </span>
            </div>
          </div>

          <h3 className="sdp-section-title">{t('connectionType')}</h3>
          <ul className="sdp-connections">
            {station.connections.length === 0 && (
              <li className="sdp-connection sdp-connection--empty">
                {isTr ? 'Soket bilgisi bulunamadı.' : 'No connector info available.'}
              </li>
            )}
            {station.connections.map((c, i) => (
              <li key={i} className="sdp-connection">
                <span className="sdp-connection-type">{c.type}</span>
                <span
                  className={`sdp-connection-level ${c.levelId === 3 ? 'sdp-connection-level--dc' : ''}`}
                >
                  {c.levelId === 3 ? 'DC' : 'AC'}
                </span>
                <span className="sdp-connection-power">
                  {c.power > 0 ? `${c.power} kW` : '—'}
                </span>
              </li>
            ))}
          </ul>

          {/* Panel altı reklam alanı: minHeight rezerve, skeleton'lı, CLS-safe */}
          <div className="sdp-ad">
            <AdBanner slot="DETAIL_PANEL_SLOT" format="auto" minHeight={250} />
          </div>
        </div>

        <footer className="sdp-footer">
          <button
            type="button"
            className="sdp-directions-btn"
            onClick={() => onGetDirections(station)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l9.5 9.5a1 1 0 0 1 0 1.4L12 22 2.5 12.9a1 1 0 0 1 0-1.4L12 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M9 13v-2h5M12 8.5L14.5 11 12 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {t('getDirections')}
          </button>
          <Link to={`/istasyon/${station.id}`} className="sdp-detail-link" onClick={onClose}>
            {isTr ? 'Tüm Detaylar' : 'Full Details'}
          </Link>
        </footer>
      </aside>
    </>
  );
}
