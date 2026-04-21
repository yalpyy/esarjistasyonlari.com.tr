import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const TERMS = [
  { term: 'AC Şarj', letter: 'A', def: 'Alternatif Akım (Alternating Current) kullanılarak yapılan şarj türü. Ev prizlerinde kullanılan akım tipidir. AC şarjda elektrik, aracın dahili şarj cihazı tarafından DC\'ye çevrilir. 3,7 kW ile 22 kW arasında güç sunar ve yavaş/normal şarj olarak bilinir.' },
  { term: 'Adaptif Hız Sabitleyici', letter: 'A', def: 'Elektrikli araçlarda yaygın kullanılan, öndeki araca göre hızı otomatik ayarlayan sürüş destek sistemi. Menzili uzatmaya yardımcı olur.' },
  { term: 'BEV (Battery Electric Vehicle)', letter: 'B', def: 'Yalnızca batarya ile çalışan, içten yanmalı motor içermeyen tam elektrikli araç. Örnek: Tesla Model 3, Togg T10X, Hyundai Ioniq 5.' },
  { term: 'Bağlantı Tipi', letter: 'B', def: 'Elektrikli aracın şarj noktasına bağlanması için kullanılan soket standardı. Türkiye\'de yaygın tipler Type 2, CCS2 ve CHAdeMO\'dur.' },
  { term: 'CCS (Combined Charging System)', letter: 'C', def: 'Avrupa ve Türkiye\'de en yaygın DC hızlı şarj standardı. Type 2 soketin altına iki DC pin eklenerek tek girişten hem AC hem DC şarjı mümkün kılar. 50-350 kW arası güç destekler.' },
  { term: 'CHAdeMO', letter: 'C', def: 'Japon otomobil üreticilerinin geliştirdiği DC hızlı şarj standardı. Nissan Leaf ve Mitsubishi Outlander PHEV gibi araçlarda kullanılır. Türkiye\'de varlığı azalmaktadır.' },
  { term: 'Dinamik Şarj', letter: 'D', def: 'Şarj gücünün, batarya seviyesi ve sıcaklığa göre otomatik ayarlandığı sistem. Akıllı şarj olarak da bilinir.' },
  { term: 'DC Şarj', letter: 'D', def: 'Doğru Akım (Direct Current) ile yapılan hızlı şarj. Akım, istasyondaki dönüştürücüler aracılığıyla doğrudan bataryaya gider. 50 kW\'tan 350 kW\'a kadar güç seviyelerine sahiptir.' },
  { term: 'DoD (Depth of Discharge)', letter: 'D', def: 'Bataryanın ne kadar boşaltıldığını gösteren yüzde. Düşük DoD batarya ömrünü uzatır. Çoğu üretici %80 DoD önerir.' },
  { term: 'Elektrikli Araç (EA)', letter: 'E', def: 'Elektrik motoru ile çalışan, enerjisini bataryadan alan taşıt. EV (Electric Vehicle) olarak da bilinir.' },
  { term: 'EVSE', letter: 'E', def: 'Electric Vehicle Supply Equipment - Elektrikli aracı şebekeye bağlayan güvenli şarj donanımı. Basit anlamda şarj istasyonunun kendisidir.' },
  { term: 'Frenleme Enerji Geri Kazanımı', letter: 'F', def: 'Regeneratif frenleme sırasında kinetik enerjiyi elektriğe çevirerek bataryayı şarj eden sistem. Menzili önemli ölçüde artırır.' },
  { term: 'Güç (kW)', letter: 'G', def: 'Şarj istasyonunun sağladığı anlık elektrik gücü. Yüksek güç, daha hızlı şarj anlamına gelir. 7 kW (AC evsel), 22 kW (AC genel), 50 kW+ (DC hızlı) tipik değerlerdir.' },
  { term: 'HPC (High Power Charging)', letter: 'H', def: 'Yüksek Güçlü Şarj - 150 kW üzerinde güç sağlayan ultra hızlı DC şarj istasyonları. 10-20 dakikada %80 şarj mümkündür.' },
  { term: 'HEV (Hybrid Electric Vehicle)', letter: 'H', def: 'Hem içten yanmalı motor hem de elektrik motoru içeren hibrit araç. Şebekeden şarj edilmez; bataryayı motor ve frenleme doldurur.' },
  { term: 'ICE (Internal Combustion Engine)', letter: 'I', def: 'İçten Yanmalı Motor - geleneksel benzinli/dizel araçlar. "ICE Blocking" terimi, bu araçların şarj noktalarını işgal etmesini ifade eder.' },
  { term: 'kWh (Kilowatt-saat)', letter: 'K', def: 'Enerji birimi. Bataryanın kapasitesi ve şarj sırasında kullanılan enerji bu birimle ifade edilir. 50 kWh\'lık batarya, 10 kW gücü 5 saat boyunca sağlayabilir.' },
  { term: 'Menzil (Range)', letter: 'M', def: 'Tam şarjlı bataryayla katedilebilecek toplam mesafe. Sürüş tarzı, hava durumu ve yük gibi faktörlere göre değişir.' },
  { term: 'MID (Measuring Instruments Directive)', letter: 'M', def: 'AB standardında onaylı ölçüm cihazları direktifi. Türkiye\'de MID onaylı sayaçlar, şarj ücretinin doğru hesaplanmasını sağlar.' },
  { term: 'NEDC', letter: 'N', def: 'New European Driving Cycle - Eski Avrupa menzil test standardı. Gerçek kullanımdan daha yüksek menzil değerleri verdiği için WLTP ile değiştirildi.' },
  { term: 'OCM (OpenChargeMap)', letter: 'O', def: 'Dünya çapında şarj istasyonu verilerini ücretsiz sağlayan açık kaynak veritabanı. esarjistasyonu.com.tr bu veriyi kullanır.' },
  { term: 'Onboard Charger', letter: 'O', def: 'Aracın dahili AC şarj cihazı. AC şarjı DC\'ye çevirerek bataryaya aktarır. Kapasitesi aracın AC şarj hızını belirler (genellikle 7,4-22 kW).' },
  { term: 'PHEV (Plug-in Hybrid)', letter: 'P', def: 'Priz (plug-in) hibrit - Hem şebekeden şarj edilebilen hem de benzinle çalışabilen hibrit araç. Örn: BMW 330e, Mercedes C 300 e.' },
  { term: 'Peak Power', letter: 'P', def: 'Şarj seansı sırasında ulaşılan en yüksek güç değeri. Batarya %20-50 arasındayken genellikle pik güce ulaşılır.' },
  { term: 'RFID Kart', letter: 'R', def: 'Şarj istasyonunu başlatmak için kullanılan temassız kart. Bazı operatörler mobil uygulama yanında RFID de sunar.' },
  { term: 'SOC (State of Charge)', letter: 'S', def: 'Şarj Durumu - Bataryadaki mevcut enerjinin yüzdesi. Genelde %20-80 aralığı, hem batarya sağlığı hem hız açısından idealdir.' },
  { term: 'SOH (State of Health)', letter: 'S', def: 'Batarya Sağlık Durumu - Bataryanın orijinal kapasitesine göre mevcut kapasitesinin yüzdesi. Yaşlandıkça düşer.' },
  { term: 'Schuko', letter: 'S', def: 'Avrupa\'da standart evsel priz. Elektrikli araç için acil durumda 2,3 kW\'a kadar şarj sağlar, düzenli kullanım için önerilmez.' },
  { term: 'Tethered (Kablolu) İstasyon', letter: 'T', def: 'Kabloları istasyona sabit bağlı şarj noktası. Untethered (kablosuz) istasyonlarda kablo kullanıcının getirmesi gerekir.' },
  { term: 'Tip 2 (Type 2 / Mennekes)', letter: 'T', def: 'Avrupa standardı AC şarj soketi. Türkiye\'deki AC istasyonların büyük çoğunluğu Type 2 kullanır. 3 fazlı akımla 22 kW\'a kadar güç sağlar.' },
  { term: 'Ultra Hızlı Şarj', letter: 'U', def: 'Genellikle 150 kW üzerindeki DC şarj istasyonları. Yeni nesil elektrikli araçlarda 18-25 dakikada %80 şarj sağlar.' },
  { term: 'V2G (Vehicle-to-Grid)', letter: 'V', def: 'Araçtan şebekeye enerji aktarımı. Elektrikli aracın bataryasındaki enerjiyi tekrar elektrik şebekesine satabilme teknolojisi.' },
  { term: 'V2L (Vehicle-to-Load)', letter: 'V', def: 'Araçtan cihaza enerji aktarımı. Aracın bataryasını harici cihazlara elektrik sağlamak için kullanma (kamp, piknik, güç kesintisi vs.).' },
  { term: 'Wallbox', letter: 'W', def: 'Ev veya işyerinde duvara monte edilen şarj ünitesi. Genellikle 7,4-22 kW güçte AC şarj sağlar.' },
  { term: 'WLTP', letter: 'W', def: 'Worldwide Harmonized Light Vehicles Test Procedure - Güncel ve gerçekçi menzil test standardı. NEDC\'nin yerine geçmiştir.' },
];

