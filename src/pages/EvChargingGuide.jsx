import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FaqSection from '../components/FaqSection';

export default function EvChargingGuide() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <GuideTR /> : <GuideEN />}
    </div>
  );
}

function GuideTR() {
  return (
    <article className="legal-content guide-content">
      <h1>Elektrikli Araç Şarj Rehberi</h1>
      <p className="guide-intro">
        Elektrikli araç sahibi olmanın en önemli adımlarından biri, şarj altyapısını tanımaktır.
        Bu rehberde Türkiye&apos;deki şarj istasyonları, şarj türleri, operatörler ve pratik bilgiler
        hakkında ihtiyacınız olan her şeyi bulacaksınız.
      </p>

      <nav className="guide-toc">
        <h2>İçindekiler</h2>
        <ol>
          <li><a href="#sarj-turleri">Şarj Türleri: AC ve DC Farkı</a></li>
          <li><a href="#soket-tipleri">Soket Tipleri ve Uyumluluk</a></li>
          <li><a href="#operatorler">Türkiye&apos;deki Şarj Operatörleri</a></li>
          <li><a href="#ucretlendirme">Ücretlendirme Modelleri</a></li>
          <li><a href="#ipuclari">Şarj İpuçları</a></li>
          <li><a href="#sss">Sıkça Sorulan Sorular</a></li>
        </ol>
      </nav>

      <section id="sarj-turleri">
        <h2>Şarj Türleri: AC ve DC Farkı</h2>
        <p>
          Elektrikli araçların şarj edilmesinde iki temel akım türü kullanılır: AC (Alternatif Akım)
          ve DC (Doğru Akım). Her ikisinin de kendine özgü avantajları ve kullanım alanları vardır.
        </p>

        <h3>AC Şarj (Yavaş/Normal Şarj)</h3>
        <p>
          AC şarj, evdeki prizden gelen elektriğin türüdür. Şarj gücü genellikle 3,7 kW ile 22 kW
          arasında değişir. AC şarjda, elektrik aracın dahili şarj cihazı (on-board charger) tarafından
          DC&apos;ye dönüştürülür. Bu nedenle şarj süresi aracın dahili şarj cihazının kapasitesine bağlıdır.
        </p>
        <ul>
          <li><strong>Şarj Süresi:</strong> 4-12 saat (batarya kapasitesine göre)</li>
          <li><strong>Uygun Kullanım:</strong> Gece şarjı, alışveriş merkezleri, ofis park yerleri</li>
          <li><strong>Maliyet:</strong> Genellikle DC şarjdan daha ekonomik</li>
        </ul>

        <h3>DC Şarj (Hızlı Şarj)</h3>
        <p>
          DC hızlı şarj istasyonları, elektriği doğrudan bataryaya aktarır ve aracın dahili şarj
          cihazını devre dışı bırakır. Bu sayede çok daha hızlı şarj mümkün olur. Güç seviyeleri
          50 kW&apos;dan 350 kW&apos;a kadar çıkabilir.
        </p>
        <ul>
          <li><strong>Şarj Süresi:</strong> 20-60 dakika (%80&apos;e kadar)</li>
          <li><strong>Uygun Kullanım:</strong> Uzun yol seyahatleri, acil şarj ihtiyaçları</li>
          <li><strong>Maliyet:</strong> AC şarjdan daha pahalı, ancak zaman tasarrufu sağlar</li>
        </ul>
      </section>

      <section id="soket-tipleri">
        <h2>Soket Tipleri ve Uyumluluk</h2>
        <p>
          Türkiye&apos;de yaygın olarak kullanılan şarj soketleri şunlardır:
        </p>

        <h3>Type 2 (Mennekes)</h3>
        <p>
          Avrupa standardı AC şarj soketi. Türkiye&apos;deki AC şarj istasyonlarının büyük çoğunluğu
          Type 2 soket kullanır. Tesla dahil çoğu Avrupa pazarı aracı bu soketi destekler.
        </p>

        <h3>CCS (Combined Charging System)</h3>
        <p>
          Avrupa ve Türkiye&apos;de en yaygın DC hızlı şarj standardıdır. Type 2 soketin altına DC
          pinleri ekleyerek hem AC hem DC şarjı tek bir girişten yapabilir. BMW, Volkswagen, Hyundai,
          Mercedes-Benz gibi markalar CCS kullanır.
        </p>

        <h3>CHAdeMO</h3>
        <p>
          Japon otomobil üreticilerinin geliştirdiği DC hızlı şarj standardıdır. Nissan Leaf ve
          Mitsubishi Outlander gibi araçlarda kullanılır. Türkiye&apos;de CHAdeMO destekli istasyonlar
          mevcuttur ancak CCS kadar yaygın değildir.
        </p>
      </section>

      <section id="operatorler">
        <h2>Türkiye&apos;deki Şarj Operatörleri</h2>
        <p>
          Türkiye&apos;de elektrikli araç şarj altyapısı hızla büyümektedir. Başlıca operatörler:
        </p>

        <h3>ZES (Zorlu Enerji)</h3>
        <p>
          Türkiye&apos;nin en büyük şarj ağlarından biri olan ZES, otoyollar ve şehir içi noktalarda
          yaygın istasyon ağına sahiptir. Hem AC hem DC şarj seçenekleri sunmaktadır.
        </p>

        <h3>Eşarj</h3>
        <p>
          Enerjisa bünyesinde faaliyet gösteren Eşarj, Türkiye genelinde geniş bir şarj ağı sunmaktadır.
          Mobil uygulama üzerinden kolay ödeme imkanı sağlar.
        </p>

        <h3>Trugo</h3>
        <p>
          Hızla büyüyen Trugo, özellikle DC hızlı şarj istasyonlarına odaklanmaktadır. Otoyol
          güzergahlarında güçlü bir ağa sahiptir.
        </p>

        <h3>Sharz.net</h3>
        <p>
          Türkiye&apos;nin ilk şarj ağı operatörlerinden olan Sharz.net, şehir içi ve alışveriş merkezi
          konumlarında hizmet vermektedir.
        </p>

        <h3>Tesla Supercharger</h3>
        <p>
          Tesla&apos;nın kendi araçları için kurduğu hızlı şarj ağı. Türkiye&apos;deki Supercharger
          istasyonları son dönemde diğer marka araçlara da açılmaya başlamıştır.
        </p>
      </section>

      <section id="ucretlendirme">
        <h2>Ücretlendirme Modelleri</h2>
        <p>
          Şarj maliyetleri operatöre, şarj türüne ve abonelik planına göre değişir:
        </p>
        <ul>
          <li><strong>kWh Bazlı:</strong> Kullanılan enerji miktarına göre ücretlendirme (en yaygın)</li>
          <li><strong>Dakika Bazlı:</strong> Şarj süresine göre ücretlendirme</li>
          <li><strong>Sabit Ücret:</strong> Belirli bir oturum ücreti</li>
          <li><strong>Ücretsiz:</strong> Bazı AVM, otel ve iş yerleri ücretsiz şarj sunmaktadır</li>
        </ul>
        <p>
          Haritamızdaki &quot;Ücretsiz&quot; filtresini kullanarak çevrenizdeki ücretsiz şarj noktalarını
          kolayca bulabilirsiniz.
        </p>
      </section>

      <section id="ipuclari">
        <h2>Şarj İpuçları</h2>
        <ol>
          <li>
            <strong>Bataryayı %80&apos;de bırakın:</strong> DC hızlı şarjda %80 sonrası şarj hızı
            önemli ölçüde düşer. Zaman ve maliyet açısından %80&apos;de durdurmak en verimli yöntemdir.
          </li>
          <li>
            <strong>Gece şarj edin:</strong> Evde AC şarj kullanıyorsanız, gece saatlerinde şarj
            etmek hem elektrik maliyetini düşürür hem de batarya sağlığına daha iyidir.
          </li>
          <li>
            <strong>Rotanızı planlayın:</strong> Uzun yolculuklarda şarj duraklarını önceden
            planlayın. <Link to="/">Haritamızı</Link> kullanarak güzergah üzerindeki istasyonları görebilirsiniz.
          </li>
          <li>
            <strong>Batarya sıcaklığına dikkat edin:</strong> Aşırı sıcak veya soğuk havalarda
            batarya performansı düşebilir. Şarj öncesi aracı uygun sıcaklığa getirin.
          </li>
          <li>
            <strong>Birden fazla uygulama kullanın:</strong> Her operatörün kendi uygulaması vardır.
            Birden fazla operatör uygulaması yükleyerek daha geniş bir ağa erişebilirsiniz.
          </li>
        </ol>
      </section>

      <section id="sss">
        <h2>Sıkça Sorulan Sorular</h2>
        <FaqSection language="tr" />
      </section>

      <section className="guide-cta">
        <h2>Şarj İstasyonlarını Keşfedin</h2>
        <p>
          Türkiye&apos;deki tüm elektrikli araç şarj istasyonlarını haritamızda görüntüleyin.
          DC/AC filtresi, operatör seçimi ve ücretsiz istasyon filtreleriyle size en uygun
          şarj noktasını bulun.
        </p>
        <Link to="/" className="guide-cta-btn">Haritayı Aç</Link>
      </section>
    </article>
  );
}

