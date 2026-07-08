import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdsenseSafePush } from '../hooks/useAdsenseSafePush';

const AD_CLIENT = 'ca-pub-8596736740004807';

/**
 * CLS-safe AdSense banner'ı.
 * - Alan, reklam yüklenmeden önce minHeight ile rezerve edilir (layout kaymaz)
 * - Yüklenene kadar gri shimmer skeleton gösterilir
 * - AdSense'in <ins> üzerine yazdığı data-ad-status ("filled"/"unfilled")
 *   MutationObserver ile izlenir; dolunca skeleton kaldırılır,
 *   dolmazsa alan korunur ve "Reklam Alanı" etiketi gösterilir.
 */
export default function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  minHeight = 250,
  style = {},
  className = '',
}) {
  const { insRef } = useAdsenseSafePush();
  const { t } = useTranslation();
  const [status, setStatus] = useState('loading'); // loading | filled | unfilled

  useEffect(() => {
    const el = insRef.current;
    if (!el || typeof MutationObserver === 'undefined') return undefined;

    const check = () => {
      const s = el.getAttribute('data-ad-status');
      if (s === 'filled') setStatus('filled');
      else if (s === 'unfilled') setStatus('unfilled');
    };

    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    return () => mo.disconnect();
  }, [insRef]);

  return (
    <div
      className={`ad-banner-container ad-banner--${status} ${className}`}
      style={{ width: '100%', minWidth: '250px', minHeight, ...style }}
    >
      {status !== 'filled' && (
        <div className="ad-skeleton" aria-hidden="true">
          {status === 'unfilled' && (
            <span className="ad-skeleton-label">{t('adPlaceholder')}</span>
          )}
        </div>
      )}
      <ins
        className="adsbygoogle"
        ref={insRef}
        style={{ display: 'block', width: '100%', minHeight, ...style }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
