import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2>{t('pageNotFound')}</h2>
        <p>{t('pageNotFoundDesc')}</p>
        <div className="not-found-links">
          <Link to="/" className="not-found-btn">{t('home')}</Link>
          <Link to="/blog" className="not-found-btn not-found-btn--secondary">{t('blog')}</Link>
          <Link to="/ev-sarj-rehberi" className="not-found-btn not-found-btn--secondary">{t('evGuide')}</Link>
        </div>
      </div>
    </div>
  );
}
