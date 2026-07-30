-- Kurulum teşhisi. Supabase SQL Editor'de çalıştırıp çıktıyı paylaş.
-- Hiçbir şeyi değiştirmez, yalnızca okur.

select 'tablolar' as bolum, tablename as ad, '' as detay
  from pg_tables where schemaname = 'public'
   and tablename in ('profiles','discoveries','stations','claims','ocm_stations')

union all
select 'sütunlar', table_name || '.' || column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name in ('profiles','discoveries','stations','claims','ocm_stations')

union all
select 'fonksiyonlar', p.proname, pg_get_function_identity_arguments(p.oid)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('set_location_consent','delete_my_data','record_discovery',
                     'cells_in_bbox','build_station','claim_station',
                     'collect_income','stations_in_bbox','purge_old_locations')

union all
select 'politikalar', tablename || ': ' || policyname, cmd
  from pg_policies where schemaname = 'public'
   and tablename in ('profiles','discoveries','stations','claims','ocm_stations')

order by 1, 2;
