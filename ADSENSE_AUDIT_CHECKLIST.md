# AdSense Onay Denetim Raporu - esarjistasyonu.com.tr

> **Tarih**: 26 Mart 2026
> **Durum**: Müdahale Gerekiyor (Needs Attention)
> **Genel Puan**: 7.5/10 — Kritik eksiklikler giderilirse 9/10

---

## Yonetici Ozeti

Site teknik olarak iyi insa edilmis, mobil UX mukemmel ve reklam implementasyonu dogru. Ancak AdSense onayini engelleyen **kritik eksiklikler** var:

1. **Kullanim Sartlari sayfasi yok** — AdSense icin zorunlu
2. **Cerez Politikasi sayfasi yok** — KVKK/GDPR uyumlulugu icin gerekli
3. **robots.txt yok** — Arama motorlari icin kritik
4. **sitemap.xml yok** — Indeksleme icin gerekli
5. **Yapisal veri (JSON-LD) yok** — Zengin sonuclar icin gerekli
6. **Ince icerik riski** — Ana sayfa sadece harita, metin icerik az
7. **404 sayfasi yok** — Kullanici deneyimi ve SEO icin gerekli
8. **Canonical/OG meta eksik** — Sosyal paylasim ve SEO icin gerekli

---

## AdSense "Mudahale Gerekiyor" Muhtemel Nedenleri

| # | Neden | Oncelik | Durum |
|---|-------|---------|-------|
| 1 | Yetersiz orijinal metin icerik (thin content) | KRITIK | Eksik |
| 2 | Kullanim Sartlari sayfasi yok | KRITIK | Eksik |
| 3 | Cerez Politikasi sayfasi yok | YUKSEK | Eksik |
| 4 | robots.txt / sitemap.xml yok | YUKSEK | Eksik |
| 5 | SSR yok - icerik client-side render | ORTA | Mimari |
| 6 | Sayfa sayisi az (sadece 4 sayfa) | ORTA | Eksik |
| 7 | Yapisal veri yok | ORTA | Eksik |
| 8 | Blog icerigi harici (Medium RSS) | DUSUK | Tasarim |

---

## Yuksek Oncelikli Duzeltmeler

### 1. Kullanim Sartlari Sayfasi Olustur
- [ ] `/src/pages/TermsOfService.jsx` olustur
- [ ] Route ekle: `/kullanim-sartlari`
- [ ] Footer'a link ekle
- **Dosya**: `src/pages/TermsOfService.jsx`, `src/App.jsx`

### 2. Cerez Politikasi Sayfasi Olustur
- [ ] `/src/pages/CookiePolicy.jsx` olustur
- [ ] Route ekle: `/cerez-politikasi`
- [ ] Footer'a link ekle
- **Dosya**: `src/pages/CookiePolicy.jsx`, `src/App.jsx`

### 3. robots.txt Olustur
- [ ] `/public/robots.txt` olustur
- [ ] Sitemap URL'si ekle
- **Dosya**: `public/robots.txt`

### 4. sitemap.xml Olustur
- [ ] `/public/sitemap.xml` olustur (tum sayfalar dahil)
- **Dosya**: `public/sitemap.xml`

### 5. Ana Sayfaya SEO Icerik Blogu Ekle
- [ ] Homepage'e EV sarj rehberi metin blogu ekle
- [ ] FAQ bolumu ekle
- [ ] En az 500 kelime orijinal Turkce icerik
- **Dosya**: `src/pages/HomePage.jsx`, `src/components/HomeSeoContent.jsx`

### 6. 404 Sayfasi Olustur
- [ ] `/src/pages/NotFound.jsx` olustur
- [ ] Route ekle: `path="*"`
- **Dosya**: `src/pages/NotFound.jsx`, `src/App.jsx`

### 7. JSON-LD Yapisal Veri Ekle
- [ ] WebApplication schema
- [ ] Organization schema
- [ ] BreadcrumbList schema
- **Dosya**: `index.html`

### 8. Meta Tag Eksikliklerini Gider
- [ ] og:image ekle
- [ ] twitter:card ekle
- [ ] canonical link ekle
- [ ] author meta ekle
- [ ] manifest.json olustur ve baglantila
- **Dosya**: `index.html`, `public/manifest.json`

---

## Orta Oncelikli Duzeltmeler

### 9. EV Sarj Rehberi Icerik Sayfasi
- [ ] `/src/pages/EvChargingGuide.jsx` olustur
- [ ] Route ekle: `/ev-sarj-rehberi`
- [ ] 1000+ kelime orijinal icerik
- **Dosya**: `src/pages/EvChargingGuide.jsx`

