import { useEffect, useRef } from 'react';

const AD_CLIENT = 'ca-pub-8596736740004807';

export default function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  style = {},
  className = '',
}) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (adRef.current && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  }, []);

  return (
    <div className={`ad-banner-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        ref={adRef}
        style={{ display: 'block', ...style }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
      />
    </div>
  );
}
