import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr');
  };

  return (
    <header className="app-header">
      <Link to="/" className="header-brand">
        <span className="header-icon">⚡</span>
        <span className="header-title">{t('appTitle')}</span>
      </Link>
      <nav className="header-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          {t('home')}
        </Link>
        <Link to="/blog" className={location.pathname === '/blog' ? 'active' : ''}>
          {t('blog')}
        </Link>
        <button className="lang-toggle" onClick={toggleLang}>
          {i18n.language === 'tr' ? 'EN' : 'TR'}
        </button>
      </nav>
    </header>
  );
}
