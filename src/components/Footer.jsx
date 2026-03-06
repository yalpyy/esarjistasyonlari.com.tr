import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-links">
          <Link to="/hakkimizda">{t('aboutUs')}</Link>
          <span className="footer-sep">|</span>
          <Link to="/gizlilik-politikasi">{t('privacyPolicy')}</Link>
          <span className="footer-sep">|</span>
          <Link to="/blog">{t('blog')}</Link>
        </div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} esarjistasyonu.com.tr — {t('allRightsReserved')}
        </p>
      </div>
    </footer>
  );
}
