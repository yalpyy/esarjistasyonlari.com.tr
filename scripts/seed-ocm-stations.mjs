#!/usr/bin/env node

/**
 * OpenChargeMap -> public.ocm_stations aynası.
 *
 * Neden gerekli: claim_station istemcinin bildirdiği koordinata güvenmiyor.
 * İstasyonun gerçek yerini sunucudan okuyup oyuncuya olan mesafeyi kendisi
 * ölçüyor. Bu tablo boşken ele geçirme 'unknown_station' ile reddedilir —
 * güvenli varsayılan.
 *
 * service_role anahtarı SADECE burada, sunucu tarafında kullanılır. Frontend'e
 * asla girmez (orada yalnızca VITE_SUPABASE_ANON_KEY var).
 *
 * Kullanım:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   VITE_OCM_API_KEY=... \
 *   node scripts/seed-ocm-stations.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OCM_KEY = process.env.VITE_OCM_API_KEY || '';
const BATCH = 500;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

/** Bir istasyonun en yüksek şarj gücü (kW). */
function maxPower(station) {
  const conns = station.Connections || [];
  return conns.reduce((max, c) => Math.max(max, Number(c.PowerKW) || 0), 0);
}

async function fetchStations() {
  const params = new URLSearchParams({
    output: 'json',
    countrycode: 'TR',
    maxresults: '10000',
    compact: 'true',
    verbose: 'false'
  });
  if (OCM_KEY) params.set('key', OCM_KEY);

  const res = await fetch(`https://api.openchargemap.io/v3/poi?${params}`);
  if (!res.ok) throw new Error(`OpenChargeMap HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log('OpenChargeMap verisi çekiliyor…');
  const raw = await fetchStations();
  console.log(`  ${raw.length} kayıt geldi.`);

  const rows = raw
    .filter((s) => s.ID && s.AddressInfo?.Latitude && s.AddressInfo?.Longitude)
    .map((s) => ({
      ocm_id: s.ID,
      title: s.AddressInfo.Title || 'Şarj istasyonu',
      lat: s.AddressInfo.Latitude,
      lng: s.AddressInfo.Longitude,
      power: Math.round(maxPower(s)),
      updated_at: new Date().toISOString()
    }));

  console.log(`  ${rows.length} kayıt yazılacak.`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db.from('ocm_stations').upsert(chunk, { onConflict: 'ocm_id' });
    if (error) {
      console.error(`  ${i}. partide hata:`, error.message);
      process.exit(1);
    }
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }

  console.log('Bitti.');
}

main().catch((err) => {
  console.error('Hata:', err.message);
  process.exit(1);
});