### 10. Footer Guclendir
- [ ] Tum yasal sayfa linkleri ekle
- [ ] Sirket bilgisi ekle
- [ ] Dahili link modulu ekle
- **Dosya**: `src/components/Footer.jsx`

### 11. Header Navigasyonu Genislet
- [ ] Hakkimizda ve Rehber linklerini ekle
- [ ] Mobil menu gelistir
- **Dosya**: `src/components/Header.jsx`

### 12. Yeniden Kullanilabilir FAQ Bileseni
- [ ] `/src/components/FaqSection.jsx` olustur
- [ ] Homepage ve rehber sayfalarinda kullan
- **Dosya**: `src/components/FaqSection.jsx`

---

## Dusuk Oncelikli Iyilestirmeler

### 13. Breadcrumb Navigasyonu
- [ ] Alt sayfalara breadcrumb ekle
- **Dosya**: `src/components/Breadcrumb.jsx`

### 14. Sayfa Bazli Meta Taglar
- [ ] react-helmet-async kur
- [ ] Her sayfaya ozel title/description
- **Dosya**: Tum sayfa dosyalari

### 15. Sosyal Medya On Izleme Gorseli
- [ ] 1200x630 OG image olustur
- **Dosya**: `public/assets/og-image.png`

### 16. Kullanilmayan Bilesenler Temizle
- [ ] InterstitialAd.jsx (placeholder)
- [ ] NativeAd.jsx (placeholder)
- **Dosya**: `src/components/`

---

## Etkilenen URL/Sablonlar

| URL | Durum | Sorun |
|-----|-------|-------|
| `/` | Mevcut | Ince icerik, SSR yok |
| `/blog` | Mevcut | Harici icerik, thin risk |
| `/hakkimizda` | Mevcut | Iyi (1200+ kelime) |
| `/gizlilik-politikasi` | Mevcut | Iyi (2000+ kelime) |
| `/kullanim-sartlari` | YOK | Olusturulmali |
| `/cerez-politikasi` | YOK | Olusturulmali |
| `/ev-sarj-rehberi` | YOK | Olusturulmali |
| `/iletisim` | YOK | Modal var, sayfa yok |
| `/*` (404) | YOK | Olusturulmali |

---

## Degistirilmesi Gereken Dosyalar

| Dosya | Islem |
|-------|-------|
| `index.html` | Meta taglar, JSON-LD, manifest link |
| `src/App.jsx` | Yeni route'lar ekle |
| `src/pages/TermsOfService.jsx` | YENI - Kullanim sartlari |
| `src/pages/CookiePolicy.jsx` | YENI - Cerez politikasi |
| `src/pages/EvChargingGuide.jsx` | YENI - EV sarj rehberi |
| `src/pages/NotFound.jsx` | YENI - 404 sayfasi |
| `src/components/Footer.jsx` | Link ekle |
| `src/components/FaqSection.jsx` | YENI - FAQ bileseni |
| `src/components/HomeSeoContent.jsx` | YENI - SEO icerik blogu |
| `public/robots.txt` | YENI |
| `public/sitemap.xml` | YENI |
| `public/manifest.json` | YENI |

---

## Tekrar Basvuru Oncesi Kontrol Listesi

- [ ] Kullanim Sartlari sayfasi canli ve erisilebilir
- [ ] Cerez Politikasi sayfasi canli ve erisilebilir
- [ ] Gizlilik Politikasi sayfasi canli (mevcut, OK)
- [ ] Hakkimizda sayfasi canli (mevcut, OK)
- [ ] robots.txt erisilebilir: /robots.txt
- [ ] sitemap.xml erisilebilir: /sitemap.xml
- [ ] ads.txt erisilebilir: /ads.txt (mevcut, OK)
- [ ] En az 5 sayfa orijinal icerikle mevcut
- [ ] Tum sayfalar en az 300+ kelime icerik
- [ ] 404 sayfasi dogru calisiyor
- [ ] JSON-LD yapisal veri mevcut
- [ ] Mobile uyumluluk OK (mevcut, OK)
- [ ] Sayfa hizi kabul edilebilir (< 3sn)
- [ ] Google Search Console'a site eklendi
- [ ] Sitemap Google Search Console'a gonderildi
- [ ] En az 2 hafta organik trafik bekle
- [ ] AdSense'e tekrar basvur
