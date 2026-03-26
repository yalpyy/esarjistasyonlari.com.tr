import { useState } from 'react';

const FAQ_TR = [
  {
    q: 'Elektrikli aracımı evde şarj edebilir miyim?',
    a: 'Evet, çoğu elektrikli araç evdeki standart 220V prizden şarj edilebilir. Ancak özel bir duvar tipi şarj ünitesi (wallbox) kullanmak hem daha hızlı hem de daha güvenlidir. Ev şarjı genellikle gece yapılır ve en ekonomik şarj yöntemidir.',
  },
  {
    q: 'DC hızlı şarj bataryaya zarar verir mi?',
    a: 'Ara sıra DC hızlı şarj kullanmak bataryaya ciddi bir zarar vermez. Ancak sürekli olarak yalnızca DC hızlı şarj kullanmak, zamanla batarya ömrünü kısaltabilir. İdeal olan, günlük kullanımda AC şarj, uzun yolculuklarda DC hızlı şarj tercih etmektir.',
  },
  {
    q: 'Şarj istasyonunu nasıl kullanırım?',
    a: 'Şarj istasyonuna geldiğinizde: 1) Operatörün mobil uygulamasını veya RFID kartınızı kullanarak oturumu başlatın, 2) Şarj kablosunu aracınıza takın, 3) Şarj başlayacaktır. Bitirdiğinizde uygulamadan oturumu sonlandırın ve kabloyu çıkarın.',
  },
  {
    q: 'Türkiye\'de kaç şarj istasyonu var?',
    a: 'Türkiye\'de hızla artan bir şarj ağı bulunmaktadır. Güncel sayıyı görmek için haritamızı ziyaret edebilirsiniz. OpenChargeMap veritabanı üzerinden sunulan veriler düzenli olarak güncellenmektedir.',
  },
  {
    q: 'Şarj maliyeti ne kadar?',
    a: 'Şarj maliyeti operatöre, şarj türüne ve abonelik planınıza göre değişir. Genel olarak AC şarj kWh başına 4-8 TL, DC hızlı şarj ise kWh başına 8-15 TL arasında değişmektedir. Bazı lokasyonlarda ücretsiz şarj imkanı da bulunmaktadır.',
  },
  {
    q: 'Yağmurda şarj yapmak güvenli mi?',
    a: 'Evet, elektrikli araç şarj sistemleri su geçirmez ve yalıtımlı olarak tasarlanmıştır. Yağmurda, karda veya diğer hava koşullarında güvenle şarj yapabilirsiniz. Şarj soketi ve kablo bağlantıları IP67 standartlarında korunmaktadır.',
  },
  {
    q: 'Bu site nasıl çalışıyor?',
    a: 'esarjistasyonu.com.tr, OpenChargeMap açık kaynak veritabanından şarj istasyonu verilerini alarak harita üzerinde gösterir. Konum izninizi kullanarak yakınızda istasyonları bulur, DC/AC türü, operatör ve ücret filtresi ile sonuçları daraltmanıza olanak sağlar.',
  },
  {
    q: 'İstasyon bilgileri ne kadar güncel?',
    a: 'Verilerimiz OpenChargeMap topluluğu tarafından güncellenen veritabanından gelmektedir. Topluluk katkılarıyla sürekli güncellenen bu veri tabanı dünya genelinde 200.000\'den fazla şarj noktası içermektedir. Hatalı bilgi görürseniz iletişim formu ile bildirebilirsiniz.',
  },
];

const FAQ_EN = [
  {
    q: 'Can I charge my electric car at home?',
    a: 'Yes, most electric vehicles can be charged from a standard 220V outlet. However, using a dedicated wall charger (wallbox) is both faster and safer. Home charging is typically done overnight and is the most economical method.',
  },
  {
    q: 'Does DC fast charging damage the battery?',
    a: 'Occasional DC fast charging does not cause significant battery damage. However, exclusively using DC fast charging may reduce battery life over time. Ideally, use AC charging for daily use and DC fast charging for long trips.',
  },
  {
    q: 'How do I use a charging station?',
    a: 'When you arrive at a station: 1) Start a session using the operator\'s mobile app or RFID card, 2) Plug the cable into your vehicle, 3) Charging will begin. When finished, end the session via the app and unplug.',
  },
  {
    q: 'How many charging stations are there in Turkey?',
    a: 'Turkey has a rapidly growing charging network. Visit our map to see the current numbers. Data is regularly updated through the OpenChargeMap database.',
  },
  {
    q: 'How much does charging cost?',
    a: 'Charging costs vary by operator, charging type, and subscription plan. Generally, AC charging costs 4-8 TL per kWh and DC fast charging costs 8-15 TL per kWh. Some locations offer free charging.',
  },
  {
    q: 'Is it safe to charge in the rain?',
    a: 'Yes, EV charging systems are designed to be waterproof and insulated. You can safely charge in rain, snow, or other weather conditions. Connectors and cables are protected to IP67 standards.',
  },
  {
    q: 'How does this site work?',
    a: 'esarjistasyonu.com.tr retrieves charging station data from the OpenChargeMap open-source database and displays it on a map. It uses your location to find nearby stations and lets you filter by DC/AC type, operator, and pricing.',
  },
  {
    q: 'How up-to-date is the station information?',
    a: 'Our data comes from the OpenChargeMap community-maintained database, which contains over 200,000 charging points worldwide. If you find incorrect information, you can report it through our contact form.',
  },
];

export default function FaqSection({ language = 'tr' }) {
  const items = language === 'tr' ? FAQ_TR : FAQ_EN;
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="faq-list" itemScope itemType="https://schema.org/FAQPage">
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`faq-item ${openIndex === idx ? 'faq-item--open' : ''}`}
          itemScope
          itemProp="mainEntity"
          itemType="https://schema.org/Question"
        >
          <button
            className="faq-question"
            onClick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
            itemProp="name"
          >
            <span>{item.q}</span>
            <svg
              className="faq-chevron"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            className="faq-answer"
            itemScope
            itemProp="acceptedAnswer"
            itemType="https://schema.org/Answer"
          >
            <p itemProp="text">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
