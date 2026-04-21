import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OCM_API = 'https://api.openchargemap.io/v3/poi';

export default function StationDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const key = import.meta.env.VITE_OCM_API_KEY || '';
    const params = new URLSearchParams({
      output: 'json',
      chargepointid: id,
      verbose: 'true',
    });
    if (key) params.set('key', key);

    fetch(`${OCM_API}?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setStation(data[0]);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="legal-page">
        <div className="station-detail-loading">
          <div className="geo-loading-spinner" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="legal-page">
        <div className="not-found-content">
          <h1 className="not-found-code">404</h1>
          <h2>{isTr ? 'İstasyon Bulunamadı' : 'Station Not Found'}</h2>
          <p>{isTr ? 'Bu ID ile eşleşen bir istasyon bulunamadı.' : 'No station found with this ID.'}</p>
          <div className="not-found-links">
            <Link to="/" className="not-found-btn">{t('home')}</Link>
          </div>
        </div>
      </div>
    );
  }

  const addr = station.AddressInfo || {};
  const conns = station.Connections || [];
  const op = station.OperatorInfo || {};
  const statusOp = (station.StatusType && station.StatusType.IsOperational) ? true : false;
  const town = addr.Town || '';
  const province = addr.StateOrProvince || '';
  const fullAddress = [addr.AddressLine1, addr.AddressLine2, town, province].filter(Boolean).join(', ');
  const maxPower = Math.max(...conns.map((c) => c.PowerKW || 0), 0);
  const stationTitle = addr.Title || `${isTr ? 'Şarj İstasyonu' : 'Charging Station'} #${id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: stationTitle,
    description: isTr
      ? `${town || province} bölgesinde ${op.Title || ''} elektrikli araç şarj istasyonu. Maksimum ${maxPower} kW güç.`
      : `${op.Title || ''} EV charging station in ${town || province}. Max ${maxPower} kW power.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: addr.AddressLine1 || '',
      addressLocality: town,
      addressRegion: province,
      addressCountry: 'TR',
      postalCode: addr.Postcode || '',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: addr.Latitude,
      longitude: addr.Longitude,
    },
    url: `https://esarjistasyonu.com.tr/istasyon/${id}`,
    isAccessibleForFree: station.UsageCost === null || station.UsageCost === '',
  };

  return (
    <div className="legal-page">
      <article className="legal-content station-detail">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <nav className="station-breadcrumb">
          <Link to="/">{t('home')}</Link>
          <span> / </span>
          {town && (
            <>
              <Link to="/sehirler">{town}</Link>
              <span> / </span>
            </>
          )}
          <span>{stationTitle}</span>
        </nav>

        <h1>{stationTitle}</h1>
        {town && province && (
          <p className="station-detail-subtitle">
            {isTr
              ? `${town}, ${province} Elektrikli Araç Şarj Noktası`
              : `EV Charging Point in ${town}, ${province}`}
          </p>
        )}

        <div className="station-detail-grid">
          <section className="station-info-card">
            <h2>{isTr ? 'Konum Bilgileri' : 'Location Info'}</h2>
            <dl className="station-dl">
              <dt>{t('address')}</dt>
              <dd>{fullAddress || '-'}</dd>
              <dt>{t('operator')}</dt>
              <dd>{op.Title || t('unknown')}</dd>
              <dt>{t('status')}</dt>
              <dd>
                <span className={`station-status ${statusOp ? 'station-status--active' : ''}`}>
                  {statusOp ? (isTr ? 'Aktif' : 'Operational') : (isTr ? 'Bilinmiyor' : 'Unknown')}
                </span>
              </dd>
              {station.UsageCost && (
                <>
                  <dt>{isTr ? 'Ücret' : 'Cost'}</dt>
                  <dd>{station.UsageCost}</dd>
                </>
              )}
            </dl>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${addr.Latitude},${addr.Longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="guide-cta-btn"
              style={{ marginTop: '1rem', display: 'inline-block' }}
            >
              {t('getDirections')}
            </a>
          </section>

          <section className="station-info-card">
            <h2>{isTr ? 'Şarj Bağlantıları' : 'Connections'}</h2>
            {conns.length === 0 && (
              <p>{isTr ? 'Bağlantı bilgisi bulunamadı.' : 'No connection info available.'}</p>
            )}
            {conns.map((c, i) => {
              const cType = (c.ConnectionType && c.ConnectionType.Title) || 'Unknown';
              const level = c.Level ? c.Level.Title : (c.LevelID === 3 ? 'DC' : 'AC');
              return (
                <div key={i} className="connection-card">
                  <div className="connection-header">
                    <span className="connection-type">{cType}</span>
                    <span className={`connection-level ${c.LevelID === 3 ? 'connection-level--dc' : ''}`}>
                      {level}
                    </span>
                  </div>
                  <div className="connection-detail">
                    <span>{t('power')}: <strong>{c.PowerKW || '?'} kW</strong></span>
                    {c.Quantity && <span> · {c.Quantity}x</span>}
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {maxPower > 0 && (
          <section className="station-detail-summary">
            <h2>{isTr ? 'Bu İstasyon Hakkında' : 'About This Station'}</h2>
            <p>
              {isTr
                ? `${stationTitle}, ${town || province || 'Türkiye'} bölgesinde ${op.Title || 'bağımsız operatör'} tarafından işletilen bir elektrikli araç şarj istasyonudur. İstasyonda maksimum ${maxPower} kW güç kapasiteli ${conns.length} adet bağlantı noktası bulunmaktadır. ${maxPower >= 50 ? 'DC hızlı şarj desteği sayesinde aracınızı yaklaşık 20-40 dakikada %80\'e kadar şarj edebilirsiniz.' : 'AC şarj ile aracınızı birkaç saat içinde tam şarj edebilirsiniz.'}`
                : `${stationTitle} is an EV charging station in ${town || province || 'Turkey'} operated by ${op.Title || 'an independent operator'}. The station has ${conns.length} connection(s) with a maximum power of ${maxPower} kW. ${maxPower >= 50 ? 'DC fast charging can bring your vehicle to 80% in approximately 20-40 minutes.' : 'AC charging will fully charge your vehicle in a few hours.'}`}
            </p>
          </section>
        )}

        <section className="guide-cta" style={{ marginTop: '2rem' }}>
          <h2>{isTr ? 'Diğer İstasyonları Keşfedin' : 'Explore Other Stations'}</h2>
          <p>
            {isTr
              ? 'Haritamızda Türkiye genelindeki tüm şarj istasyonlarını görüntüleyin.'
              : 'View all charging stations across Turkey on our map.'}
          </p>
          <Link to="/" className="guide-cta-btn">
            {isTr ? 'Haritayı Aç' : 'Open Map'}
          </Link>
        </section>
      </article>
    </div>
  );
}
