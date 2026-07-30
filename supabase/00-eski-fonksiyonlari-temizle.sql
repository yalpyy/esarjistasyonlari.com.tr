-- ACİL TEMİZLİK — tek başına çalıştırılabilir.
--
-- schema.sql "cannot remove parameter defaults from existing function" (42P13)
-- ya da "function is not unique" veriyorsa bunu bir kez çalıştır, sonra
-- schema.sql'i baştan çalıştır.
--
-- Aynı blok schema.sql'in EN BAŞINDA da var; ayrı dosya olmasının tek sebebi,
-- dosyanın tamamını kopyalayamadığın durumda tek başına yapıştırabilmen.
--
-- Yalnızca oyunun kendi fonksiyonlarını siler. Tabloya, veriye dokunmaz.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where (n.nspname = 'public' and p.proname in (
             'set_location_consent', 'delete_my_data', 'record_discovery',
             'cells_in_bbox', 'build_station', 'claim_station',
             'collect_income', 'stations_in_bbox', 'purge_old_locations',
             'handle_new_user'))
        or (n.nspname = 'game' and p.proname in (
             'rules', 'distance_m', 'actor', 'assert_fix'))
  loop
    raise notice 'düşürülüyor: %', f.sig;
    execute format('drop function if exists %s cascade', f.sig);
  end loop;
end;
$$;
