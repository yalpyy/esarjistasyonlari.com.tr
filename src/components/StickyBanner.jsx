import { useTranslation } from 'react-i18next';

export default function StickyBanner() {
  const { t } = useTranslation();

  return (
    <div className="sticky-banner">
      <div className="sticky-banner-content">
        <span>{t('adPlaceholder')} - 320x50</span>
      </div>
    </div>
  );
}
