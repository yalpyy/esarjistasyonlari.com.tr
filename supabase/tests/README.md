# Şema testleri

Supabase'e yüklemeden önce kuralları yerel Postgres'te doğrular. Supabase
hesabı gerekmiyor; `auth.users` ve `auth.uid()` yerel olarak taklit ediliyor
(`00-auth-stub.sql`).

```bash
# Postgres 16 gerekli
export PATH=/usr/lib/postgresql/16/bin:$PATH
initdb -D /var/tmp/pgdata -A trust -U postgres
pg_ctl -D /var/tmp/pgdata -o "-k /var/tmp -p 55432 -c listen_addresses=''" start

P="psql -h /var/tmp -p 55432 -U postgres -q -v ON_ERROR_STOP=1"
$P -f supabase/tests/00-auth-stub.sql
$P -f supabase/schema.sql
psql -h /var/tmp -p 55432 -U postgres -f supabase/tests/01-rules.test.sql
psql -h /var/tmp -p 55432 -U postgres -f supabase/tests/02-rls.test.sql
```

`01-rules.test.sql` (47 kontrol) ekonomiyi sınar: rıza kapısı, GPS doğruluğu,
menzil, minimum aralık, kota, bakiye, ışınlanma, keşif filtreleri, ele geçirme
mesafesi, gelir hesabı, trafo aşımı, saklama süresi.

`02-rls.test.sql` (8 kontrol) istemcinin doğrudan yazamadığını sınar: bakiye,
seviye, ban, istasyon, keşif ve OCM ayna tablosu.

Not: testler `client_min_messages = notice` ile çalışır; NOTICE bastırılırsa
başarılı koşu sessiz görünür ve "çıktı yok" yanlışlıkla "test yok" sanılır.
