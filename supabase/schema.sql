-- =============================================================================
-- Şarj Ağı Savaşı — Supabase şeması
--
-- Tek kural: oyun ekonomisi burada hesaplanır. İstemci hiçbir tabloya doğrudan
-- INSERT/UPDATE yapmaz; para, seviye, kota ve mesafe kararları bu dosyadaki
-- RPC'lerdedir. İstemcideki kontroller (geo.js/canBuildAt) yalnızca anlık geri
-- bildirim içindir ve burada yeniden yapılır.
--
-- h3-pg YOK varsayımıyla yazıldı (`pg_available_extensions` sorgusu boş döndü).
-- Sonucu: sunucu H3 hücresi HESAPLAYAMAZ, dolayısıyla hücre kimliklerini
-- istemci gönderir. Bunun güvenlik etkisi bilinçli olarak kabul edildi:
--
--   * Sis TAMAMEN kozmetiktir. Sahte hücre gönderen oyuncu yalnızca kendi
--     ekranındaki karanlığı açar; başkası göremez, hiçbir gelir doğurmaz.
--   * Para kazandıran her işlem (build_station, claim_station, collect_income)
--     hücreye DEĞİL, sunucuda doğrulanmış son konuma ve mesafeye bakar.
--   * Konumun kendisi hız/doğruluk kontrolünden geçer (assert_fix).
--
-- Yani hücre uydurmak oyunu bozmaz; konum uydurmak ise reddedilir.
-- h3-pg ileride kurulursa record_discovery içindeki hücre kabulü sunucu
-- tarafında yeniden hesaplanacak şekilde sıkılaştırılabilir.
-- =============================================================================

-- =============================================================================
-- 1. Oyun kuralları — tek kaynak. src/game/geo.js RULES ile eşleşmeli.
-- =============================================================================

create schema if not exists game;

create or replace function game.rules()
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'h3_res',           8,
    'build_range_m',    200,     -- oyuncudan istasyona izin verilen mesafe
    'min_station_gap_m',100,     -- iki istasyon arası minimum mesafe
    'claim_range_m',    50,      -- gerçek istasyonu ele geçirme mesafesi
    'max_accuracy_m',   100,     -- bundan kötü GPS doğruluğu sayılmaz
    'max_speed_kmh',    120,     -- üstü ışınlanma sayılır
    'claim_hours',      24,      -- ele geçirme süresi
    'cost_ac',          1000,
    'cost_dc',          5000,
    'income_ac_hourly', 60,      -- ₺/saat, trafo aşımı yokken
    'income_dc_hourly', 320,
    'claim_income_hourly', 140,
    'max_collect_hours', 8,      -- birikim tavanı: oyunu açmadan sonsuz kazanç yok
    'capacity_base_kw', 200,     -- seviye 1 trafo kapasitesi
    'capacity_step_kw', 120      -- her seviyede eklenen kapasite
  );
$$;

-- =============================================================================
-- 2. Coğrafya — h3-pg ve PostGIS olmadan, saf SQL haversine.
-- =============================================================================

create or replace function game.distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision language sql immutable as $$
  select 2 * 6371008.8 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- =============================================================================
-- 3. Tablolar
-- =============================================================================

create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  nickname            text,
  balance             numeric(14,2) not null default 12000,
  level               int           not null default 1,
  xp                  int           not null default 0,
  location_consent_at timestamptz,
  banned              boolean       not null default false,
  -- Sunucunun doğruladığı son konum. Mesafe kararları buna göre verilir,
  -- istemcinin o an gönderdiği koordinata körü körüne güvenilmez.
  last_lat            double precision,
  last_lng            double precision,
  last_fix_at         timestamptz,
  last_collected_at   timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

/**
 * Eksik sütunları tamamla.
 *
 * `create table if not exists` mevcut tabloyu OLDUĞU GİBİ bırakır. Supabase
 * projelerinde çoğu zaman "User Management Starter" şablonundan gelen bir
 * public.profiles tablosu zaten vardır (id, username, full_name, avatar_url…).
 * O durumda yukarıdaki create sessizce atlanır ve şemanın geri kalanı
 * "column last_lat does not exist" ile patlar.
 *
 * Aşağıdaki blok hem o durumu hem de yarım kalmış bir kurulumu onarır ve
 * şemayı tekrar tekrar çalıştırılabilir yapar.
 */
