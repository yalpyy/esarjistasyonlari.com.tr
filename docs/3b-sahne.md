# Şarj Ağı Savaşı — 3B sahne

Oyun rotası (`/oyun`) MapLibre GL kullanıyor. Ana sitenin Leaflet haritasıyla
ilgisi yok ve tembel yükleniyor; normal ziyaretçi bu paketi indirmiyor.

## Katman sırası

Sıra tesadüf değil, sisin işlevi buna bağlı:

```
arka plan
fog-haze              keşfedilmemiş alanı karartan düz katman
game-buildings        3B binalar
stations-pillar-3d    istasyon sütunları
stations-pillar-cap   sütunların parlak tepesi
build-range           kurulum yarıçapı
stations-hit          görünmez tıklama hedefi
stations-label        etiketler
fog-wall              yükseltilmiş sis duvarı  <-- yukarıdakilerin hepsi ALTINDA
fog-edge-glow         keşif sınırı parıltısı
fog-edge              keşif sınırı çizgisi
```

Binalar ve sütunlar `beforeId: FOG_LAYER` ile ekleniyor. Bu olmazsa
keşfedilmemiş mahallelerdeki binalar sisin üstüne çizilir ve oyuncu daha
gitmediği yeri görür — sis anlamını kaybeder.

## Ayarlanacak değerler

| Yer | Değer | Not |
|---|---|---|
| `fog3d.js` → `addFogLayers({ wallHeight })` | 260 m | İlk ayarlanacak değer. Yüksek: yakın manzara kapanır. Alçak: eğimli kamerada duvarın üstünden bakılır, sis hissi gider. Zoom'a göre ölçekleniyor (z10'da 0, z16'da tam). |
| `scene.js` → `profile()` | 32 / 54 / 70 m | AC, DC ve gerçek istasyon sütun yükseklikleri. |
| `scene.js` → `addLighting()` | `intensity: 0.32` | Bina gölgelenmesi. |
| `GameMap.jsx` → `pitch` | 60 | Başlangıç kamera eğimi, `maxPitch: 75`. |

## Görsel test — Supabase gerekmeden

`dev/scene-test.html` sis, bina ve sütun katmanlarını sentetik bir "şehir"le
kurar; hesap, konum izni ve backend istemez:

```bash
npm run dev
# http://localhost:5173/dev/scene-test.html
```

Konsoldan `__view({ pitch: 72, zoom: 16 })` ile açı deneyebilir,
`__expand()` ile yeni mahalle açıp sınır nabzını görebilirsin.

`dev/geom-test.html` ise sis ve sütun geometrisini doğrular (18 kontrol);
tarayıcıda açman yeterli, WebGL gerekmiyor.

## Bilinen kısıtlar

- **Bina katmanı stile bağlı.** `detectBuildingSource()` stilin kendi
  katmanlarına bakıp bina kaynağını bulur; stilde yoksa binalar düz kalır
  (uyarı basılır, oyun çökmez). OpenFreeMap dark ve MapTiler'da çalışır.
- **Sis tek seviye delik kullanıyor.** Keşfedilen alanın ortasında kalan
  boşluklar (`exploredRings` iç halkaları) yok sayılıyor — pratikte nadir.
- **`trafik` katmanı yok.** Pakette `traffic.js` gelmedi; gerçek yollarda araç
  dolaştırma özelliği bu depoda mevcut değil.
