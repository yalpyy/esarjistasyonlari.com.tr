import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const CARDS_TR = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'AC ve DC Farkı',
    text: 'AC yavaş/normal şarj, DC ise hızlı şarjdır. DC 20-60 dakikada %80\'e ulaşır.',
    href: '/ev-sarj-rehberi#sarj-turleri',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Menzil Hesapla',
    text: 'Aracınızın gerçek menzilini sıcaklık ve hıza göre hesaplayın.',
    href: '/menzil-hesaplayici',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 19h16M6 19V7l6-4 6 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Şehir Rehberi',
    text: '81 il için şarj altyapısı bilgisi ve istasyon yoğunluğu.',
    href: '/sehirler',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'EV Sözlüğü',
    text: 'CCS, Type 2, kWh... Tüm terimler açıklamalı sözlükte.',
    href: '/sozluk',
  },
];

const CARDS_EN = [
  {
    icon: CARDS_TR[0].icon,
    title: 'AC vs DC',
    text: 'AC is slow/normal charging, DC is fast charging — reaches 80% in 20-60 min.',
    href: '/ev-sarj-rehberi#sarj-turleri',
  },
  {
    icon: CARDS_TR[1].icon,
    title: 'Calculate Range',
    text: 'Calculate your real-world range based on temperature and speed.',
    href: '/menzil-hesaplayici',
  },
  {
    icon: CARDS_TR[2].icon,
    title: 'City Guide',
    text: 'Charging infrastructure info and station density for 81 provinces.',
    href: '/sehirler',
  },
  {
    icon: CARDS_TR[3].icon,
    title: 'EV Glossary',
    text: 'CCS, Type 2, kWh... All terms explained in one place.',
    href: '/sozluk',
  },
];

export default function QuickGuideCards() {
  const { i18n } = useTranslation();
  const isTr = i18n.language === 'tr';
  const cards = isTr ? CARDS_TR : CARDS_EN;

  return (
    <div className="quick-guide-cards">
      <h3 className="quick-guide-title">
        {isTr ? 'Hızlı Rehber' : 'Quick Guide'}
      </h3>
      <div className="quick-guide-grid">
        {cards.map((card) => (
          <Link key={card.title} to={card.href} className="quick-guide-card">
            <span className="quick-guide-icon">{card.icon}</span>
            <span className="quick-guide-content">
              <span className="quick-guide-heading">{card.title}</span>
              <span className="quick-guide-text">{card.text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
