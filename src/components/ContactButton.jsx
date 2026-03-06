import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@esarjistasyonlari.com.tr';

export default function ContactButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [formType, setFormType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    stationName: '',
    errorDescription: '',
    businessName: '',
    businessAddress: '',
    chargerCount: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let subject, body;

    if (formType === 'error') {
      subject = encodeURIComponent(`Hata Bildirimi: ${formData.stationName}`);
      body = encodeURIComponent(
        `Ad Soyad: ${formData.name}\nE-posta: ${formData.email}\nTelefon: ${formData.phone}\nİstasyon: ${formData.stationName}\nHata Açıklaması: ${formData.errorDescription}\nEk Mesaj: ${formData.message}`
      );
    } else {
      subject = encodeURIComponent(`B2B İşletme Başvurusu: ${formData.businessName}`);
      body = encodeURIComponent(
        `Ad Soyad: ${formData.name}\nE-posta: ${formData.email}\nTelefon: ${formData.phone}\nİşletme Adı: ${formData.businessName}\nİşletme Adresi: ${formData.businessAddress}\nŞarj Ünitesi Sayısı: ${formData.chargerCount}\nEk Mesaj: ${formData.message}`
      );
    }

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setIsOpen(false);
    setFormType(null);
    setFormData({
      name: '', email: '', phone: '', message: '', stationName: '',
      errorDescription: '', businessName: '', businessAddress: '', chargerCount: '',
    });
  };

  return (
    <>
      <button className="contact-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="contact-panel">
          {!formType ? (
            <div className="contact-options">
              <h3>{t('contactUs')}</h3>
              <button className="contact-option-btn" onClick={() => setFormType('error')}>
                🔧 {t('reportError')}
              </button>
              <button className="contact-option-btn" onClick={() => setFormType('b2b')}>
                🏢 {t('addBusiness')}
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3>{formType === 'error' ? t('reportError') : t('addBusiness')}</h3>

              <input name="name" placeholder={t('name')} value={formData.name} onChange={handleChange} required />
              <input name="email" type="email" placeholder={t('email')} value={formData.email} onChange={handleChange} required />
              <input name="phone" type="tel" placeholder={t('phone')} value={formData.phone} onChange={handleChange} />

              {formType === 'error' && (
                <>
                  <input name="stationName" placeholder={t('stationName')} value={formData.stationName} onChange={handleChange} required />
                  <textarea name="errorDescription" placeholder={t('errorDescription')} value={formData.errorDescription} onChange={handleChange} required />
                </>
              )}

              {formType === 'b2b' && (
                <>
                  <input name="businessName" placeholder={t('businessName')} value={formData.businessName} onChange={handleChange} required />
                  <input name="businessAddress" placeholder={t('businessAddress')} value={formData.businessAddress} onChange={handleChange} required />
                  <input name="chargerCount" type="number" placeholder={t('chargerCount')} value={formData.chargerCount} onChange={handleChange} />
                </>
              )}

              <textarea name="message" placeholder={t('message')} value={formData.message} onChange={handleChange} />

              <div className="contact-form-actions">
                <button type="button" className="btn-secondary" onClick={() => setFormType(null)}>
                  ← {t('contactUs')}
                </button>
                <button type="submit" className="btn-primary">{t('send')}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
