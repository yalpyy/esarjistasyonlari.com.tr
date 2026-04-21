import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-columns">
          <div className="footer-column">
            <h4>{t('footerResources') || 'Kaynaklar'}</h4>
            <Link to="/ev-sarj-rehberi">{t('evGuide')}</Link>
            <Link to="/sozluk">{t('evGlossary') || 'EV Sözlüğü'}</Link>
            <Link to="/menzil-hesaplayici">{t('rangeCalculator') || 'Menzil Hesaplayıcı'}</Link>
            <Link to="/sehirler">{t('cityDirectory') || 'Şehirler'}</Link>
            <Link to="/blog">{t('blog')}</Link>
          </div>
          <div className="footer-column">
            <h4>{t('footerCompany') || 'Kurumsal'}</h4>
            <Link to="/hakkimizda">{t('aboutUs')}</Link>
            <Link to="/gizlilik-politikasi">{t('privacyPolicy')}</Link>
            <Link to="/kullanim-sartlari">{t('termsOfService')}</Link>
            <Link to="/cerez-politikasi">{t('cookiePolicy')}</Link>
            <Link to="/kvkk">{t('kvkk') || 'KVKK Aydınlatma'}</Link>
          </div>
          <div className="footer-column">
            <h4>{t('footerContact') || 'İletişim'}</h4>
            <a href="mailto:softcorptr@gmail.com">softcorptr@gmail.com</a>
            <p className="footer-note">
              {t('footerNote') || 'Türkiye\'nin elektrikli araç şarj rehberi. Veriler OpenChargeMap kaynağından sağlanmaktadır.'}
            </p>
          </div>
        </div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} esarjistasyonu.com.tr — {t('allRightsReserved')}
        </p>
      </div>
    </footer>
  );
}