alter table public.profiles
  add column if not exists nickname            text,
  add column if not exists balance             numeric(14,2) not null default 12000,
  add column if not exists level               int           not null default 1,
  add column if not exists xp                  int           not null default 0,
  add column if not exists location_consent_at timestamptz,
  add column if not exists banned              boolean       not null default false,
  add column if not exists last_lat            double precision,
  add column if not exists last_lng            double precision,
  add column if not exists last_fix_at         timestamptz,
  add column if not exists last_collected_at   timestamptz not null default now(),
  add column if not exists created_at          timestamptz not null default now();

comment on column public.profiles.last_lat is
  'assert_fix() tarafından doğrulanmış son konum; hız kontrolünün referansı.';

-- Keşfedilen hücreler. lat/lng, hücreyi açan doğrulanmış konumdur —
-- h3-pg olmadığı için bbox filtresi hücre kimliğinden değil bu koordinattan
-- yapılıyor.
create table if not exists public.discoveries (
  user_id    uuid not null references auth.users(id) on delete cascade,
  cell       text not null,
  lat        double precision not null,
  lng        double precision not null,
  created_at timestamptz not null default now(),
  primary key (user_id, cell)
);

alter table public.discoveries
  add column if not exists lat        double precision,
  add column if not exists lng        double precision,
  add column if not exists created_at timestamptz not null default now();

create index if not exists discoveries_user_bbox_idx
  on public.discoveries (user_id, lat, lng);

-- 30 gün saklama için: eski konum izini temizlerken kullanılıyor.
create index if not exists discoveries_created_idx
  on public.discoveries (created_at);

create table if not exists public.stations (
  id                bigint generated always as identity primary key,
  owner             uuid not null references auth.users(id) on delete cascade,
  kind              text not null check (kind in ('AC', 'DC')),
  power             int  not null,
  lat               double precision not null,
  lng               double precision not null,
  created_at        timestamptz not null default now(),
  last_collected_at timestamptz not null default now()
);

alter table public.stations
  add column if not exists power             int,
  add column if not exists created_at        timestamptz not null default now(),
  add column if not exists last_collected_at timestamptz not null default now();

create index if not exists stations_bbox_idx on public.stations (lat, lng);
create index if not exists stations_owner_idx on public.stations (owner);

-- Gerçek (OpenChargeMap) istasyonların geçici ele geçirilmesi.
create table if not exists public.claims (
  ocm_id     bigint primary key,
  owner      uuid not null references auth.users(id) on delete cascade,
  lat        double precision not null,
  lng        double precision not null,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  collected_at timestamptz not null default now()
);

alter table public.claims
  add column if not exists claimed_at   timestamptz not null default now(),
  add column if not exists collected_at timestamptz not null default now();

create index if not exists claims_owner_idx on public.claims (owner);
create index if not exists claims_bbox_idx on public.claims (lat, lng);

/**
 * Gerçek (OpenChargeMap) istasyonların sunucu tarafı aynası.
 *
 * Bu tablo OLMADAN ele geçirme güvenli değil: istemci yalnızca ocm_id
 * gönderiyor, sunucu istasyonun nerede olduğunu bilmiyor. Aynası olmazsa
 * oyuncu Ankara'daki istasyonu İstanbul'dan ele geçirip gelir üretebilir.
 * Bu yüzden claim_station, burada kaydı olmayan istasyonu reddediyor.
 *
 * Doldurma: scripts/seed-ocm-stations.mjs (OpenChargeMap -> bu tablo).
 */
create table if not exists public.ocm_stations (
  ocm_id     bigint primary key,
  title      text,
  lat        double precision not null,
  lng        double precision not null,
  power      int,
  updated_at timestamptz not null default now()
);

alter table public.ocm_stations
  add column if not exists title      text,
  add column if not exists power      int,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists ocm_stations_bbox_idx on public.ocm_stations (lat, lng);

