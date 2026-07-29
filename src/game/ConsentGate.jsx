import { useEffect, useState } from 'react';
import {
  getSession, onAuthChange, signInWithEmail, signInWithGoogle,
  getProfile, setConsent
} from './api';
import { isGameConfigured, configDiagnostics } from '../lib/supabase';

/**
 * Oyuna girişten önceki iki kapı:
 *  1. Hesap (Supabase Auth)
 *  2. Konum verisinin SAKLANMASINA ayrı ve açık rıza
 *
 * Haritanın konum izni bunu kapsamıyor: orada konum işlenip atılıyor,
 * burada sunucuda saklanıyor. KVKK açısından ayrı bir işleme faaliyeti,
 * dolayısıyla ayrı rıza gerekiyor.
 */
export default function ConsentGate({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    getSession().then((s) => {
      if (!alive) return;
      setSession(s);
      setLoading(false);
    });
    return onAuthChange((s) => {
      setSession(s);
      setProfile(null);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    getProfile().then(setProfile);
  }, [session]);

  if (!isGameConfigured) {
    return (
      <Screen title="Oyun şu an kapalı">
        <p>Oyun sunucusu yapılandırılmamış. Kısa süre içinde tekrar dene.</p>
        <SetupHint />
      </Screen>
    );
  }

  if (loading) return <Screen title="Yükleniyor…" />;

  /* ---------- 1. Giriş ---------- */
  if (!session) {
    return (
      <Screen title="Şarj Ağı Savaşı" lead="Kendi mahallende şarj ağını kur. Oynamak için hesap gerekiyor.">
        <button
          className="game-btn primary"
          onClick={async () => {
            setBusy(true);
            const r = await signInWithGoogle();
            if (!r.ok) setErr('Google girişi başarısız.');
            setBusy(false);
          }}
          disabled={busy}
        >
          Google ile devam et
        </button>

        <div className="divider"><span>veya</span></div>

        {sent ? (
          <p className="ok">Giriş bağlantısı <b>{email}</b> adresine gönderildi. Postanı kontrol et.</p>
        ) : (
          <>
            <input
              className="game-input"
              type="email"
              inputMode="email"
              placeholder="eposta@ornek.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="game-btn"
              disabled={busy || !email.includes('@')}
              onClick={async () => {
                setBusy(true);
                setErr(null);
                const r = await signInWithEmail(email.trim());
                if (r.ok) setSent(true);
                else setErr('Bağlantı gönderilemedi. Adresi kontrol et.');
                setBusy(false);
              }}
            >
              Giriş bağlantısı gönder
            </button>
          </>
        )}
        {err && <p className="err">{err}</p>}
      </Screen>
    );
  }

  /* ---------- 2. Konum rızası ---------- */
  if (profile && !profile.location_consent_at) {
    return (
      <Screen title="Konum izni" lead="Bu oyun konumunla oynanıyor. Devam etmeden önce ne sakladığımızı bilmelisin.">
        <ul className="consent-list">
          <li><b>Ne saklanıyor:</b> keşfettiğin bölgelerin altıgen kimlikleri ve son bilinen konumun.</li>
          <li><b>Neden:</b> haritanın açık kalması, istasyon kurabilmen ve hile tespiti için.</li>
          <li><b>Ne kadar süre:</b> konum geçmişi 30 gün sonra otomatik silinir.</li>
          <li><b>Nerede:</b> Supabase (Frankfurt) sunucularında.</li>
          <li><b>Geri alma:</b> tek tıkla rızanı geri çekebilir, tüm konum verini sildirebilirsin.</li>
        </ul>

        <div className="safety">
          ⚠ Araç kullanırken oynama. Yürürken trafiğe ve çevrene dikkat et, özel mülke girme.
        </div>

        <button
          className="game-btn primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await setConsent(true);
            if (r?.ok) setProfile(await getProfile());
            else setErr('Rıza kaydedilemedi, tekrar dene.');
            setBusy(false);
          }}
        >
          Kabul ediyorum, oyuna başla
        </button>
        <a className="game-btn ghost" href="/gizlilik-politikasi">Gizlilik politikasını oku</a>
        {err && <p className="err">{err}</p>}
      </Screen>
    );
  }

  if (!profile) return <Screen title="Profil hazırlanıyor…" />;

  return children({ session, profile, refreshProfile: async () => setProfile(await getProfile()) });
}

/**
 * "Kapalı" ekranının teşhis kısmı.
 *
 * Bu blok olmadan mesaj çıkmaz sokak: kurulumu yapan kişi değişkenleri
 * eklediğini bilir ama neden hâlâ kapalı olduğunu göremez. En sık sebep,
 * değişkenlerin eklenmesi ama yeniden deploy edilmemesi — Vite değerleri
 * derleme anında gömüyor.
 *
 * Anahtar veya URL'nin kendisi YAZILMIYOR, yalnızca var/yok bilgisi.
 */
function SetupHint() {
  const { missing, hasUrl, hasAnonKey, urlLooksValid, anonKeyLooksValid } = configDiagnostics;

  return (
    <div className="setup-hint">
      <p className="hint-title">Bu derlemede eksik olan:</p>
      <ul>
        <li>
          <code>VITE_SUPABASE_URL</code>{' '}
          {!hasUrl ? '— tanımlı değil' : urlLooksValid ? '— tamam' : '— tanımlı ama biçimi beklenmedik'}
        </li>
        <li>
          <code>VITE_SUPABASE_ANON_KEY</code>{' '}
          {!hasAnonKey ? '— tanımlı değil' : anonKeyLooksValid ? '— tamam' : '— tanımlı ama JWT gibi görünmüyor'}
        </li>
      </ul>

      {missing.length > 0 && (
        <p className="hint-note">
          Değişkenleri Vercel'e eklediysen bu derleme onlardan önce alınmış olabilir.
          Vite değerleri <b>derleme anında</b> koda gömüyor, çalışma anında okumuyor —
          eklendikten sonra <b>yeniden deploy</b> gerekiyor. Ayrıca değişkenin
          hangi ortam için işaretlendiğine bak: PR önizleme adresinde görünmesi
          için <b>Preview</b> de işaretli olmalı.
        </p>
      )}
    </div>
  );
}

function Screen({ title, lead, children }) {
  return (
    <div className="game-gate">
      <div className="gate-card">
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
