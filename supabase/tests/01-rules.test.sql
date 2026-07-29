-- Şarj Ağı Savaşı — sunucu kuralları davranış testi
\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function t_ok(cond boolean, name text) returns void language plpgsql as $$
begin
  if cond then raise notice '  OK   %', name;
  else raise exception 'FAIL: %', name;
  end if;
end;
$$;

create or replace function login(u uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u::text, false)::void;
$$;

do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  bob   uuid := '22222222-2222-2222-2222-222222222222';
  -- Kadıköy civarı
  lat0  double precision := 40.9903;
  lng0  double precision := 29.0270;
  res   jsonb;
  bal   numeric;
  n     int;
begin
  delete from auth.users;
  delete from public.claims;
  insert into auth.users (id, email) values (alice, 'alice@test.tr'), (bob, 'bob@test.tr');

  perform t_ok((select count(*) from public.profiles) = 2, 'kayıt tetikleyicisi profil açıyor');
  perform t_ok((select balance from public.profiles where id = alice) = 12000,
               'başlangıç bakiyesi 12.000');

  perform login(alice);

  -- ---------- Rıza kapısı ----------
  res := public.build_station(lat0, lng0, 'AC', 10, lat0, lng0);
  perform t_ok(res->>'reason' = 'consent', 'rıza yokken istasyon kurulamıyor');

  res := public.collect_income();
  perform t_ok(res->>'reason' = 'consent', 'rıza yokken gelir toplanamıyor');

  perform public.set_location_consent(true);
  perform t_ok((select location_consent_at is not null from public.profiles where id = alice),
               'rıza kaydediliyor');

  -- ---------- GPS doğruluğu ----------
  res := public.build_station(lat0, lng0, 'AC', 500, lat0, lng0);
  perform t_ok(res->>'reason' = 'weak_signal', 'kötü GPS doğruluğu reddediliyor');

  -- ---------- Geçerli kurulum ----------
  res := public.build_station(lat0, lng0, 'AC', 10, lat0, lng0);
  perform t_ok((res->>'ok')::boolean, 'geçerli AC kurulumu başarılı');
  perform t_ok((select balance from public.profiles where id = alice) = 11000,
               'AC bedeli 1.000 düşülüyor');
  perform t_ok((select count(*) from public.stations where owner = alice) = 1,
               'istasyon kaydediliyor');

  -- ---------- Menzil ----------
  -- ~400 m kuzey: build_range 200 m
  res := public.build_station(lat0 + 0.0036, lng0, 'AC', 10, lat0, lng0);
  perform t_ok(res->>'reason' = 'too_far', 'menzil dışına kurulamıyor');
  perform t_ok((res->>'distance')::numeric between 350 and 450, 'mesafe doğru raporlanıyor');
  perform t_ok((select balance from public.profiles where id = alice) = 11000,
               'reddedilen kurulum para düşürmüyor');

  -- ---------- Minimum aralık ----------
  -- 50 m doğu: min_station_gap 100 m
  res := public.build_station(lat0, lng0 + 0.00059, 'AC', 10, lat0, lng0);
  perform t_ok(res->>'reason' = 'too_close', 'başka istasyona çok yakın kurulamıyor');

  -- ---------- Kota ----------
  -- Seviye 1 -> kota 3. Biri kurulu; 150 m aralıkla iki tane daha.
  res := public.build_station(lat0 + 0.00135, lng0, 'AC', 10, lat0, lng0);
  perform t_ok((res->>'ok')::boolean, 'ikinci istasyon kuruluyor');
  res := public.build_station(lat0 - 0.00135, lng0, 'AC', 10, lat0, lng0);
  perform t_ok((res->>'ok')::boolean, 'üçüncü istasyon kuruluyor');
  perform t_ok((res->>'left')::int = 0, 'kalan kota 0 raporlanıyor');

  res := public.build_station(lat0, lng0 + 0.0016, 'AC', 10, lat0, lng0);
  perform t_ok(res->>'reason' = 'quota', 'kota dolunca kurulamıyor');

  -- ---------- Bakiye ----------
  update public.profiles set balance = 10, level = 9 where id = alice;
  res := public.build_station(lat0, lng0 + 0.0016, 'DC', 10, lat0, lng0);
  perform t_ok(res->>'reason' = 'funds', 'bakiye yetmezse kurulamıyor');

  -- ---------- Işınlanma ----------
  update public.profiles
     set balance = 50000, last_lat = lat0, last_lng = lng0, last_fix_at = now() - interval '10 seconds'
   where id = alice;
  -- ~90 km kuzey, 10 saniyede
  res := public.build_station(lat0 + 0.8, lng0, 'DC', 10, lat0 + 0.8, lng0);
  perform t_ok(res->>'reason' = 'implausible', 'ışınlanma reddediliyor');

  -- Aynı sıçrama makul sürede kabul edilmeli
  update public.profiles set last_fix_at = now() - interval '3 hours' where id = alice;
  res := public.build_station(lat0 + 0.8, lng0, 'DC', 10, lat0 + 0.8, lng0);
  perform t_ok((res->>'ok')::boolean, 'yeterli sürede aynı mesafe kabul ediliyor');

  -- ---------- Keşif ----------
  perform login(bob);
  perform public.set_location_consent(true);
  res := public.record_discovery(lat0, lng0, 10,
           array['881e30c6a1fffff','881e30c6a3fffff']);
  perform t_ok((res->>'ok')::boolean, 'keşif kaydediliyor');
  perform t_ok(jsonb_array_length(res->'cells') = 2, 'kaydedilen hücreler dönüyor');

  -- Biçimsiz hücreler süzülüyor
  res := public.record_discovery(lat0, lng0, 10, array['ZZZ', '', 'drop table x']);
  perform t_ok(jsonb_array_length(res->'cells') = 2, 'geçersiz hücre kimlikleri süzülüyor');

  -- Aşırı hücre yığını reddediliyor
  res := public.record_discovery(lat0, lng0, 10,
           (select array_agg(lpad(to_hex(g), 15, '8')) from generate_series(1, 40) g));
  perform t_ok(res->>'ok' = 'false', 'tek çağrıda 32 üstü hücre reddediliyor');

  -- bbox filtresi
  perform t_ok(jsonb_array_length(public.cells_in_bbox(lat0 - 0.05, lng0 - 0.05, lat0 + 0.05, lng0 + 0.05)) = 2,
               'cells_in_bbox kadraj içini döndürüyor');
  perform t_ok(jsonb_array_length(public.cells_in_bbox(50.0, 10.0, 51.0, 11.0)) = 0,
               'cells_in_bbox kadraj dışını döndürmüyor');

  -- Başkasının hücreleri sızmıyor
  perform login(alice);
  perform t_ok(jsonb_array_length(public.cells_in_bbox(lat0 - 0.05, lng0 - 0.05, lat0 + 0.05, lng0 + 0.05)) = 0,
               'keşif hücreleri kullanıcılar arasında sızmıyor');

  -- ---------- Ele geçirme ----------
  perform login(bob);
  update public.profiles set last_lat = lat0, last_lng = lng0, last_fix_at = now() - interval '1 hour'
   where id = bob;

  res := public.claim_station(999999, lat0, lng0, 10);
  perform t_ok(res->>'reason' = 'unknown_station', 'ayna tabloda olmayan istasyon ele geçirilemiyor');

  delete from public.ocm_stations;
  insert into public.ocm_stations (ocm_id, title, lat, lng, power)
  values (4242, 'Kadıköy DC', lat0 + 0.0045, lng0, 180);   -- ~500 m kuzey

  res := public.claim_station(4242, lat0, lng0, 10);
  perform t_ok(res->>'reason' = 'too_far', 'uzaktaki gerçek istasyon ele geçirilemiyor');

  -- 30 m yakınına git
  update public.profiles set last_fix_at = now() - interval '1 hour' where id = bob;
  res := public.claim_station(4242, lat0 + 0.00423, lng0, 10);
  perform t_ok((res->>'ok')::boolean, 'yakındaki gerçek istasyon ele geçiriliyor');
  perform t_ok((select count(*) from public.claims where ocm_id = 4242 and owner = bob) = 1,
               'ele geçirme kaydediliyor');
  perform t_ok((select abs(lat - (lat0 + 0.0045)) < 0.0001 from public.claims where ocm_id = 4242),
               'ele geçirme istemcinin değil sunucunun koordinatını saklıyor');

  -- Başkası süresi dolmadan alamaz
  perform login(alice);
  update public.profiles set last_lat = lat0 + 0.00423, last_lng = lng0,
         last_fix_at = now() - interval '1 hour' where id = alice;
  res := public.claim_station(4242, lat0 + 0.00423, lng0, 10);
  perform t_ok(res->>'reason' = 'cooldown', 'başkasının aktif ele geçirmesi alınamıyor');

  -- ---------- Gelir ----------
  perform login(bob);
  delete from public.stations where owner = bob;
  insert into public.stations (owner, kind, power, lat, lng)
  values (bob, 'AC', 22, lat0, lng0);
  update public.profiles
     set last_collected_at = now() - interval '2 hours', level = 1, balance = 0
   where id = bob;

  res := public.collect_income();
  bal := (res->>'earned')::numeric;
  -- 2 saat * (AC 60 + ele geçirme 140) = 400
  perform t_ok(bal = 400, 'gelir saat başına doğru hesaplanıyor (' || bal || ')');
  perform t_ok((res->>'over_capacity')::boolean = false, 'kapasite altında kırpma yok');
  perform t_ok((select balance from public.profiles where id = bob) = 400, 'gelir bakiyeye yazılıyor');

  res := public.collect_income();
  perform t_ok((res->>'earned')::numeric = 0, 'arka arkaya toplamada ikinci çağrı 0 veriyor');

  -- Birikim tavanı
  update public.profiles set last_collected_at = now() - interval '30 days', balance = 0 where id = bob;
  res := public.collect_income();
  perform t_ok((res->>'earned')::numeric = 8 * 200,
               'birikim 8 saatle sınırlı (' || (res->>'earned') || ')');

  -- Trafo aşımı
  delete from public.stations where owner = bob;
  insert into public.stations (owner, kind, power, lat, lng)
  select bob, 'DC', 150, lat0 + (g * 0.002), lng0 from generate_series(1, 4) g;
  update public.profiles set last_collected_at = now() - interval '1 hour', level = 1, balance = 0
   where id = bob;
  res := public.collect_income();
  perform t_ok((res->>'over_capacity')::boolean, 'trafo aşımı tespit ediliyor');
  perform t_ok((res->>'load_kw')::numeric = 600, 'toplam yük doğru (600 kW)');
  -- gross = 4*320 + 140(claim) = 1420; factor = 200/600
  perform t_ok((res->>'earned')::numeric < 1420, 'aşımda gelir kırpılıyor');

  -- ---------- Rıza geri çekme ----------
  perform t_ok((select count(*) from public.discoveries where user_id = bob) = 2, 'bob keşifleri duruyor');
  perform public.set_location_consent(false);
  perform t_ok((select count(*) from public.discoveries where user_id = bob) = 0,
               'rıza geri çekilince konum izi siliniyor');
  perform t_ok((select last_lat is null from public.profiles where id = bob),
               'rıza geri çekilince son konum siliniyor');

  -- ---------- Veri silme ----------
  perform public.set_location_consent(true);
  perform public.delete_my_data();
  perform t_ok((select count(*) from public.stations where owner = bob) = 0, 'veri silme istasyonları kaldırıyor');
  perform t_ok((select count(*) from public.claims where owner = bob) = 0, 'veri silme ele geçirmeleri kaldırıyor');

  -- ---------- Saklama süresi ----------
  perform login(alice);
  insert into public.discoveries (user_id, cell, lat, lng, created_at)
  values (alice, '881e30c6a5fffff', lat0, lng0, now() - interval '40 days');
  n := public.purge_old_locations();
  perform t_ok(n = 1, '30 günden eski konum kaydı temizleniyor');

  raise notice ' ';
  raise notice 'TÜM DAVRANIŞ TESTLERİ GEÇTİ';
end;
$$;
