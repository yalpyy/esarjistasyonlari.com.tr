import AdBanner from './AdBanner';

export default function StickyBanner() {
  return (
    <div className="sticky-banner">
      <div className="sticky-banner-content">
        <AdBanner
          slot="STICKY_MOBILE_SLOT"
          format="auto"
          responsive={false}
          style={{ width: 430, height: 49 }}
        />
      </div>
    </div>
  );
}