export default function EvGlossary() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState(null);

  const filteredTerms = useMemo(() => {
    let result = TERMS;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)
      );
    }
    if (activeLetter) {
      result = result.filter((t) => t.letter === activeLetter);
    }
    return result;
  }, [search, activeLetter]);

  const letters = useMemo(
    () => Array.from(new Set(TERMS.map((t) => t.letter))).sort(),
    []
  );

  return (
    <div className="legal-page">
      <article className="legal-content glossary-content">
        <h1>{isTr ? 'Elektrikli Araç Sözlüğü' : 'Electric Vehicle Glossary'}</h1>
        <p className="guide-intro">
          {isTr
            ? 'Elektrikli araç dünyasında sık kullanılan terimlerin açıklamalı sözlüğü. AC/DC şarjdan batarya teknolojilerine, soket tiplerinden sektör terimlerine kadar 35+ terim.'
            : '35+ key terms from the electric vehicle world, explained: AC/DC charging, battery tech, connector types, and more.'}
        </p>

        <div className="glossary-search-bar">
          <input
            type="text"
            className="glossary-search"
            placeholder={isTr ? 'Terim ara...' : 'Search term...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="glossary-letter-nav" role="navigation" aria-label="Alfabetik filtre">
          <button
            className={`glossary-letter ${activeLetter === null ? 'active' : ''}`}
            onClick={() => setActiveLetter(null)}
          >
            {isTr ? 'Tümü' : 'All'}
          </button>
          {letters.map((l) => (
            <button
              key={l}
              className={`glossary-letter ${activeLetter === l ? 'active' : ''}`}
              onClick={() => setActiveLetter(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <dl className="glossary-list">
          {filteredTerms.length === 0 && (
            <p className="empty-text">
              {isTr ? 'Eşleşen terim bulunamadı.' : 'No matching terms found.'}
            </p>
          )}
          {filteredTerms.map((item) => (
            <div key={item.term} className="glossary-item">
              <dt className="glossary-term">{item.term}</dt>
              <dd className="glossary-def">{item.def}</dd>
            </div>
          ))}
        </dl>

        <section className="guide-cta">
          <h2>{isTr ? 'Şarj Rehberini İnceleyin' : 'Read the Charging Guide'}</h2>
          <p>
            {isTr
              ? 'Terimleri öğrendiniz, şimdi detaylı şarj rehberimizi okuyun. AC/DC farkı, operatörler, ipuçları ve daha fazlası.'
              : 'Learned the terms? Read our detailed charging guide: AC/DC, operators, tips, and more.'}
          </p>
          <Link to="/ev-sarj-rehberi" className="guide-cta-btn">
            {isTr ? 'Rehbere Git' : 'Go to Guide'}
          </Link>
        </section>
      </article>
    </div>
  );
}
