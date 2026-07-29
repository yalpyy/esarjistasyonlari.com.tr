# EV Network Tycoon

Şehrin şarj ağını kurma oyunu — saf HTML5 Canvas + Vanilla JS + Tailwind (CDN).
Harici görsel/ses dosyası yok; araçlar, istasyonlar ve şehir tamamen vektörle çiziliyor.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Responsive iskelet, HUD, dashboard/bottom sheet, modallar |
| `game.js` | Canvas motoru: harita, araç üretimi, yol bulma, şarj mantığı, şebeke yükü, ekonomi, kayıt |
| `ui.js` | DOM bağlantıları, kurulum menüsü, dokunmatik kamera kontrolleri, modal akışları |
| `styles.css` | Koyu tema (#121212, #00E676, #00B0FF), masaüstü 70/30 ve mobil bottom sheet düzeni |

## Kurulum

Dört dosyayı aynı klasöre koy, `index.html`'i aç. Build adımı yok.

Mevcut Vite + React sitesine eklemek için:

1. Dosyaları `public/oyun/` altına kopyala.
2. Menüye `<a href="/oyun/">Oyun</a>` linki ekle (React Router'ı bypass eder, statik servis edilir).
3. `sitemap.xml`'e `/oyun/` girdisini ekle — AdSense denetiminde işe yarayan özgün, etkileşimli içerik.

Tam sayfa yerine gömmek isterseniz: `<iframe src="/oyun/" style="width:100%;aspect-ratio:16/10;border:0" title="EV Network Tycoon"></iframe>`

## Ödüllü reklam bağlama

Sigorta attığında `#modalOverload` açılır. Şu an "reklam" 5 saniyelik bir simülasyon;
gerçek SDK'yı tek satırla bağlarsınız:

```js
EV.onRewardedAd = function (grantReward) {
  googletag.rewarded.show(function (result) {
    if (result.rewardGranted) grantReward();   // şebeke anında geri gelir
  });
};
```

`grantReward()` çağrılmazsa oyuncu 15 saniyelik cezayı normal şekilde bekler.

## Lead / kupon

Oyuncu 10. seviyeye **veya** ₺100.000'e ulaşınca `goal` olayı tetiklenir ve kupon modali açılır.
Kod `localStorage`'da `evnt.coupon` anahtarında saklanır (`ESARJ15-XXXX`). CRM'e göndermek için:

```js
EV.on('goal', function (d) { fetch('/api/lead', { method: 'POST', body: JSON.stringify(d) }); });
```

## Denge ayarları

Tüm sayılar `game.js` içindeki `CFG` bloğunda:

- `DAY_SECONDS: 60` — 1 oyun günü
- `CHARGE_FACTOR: 0.04` — kW başına saniyede aktarılan kWh (oyun temposu)
- `START_GRID: 200` — başlangıç trafo limiti; DC kabini 150 kW'ı iki soket arasında paylaştırır
- `ENERGY_COST: 3.2` / `PRICE_MIN..MAX: 4–15` — ₺/kWh alış ve satış aralığı
- `OVERLOAD_SECONDS: 15` — sigorta cezası

## Kayıt anahtarları

`evnt.save.v1` (oyun durumu), `evnt.scores.v1` (ilk 10 günlük ciro), `evnt.coupon`.
`localStorage` kapalıysa oyun bellekte sorunsuz çalışır, sadece kayıt olmaz.

## Kontroller

Sürükle: haritayı kaydır · Tekerlek / iki parmak: yakınlaştır · Tık/dokunma: parsel veya istasyon seç
· `1`/`2`: AC/DC kurulum modu · `F`: haritayı sığdır · `Esc`: iptal
