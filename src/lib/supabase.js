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
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

if (!isGameConfigured && import.meta.env.DEV) {
  console.warn(
    '[Oyun] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tanımlı değil — oyun kapalı modda.'
  );
}
