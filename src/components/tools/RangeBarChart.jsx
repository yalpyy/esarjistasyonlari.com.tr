import { useTranslation } from 'react-i18next';

/**
 * Sürüş tiplerine göre tahmini menzili karşılaştıran yatay bar grafiği.
 * Saf CSS ile çizilir (harici grafik kütüphanesi gerektirmez);
 * bar yükseklikleri sabittir, veri değişiminde layout kaymaz (CLS-safe).
 *
 * @param {{key: string, label: string, km: number}[]} bars
 * @param {string} activeKey  Seçili sürüş tipi (vurgulanır)
 * @param {number} baseRange  Referans (ideal/WLTP benzeri) menzil
 */
export default function RangeBarChart({ bars, activeKey, baseRange }) {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  const maxKm = Math.max(baseRange, ...bars.map((b) => b.km), 1);

  return (
    <div className="range-chart" role="img" aria-label={isTr ? 'Sürüş tipine göre menzil grafiği' : 'Range by driving style chart'}>
      <div className="range-chart-header">
        <span>{isTr ? 'Sürüş Tipine Göre Menzil' : 'Range by Driving Style'}</span>
        <span className="range-chart-ref">
          {isTr ? 'İdeal' : 'Ideal'}: {baseRange} km
        </span>
      </div>

      {bars.map((bar) => {
        const pct = Math.max(4, Math.round((bar.km / maxKm) * 100));
        const isActive = bar.key === activeKey;
        return (
          <div key={bar.key} className={`range-bar-row ${isActive ? 'range-bar-row--active' : ''}`}>
            <span className="range-bar-label">{bar.label}</span>
            <div className="range-bar-track">
              <div
                className="range-bar-fill"
                style={{ width: `${pct}%` }}
              >
                <span className="range-bar-value">{bar.km} km</span>
              </div>
              {/* İdeal menzil referans çizgisi */}
              <span
                className="range-bar-refline"
                style={{ left: `${Math.min(100, Math.round((baseRange / maxKm) * 100))}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
