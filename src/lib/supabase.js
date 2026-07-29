import { createClient } from '@supabase/supabase-js';

/**
 * Oyunun Supabase istemcisi.
 *
 * Sadece anon anahtar kullanılır — `service_role` asla frontend'e girmez.
 * Yazma kuralları RLS ve RPC'lerde (supabase/schema.sql), istemci tarafında değil.
 *
 * Ortam değişkenleri tanımlı değilse istemci `null` kalır ve `isGameConfigured`
 * false döner; oyun bu durumda "kapalı" ekranı gösterir, çökmez. Bu sayede
 * sitenin geri kalanı Supabase yapılandırılmadan da derlenip yayınlanabilir.
 *
 * ÖNEMLİ: Vite bu değişkenleri DERLEME anında koda gömer, çalışma anında
 * okumaz. Vercel'de değişkeni eklemek mevcut dağıtımı değiştirmez — yeniden
 * deploy etmek gerekir. Ayrıca değişken hangi ortam için işaretlendiyse
 * (Production / Preview / Development) yalnızca orada görünür; PR önizleme
 * adresinde Preview işaretli olmalı.
 */

/** Panele yanlışlıkla tırnakla veya boşlukla yapıştırılan değerleri toparlar. */
function clean(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * Neyin eksik olduğunu söyleyen teşhis. Değerlerin KENDİSİ yok, yalnızca
 * var/yok bilgisi — "kapalı" ekranı bunu gösterip kullanıcıyı çıkmazdan
 * kurtarıyor.
 */
export const configDiagnostics = {
  hasUrl: Boolean(url),
  hasAnonKey: Boolean(anonKey),
  // Yaygın hata: URL yerine proje adı ya da pano bağlantısı yapıştırmak.
  urlLooksValid: /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(url),
  // Anon anahtar bir JWT'dir ve "eyJ" ile başlar. service_role da öyle başlar,
  // o yüzden bu yalnızca biçim kontrolü — hangi anahtar olduğunu söylemez.
  anonKeyLooksValid: anonKey.startsWith('eyJ'),
  get missing() {
    const list = [];
    if (!this.hasUrl) list.push('VITE_SUPABASE_URL');
    if (!this.hasAnonKey) list.push('VITE_SUPABASE_ANON_KEY');
    return list;
  }
};

export const isGameConfigured = Boolean(url && anonKey);

export const supabase = isGameConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Magic link ve OAuth geri dönüşleri /oyun adresine URL'de token ile düşüyor.
        detectSessionInUrl: true
      }
    })
  : null;

if (!isGameConfigured) {
  console.warn(
    '[Oyun] Eksik ortam değişkeni:', configDiagnostics.missing.join(', '),
    '— Vite bunları derleme anında gömer, Vercel\'de ekledikten sonra yeniden deploy gerekir.'
  );
}
