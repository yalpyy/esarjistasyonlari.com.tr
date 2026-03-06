import { useTranslation } from 'react-i18next';

export default function AboutUs() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <AboutTR /> : <AboutEN />}
    </div>
  );
}

function AboutTR() {
  return (
    <article className="legal-content">
      <h1>Hakkımızda</h1>

      <section>
        <h2>E-Şarj İstasyonları Nedir?</h2>
        <p>
          esarjistasyonu.com.tr, Türkiye genelindeki elektrikli araç şarj istasyonlarını
          tek bir harita üzerinde toplayan, kullanıcı dostu ve hızlı bir şarj istasyonu
          rehberidir. Amacımız, elektrikli araç sahiplerinin en yakın şarj noktasını kolayca
          bulmasını, filtrelemesini ve anında yol tarifi almasını sağlamaktır.
        </p>
      </section>

      <section>
        <h2>Misyonumuz</h2>
        <p>
          Türkiye&apos;de elektrikli araç kullanımının yaygınlaşmasına katkı sağlamak ve
          sürücülerin şarj altyapısına erişimini kolaylaştırmak. Sıfır emisyonlu bir
          ulaşım geleceğine destek olmak için doğru, güncel ve erişilebilir bilgi sunuyoruz.
        </p>
      </section>

      <section>
        <h2>Ne Sunuyoruz?</h2>
        <ul>
          <li>
            <strong>Gerçek Zamanlı Harita:</strong> OpenChargeMap API entegrasyonu ile
            Türkiye&apos;deki tüm şarj istasyonlarını interaktif harita üzerinde görüntüleyin.
          </li>
          <li>
            <strong>Akıllı Filtreleme:</strong> DC (Hızlı Şarj), AC (Standart Şarj),
            ücretsiz istasyonlar ve operatörlere (ZES, Eşarj, Trugo vb.) göre filtreleme yapın.
          </li>
          <li>
            <strong>Mesafe Bazlı Sıralama:</strong> Konumunuza en yakın istasyonları otomatik
            olarak sıralı şekilde görün.
          </li>
          <li>
            <strong>Anında Yol Tarifi:</strong> Tek tıkla Google Maps veya Apple Maps
            üzerinden seçtiğiniz istasyona navigasyon başlatın.
          </li>
          <li>
            <strong>Blog:</strong> Elektrikli araçlar, şarj teknolojileri ve sektörel
            gelişmeler hakkında güncel içerikler.
          </li>
          <li>
            <strong>Çoklu Dil Desteği:</strong> Türkçe ve İngilizce dil desteği ile
            yerli ve yabancı kullanıcılara hizmet.
          </li>
        </ul>
      </section>

      <section>
        <h2>Veri Kaynağı</h2>
        <p>
          Şarj istasyonu verileri, dünya genelinde 200.000&apos;den fazla şarj noktası bilgisi
          barındıran açık kaynaklı <strong>OpenChargeMap</strong> platformundan sağlanmaktadır.
          Veriler topluluk katkılarıyla sürekli güncellenmektedir.
        </p>
      </section>

      <section>
        <h2>İşletmeler İçin (B2B)</h2>
        <p>
          Şarj istasyonu işletmecisiyseniz veya yeni bir şarj noktası açmayı planlıyorsanız,
          platformumuza işletmenizi eklemek için <strong>&quot;İşletmeni Ekle&quot;</strong> formunu
          kullanabilirsiniz. İş birliği teklifleriniz için{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>{' '}
          adresinden bize ulaşabilirsiniz.
        </p>
      </section>

      <section>
        <h2>İletişim</h2>
        <p>
          Soru, öneri ve geri bildirimleriniz için{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>{' '}
          adresinden bize yazabilirsiniz.
        </p>
      </section>
    </article>
  );
}

function AboutEN() {
  return (
    <article className="legal-content">
      <h1>About Us</h1>

      <section>
        <h2>What is E-Charging Stations?</h2>
        <p>
          esarjistasyonu.com.tr is a user-friendly and fast charging station guide that
          consolidates all electric vehicle charging stations across Turkey on a single map.
          Our goal is to help EV owners easily find the nearest charging point, filter stations,
          and get instant directions.
        </p>
      </section>

      <section>
        <h2>Our Mission</h2>
        <p>
          To contribute to the widespread adoption of electric vehicles in Turkey and to facilitate
          drivers&apos; access to charging infrastructure. We provide accurate, up-to-date, and
          accessible information to support a zero-emission transportation future.
        </p>
      </section>

      <section>
        <h2>What We Offer</h2>
        <ul>
          <li>
            <strong>Real-Time Map:</strong> View all charging stations in Turkey on an
            interactive map through OpenChargeMap API integration.
          </li>
          <li>
            <strong>Smart Filtering:</strong> Filter by DC (Fast Charging), AC (Standard Charging),
            free stations, and operators (ZES, Esarj, Trugo, etc.).
          </li>
          <li>
            <strong>Distance-Based Sorting:</strong> Automatically see the closest stations
            to your location, sorted by distance.
          </li>
          <li>
            <strong>Instant Directions:</strong> Start navigation to your selected station
            via Google Maps or Apple Maps with a single click.
          </li>
          <li>
            <strong>Blog:</strong> Up-to-date content about electric vehicles, charging
            technologies, and industry developments.
          </li>
          <li>
            <strong>Multi-Language Support:</strong> Turkish and English language support
            serving both local and international users.
          </li>
        </ul>
      </section>

      <section>
        <h2>Data Source</h2>
        <p>
          Charging station data is provided by the open-source <strong>OpenChargeMap</strong> platform,
          which hosts information on more than 200,000 charging points worldwide. The data is
          continuously updated through community contributions.
        </p>
      </section>

      <section>
        <h2>For Businesses (B2B)</h2>
        <p>
          If you operate a charging station or plan to open a new charging point, you can use
          our <strong>&quot;Add Your Business&quot;</strong> form to list your station on our platform.
          For partnership inquiries, contact us at{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions, suggestions, and feedback, you can reach us at{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>.
        </p>
      </section>
    </article>
  );
}
