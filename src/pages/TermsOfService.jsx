import { useTranslation } from 'react-i18next';

export default function TermsOfService() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <TermsTR /> : <TermsEN />}
    </div>
  );
}

function TermsTR() {
  return (
    <article className="legal-content">
      <h1>Kullanım Şartları</h1>
      <p className="legal-updated">Son güncelleme: 26 Mart 2026</p>

      <section>
        <h2>1. Hizmetin Tanımı</h2>
        <p>
          esarjistasyonu.com.tr (&quot;Site&quot;), Türkiye genelindeki elektrikli araç (EV) şarj
          istasyonlarını harita üzerinde gösteren, filtreleyen ve yol tarifi sunan ücretsiz bir web
          uygulamasıdır. Site, OpenChargeMap açık kaynak veritabanını kullanarak şarj istasyonu
          bilgilerini sunmaktadır.
        </p>
      </section>

      <section>
        <h2>2. Kullanım Koşulları</h2>
        <p>Siteyi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:</p>
        <ul>
          <li>Siteyi yalnızca yasal amaçlarla kullanacağınızı,</li>
          <li>Başkalarının site kullanımını engellemeyeceğinizi,</li>
          <li>Siteye zarar verecek veya işleyişini bozacak faaliyetlerde bulunmayacağınızı,</li>
          <li>Sitedeki verileri ticari amaçla toplamayacağınızı (scraping vb.),</li>
          <li>Site üzerinden paylaşacağınız bilgilerin doğru ve güncel olduğunu</li>
        </ul>
        <p>kabul ve taahhüt edersiniz.</p>
      </section>

      <section>
        <h2>3. Bilgilerin Doğruluğu</h2>
        <p>
          Sitede gösterilen şarj istasyonu bilgileri (konum, operatör, güç kapasitesi, ücretlendirme vb.)
          OpenChargeMap API&apos;sinden alınmaktadır. Bu verilerin doğruluğu, güncelliği ve eksiksizliği
          konusunda garanti veremeyiz. Şarj istasyonuna gitmeden önce bilgileri doğrulamanızı öneririz.
        </p>
        <p>
          Özellikle şarj istasyonunun aktif durumu, fiyatlandırma politikası ve soket uyumluluğu
          anlık olarak değişebilir. Site yalnızca bilgilendirme amaçlıdır ve herhangi bir hizmet
          taahhüdü içermez.
        </p>
      </section>

      <section>
        <h2>4. Fikri Mülkiyet Hakları</h2>
        <p>
          Sitenin tasarımı, yazılım kodu, logosu, metinleri ve özgün içerikleri esarjistasyonu.com.tr&apos;ye
          aittir ve telif hakları ile korunmaktadır. Harita verileri OpenStreetMap katkıda bulunanlarına,
          şarj istasyonu verileri ise OpenChargeMap topluluğuna aittir.
        </p>
        <p>
          Siteyi kişisel ve ticari olmayan amaçlarla kullanabilirsiniz. İçeriklerin izinsiz çoğaltılması,
          dağıtılması veya değiştirilmesi yasaktır.
        </p>
      </section>

      <section>
        <h2>5. Sorumluluk Sınırlaması</h2>
        <p>
          esarjistasyonu.com.tr, sitedeki bilgilerin kullanımından doğabilecek doğrudan veya dolaylı
          zararlardan sorumlu değildir. Bu kapsamda:
        </p>
        <ul>
          <li>Şarj istasyonlarının fiziksel durumu veya erişilebilirliği ile ilgili sorumluluk kabul etmiyoruz.</li>
          <li>Yanlış veya eksik veri nedeniyle oluşabilecek mağduriyetlerden sorumlu değiliz.</li>
          <li>Üçüncü taraf hizmetlerinin (OpenChargeMap, Google Maps, Apple Maps) kesintilerinden sorumlu değiliz.</li>
          <li>Yol tarifi hizmetlerinin doğruluğu ilgili harita sağlayıcılarının sorumluluğundadır.</li>
        </ul>
      </section>

      <section>
        <h2>6. Üçüncü Taraf Bağlantıları</h2>
        <p>
          Sitemiz, Google Maps, Apple Maps ve çeşitli şarj operatörlerinin web sitelerine bağlantılar
          içerebilir. Bu üçüncü taraf sitelerinin içerikleri, gizlilik politikaları ve uygulamaları
          üzerinde herhangi bir kontrolümüz yoktur. Bu siteleri ziyaret ettiğinizde kendi risk ve
          sorumluluğunuzdadır.
        </p>
      </section>

      <section>
        <h2>7. Reklam ve Sponsorlu İçerik</h2>
        <p>
          Sitemizde Google AdSense aracılığıyla reklamlar gösterilmektedir. Reklamlar üçüncü taraf
          reklamverenler tarafından sağlanır ve içerikleri sitemizin kontrolünde değildir. Reklam
          içeriklerinden kaynaklanan herhangi bir sorumluluk kabul edilmez.
        </p>
        <p>
          Reklamlar, kullanıcıların çerez tercihleri ve tarama geçmişine göre kişiselleştirilebilir.
          Reklam kişiselleştirme tercihlerinizi Google Reklam Ayarları sayfasından yönetebilirsiniz.
        </p>
      </section>

      <section>
        <h2>8. Hizmet Değişiklikleri</h2>
        <p>
          Sitemizin özelliklerini, tasarımını veya sunulan verilerin kapsamını önceden bildirimde
          bulunmaksızın değiştirme, askıya alma veya sonlandırma hakkını saklı tutarız. Sitedeki
          herhangi bir özelliğin sürekli olarak sunulacağına dair garanti verilmemektedir.
        </p>
      </section>

      <section>
        <h2>9. Uygulanacak Hukuk</h2>
        <p>
          Bu kullanım şartları Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda
          Türkiye Cumhuriyeti mahkemeleri yetkilidir.
        </p>
      </section>

      <section>
        <h2>10. İletişim</h2>
        <p>
          Kullanım şartlarımızla ilgili sorularınız için{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>{' '}
          adresinden bize ulaşabilirsiniz.
        </p>
      </section>

      <section>
        <h2>11. Değişiklikler</h2>
        <p>
          Bu kullanım şartları gerektiğinde güncellenebilir. Güncellemeler bu sayfada yayınlanır
          ve yayın tarihi itibarıyla yürürlüğe girer. Siteyi kullanmaya devam etmeniz, güncel
          kullanım şartlarını kabul ettiğiniz anlamına gelir.
        </p>
      </section>
    </article>
  );
}

function TermsEN() {
  return (
    <article className="legal-content">
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated: March 26, 2026</p>

      <section>
        <h2>1. Service Description</h2>
        <p>
          esarjistasyonu.com.tr (&quot;Site&quot;) is a free web application that displays, filters,
          and provides directions to electric vehicle (EV) charging stations across Turkey. The Site
          uses the OpenChargeMap open-source database to provide charging station information.
        </p>
      </section>

      <section>
        <h2>2. Terms of Use</h2>
        <p>By using the Site, you agree to the following conditions:</p>
        <ul>
          <li>You will use the Site only for lawful purposes.</li>
          <li>You will not interfere with others&apos; use of the Site.</li>
          <li>You will not engage in activities that damage or disrupt the Site.</li>
          <li>You will not collect Site data for commercial purposes (scraping, etc.).</li>
          <li>Any information you share through the Site will be accurate and up to date.</li>
        </ul>
      </section>

      <section>
        <h2>3. Accuracy of Information</h2>
        <p>
          Charging station information displayed on the Site (location, operator, power capacity,
          pricing, etc.) is sourced from the OpenChargeMap API. We cannot guarantee the accuracy,
          currency, or completeness of this data. We recommend verifying information before
          visiting a charging station.
        </p>
        <p>
          Station availability, pricing policies, and connector compatibility may change at any time.
          The Site is for informational purposes only and does not constitute a service commitment.
        </p>
      </section>

      <section>
        <h2>4. Intellectual Property</h2>
        <p>
          The design, software code, logo, text, and original content of the Site belong to
          esarjistasyonu.com.tr and are protected by copyright. Map data belongs to OpenStreetMap
          contributors, and charging station data belongs to the OpenChargeMap community.
        </p>
      </section>

      <section>
        <h2>5. Limitation of Liability</h2>
        <p>
          esarjistasyonu.com.tr is not responsible for any direct or indirect damages arising from
          the use of information on the Site. We do not accept responsibility for the physical
          condition or accessibility of charging stations, inaccurate data, third-party service
          interruptions, or the accuracy of navigation services.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Links</h2>
        <p>
          Our Site may contain links to Google Maps, Apple Maps, and various charging operator
          websites. We have no control over the content or privacy practices of these third-party sites.
        </p>
      </section>

      <section>
        <h2>7. Advertising</h2>
        <p>
          Advertisements are displayed on our Site through Google AdSense. Ad content is provided by
          third-party advertisers and is not under our control. Ads may be personalized based on
          cookie preferences and browsing history.
        </p>
      </section>

      <section>
        <h2>8. Governing Law</h2>
        <p>
          These terms of service are governed by the laws of the Republic of Turkey.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          For questions about our terms of service, please contact us at{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>.
        </p>
      </section>
    </article>
  );
}
