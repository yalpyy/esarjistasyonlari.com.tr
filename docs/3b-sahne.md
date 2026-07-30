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

## Backend

Şema `supabase/schema.sql`. Supabase SQL Editor'e olduğu gibi yapıştırılır.

`h3-pg` uzantısı bu projede **yok**, dolayısıyla sunucu H3 hücresi hesaplayamıyor.
Hücreleri istemci gönderiyor, sunucu konumu doğruluyor. Sis kozmetik olduğu ve
gelir doğurmadığı için bu kabul edildi; para kazandıran her işlem hücreye değil
doğrulanmış konuma bakıyor. Ayrıntı dosya başındaki yorumda.

Ele geçirme (`claim_station`) `public.ocm_stations` ayna tablosunu **zorunlu**
kılıyor. Tablo boşken her ele geçirme `unknown_station` ile reddedilir — bu
kasıtlı: sunucu istasyonun yerini bilmeden mesafe ölçemez, istemciye sorarsa
Ankara'daki istasyon İstanbul'dan alınır. Doldurmak için:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
VITE_OCM_API_KEY=... \
node scripts/seed-ocm-stations.mjs
```

`service_role` anahtarı yalnızca bu betikte, sunucu tarafında kullanılır;
frontend'de sadece `VITE_SUPABASE_ANON_KEY` var.

Kurallar `game.rules()` içinde tek yerde toplandı ve `src/game/geo.js` içindeki
`RULES` ile eşleşmeli — birini değiştirirken diğerini unutma.

## "Oyun şu an kapalı" diyorsa

Vite ortam değişkenlerini **derleme anında** koda gömer, çalışma anında okumaz.
Bunun iki pratik sonucu var:

1. Vercel'e değişken eklemek mevcut dağıtımı değiştirmez — **yeniden deploy**
   gerekir.
2. Değişken hangi ortam için işaretliyse orada görünür. PR önizleme adresinde
   çalışması için **Preview** de işaretli olmalı; yalnızca Production işaretliyse
   önizleme kapalı kalır.

Kapalı ekranı artık hangi değişkenin eksik olduğunu yazıyor (değerleri değil).
Tarayıcı konsolunda da aynı uyarı var.

Değerler panele tırnak içinde yapıştırılmışsa istemci bunu temizliyor.

## Giriş bağlantısı localhost'a gidiyorsa

Supabase, `emailRedirectTo` / `redirectTo` değerini **yalnızca panelde izin
listesindeyse** kullanır. Listede yoksa sessizce yok sayar ve **Site URL**'e
düşer — varsayılanı `http://localhost:3000` olduğu için giriş bağlantısı
localhost'a gider. Kodda yapılacak bir şey yok, ayar panelde.

Authentication → URL Configuration:

- **Site URL**: `https://www.esarjistasyonu.com.tr`
- **Redirect URLs** (her satır ayrı):
  ```
  https://www.esarjistasyonu.com.tr/oyun
  https://esarjistasyonu.com.tr/oyun
  https://*.vercel.app/oyun
  http://localhost:5173/oyun
  ```

`https://*.vercel.app/oyun` satırı PR önizlemeleri için; her önizleme farklı
alt alan adı aldığından joker olmadan her deploy'da giriş kırılır.

Apex ve www'yi ayrı ayrı eklemek gerekiyor — Supabase tam eşleşme arıyor.
Tek kanonik adrese sabitlemek istersen `VITE_SITE_URL` tanımla; tanımlıysa
sayfanın kendi kaynağı yerine o kullanılır (önizlemeler de oraya döner).

Giriş ekranı, bağlantı gönderildikten sonra dönülecek adresi yazıyor —
beklenenden farklıysa sorun bu listede demektir.

## Giriş: kod yolu (önerilen)

Bağlantıyla giriş kırılgan. Kurumsal e-posta filtreleri (Outlook Safe Links,
antivirüs tarayıcıları, bazı önizleme servisleri) bağlantıyı kullanıcı
tıklamadan açıyor ve tek kullanımlık jetonu tüketiyor; kullanıcı tıkladığında
Supabase `access_denied` / `otp_expired` döndürüyor. Bağlantı bir kez
kullanılmıştır ve geri gelmez.

