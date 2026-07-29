set client_min_messages = notice;
do $$
declare
  alice uuid := '11111111-1111-1111-1111-111111111111';
  msg text;
begin
  perform set_config('request.jwt.claim.sub', alice::text, false);

  -- authenticated rolüne geç: gerçek istemcinin yetkisi bu
  set local role authenticated;

  begin
    update public.profiles set balance = 999999 where id = alice;
    raise exception 'FAIL: istemci bakiyeyi güncelleyebildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci bakiyeyi doğrudan güncelleyemiyor';
  end;

  begin
    update public.profiles set level = 99 where id = alice;
    raise exception 'FAIL: istemci seviyeyi güncelleyebildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci seviyeyi doğrudan güncelleyemiyor';
  end;

  begin
    update public.profiles set banned = false where id = alice;
    raise exception 'FAIL: istemci ban durumunu değiştirebildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci ban durumunu değiştiremiyor';
  end;

  begin
    insert into public.stations (owner, kind, power, lat, lng)
    values (alice, 'DC', 150, 40.99, 29.02);
    raise exception 'FAIL: istemci doğrudan istasyon ekleyebildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci doğrudan istasyon ekleyemiyor';
  end;

  begin
    insert into public.discoveries (user_id, cell, lat, lng)
    values (alice, '881e30c6a7fffff', 40.99, 29.02);
    raise exception 'FAIL: istemci doğrudan keşif ekleyebildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci doğrudan keşif ekleyemiyor';
  end;

  begin
    insert into public.ocm_stations (ocm_id, lat, lng) values (7, 40.99, 29.02);
    raise exception 'FAIL: istemci ayna tabloya yazabildi';
  exception when insufficient_privilege then
    raise notice '  OK   istemci OCM ayna tablosuna yazamıyor';
  end;

  -- Takma ad izinli tek sütun
  update public.profiles set nickname = 'alice' where id = alice;
  raise notice '  OK   takma ad güncellenebiliyor (izinli tek sütun)';

  -- Başkasının profili görünmemeli
  perform set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
  if exists (select 1 from public.profiles where id = alice) then
    raise exception 'FAIL: başka kullanıcının profili okunabiliyor';
  end if;
  raise notice '  OK   başka kullanıcının profili RLS ile gizli';

  reset role;
  raise notice ' ';
  raise notice 'RLS TESTLERİ GEÇTİ';
end;
$$;