function GuideEN() {
  return (
    <article className="legal-content guide-content">
      <h1>Electric Vehicle Charging Guide</h1>
      <p className="guide-intro">
        One of the most important steps of owning an electric vehicle is understanding the charging
        infrastructure. In this guide, you will find everything you need to know about charging
        stations in Turkey, charging types, operators, and practical information.
      </p>

      <nav className="guide-toc">
        <h2>Table of Contents</h2>
        <ol>
          <li><a href="#charging-types">Charging Types: AC vs DC</a></li>
          <li><a href="#connector-types">Connector Types and Compatibility</a></li>
          <li><a href="#operators">Charging Operators in Turkey</a></li>
          <li><a href="#pricing">Pricing Models</a></li>
          <li><a href="#tips">Charging Tips</a></li>
          <li><a href="#faq">Frequently Asked Questions</a></li>
        </ol>
      </nav>

      <section id="charging-types">
        <h2>Charging Types: AC vs DC</h2>
        <p>
          Two main types of current are used for charging electric vehicles: AC (Alternating Current)
          and DC (Direct Current). Each has its own advantages and use cases.
        </p>

        <h3>AC Charging (Slow/Normal Charging)</h3>
        <p>
          AC charging uses the same type of electricity from your home outlet. Power levels range
          from 3.7 kW to 22 kW. The vehicle&apos;s on-board charger converts AC to DC, so charging
          speed depends on the vehicle&apos;s charger capacity.
        </p>
        <ul>
          <li><strong>Charging Time:</strong> 4-12 hours (depending on battery capacity)</li>
          <li><strong>Best For:</strong> Overnight charging, shopping malls, office parking</li>
          <li><strong>Cost:</strong> Generally more economical than DC charging</li>
        </ul>

        <h3>DC Fast Charging</h3>
        <p>
          DC fast charging stations deliver power directly to the battery, bypassing the vehicle&apos;s
          on-board charger. This enables much faster charging with power levels from 50 kW to 350 kW.
        </p>
        <ul>
          <li><strong>Charging Time:</strong> 20-60 minutes (to 80%)</li>
          <li><strong>Best For:</strong> Long trips, emergency charging needs</li>
          <li><strong>Cost:</strong> More expensive than AC, but saves time</li>
        </ul>
      </section>

      <section id="connector-types">
        <h2>Connector Types and Compatibility</h2>
        <p>The most common charging connectors in Turkey are:</p>
        <h3>Type 2 (Mennekes)</h3>
        <p>The European standard AC connector, used by most AC stations in Turkey.</p>
        <h3>CCS (Combined Charging System)</h3>
        <p>The most common DC fast charging standard in Europe and Turkey.</p>
        <h3>CHAdeMO</h3>
        <p>Japanese DC fast charging standard, used by Nissan Leaf and Mitsubishi vehicles.</p>
      </section>

      <section id="operators">
        <h2>Charging Operators in Turkey</h2>
        <p>
          Turkey&apos;s EV charging infrastructure is growing rapidly with major operators including
          ZES, Eşarj, Trugo, Sharz.net, and Tesla Superchargers.
        </p>
      </section>

      <section id="pricing">
        <h2>Pricing Models</h2>
        <ul>
          <li><strong>Per kWh:</strong> Based on energy consumed (most common)</li>
          <li><strong>Per Minute:</strong> Based on charging duration</li>
          <li><strong>Flat Rate:</strong> Fixed session fee</li>
          <li><strong>Free:</strong> Some locations offer free charging</li>
        </ul>
        <p>
          Use the &quot;Free&quot; filter on our <Link to="/">map</Link> to find free charging stations near you.
        </p>
      </section>

      <section id="tips">
        <h2>Charging Tips</h2>
        <ol>
          <li><strong>Stop at 80%:</strong> DC fast charging slows significantly after 80%.</li>
          <li><strong>Charge overnight:</strong> Home AC charging at night saves costs.</li>
          <li><strong>Plan your route:</strong> Use our <Link to="/">map</Link> to find stations along your route.</li>
          <li><strong>Watch battery temperature:</strong> Extreme temperatures affect performance.</li>
          <li><strong>Use multiple apps:</strong> Install apps from multiple operators for wider coverage.</li>
        </ol>
      </section>

      <section id="faq">
        <h2>Frequently Asked Questions</h2>
        <FaqSection language="en" />
      </section>

      <section className="guide-cta">
        <h2>Explore Charging Stations</h2>
        <p>
          View all electric vehicle charging stations in Turkey on our map. Use DC/AC filters,
          operator selection, and free station filters to find the perfect charging point for you.
        </p>
        <Link to="/" className="guide-cta-btn">Open Map</Link>
      </section>
    </article>
  );
}