Kod yolunda bu sorun yok: yönlendirme adresi hiç devreye girmiyor, jeton
yalnızca kullanıcı yazınca harcanıyor. Giriş ekranı kodu birincil yol olarak
sunuyor, bağlantı da çalışmaya devam ediyor.

### Zorunlu ayar: e-posta şablonuna kodu ekle

Supabase'in **varsayılan Magic Link şablonunda kod YOKTUR**, yalnızca bağlantı
vardır. Şablon güncellenmezse kullanıcıya kod gitmez ve kod alanı işe yaramaz.

Authentication → Emails → **Magic Link** şablonuna `{{ .Token }}` ekle:

```html
<h2>Şarj Ağı Savaşı — giriş</h2>

<p>Giriş kodun:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">{{ .Token }}</p>
<p>Kodu oyundaki giriş ekranına yaz. Kod kısa süre geçerlidir.</p>

<hr />
<p>Ya da doğrudan bu bağlantıya tıkla:</p>
<p><a href="{{ .ConfirmationURL }}">Giriş yap</a></p>
```

`{{ .Token }}` 6 haneli kodu, `{{ .ConfirmationURL }}` bağlantıyı basar.
İkisi aynı jetonu temsil eder; hangisi önce kullanılırsa diğeri geçersiz olur.

### Giriş hataları

Bağlantı başarısız olduğunda Supabase hatayı sayfada değil adres parçasında
(`#error=...`) döndürür. Giriş ekranı bunu okuyup Türkçe açıklıyor ve adresi
temizliyor; okunmasaydı kullanıcı yalnızca giriş ekranını yeniden görürdü.

## "Rıza kaydedilemedi" ve benzeri RPC hataları

Artık gerçek sebep ekranda yazıyor. Sık görülenler:

| Ekrandaki mesaj | Sebep | Çözüm |
|---|---|---|
| Sunucu fonksiyonu bulunamadı (PGRST202) | Şema çalıştırılmamış ya da PostgREST önbelleği bayat | `supabase/schema.sql`'i çalıştır; sonu zaten `notify pgrst, 'reload schema';` ile bitiyor |
| Yetki reddedildi (42501) | `grant execute` bölümü uygulanmamış | Şemayı baştan çalıştır |
| İmza uyuşmuyor (42883) | Eski fonksiyon sürümü kalmış | Şemayı çalıştır; eski imzalar açıkça düşürülüyor |
| Oturumun düşmüş | JWT yok ya da süresi dolmuş | Çıkış yapıp tekrar gir |

Şemayı **kısmen** çalıştırdıysan (bir hatada durup kalanı atladıysan) fonksiyonların
bir kısmı eksik kalır. Dosya tekrar çalıştırılabilir; baştan sona bir kez daha çalıştır.

Ayrıntılı hata (kod, detay, ipucu) tarayıcı konsolunda `[Oyun] <fonksiyon>
başarısız:` satırında duruyor.

## Şema hatası: `cannot remove parameter defaults` / `function is not unique`

`create or replace function` sanıldığından çok dar: yalnızca gövdeyi
değiştirebilir. Argüman sayısı/tipi değişirse eski sürüm silinmez, yanına
ikincisi eklenir; varsayılan parametre veya dönüş tipi değişirse doğrudan
hata verir (42P13).

Şema artık kendi fonksiyonlarını yeniden kurmadan önce **imzası ne olursa olsun**
düşürüyor; bu blok dosyanın EN BAŞINDA. Elle `drop function` çalıştırman
gerekmiyor.

Hâlâ bu hatayı alıyorsan çalıştırdığın dosya güncel değildir — blok en başta
olduğu için dosyanın tamamını kopyaladığından emin ol. Tamamını kopyalayamıyorsan
`supabase/00-eski-fonksiyonlari-temizle.sql` dosyasını tek başına çalıştır,
sonra `schema.sql`'i baştan çalıştır.