-- =============================================================================
-- 4. RLS — istemci hiçbir şeyi doğrudan yazamaz
-- =============================================================================

alter table public.profiles     enable row level security;
alter table public.discoveries  enable row level security;
alter table public.stations     enable row level security;
alter table public.claims       enable row level security;
alter table public.ocm_stations enable row level security;

/**
 * Devralınan politikaları temizle.
 *
 * Bu tablolar oyunun kontrolünde. Supabase "User Management Starter"
 * şablonundan gelen `Public profiles are viewable by everyone.` gibi izin
 * veren bir SELECT politikası kalırsa, politikalar OR'landığı için aşağıdaki
 * kısıtlayıcı politikalar HİÇBİR İŞE YARAMAZ.
 *
 * Bu teorik değil: profiles tablosunda last_lat/last_lng var. Kalan izin
 * verici bir politika, her oyuncunun son GPS konumunu herkese açık hale
 * getirir — rıza metninde verdiğimiz sözün tam tersi. O yüzden adı ne olursa
 * olsun mevcut politikalar düşürülüp yalnızca buradakiler kuruluyor.
 */
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename
      from pg_policies
     where schemaname = 'public'
       and tablename in ('profiles', 'discoveries', 'stations', 'claims', 'ocm_stations')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- Takma ad dışında hiçbir sütun istemciden güncellenemez. Sütun izni aşağıda
-- GRANT ile daraltılıyor; bu politika yalnızca satırı sahibine kilitliyor.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists discoveries_select_own on public.discoveries;
create policy discoveries_select_own on public.discoveries
  for select using (auth.uid() = user_id);

-- İstasyonlar herkese açık okunur: harita rekabetin görünmesiyle anlamlı.
drop policy if exists stations_select_all on public.stations;
create policy stations_select_all on public.stations
  for select using (true);

drop policy if exists claims_select_all on public.claims;
create policy claims_select_all on public.claims
  for select using (true);

-- Ayna tablo herkese açık okunur; yazma yalnızca service_role ile
-- (seed-ocm-stations.mjs), istemciden asla.
drop policy if exists ocm_stations_select_all on public.ocm_stations;
create policy ocm_stations_select_all on public.ocm_stations
  for select using (true);

-- INSERT/UPDATE/DELETE politikası bilerek YOK: tüm yazma yolu RPC'lerden geçer.

-- Supabase bunu varsayılan veriyor; taze projede eksik kalmasın diye açık.
grant usage on schema public to anon, authenticated;

revoke all on public.profiles, public.discoveries, public.stations,
              public.claims, public.ocm_stations
  from anon, authenticated;

grant select on public.stations, public.claims, public.ocm_stations
  to anon, authenticated;
grant select on public.profiles, public.discoveries to authenticated;
-- Sadece takma ad. balance/level/banned istemciden yazılamaz.
grant update (nickname) on public.profiles to authenticated;

