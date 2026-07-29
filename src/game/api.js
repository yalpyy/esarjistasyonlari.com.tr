import { supabase } from '../lib/supabase';
import { cellsAround } from './geo';

/**
 * Tüm oyun yazma işlemleri RPC üzerinden. İstemci hiçbir tabloya doğrudan
 * INSERT/UPDATE yapmaz — kurallar sunucuda (schema.sql / schema_v2.sql).
 */

const fail = (reason) => ({ ok: false, reason });

async function rpc(name, args) {
  if (!supabase) return fail('not_configured');
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    console.error(`[Oyun] ${name}:`, error.message);
    return fail('network');
  }
  return data ?? fail('empty');
}

/* ---------- Oturum ---------- */

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export function onAuthChange(handler) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => handler(session));
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email) {
  if (!supabase) return fail('not_configured');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/oyun` }
  });
  return error ? fail(error.message) : { ok: true };
}

export async function signInWithGoogle() {
  if (!supabase) return fail('not_configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/oyun` }
  });
  return error ? fail(error.message) : { ok: true };
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

/* ---------- Profil ve rıza ---------- */

export async function getProfile() {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) return null;
  return data;
}

export const setConsent = (granted) => rpc('set_location_consent', { p_granted: granted });
export const deleteMyData = () => rpc('delete_my_data', {});

export async function setNickname(nickname) {
  if (!supabase) return fail('not_configured');
  const { error } = await supabase.from('profiles').update({ nickname }).eq('id',
    (await supabase.auth.getUser()).data.user?.id);
  return error ? fail(error.message) : { ok: true };
}

/* ---------- Oyun ---------- */

/**
 * Keşfi bildirir.
 *
 * Hücreleri istemci hesaplıyor çünkü Supabase projesinde h3-pg yok; sunucu
 * H3 üretemiyor. Sunucu konumu (hız + doğruluk) doğrulayıp hücreleri
 * kaydediyor. Sis kozmetik olduğu ve gelir doğurmadığı için bu kabul edilebilir
 * — para kazandıran her işlem hücreye değil, doğrulanmış konuma bakıyor.
 * Ayrıntı: supabase/schema.sql dosya başı.
 */
export const recordDiscovery = ({ lat, lng, accuracy }) =>
  rpc('record_discovery', {
    p_lat: lat,
    p_lng: lng,
    p_accuracy: Math.round(accuracy ?? 0),
    p_cells: cellsAround({ lat, lng })
  });

/**
 * İstasyon kurar. Hedef ve oyuncu konumu AYRI gönderilir: sunucu hız
 * kontrolünü oyuncu konumuna, menzil kontrolünü ikisi arasındaki mesafeye
 * uyguluyor. Tek koordinat gönderilseydi mesafe hep 0 çıkardı.
 */
export const buildStation = ({ lat, lng, kind, accuracy, playerLat, playerLng }) =>
  rpc('build_station', {
    p_lat: lat,
    p_lng: lng,
    p_kind: kind,
    p_accuracy: Math.round(accuracy ?? 0),
    p_player_lat: playerLat,
    p_player_lng: playerLng
  });

export const claimStation = ({ ocmId, lat, lng, accuracy }) =>
  rpc('claim_station', { p_ocm_id: ocmId, p_lat: lat, p_lng: lng, p_accuracy: Math.round(accuracy ?? 0) });

export const collectIncome = () => rpc('collect_income', {});

/** Görünen alandaki keşif hücreleri (h3 index dizisi). */
export async function cellsInBbox(bounds) {
  const data = await rpc('cells_in_bbox', {
    p_min_lat: bounds.south, p_min_lng: bounds.west,
    p_max_lat: bounds.north, p_max_lng: bounds.east
  });
  return Array.isArray(data) ? data : [];
}

/** Görünen alandaki gerçek + sanal istasyonlar. */
export async function stationsInBbox(bounds) {
  const data = await rpc('stations_in_bbox', {
    p_min_lat: bounds.south, p_min_lng: bounds.west,
    p_max_lat: bounds.north, p_max_lng: bounds.east
  });
  return Array.isArray(data) ? data : [];
}

export async function leaderboard() {
  if (!supabase) return [];
  const { data } = await supabase.from('leaderboard').select('*').limit(20);
  return data ?? [];
}