## Şema hatası: `column "..." does not exist`

Sebebi neredeyse her zaman aynı: aynı isimli bir tablo zaten var ama beklenen
şekilde değil (yarım kalmış kurulum, elle değişiklik, başka amaçla açılmış
tablo). `create table if not exists` mevcut tabloyu olduğu gibi bırakır,
sonraki `create index` / `create policy` satırları da eksik sütunda patlar —
ve hata hangi tablodan geldiğini söylemez.

Şema artık bunu kendi onarıyor. Oyunun kendi tabloları (`discoveries`,
`stations`, `claims`, `ocm_stations`) için:

- şekil bozuk ve tablo **boşsa** → düşürülüp doğru şekliyle yeniden kurulur,
- şekil bozuk ve tablo **doluysa** → veri silmemek için açık bir hata verir ve
  ne yapman gerektiğini yazar.

`public.profiles` bu listede yok: Supabase şablonundan gelen gerçek kullanıcı
verisi taşıyabileceği için asla düşürülmez, eksik sütunları eklenir.

Durumu görmek için `supabase/diagnose.sql` dosyasını çalıştır — tabloları,
sütunları, fonksiyon imzalarını ve politikaları listeler, hiçbir şeyi değiştirmez.

## Harita kapkara görünüyorsa

İki ayrı sebebi olabilir, ikisi de giderildi:

1. **Sis tüm dünyayı kapatıyordu.** `GameMap`'in `load` işleyicisi
   `useEffect([styleUrl])` içinde olduğu için `cells` değerini ilk render'dan
   yakalıyordu. Harita yüklenirken hücreler değişirse (demo modu, sunucudan
   gelen liste) sis bayat/boş kümeyle kuruluyor ve hiç delik açmıyordu —
   ekranın tamamı sis. Artık ref üzerinden güncel küme okunuyor.

2. **Basemap hiç gelmiyor olabilir.** OpenFreeMap'in belgelediği stiller
   `liberty`, `bright`, `positron`; koyu stil her zaman mevcut olmayabiliyor.
   Stil 404 verirse basemap boş kalır. Artık `STYLE_CANDIDATES` sırayla
   deneniyor ve hepsi başarısız olursa oyuncuya "Harita altlığı yüklenemedi"
   bandı gösteriliyor — sessiz siyah ekran yok.

Oyunun koyu görünümü artık stile bağlı değil: `addBasemapTint` dünyayı kaplayan
yarı saydam koyu bir katman koyuyor, böylece açık temalı bir stil bile oyunun
paletine uyuyor.

## Konum alınamazsa: demo modu

Tarayıcı konum vermezse (izin reddi, sinyal yok, desteklenmeyen cihaz) oyuncu
boş ekranda kalmıyor; bir kart çıkıp **İstanbul, Ataşehir** üzerinden demo
başlatmayı öneriyor. Koordinat `geo.js` içinde `FALLBACK_POSITION`.

Demo modunda:

- harita Ataşehir'de açılır, 3B dünya gezilebilir, sis merkez + 6 komşu hücrede açıktır,
- **istasyon kurma, ele geçirme ve gelir toplama kapalıdır**,
- konum sunucuya **hiç gönderilmez** (`record_discovery` çağrılmaz),
- açılan hücreler yalnızca bellekte tutulur, kalıcı önbelleğe yazılmaz.

Bu kısıtlar keyfi değil: sahte konum sunucuya kabul edilseydi, konum iznini
reddeden herkes Ataşehir'den istasyon kurup gelir üretebilirdi ve `assert_fix`
hız/mesafe kontrolünün tamamı anlamsızlaşırdı. Demo yalnızca vitrin.

Banttaki "Konumu tekrar dene" düğmesi demodan çıkıp izni yeniden ister; demo
sırasında açılan hücreler atılır ve sunucudaki gerçek liste esas alınır.