-- =============================================================================
-- 5. Kayıt olunca profil aç
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, split_part(coalesce(new.email, 'oyuncu'), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- 6. Ortak doğrulama
-- =============================================================================

-- Oyuncuyu getirir; yoksa/yasaklıysa/rıza vermediyse hata fırlatır.
create or replace function game.actor()
returns public.profiles language plpgsql security definer
set search_path = public, pg_temp as $$
declare p public.profiles;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated' using errcode = 'P0001';
  end if;

  select * into p from public.profiles where id = auth.uid();
  if not found then
    raise exception 'no_profile' using errcode = 'P0001';
  end if;
  if p.banned then
    raise exception 'banned' using errcode = 'P0001';
  end if;
  if p.location_consent_at is null then
    raise exception 'consent' using errcode = 'P0001';
  end if;
  return p;
end;
$$;

/**
 * Gelen konumu doğrular ve profildeki son konumu günceller.
 *
 * İki kapı:
 *  1. GPS doğruluğu max_accuracy_m'den kötüyse konum sayılmaz.
 *  2. Bir önceki doğrulanmış konumdan bu noktaya geçiş max_speed_kmh ile
 *     mümkün değilse ışınlanma sayılır.
 *
 * Zaman damgası istemciden ALINMAZ — now() kullanılır, yoksa saati geri alan
 * istemci hız kontrolünü baypas eder.
 */
create or replace function game.assert_fix(p_lat double precision, p_lng double precision, p_accuracy int)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  r        jsonb := game.rules();
  prev     public.profiles;
  meters   double precision;
  seconds  double precision;
begin
  if p_lat is null or p_lng is null
     or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'bad_position' using errcode = 'P0001';
  end if;

  if coalesce(p_accuracy, 9999) > (r->>'max_accuracy_m')::int then
    raise exception 'weak_signal' using errcode = 'P0001';
  end if;

  select * into prev from public.profiles where id = auth.uid();

  if prev.last_lat is not null and prev.last_fix_at is not null then
    meters  := game.distance_m(prev.last_lat, prev.last_lng, p_lat, p_lng);
    seconds := greatest(extract(epoch from (now() - prev.last_fix_at)), 1);
    -- 500 m altındaki sıçramalar GPS gürültüsü sayılır, cezalandırılmaz.
    if meters > 500 and (meters / seconds) * 3.6 > (r->>'max_speed_kmh')::numeric then
      raise exception 'implausible' using errcode = 'P0001';
    end if;
  end if;

  update public.profiles
     set last_lat = p_lat, last_lng = p_lng, last_fix_at = now()
   where id = auth.uid();
end;
$$;

-- =============================================================================
-- 7. Rıza ve veri silme
-- =============================================================================

create or replace function public.set_location_consent(p_granted boolean)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  if p_granted then
    update public.profiles set location_consent_at = now() where id = auth.uid();
  else
    -- Rıza geri çekilince konum izi de gider: saklamanın dayanağı kalmıyor.
    update public.profiles
       set location_consent_at = null, last_lat = null, last_lng = null, last_fix_at = null
     where id = auth.uid();
    delete from public.discoveries where user_id = auth.uid();
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_my_data()
returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  end if;

  delete from public.discoveries where user_id = auth.uid();
  delete from public.stations    where owner   = auth.uid();
  delete from public.claims      where owner   = auth.uid();
  update public.profiles
     set last_lat = null, last_lng = null, last_fix_at = null,
         location_consent_at = null, nickname = null
   where id = auth.uid();

  return jsonb_build_object('ok', true);
end;
$$;

-- =============================================================================
-- 8. Keşif
-- =============================================================================

/**
 * Konumu doğrular ve istemcinin hesapladığı hücreleri kaydeder.
 *
 * p_cells istemciden gelir (h3-pg yok). Kötüye kullanımı sınırlamak için:
 *  - konum önce assert_fix'ten geçer,
 *  - tek çağrıda en fazla 32 hücre kabul edilir (ring 1 = 7 hücre),
 *  - hücre kimliği biçimsel olarak doğrulanır.
 * Sisin kozmetik olduğu ve gelir doğurmadığı dosya başında açıklandı.
 */
create or replace function public.record_discovery(
  p_lat double precision,
  p_lng double precision,
  p_accuracy int,
  p_cells text[] default '{}'
) returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  cleaned text[];
begin
  perform game.actor();
  perform game.assert_fix(p_lat, p_lng, p_accuracy);

  select array_agg(distinct c)
    into cleaned
    from unnest(coalesce(p_cells, '{}')) as c
   where c ~ '^[0-9a-f]{15,16}$';

  if cleaned is not null and array_length(cleaned, 1) > 32 then
    raise exception 'too_many_cells' using errcode = 'P0001';
  end if;

  if cleaned is not null then
    insert into public.discoveries (user_id, cell, lat, lng)
    select auth.uid(), c, p_lat, p_lng from unnest(cleaned) as c
    on conflict (user_id, cell) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'cells', coalesce(
      (select jsonb_agg(cell) from public.discoveries where user_id = auth.uid()),
      '[]'::jsonb
    )
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'reason', sqlerrm);
end;
$$;

