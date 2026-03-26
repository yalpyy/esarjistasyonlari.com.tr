import { useAdsenseSafePush } from '../hooks/useAdsenseSafePush';

const AD_CLIENT = 'ca-pub-8596736740004807';

export default function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className = '',
}) {
  const { insRef } = useAdsenseSafePush();

  return (
    <div
      className={`ad-banner-container ${className}`}
      style={{ width: '100%', minWidth: '250px', ...style }}
    >
      <ins
        className="adsbygoogle"
        ref={insRef}
        style={{ display: 'block', width: '100%', ...style }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
