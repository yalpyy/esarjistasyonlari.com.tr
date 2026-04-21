import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PRESET_VEHICLES = [
  { name: 'Togg T10X', batteryKwh: 88, consumption: 16.5 },
  { name: 'Tesla Model 3 LR', batteryKwh: 75, consumption: 14.5 },
  { name: 'Tesla Model Y LR', batteryKwh: 75, consumption: 16.0 },
  { name: 'Hyundai Ioniq 5', batteryKwh: 77, consumption: 17.0 },
  { name: 'Kia EV6', batteryKwh: 77, consumption: 17.2 },
  { name: 'Volkswagen ID.4', batteryKwh: 77, consumption: 17.5 },
  { name: 'BMW iX3', batteryKwh: 74, consumption: 18.5 },
  { name: 'Skoda Enyaq iV 80', batteryKwh: 77, consumption: 17.8 },
  { name: 'MG ZS EV', batteryKwh: 72, consumption: 17.9 },
  { name: 'Ford Mustang Mach-E', batteryKwh: 88, consumption: 19.0 },
];

export default function RangeCalculator() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  const [batteryKwh, setBatteryKwh] = useState(75);
  const [consumption, setConsumption] = useState(16.5);
  const [soc, setSoc] = useState(80);
  const [temperature, setTemperature] = useState(20);
  const [speed, setSpeed] = useState('mixed');

  const results = useMemo(() => {
    // Base range (WLTP-like conditions)
    const usableEnergy = (batteryKwh * soc) / 100;
    const baseRange = (usableEnergy / consumption) * 100;

    // Temperature factor (optimal 20°C; cold/hot reduces efficiency)
    let tempFactor = 1.0;
    if (temperature < 0) tempFactor = 0.70;
    else if (temperature < 10) tempFactor = 0.82;
    else if (temperature < 20) tempFactor = 0.92;
    else if (temperature <= 25) tempFactor = 1.0;
    else if (temperature <= 35) tempFactor = 0.95;
    else tempFactor = 0.88;

    // Speed factor
    const speedFactors = { city: 1.15, mixed: 1.0, highway: 0.80 };
    const speedFactor = speedFactors[speed] || 1.0;

    const realRange = baseRange * tempFactor * speedFactor;

    // Charging estimate (AC 11 kW, DC 50 kW, DC 150 kW from 20% to 80%)
    const chargeFromSocToFull = ((100 - soc) * batteryKwh) / 100;
    const ac11 = chargeFromSocToFull / 11;
    const dc50 = chargeFromSocToFull / 50;
    const dc150 = chargeFromSocToFull / 150;

    return {
      baseRange: Math.round(baseRange),
      realRange: Math.round(realRange),
      usableEnergy: usableEnergy.toFixed(1),
      chargeFromSocToFull: chargeFromSocToFull.toFixed(1),
      ac11: (ac11 * 60).toFixed(0),
      dc50: (dc50 * 60).toFixed(0),
      dc150: (dc150 * 60).toFixed(0),
    };
  }, [batteryKwh, consumption, soc, temperature, speed]);

  const applyPreset = (v) => {
    setBatteryKwh(v.batteryKwh);
    setConsumption(v.consumption);
  };

  return (
    <div className="legal-page">
      <article className="legal-content calculator-content">
        <h1>{isTr ? 'Menzil ve Şarj Hesaplayıcı' : 'Range and Charging Calculator'}</h1>
        <p className="guide-intro">
          {isTr
            ? 'Elektrikli aracınızın gerçek menzilini ve şarj sürelerini hesaplayın. Sıcaklık, sürüş hızı ve şarj seviyesine göre gerçekçi tahminler sunar.'
            : 'Calculate real-world range and charging times for your EV. Realistic estimates based on temperature, speed, and charge level.'}
        </p>

        <section className="calculator-wrapper">
          <div className="calculator-form">
            <h2>{isTr ? 'Hazır Araç Seç' : 'Select Preset Vehicle'}</h2>
            <div className="preset-grid">
              {PRESET_VEHICLES.map((v) => (
                <button
                  key={v.name}
                  className="preset-btn"
                  onClick={() => applyPreset(v)}
                >
                  {v.name}
                </button>
              ))}
            </div>

            <h2>{isTr ? 'Parametreler' : 'Parameters'}</h2>

            <label className="calc-field">
              <span>{isTr ? 'Batarya Kapasitesi (kWh)' : 'Battery Capacity (kWh)'}</span>
              <input
                type="number"
                min={10}
                max={200}
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value) || 0)}
              />
            </label>

            <label className="calc-field">
              <span>{isTr ? 'Tüketim (kWh/100km)' : 'Consumption (kWh/100km)'}</span>
              <input
                type="number"
                min={5}
                max={40}
                step={0.1}
                value={consumption}
                onChange={(e) => setConsumption(Number(e.target.value) || 0)}
              />
            </label>

            <label className="calc-field">
              <span>{isTr ? 'Şarj Seviyesi (%)' : 'State of Charge (%)'}: {soc}%</span>
              <input
                type="range"
                min={5}
                max={100}
                value={soc}
                onChange={(e) => setSoc(Number(e.target.value))}
              />
            </label>

            <label className="calc-field">
              <span>{isTr ? 'Dış Sıcaklık (°C)' : 'Outside Temperature (°C)'}: {temperature}°C</span>
              <input
                type="range"
                min={-15}
                max={45}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </label>

            <div className="calc-field">
              <span>{isTr ? 'Sürüş Türü' : 'Driving Style'}</span>
              <div className="speed-options">
                <button
                  className={`speed-btn ${speed === 'city' ? 'active' : ''}`}
                  onClick={() => setSpeed('city')}
                >
                  {isTr ? 'Şehir İçi' : 'City'}
                </button>
                <button
                  className={`speed-btn ${speed === 'mixed' ? 'active' : ''}`}
                  onClick={() => setSpeed('mixed')}
                >
                  {isTr ? 'Karma' : 'Mixed'}
                </button>
                <button
                  className={`speed-btn ${speed === 'highway' ? 'active' : ''}`}
                  onClick={() => setSpeed('highway')}
                >
                  {isTr ? 'Otoyol' : 'Highway'}
                </button>
              </div>
            </div>
          </div>

          <div className="calculator-results">
            <h2>{isTr ? 'Sonuçlar' : 'Results'}</h2>

            <div className="result-card result-card--primary">
              <span className="result-label">{isTr ? 'Gerçek Menzil' : 'Real-World Range'}</span>
              <span className="result-value">{results.realRange} km</span>
              <span className="result-sub">
                {isTr ? 'Mevcut koşullarda' : 'Under current conditions'}
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">{isTr ? 'İdeal Menzil (WLTP)' : 'Ideal Range (WLTP)'}</span>
              <span className="result-value">{results.baseRange} km</span>
              <span className="result-sub">
                {isTr ? 'Optimum koşullarda' : 'Under optimal conditions'}
              </span>
            </div>

            <div className="result-card">
              <span className="result-label">{isTr ? 'Kullanılabilir Enerji' : 'Usable Energy'}</span>
              <span className="result-value">{results.usableEnergy} kWh</span>
            </div>

            <h3>{isTr ? 'Tam Şarj Süresi' : 'Full Charge Time'}</h3>
            <p className="charge-note">
              {isTr
                ? `%${soc}'ten %100'e şarj için gereken enerji: ${results.chargeFromSocToFull} kWh`
                : `Energy needed from ${soc}% to 100%: ${results.chargeFromSocToFull} kWh`}
            </p>

            <div className="charge-times">
              <div className="charge-row">
                <span className="charge-type">AC 11 kW</span>
                <span className="charge-duration">{results.ac11} dk</span>
              </div>
              <div className="charge-row">
                <span className="charge-type">DC 50 kW</span>
                <span className="charge-duration">{results.dc50} dk</span>
              </div>
              <div className="charge-row">
                <span className="charge-type">DC 150 kW</span>
                <span className="charge-duration">{results.dc150} dk</span>
              </div>
            </div>
            <p className="charge-disclaimer">
              {isTr
                ? 'DC hızlı şarjda %80 sonrası hız önemli ölçüde düşer. Bu hesaplama yaklaşık değerdir; araçların şarj eğrisi farklılık gösterir.'
                : 'DC charging significantly slows after 80%. These are approximate values; actual charging curves differ between vehicles.'}
            </p>
          </div>
        </section>

        <section>
          <h2>{isTr ? 'Menzili Etkileyen Faktörler' : 'Factors Affecting Range'}</h2>
          <ul>
            <li>
              <strong>{isTr ? 'Sıcaklık:' : 'Temperature:'}</strong>{' '}
              {isTr
                ? 'Çok soğuk havada (-5°C altı) menzil %30\'a kadar düşebilir. Batarya ısıtma ve kabin konforu için ek enerji tüketir.'
                : 'In very cold weather (below -5°C), range can drop by up to 30%. Battery heating and cabin comfort use extra energy.'}
            </li>
            <li>
              <strong>{isTr ? 'Sürüş Hızı:' : 'Driving Speed:'}</strong>{' '}
              {isTr
                ? 'Aerodinamik direnç hızın karesiyle artar. 130 km/s\'de menzil, 110 km/s\'ye göre %20 daha az olabilir.'
                : 'Aerodynamic drag increases with the square of speed. At 130 km/h, range can be 20% less than at 110 km/h.'}
            </li>
            <li>
              <strong>{isTr ? 'Klima ve Isıtma:' : 'A/C and Heating:'}</strong>{' '}
              {isTr
                ? 'Özellikle elektrikli araçlarda kabin ısıtma, motordan gelen atık ısı olmadığı için ek enerji çeker.'
                : 'Cabin heating draws extra energy since there\'s no waste heat from a combustion engine.'}
            </li>
            <li>
              <strong>{isTr ? 'Yol Eğimi:' : 'Road Incline:'}</strong>{' '}
              {isTr
                ? 'Yokuş çıkışı tüketimi ciddi şekilde artırır ancak iniş sırasında regeneratif frenleme kısmen telafi eder.'
                : 'Uphill driving significantly increases consumption, but regenerative braking partially compensates downhill.'}
            </li>
            <li>
              <strong>{isTr ? 'Yük ve Bagaj:' : 'Load:'}</strong>{' '}
              {isTr
                ? 'Ekstra yolcu ve bagaj tüketimi artırır. Tavan barı kullanımı aerodinamiği de bozar.'
                : 'Extra passengers and luggage increase consumption. Roof racks also impact aerodynamics.'}
            </li>
          </ul>
        </section>

        <section className="guide-cta">
          <h2>{isTr ? 'Rota Planlaması Yapın' : 'Plan Your Route'}</h2>
          <p>
            {isTr
              ? 'Menzilinizi hesapladıktan sonra haritamızdan güzergah üzerindeki şarj istasyonlarını bulun.'
              : 'After calculating your range, find charging stations along your route using our map.'}
          </p>
          <Link to="/" className="guide-cta-btn">
            {isTr ? 'Haritayı Aç' : 'Open Map'}
          </Link>
        </section>
      </article>
    </div>
  );
}