create or replace function public.cells_in_bbox(
  p_min_lat double precision, p_min_lng double precision,
  p_max_lat double precision, p_max_lng double precision
) returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;

  return coalesce((
    select jsonb_agg(cell)
      from public.discoveries
     where user_id = auth.uid()
       -- Hücre kenarı ~460 m; sınırı biraz genişletiyoruz ki ekranın kıyısındaki
       -- hücreyi açan konum kadraj dışında kalınca sis geri gelmesin.
       and lat between p_min_lat - 0.01 and p_max_lat + 0.01
       and lng between p_min_lng - 0.01 and p_max_lng + 0.01
  ), '[]'::jsonb);
end;
$$;

-- =============================================================================
-- 9. İstasyon kurma
-- =============================================================================

/**
 * İstasyon kurar.
 *
 * p_lat/p_lng HEDEF noktadır (haritada dokunulan yer), p_player_* ise
 * oyuncunun o anki konumu. İkisi ayrı olmak zorunda: yalnızca oyuncu konumu
 * hız/doğruluk kontrolünden geçer, mesafe kuralı da oyuncu ile hedef arasında
 * ölçülür. Tek koordinat alınsaydı mesafe her zaman 0 çıkar ve menzil kuralı
 * tamamen delinirdi.
 */
create or replace function public.build_station(
  p_lat double precision,
  p_lng double precision,
  p_kind text,
  p_accuracy int,
  p_player_lat double precision,
  p_player_lng double precision
) returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  r      jsonb := game.rules();
  me     public.profiles;
  cost   numeric;
  power  int;
  quota  int;
  owned  int;
  gap    double precision;
  away   double precision;
begin
  me := game.actor();

  if p_kind not in ('AC', 'DC') then
    return jsonb_build_object('ok', false, 'reason', 'bad_kind');
  end if;

  -- Önce OYUNCU konumunu doğrula (hız + doğruluk) ve profile yaz.
  perform game.assert_fix(p_player_lat, p_player_lng, p_accuracy);

  -- Mesafeyi istemcinin gönderdiği değere değil, profildeki doğrulanmış
  -- konuma göre ölç.
  select game.distance_m(pr.last_lat, pr.last_lng, p_lat, p_lng)
    into away from public.profiles pr where pr.id = auth.uid();

  if away > (r->>'build_range_m')::numeric then
    return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance', round(away));
  end if;

  if p_kind = 'AC' then
    cost := (r->>'cost_ac')::numeric; power := 22;
  else
    cost := (r->>'cost_dc')::numeric; power := 150;
  end if;

  quota := 2 + me.level;
  select count(*) into owned from public.stations where owner = auth.uid();
  if owned >= quota then
    return jsonb_build_object('ok', false, 'reason', 'quota', 'quota', quota);
  end if;

  if me.balance < cost then
    return jsonb_build_object('ok', false, 'reason', 'funds');
  end if;

  -- Herkesin istasyonuna karşı mesafe: başkasının istasyonunun dibine
  -- kurup geliri bölmek engellensin.
  select min(game.distance_m(s.lat, s.lng, p_lat, p_lng)) into gap
    from public.stations s;

  if gap is not null and gap < (r->>'min_station_gap_m')::numeric then
    return jsonb_build_object('ok', false, 'reason', 'too_close', 'distance', round(gap));
  end if;

  insert into public.stations (owner, kind, power, lat, lng)
  values (auth.uid(), p_kind, power, p_lat, p_lng);

  update public.profiles
     set balance = balance - cost,
         xp      = xp + 10,
         level   = greatest(level, 1 + ((xp + 10) / 100))
   where id = auth.uid();

  return jsonb_build_object('ok', true, 'left', quota - owned - 1);
exception
  when others then
    return jsonb_build_object('ok', false, 'reason', sqlerrm);
end;
$$;

-- =============================================================================
-- 10. Gerçek istasyonu ele geçirme
-- =============================================================================

create or replace function public.claim_station(
  p_ocm_id bigint,
  p_lat double precision,
  p_lng double precision,
  p_accuracy int
) returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  r        jsonb := game.rules();
  existing public.claims;
  target   public.ocm_stations;
  away     double precision;
