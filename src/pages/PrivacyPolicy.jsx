import { useTranslation } from 'react-i18next';

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <PrivacyTR /> : <PrivacyEN />}
    </div>
  );
}

function PrivacyTR() {
  return (
    <article className="legal-content">
      <h1>Gizlilik Politikası</h1>
      <p className="legal-updated">Son güncelleme: 06 Mart 2026</p>

      <section>
        <h2>1. Giriş</h2>
        <p>
          esarjistasyonlari.com.tr (&quot;Site&quot;) olarak kullanıcılarımızın gizliliğine
          saygı duyuyoruz. Bu Gizlilik Politikası, sitemizi ziyaret ettiğinizde hangi bilgilerin
          toplandığını, nasıl kullanıldığını ve nasıl korunduğunu açıklamaktadır.
        </p>
      </section>

      <section>
        <h2>2. Toplanan Bilgiler</h2>
        <h3>2.1 Otomatik Olarak Toplanan Bilgiler</h3>
        <ul>
          <li><strong>Konum Bilgisi:</strong> Harita hizmetimizi sunabilmek için tarayıcınız aracılığıyla konum izni istenir. Bu bilgi yalnızca yakındaki şarj istasyonlarını göstermek için kullanılır ve sunucularımızda saklanmaz.</li>
          <li><strong>Çerezler ve Benzer Teknolojiler:</strong> Google AdSense ve analiz araçları tarafından çerezler kullanılabilir. Bu çerezler reklam kişiselleştirme ve site trafiği analizi amacıyla kullanılır.</li>
          <li><strong>Log Verileri:</strong> IP adresi, tarayıcı türü, ziyaret edilen sayfalar ve ziyaret tarihleri otomatik olarak kaydedilebilir.</li>
        </ul>
        <h3>2.2 Kullanıcının Sağladığı Bilgiler</h3>
        <ul>
          <li><strong>İletişim Formu:</strong> Hata bildirimi veya B2B başvurusu yapılırken sağlanan ad, e-posta, telefon gibi bilgiler yalnızca e-posta yoluyla iletilir ve sitemizde saklanmaz.</li>
        </ul>
      </section>

      <section>
        <h2>3. Üçüncü Taraf Hizmetler</h2>
        <h3>3.1 Google AdSense</h3>
        <p>
          Sitemizde Google AdSense reklamları gösterilmektedir. Google, kullanıcılara ilgi alanlarına
          göre reklam sunmak için çerezler kullanabilir. Google&apos;ın çerez kullanımı hakkında
          detaylı bilgi için{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google Reklam Politikaları
          </a>{' '}
          sayfasını ziyaret edebilirsiniz.
        </p>
        <h3>3.2 OpenChargeMap API</h3>
        <p>
          Şarj istasyonu verileri OpenChargeMap açık kaynak API&apos;si üzerinden sağlanmaktadır.
          Bu hizmet kullanılırken kullanıcının konum bilgisi API&apos;ye iletilir.
        </p>
        <h3>3.3 Leaflet Harita</h3>
        <p>
          Harita görüntüleme için OpenStreetMap tabanlı Leaflet kütüphanesi kullanılmaktadır.
        </p>
      </section>

      <section>
        <h2>4. Çerez Politikası</h2>
        <p>
          Sitemiz aşağıdaki amaçlarla çerezler kullanmaktadır:
        </p>
        <ul>
          <li><strong>Zorunlu Çerezler:</strong> Sitenin temel işlevselliği için gereklidir (dil tercihi gibi).</li>
          <li><strong>Reklam Çerezleri:</strong> Google AdSense tarafından kişiselleştirilmiş reklam sunmak için kullanılır.</li>
          <li><strong>Analiz Çerezleri:</strong> Site trafiğini analiz etmek ve kullanıcı deneyimini iyileştirmek için kullanılır.</li>
        </ul>
        <p>
          Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durumda
          sitenin bazı özellikleri düzgün çalışmayabilir.
        </p>
      </section>

      <section>
        <h2>5. Veri Güvenliği</h2>
        <p>
          Sitemiz veritabanı kullanmamaktadır. İletişim formu verileri doğrudan e-posta
          yoluyla iletilir. Konum bilgileri tarayıcıda işlenir ve sunuculara kaydedilmez.
        </p>
      </section>

      <section>
        <h2>6. Kullanıcı Hakları</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki haklara sahipsiniz:
        </p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmiş ise buna ilişkin bilgi talep etme</li>
          <li>İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yanlış veya eksik işlenmişse düzeltilmesini isteme</li>
          <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
        </ul>
      </section>

      <section>
        <h2>7. İletişim</h2>
        <p>
          Gizlilik politikamızla ilgili sorularınız için{' '}
          <a href="mailto:business@esarjistasyonlari.com.tr">business@esarjistasyonlari.com.tr</a>{' '}
          adresinden bize ulaşabilirsiniz.
        </p>
      </section>

      <section>
        <h2>8. Değişiklikler</h2>
        <p>
          Bu gizlilik politikası gerektiğinde güncellenebilir. Değişiklikler bu sayfada
          yayınlanacaktır. Sitemizi düzenli olarak ziyaret ederek güncellemelerden haberdar
          olmanızı öneririz.
        </p>
      </section>
    </article>
  );
}

function PrivacyEN() {
  return (
    <article className="legal-content">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated: March 06, 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          esarjistasyonlari.com.tr (&quot;Site&quot;) respects the privacy of our users. This Privacy
          Policy explains what information is collected when you visit our site, how it is used,
          and how it is protected.
        </p>
      </section>

      <section>
        <h2>2. Information Collected</h2>
        <h3>2.1 Automatically Collected Information</h3>
        <ul>
          <li><strong>Location Data:</strong> We request location permission through your browser to provide our map service. This data is used solely to display nearby charging stations and is not stored on our servers.</li>
          <li><strong>Cookies and Similar Technologies:</strong> Cookies may be used by Google AdSense and analytics tools for ad personalization and site traffic analysis.</li>
          <li><strong>Log Data:</strong> IP address, browser type, pages visited, and visit dates may be automatically recorded.</li>
        </ul>
        <h3>2.2 User-Provided Information</h3>
        <ul>
          <li><strong>Contact Form:</strong> Information such as name, email, and phone number provided during error reports or B2B applications is transmitted only via email and is not stored on our site.</li>
        </ul>
      </section>

      <section>
        <h2>3. Third-Party Services</h2>
        <h3>3.1 Google AdSense</h3>
        <p>
          Our site displays Google AdSense advertisements. Google may use cookies to serve ads
          based on user interests. For detailed information about Google&apos;s cookie usage, visit the{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google Advertising Policies
          </a>{' '}
          page.
        </p>
        <h3>3.2 OpenChargeMap API</h3>
        <p>
          Charging station data is provided through the OpenChargeMap open-source API.
          The user&apos;s location information is transmitted to the API when using this service.
        </p>
        <h3>3.3 Leaflet Map</h3>
        <p>
          The Leaflet library based on OpenStreetMap is used for map display.
        </p>
      </section>

      <section>
        <h2>4. Cookie Policy</h2>
        <p>Our site uses cookies for the following purposes:</p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for basic site functionality (such as language preference).</li>
          <li><strong>Advertising Cookies:</strong> Used by Google AdSense to serve personalized ads.</li>
          <li><strong>Analytics Cookies:</strong> Used to analyze site traffic and improve user experience.</li>
        </ul>
        <p>
          You can disable cookies through your browser settings; however, some features of the
          site may not function properly.
        </p>
      </section>

      <section>
        <h2>5. Data Security</h2>
        <p>
          Our site does not use a database. Contact form data is transmitted directly via email.
          Location data is processed in the browser and is not stored on servers.
        </p>
      </section>

      <section>
        <h2>6. User Rights</h2>
        <p>You have the following rights regarding your personal data:</p>
        <ul>
          <li>Right to know whether your personal data is being processed</li>
          <li>Right to request information about processed data</li>
          <li>Right to know the purpose of processing and whether data is used accordingly</li>
          <li>Right to request correction of incomplete or inaccurate data</li>
          <li>Right to request deletion or destruction of your personal data</li>
        </ul>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          For questions about our privacy policy, please contact us at{' '}
          <a href="mailto:business@esarjistasyonlari.com.tr">business@esarjistasyonlari.com.tr</a>.
        </p>
      </section>

      <section>
        <h2>8. Changes</h2>
        <p>
          This privacy policy may be updated as needed. Changes will be published on this page.
          We recommend visiting our site regularly to stay informed about updates.
        </p>
      </section>
    </article>
  );
}
