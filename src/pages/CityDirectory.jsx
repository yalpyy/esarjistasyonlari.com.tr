import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const REGIONS = {
  'Marmara': ['İstanbul', 'Bursa', 'Kocaeli', 'Sakarya', 'Tekirdağ', 'Balıkesir', 'Çanakkale', 'Edirne', 'Kırklareli', 'Bilecik', 'Yalova'],
  'Ege': ['İzmir', 'Manisa', 'Aydın', 'Denizli', 'Muğla', 'Kütahya', 'Afyonkarahisar', 'Uşak'],
  'Akdeniz': ['Antalya', 'Mersin', 'Adana', 'Hatay', 'Isparta', 'Burdur', 'Kahramanmaraş', 'Osmaniye'],
  'İç Anadolu': ['Ankara', 'Konya', 'Kayseri', 'Eskişehir', 'Sivas', 'Nevşehir', 'Kırşehir', 'Aksaray', 'Niğde', 'Yozgat', 'Çankırı', 'Kırıkkale', 'Karaman'],
  'Karadeniz': ['Trabzon', 'Samsun', 'Ordu', 'Rize', 'Giresun', 'Zonguldak', 'Bolu', 'Düzce', 'Karabük', 'Kastamonu', 'Sinop', 'Amasya', 'Tokat', 'Bartın', 'Artvin', 'Gümüşhane', 'Bayburt', 'Çorum'],
  'Doğu Anadolu': ['Erzurum', 'Malatya', 'Elazığ', 'Van', 'Erzincan', 'Ağrı', 'Ardahan', 'Bingöl', 'Bitlis', 'Hakkari', 'Iğdır', 'Kars', 'Muş', 'Tunceli'],
  'Güneydoğu Anadolu': ['Gaziantep', 'Şanlıurfa', 'Diyarbakır', 'Mardin', 'Batman', 'Siirt', 'Şırnak', 'Adıyaman', 'Kilis'],
};

const CITY_INFO = {
  'İstanbul': 'Türkiye\'nin en yoğun şarj ağına sahip şehri. Avrupa ve Anadolu yakasında 500+ istasyon, otoyol güzergahlarında ultra hızlı şarj noktaları mevcut.',
  'Ankara': 'Başkent olarak güçlü bir AC ve DC şarj altyapısı sunar. Alışveriş merkezleri, iş bölgeleri ve otoyol girişlerinde yaygın istasyon ağı.',
  'İzmir': 'Ege Bölgesi\'nin şarj merkezi. Şehir içi ve sahil güzergahlarında operatörlerin yoğun olduğu noktalar bulunur.',
  'Bursa': 'OSB bölgeleri, AVM\'ler ve İstanbul-Ankara otoyol bağlantısı üzerinde güçlü şarj istasyonu erişimi.',
  'Antalya': 'Turistik bölgeler ve otel zincirlerinde şarj olanakları. Sahil şeridi ve havaalanı çevresinde yaygın istasyon.',
  'Konya': 'İç Anadolu\'da önemli bir şarj durağı. Otoyol geçiş noktalarında DC hızlı şarj istasyonları yaygınlaşıyor.',
  'Gaziantep': 'Güneydoğu\'nun en büyük şarj ağına sahip şehri. Otoyol bağlantılarında ultra hızlı şarj noktaları mevcut.',
  'Kocaeli': 'İstanbul-Ankara otoyolunda kritik durak. Sanayi bölgeleri ve otoyol dinlenme tesislerinde güçlü istasyon ağı.',
  'Adana': 'Akdeniz-Güneydoğu geçişinde önemli şarj merkezi. Otoyol ve şehir içinde hızlı şarj olanakları.',
  'Trabzon': 'Karadeniz\'in şarj merkezi. Sahil yolu boyunca AC ve DC istasyonlar yaygınlaşıyor.',
  'Kayseri': 'Erciyes ve kış turizmine yönelik şarj olanakları. Şehir içi AVM\'lerde AC şarj yaygın.',
  'Eskişehir': 'Üniversite şehri olarak genç kullanıcıya yönelik modern şarj altyapısı.',
  'Samsun': 'Karadeniz Bölgesi\'nin en büyük şarj ağına sahip şehirlerinden.',
  'Diyarbakır': 'Güneydoğu Anadolu\'nun önemli şarj duraklarından biri.',
  'Mersin': 'Akdeniz sahil güzergahında kritik şarj noktası.',
};

function getDefaultInfo(city) {
  return `${city} ve çevresinde elektrikli araç şarj istasyonu sayısı her geçen gün artmaktadır. Şehir merkezinde AC şarj, ana yol güzergahlarında DC hızlı şarj noktaları bulunmaktadır. Haritamızı kullanarak ${city} ve çevresindeki en yakın istasyonları görebilirsiniz.`;
}

export default function CityDirectory() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const [search, setSearch] = useState('');

  const filteredRegions = useMemo(() => {
    if (!search.trim()) return REGIONS;
    const q = search.toLowerCase().trim();
    const result = {};
    for (const [region, cities] of Object.entries(REGIONS)) {
      const matched = cities.filter((c) => c.toLowerCase().includes(q));
      if (matched.length > 0) result[region] = matched;
    }
    return result;
  }, [search]);

  return (
    <div className="legal-page">
      <article className="legal-content cities-content">
        <h1>{isTr ? 'Hizmet Verilen Şehirler' : 'Cities We Serve'}</h1>
        <p className="guide-intro">
          {isTr
            ? 'Türkiye genelinde 81 ilde elektrikli araç şarj istasyonu verilerini sunuyoruz. Bölgesel dağılıma göre illeri keşfedin ve her şehir için şarj altyapısı hakkında bilgi edinin.'
            : 'We provide EV charging station data across 81 provinces in Turkey. Explore cities by region and learn about the charging infrastructure in each.'}
        </p>

        <div className="glossary-search-bar">
          <input
            type="text"
            className="glossary-search"
            placeholder={isTr ? 'Şehir ara...' : 'Search city...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {Object.entries(filteredRegions).map(([region, cities]) => (
          <section key={region} className="region-section">
            <h2>{region} {isTr ? 'Bölgesi' : 'Region'}</h2>
            <div className="cities-grid">
              {cities.map((city) => (
                <article key={city} className="city-card">
                  <h3>{city}</h3>
                  <p>{CITY_INFO[city] || getDefaultInfo(city)}</p>
                  <Link to="/" className="city-card-link">
                    {isTr ? 'Haritada Gör →' : 'View on Map →'}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}

        {Object.keys(filteredRegions).length === 0 && (
          <p className="empty-text">
            {isTr ? 'Eşleşen şehir bulunamadı.' : 'No matching city found.'}
          </p>
        )}

        <section className="guide-cta">
          <h2>{isTr ? 'Haritayı Açın' : 'Open the Map'}</h2>
          <p>
            {isTr
              ? 'Tüm şehirlerdeki şarj istasyonlarını interaktif haritamızda görün, filtreleyin ve yol tarifi alın.'
              : 'View all charging stations on our interactive map, apply filters, and get directions.'}
          </p>
          <Link to="/" className="guide-cta-btn">
            {isTr ? 'Haritayı Aç' : 'Open Map'}
          </Link>
        </section>
      </article>
    </div>
  );
}