begin
  perform game.actor();
  -- p_lat/p_lng OYUNCUNUN konumu; istasyonun yeri sunucudan okunuyor.
  perform game.assert_fix(p_lat, p_lng, p_accuracy);

  select * into target from public.ocm_stations where ocm_id = p_ocm_id;
  if not found then
    -- Ayna tablo boşsa ele geçirme kapalıdır. İstemcinin bildirdiği
    -- koordinata güvenip mesafe ölçmek, uzaktaki istasyonu ele geçirmeye
    -- kapı açardı.
    return jsonb_build_object('ok', false, 'reason', 'unknown_station');
  end if;

  select game.distance_m(pr.last_lat, pr.last_lng, target.lat, target.lng)
    into away from public.profiles pr where pr.id = auth.uid();

  if away > (r->>'claim_range_m')::numeric then
    return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance', round(away));
  end if;

  select * into existing from public.claims where ocm_id = p_ocm_id;

  if found and existing.expires_at > now() then
    if existing.owner = auth.uid() then
      return jsonb_build_object('ok', false, 'reason', 'cooldown');
    end if;
    -- Başkasındaysa süresi dolmadan alınamaz.
    return jsonb_build_object('ok', false, 'reason', 'cooldown');
  end if;

  insert into public.claims (ocm_id, owner, lat, lng, expires_at, collected_at)
  values (p_ocm_id, auth.uid(), target.lat, target.lng,
          now() + ((r->>'claim_hours')::int || ' hours')::interval, now())
  on conflict (ocm_id) do update
    set owner = auth.uid(),
        lat = target.lat, lng = target.lng,
        claimed_at = now(),
        collected_at = now(),
        expires_at = now() + ((r->>'claim_hours')::int || ' hours')::interval;

  update public.profiles set xp = xp + 5 where id = auth.uid();

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'reason', sqlerrm);
end;
$$;

-- =============================================================================
-- 11. Gelir
-- =============================================================================

/**
 * Pasif geliri toplar.
 *
 * Tavan (max_collect_hours) bilerek var: oyunu bir hafta açmayıp devasa yığın
 * toplamak, aktif oynayanı cezalandırır. Trafo kapasitesi aşılırsa gelir
 * oransal olarak kırpılır — oyuncu istasyonu üst üste yığmak yerine
 * seviye atlamaya yönelsin.
 */
create or replace function public.collect_income()
returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  r         jsonb := game.rules();
  me        public.profiles;
  hours     numeric;
  load_kw   numeric := 0;
  capacity  numeric;
  gross     numeric := 0;
  factor    numeric := 1;
  earned    numeric;
begin
  me := game.actor();

  hours := least(
    extract(epoch from (now() - me.last_collected_at)) / 3600.0,
    (r->>'max_collect_hours')::numeric
  );

  if hours <= 0.01 then
    return jsonb_build_object('ok', true, 'earned', 0, 'over_capacity', false, 'load_kw', 0);
  end if;

  select coalesce(sum(s.power), 0),
         coalesce(sum(case when s.kind = 'AC'
                           then (r->>'income_ac_hourly')::numeric
                           else (r->>'income_dc_hourly')::numeric end), 0)
    into load_kw, gross
    from public.stations s
   where s.owner = auth.uid();

  -- Süresi dolmamış ele geçirmeler de gelir üretir.
  gross := gross + coalesce((
    select count(*) * (r->>'claim_income_hourly')::numeric
      from public.claims c
     where c.owner = auth.uid() and c.expires_at > now()
  ), 0);

  capacity := (r->>'capacity_base_kw')::numeric
            + (me.level - 1) * (r->>'capacity_step_kw')::numeric;

  if load_kw > capacity and load_kw > 0 then
    factor := capacity / load_kw;
  end if;

  earned := round(gross * hours * factor);

  update public.profiles
     set balance = balance + earned,
         last_collected_at = now()
   where id = auth.uid();

  return jsonb_build_object(
    'ok', true,
    'earned', earned,
    'over_capacity', load_kw > capacity,
    'load_kw', load_kw,
    'capacity_kw', capacity
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'reason', sqlerrm);
end;
$$;

