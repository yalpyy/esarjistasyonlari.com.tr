import { useTranslation } from 'react-i18next';

export default function NativeAd() {
  const { t } = useTranslation();

  return (
    <div className="native-ad">
      <span className="native-ad-label">{t('sponsored')}</span>
      <div className="native-ad-content">
        <div className="native-ad-placeholder">
          <span>{t('adPlaceholder')}</span>
        </div>
      </div>
    </div>
  );
}
