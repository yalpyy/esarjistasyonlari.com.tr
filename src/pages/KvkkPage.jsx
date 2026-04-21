import { useTranslation } from 'react-i18next';

export default function KvkkPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  return (
    <div className="legal-page">
      {isTr ? <KvkkTR /> : <KvkkEN />}
    </div>
  );
}

function KvkkTR() {
  return (
    <article className="legal-content">
      <h1>KVKK Aydınlatma Metni</h1>
      <p className="legal-updated">Son güncelleme: 21 Nisan 2026</p>

      <section>
        <h2>1. Veri Sorumlusu</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz
          veri sorumlusu sıfatıyla <strong>esarjistasyonu.com.tr</strong> (&quot;Site&quot;) tarafından
          aşağıda açıklanan kapsamda işlenebilecektir.
        </p>
        <p>
          İletişim: <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>
        </p>
      </section>

      <section>
        <h2>2. İşlenen Kişisel Veriler</h2>
        <p>Sitemiz aracılığıyla aşağıdaki kişisel verileriniz işlenebilir:</p>
        <ul>
          <li><strong>Kimlik Bilgileri:</strong> İletişim formu aracılığıyla paylaşırsanız ad-soyad.</li>
          <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon (isteğe bağlı).</li>
          <li><strong>Konum Bilgisi:</strong> Tarayıcı konum izni verdiyseniz GPS koordinatları (yalnızca cihazınızda işlenir; sunucuya gönderilmez).</li>
          <li><strong>Cihaz ve İnternet Bilgileri:</strong> IP adresi, tarayıcı türü, işletim sistemi, ziyaret edilen sayfalar (anonim analitik).</li>
          <li><strong>Çerez Verileri:</strong> Çerez politikamızda detaylı açıklanan çerezler.</li>
        </ul>
      </section>

      <section>
        <h2>3. Kişisel Verilerin İşlenme Amacı</h2>
        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenebilir:</p>
        <ul>
          <li>Elektrikli araç şarj istasyonu bilgilerini harita üzerinde sunmak,</li>
          <li>Konumunuza yakın istasyonları gösterebilmek,</li>
          <li>İletişim form taleplerinizi yanıtlamak,</li>
          <li>Site performansını ve kullanıcı deneyimini iyileştirmek,</li>
          <li>Güvenliği sağlamak ve kötüye kullanımı önlemek,</li>
          <li>Yasal yükümlülükleri yerine getirmek,</li>
          <li>Google AdSense üzerinden reklam sunmak ve ölçümlemek.</li>
        </ul>
      </section>

      <section>
        <h2>4. Kişisel Verilerin Aktarılması</h2>
        <p>
          Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmaz. Ancak aşağıdaki
          hizmet sağlayıcılara KVKK Madde 8 ve 9 uyarınca belirli kapsamda aktarım yapılabilir:
        </p>
        <ul>
          <li><strong>Google LLC:</strong> AdSense reklam sunumu ve analitik hizmetler için.</li>
          <li><strong>Vercel Inc.:</strong> Barındırma ve performans analitiği için.</li>
          <li><strong>OpenChargeMap:</strong> Şarj istasyonu veri sağlama (sadece dinamik sorgu, kişisel veri iletilmez).</li>
        </ul>
      </section>

      <section>
        <h2>5. İşleme Hukuki Sebebi</h2>
        <p>
          Kişisel verileriniz KVKK Madde 5 ve 6 uyarınca aşağıdaki hukuki sebeplerle işlenir:
        </p>
        <ul>
          <li>Açık rızanızın bulunması (konum izni, iletişim form gönderimi vb.),</li>
          <li>Bir sözleşmenin kurulması veya ifası için gerekli olması,</li>
          <li>Hukuki yükümlülüğün yerine getirilmesi için zorunlu olması,</li>
          <li>Veri sorumlusunun meşru menfaatleri için veri işlemenin zorunlu olması (güvenlik, dolandırıcılık önleme).</li>
        </ul>
      </section>

      <section>
        <h2>6. Kişisel Verilerin Saklanma Süresi</h2>
        <p>
          Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca saklanır. Yasal saklama süreleri
          ve olası uyuşmazlıklar için belirli süreler aşağıdaki gibidir:
        </p>
        <ul>
          <li>İletişim formu kayıtları: Azami 2 yıl</li>
          <li>Analitik veriler (anonim): 26 ay (Vercel)</li>
          <li>Reklam çerezleri: 13 ay (Google AdSense standardı)</li>
          <li>Oturum çerezleri: Tarayıcı kapandığında silinir</li>
        </ul>
      </section>

      <section>
        <h2>7. Veri Sahibinin Hakları (KVKK Madde 11)</h2>
        <p>KVKK kapsamında veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>Silinmesini veya yok edilmesini isteme,</li>
          <li>Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhe sonuç çıkmasına itiraz etme,</li>
          <li>Kanuna aykırı işleme sebebiyle zarara uğramışsanız tazminat talep etme.</li>
        </ul>
      </section>

      <section>
        <h2>8. Başvuru Yöntemi</h2>
        <p>
          KVKK Madde 13 uyarınca veri sahibi haklarınızı kullanmak için{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>{' '}
          adresine yazılı başvuru yapabilirsiniz. Başvurunuzda kimlik bilgilerinizi, talebinizi ve
          iletişim bilgilerinizi belirtmeniz gerekmektedir.
        </p>
        <p>
          Başvurularınız, KVKK gereği en geç <strong>30 gün</strong> içinde cevaplanır. Talebin niteliğine
          göre ücret alınabilir (KVKK Madde 13 uyarınca).
        </p>
      </section>

      <section>
        <h2>9. Değişiklikler</h2>
        <p>
          Bu aydınlatma metni, yasal mevzuat değişiklikleri veya iş süreçlerinde yapılacak güncellemeler
          doğrultusunda değiştirilebilir. Güncel metin her zaman bu sayfada yayınlanır.
        </p>
      </section>
    </article>
  );
}

function KvkkEN() {
  return (
    <article className="legal-content">
      <h1>KVKK (Data Protection) Disclosure</h1>
      <p className="legal-updated">Last updated: April 21, 2026</p>

      <section>
        <h2>1. Data Controller</h2>
        <p>
          Under the Turkish Personal Data Protection Law No. 6698 (&quot;KVKK&quot;), your personal data is
          processed by <strong>esarjistasyonu.com.tr</strong> (&quot;Site&quot;) as the data controller.
        </p>
        <p>
          Contact: <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>
        </p>
      </section>

      <section>
        <h2>2. Data Processed</h2>
        <ul>
          <li><strong>Identity:</strong> Name (if submitted via contact form).</li>
          <li><strong>Contact:</strong> Email, phone (optional).</li>
          <li><strong>Location:</strong> GPS coordinates (processed only on your device, not sent to servers).</li>
          <li><strong>Device/Internet:</strong> IP address, browser, OS, pages visited (anonymous analytics).</li>
          <li><strong>Cookie data:</strong> As detailed in our Cookie Policy.</li>
        </ul>
      </section>

      <section>
        <h2>3. Purposes of Processing</h2>
        <ul>
          <li>Display EV charging stations on the map,</li>
          <li>Show nearby stations based on location,</li>
          <li>Respond to contact form requests,</li>
          <li>Improve site performance and user experience,</li>
          <li>Ensure security and prevent misuse,</li>
          <li>Fulfill legal obligations,</li>
          <li>Serve and measure ads via Google AdSense.</li>
        </ul>
      </section>

      <section>
        <h2>4. Your Rights</h2>
        <p>
          Under KVKK Article 11, you have the right to access, correct, delete, and object to the
          processing of your data, among others. To exercise these rights, contact{' '}
          <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>. We respond within 30 days.
        </p>
      </section>
    </article>
  );
}