-- =============================================================================
-- 12. Harita verisi
-- =============================================================================

create or replace function public.stations_in_bbox(
  p_min_lat double precision, p_min_lng double precision,
  p_max_lat double precision, p_max_lng double precision
) returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  return coalesce((
    select jsonb_agg(row_to_json(t))
    from (
      select s.id,
             'virtual'::text as kind,
             coalesce(p.nickname, 'oyuncu') || ' · ' || s.kind as title,
             s.lat, s.lng, s.power,
             coalesce(p.nickname, 'oyuncu') as owner,
             (s.owner = auth.uid()) as mine
        from public.stations s
        left join public.profiles p on p.id = s.owner
       where s.lat between p_min_lat and p_max_lat
         and s.lng between p_min_lng and p_max_lng

      union all

      select c.ocm_id as id,
             'real'::text as kind,
             coalesce(o.title, 'Şarj istasyonu') as title,
             c.lat, c.lng,
             coalesce(o.power, 0) as power,
             coalesce(p.nickname, 'oyuncu') as owner,
             (c.owner = auth.uid()) as mine
        from public.claims c
        left join public.profiles p on p.id = c.owner
        left join public.ocm_stations o on o.ocm_id = c.ocm_id
       where c.expires_at > now()
         and c.lat between p_min_lat and p_max_lat
         and c.lng between p_min_lng and p_max_lng
    ) t
  ), '[]'::jsonb);
end;
$$;

-- =============================================================================
-- 13. Sıralama
-- =============================================================================

create or replace view public.leaderboard
with (security_invoker = off) as
  select p.id,
         coalesce(p.nickname, 'oyuncu') as nickname,
         p.level,
         round(p.balance) as balance,
         (select count(*) from public.stations s where s.owner = p.id) as stations
    from public.profiles p
   where p.banned = false
   order by p.balance desc
   limit 20;

grant select on public.leaderboard to anon, authenticated;

-- =============================================================================
-- 14. RPC izinleri
-- =============================================================================

revoke all on function
  public.set_location_consent(boolean),
  public.delete_my_data(),
  public.record_discovery(double precision, double precision, int, text[]),
  public.cells_in_bbox(double precision, double precision, double precision, double precision),
  public.build_station(double precision, double precision, text, int, double precision, double precision),
  public.claim_station(bigint, double precision, double precision, int),
  public.collect_income(),
  public.stations_in_bbox(double precision, double precision, double precision, double precision)
  from public, anon;

grant execute on function
  public.set_location_consent(boolean),
  public.delete_my_data(),
  public.record_discovery(double precision, double precision, int, text[]),
  public.cells_in_bbox(double precision, double precision, double precision, double precision),
  public.build_station(double precision, double precision, text, int, double precision, double precision),
  public.claim_station(bigint, double precision, double precision, int),
  public.collect_income()
  to authenticated;

grant execute on function
  public.stations_in_bbox(double precision, double precision, double precision, double precision)
  to anon, authenticated;

-- =============================================================================
-- 15. 30 gün saklama
--
-- Gizlilik metninde "konum geçmişi 30 gün sonra silinir" yazıyor; bunu bir
-- işin uygulaması gerekiyor. pg_cron kuruluysa aşağıdaki blok zamanlar.
-- Kurulu değilse fonksiyonu Supabase Scheduled Function ile günlük çağırın.
-- =============================================================================

create or replace function public.purge_old_locations()
returns int language plpgsql security definer
set search_path = public, pg_temp as $$
declare removed int;
begin
  delete from public.discoveries where created_at < now() - interval '30 days';
  get diagnostics removed = row_count;

  update public.profiles
     set last_lat = null, last_lng = null, last_fix_at = null
   where last_fix_at < now() - interval '30 days';

  return removed;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-old-locations', '30 3 * * *',
                          'select public.purge_old_locations()');
  else
    raise notice 'pg_cron yok — purge_old_locations() gunluk zamanlanmali.';
  end if;
end;
$$;
