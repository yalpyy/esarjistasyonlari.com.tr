import { useTranslation } from 'react-i18next';

export default function CookiePolicy() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <CookieTR /> : <CookieEN />}
    </div>
  );
}

function CookieTR() {
  return (
    <article className="legal-content">
      <h1>Çerez Politikası</h1>
      <p className="legal-updated">Son güncelleme: 26 Mart 2026</p>

      <section>
        <h2>1. Çerez Nedir?</h2>
        <p>
          Çerezler (cookies), web sitelerinin tarayıcınıza kaydettiği küçük metin dosyalarıdır.
          Bu dosyalar sitenin düzgün çalışmasını sağlamak, kullanıcı deneyimini iyileştirmek ve
          site trafiğini analiz etmek amacıyla kullanılır. Çerezler kişisel verilerinize erişim
          sağlamaz ve bilgisayarınıza zarar vermez.
        </p>
      </section>

      <section>
        <h2>2. Kullandığımız Çerez Türleri</h2>

        <h3>2.1 Zorunlu Çerezler (Strictly Necessary)</h3>
        <p>
          Sitenin temel işlevlerinin çalışması için gerekli olan çerezlerdir. Bu çerezler olmadan
          site düzgün çalışamaz. Devre dışı bırakılamazlar.
        </p>
        <ul>
          <li><strong>Dil Tercihi:</strong> Seçtiğiniz dili (Türkçe/İngilizce) hatırlamak için kullanılır.</li>
          <li><strong>Oturum Yönetimi:</strong> Sayfa geçişlerinde kullanıcı tercihlerini korumak için kullanılır.</li>
        </ul>

        <h3>2.2 Reklam Çerezleri (Advertising Cookies)</h3>
        <p>
          Google AdSense tarafından kullanılır. Bu çerezler, ilgi alanlarınıza göre kişiselleştirilmiş
          reklamlar sunmak amacıyla kullanılır. Google&apos;ın çerez kullanımı hakkında detaylı bilgi
          için{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google Reklam Politikaları
          </a>{' '}
          sayfasını ziyaret edebilirsiniz.
        </p>
        <ul>
          <li><strong>Google AdSense (__gads, __gpi):</strong> Reklam hedefleme ve performans ölçümü.</li>
          <li><strong>DoubleClick (IDE, test_cookie):</strong> Reklam sunumu ve dönüşüm takibi.</li>
        </ul>

        <h3>2.3 Analiz Çerezleri (Analytics Cookies)</h3>
        <p>
          Site kullanım istatistiklerini toplamak ve kullanıcı deneyimini iyileştirmek için kullanılır.
          Bu çerezler anonim veri toplar ve kişisel kimliğinizi belirlemez.
        </p>
        <ul>
          <li><strong>Vercel Analytics:</strong> Sayfa görüntülenmeleri, ziyaretçi sayısı ve performans metrikleri.</li>
        </ul>

        <h3>2.4 İşlevsel Çerezler (Functional Cookies)</h3>
        <p>
          Sitenin gelişmiş işlevlerini ve kişiselleştirme özelliklerini sağlamak için kullanılır.
        </p>
        <ul>
          <li><strong>Harita Tercihleri:</strong> Son görüntülenen harita konumu ve zoom seviyesi.</li>
          <li><strong>Filtre Tercihleri:</strong> Seçilen filtre ayarlarını hatırlamak için kullanılır.</li>
        </ul>
      </section>

      <section>
        <h2>3. Üçüncü Taraf Çerezleri</h2>
        <p>Sitemizde aşağıdaki üçüncü taraf hizmetleri çerez kullanmaktadır:</p>
        <table className="cookie-table">
          <thead>
            <tr>
              <th>Hizmet</th>
              <th>Amaç</th>
              <th>Süre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Google AdSense</td>
              <td>Kişiselleştirilmiş reklam sunumu</td>
              <td>13 ay</td>
            </tr>
            <tr>
              <td>Vercel Analytics</td>
              <td>Site kullanım analizi</td>
              <td>Oturum</td>
            </tr>
            <tr>
              <td>OpenStreetMap</td>
              <td>Harita görüntüleme</td>
              <td>Oturum</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Çerez Yönetimi</h2>
        <p>
          Tarayıcı ayarlarınızı değiştirerek çerezleri kontrol edebilir veya silebilirsiniz.
          Çerezleri devre dışı bırakmak sitenin bazı özelliklerinin çalışmamasına neden olabilir.
        </p>
        <p>Popüler tarayıcılarda çerez ayarları:</p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/tr/kb/cerezleri-silme" target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
              Apple Safari
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/tr-tr/microsoft-edge" target="_blank" rel="noopener noreferrer">
              Microsoft Edge
            </a>
          </li>
        </ul>
        <p>
          Google reklam kişiselleştirmesini yönetmek için{' '}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google Reklam Ayarları
          </a>{' '}
          sayfasını ziyaret edebilirsiniz.
        </p>
      </section>

      <section>
        <h2>5. Yasal Dayanak</h2>
        <p>
          Bu çerez politikası, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve
          5809 sayılı Elektronik Haberleşme Kanunu kapsamında hazırlanmıştır.
        </p>
      </section>

      <section>
        <h2>6. İletişim</h2>
        <p>
          Çerez politikamızla ilgili sorularınız için{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>{' '}
          adresinden bize ulaşabilirsiniz.
        </p>
      </section>

      <section>
        <h2>7. Değişiklikler</h2>
        <p>
          Bu çerez politikası gerektiğinde güncellenebilir. Güncellemeler bu sayfada yayınlanır.
        </p>
      </section>
    </article>
  );
}

function CookieEN() {
  return (
    <article className="legal-content">
      <h1>Cookie Policy</h1>
      <p className="legal-updated">Last updated: March 26, 2026</p>

      <section>
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that websites store in your browser. They are used to ensure
          the proper functioning of the site, improve user experience, and analyze site traffic.
          Cookies do not access your personal data and do not harm your computer.
        </p>
      </section>

      <section>
        <h2>2. Types of Cookies We Use</h2>

        <h3>2.1 Strictly Necessary Cookies</h3>
        <p>
          These cookies are essential for the basic functions of the site. Without them, the site
          cannot function properly and they cannot be disabled.
        </p>
        <ul>
          <li><strong>Language Preference:</strong> Used to remember your selected language.</li>
          <li><strong>Session Management:</strong> Used to maintain user preferences across page transitions.</li>
        </ul>

        <h3>2.2 Advertising Cookies</h3>
        <p>
          Used by Google AdSense to serve personalized advertisements based on your interests.
          For more information about Google&apos;s cookie usage, visit the{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google Advertising Policies
          </a>{' '}
          page.
        </p>

        <h3>2.3 Analytics Cookies</h3>
        <p>
          Used to collect site usage statistics and improve user experience. These cookies collect
          anonymous data and do not identify you personally.
        </p>

        <h3>2.4 Functional Cookies</h3>
        <p>
          Used to provide enhanced functionality and personalization features, such as remembering
          your map preferences and filter settings.
        </p>
      </section>

      <section>
        <h2>3. Managing Cookies</h2>
        <p>
          You can control or delete cookies by changing your browser settings. Disabling cookies
          may cause some features of the site to not work properly.
        </p>
        <p>
          To manage Google ad personalization, visit{' '}
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">
            Google Ad Settings
          </a>.
        </p>
      </section>

      <section>
        <h2>4. Contact</h2>
        <p>
          For questions about our cookie policy, please contact us at{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>.
        </p>
      </section>
    </article>
  );
}
