-- Přežij MA1: synchronizace pokroku.
--
-- Bezpečnostní model (kód i tohle schéma jsou veřejné, publishable klíč je veřejný):
--  * tabulka žije ve schématu `private`, které Data API nevystavuje → nejde ji číst/filtrovat přes REST,
--  * ven jsou jen 3 funkce ve schématu `api` (Data API → Exposed schemas = jen `api`),
--  * funkce smí volat jen přihlášený uživatel (role `authenticated`) a vždy pracují jen s řádkem
--    `auth.uid()` z podepsaného JWT – id uživatele se nikdy nebere z parametru,
--  * 1 řádek na účet, max. 64 kB, max. 1 zápis za 10 s, krátký statement_timeout.
--
-- Chybové kódy PTxxx PostgREST překládá přímo na HTTP status xxx.

create schema if not exists private;
create schema if not exists api;

create table if not exists private.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  version    integer     not null default 1,
  updated_at timestamptz not null default now(),
  constraint progress_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint progress_data_size      check (octet_length(data::text) <= 65536)
);

-- pojistka: i kdyby se schéma omylem vystavilo, RLS bez politik nepustí nic
alter table private.progress enable row level security;
alter table private.progress force row level security;

revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;

-- ---------------------------------------------------------------- čtení
-- Když klient už zná aktuální verzi, vrátí se jen číslo verze (data = null) → minimální přenos.
create or replace function api.get_progress(known_version integer default 0)
returns table (version integer, data jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select p.version,
         case when p.version = known_version then null else p.data end
  from private.progress p
  where p.user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------- zápis
-- Vrací novou verzi. Záporné číslo = konflikt (|n| je aktuální verze na serveru):
-- klient si data stáhne, sloučí a zkusí to znovu.
create or replace function api.put_progress(new_data jsonb, base_version integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  cur private.progress;
begin
  if uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'unauthorized' using errcode = 'PT401';
  end if;
  if new_data is null or jsonb_typeof(new_data) <> 'object' then
    raise exception 'payload must be an object' using errcode = 'PT400';
  end if;
  if octet_length(new_data::text) > 65536 then
    raise exception 'payload too large' using errcode = 'PT413';
  end if;

  select * into cur from private.progress where user_id = uid for update;

  if not found then
    insert into private.progress (user_id, data) values (uid, new_data)
    on conflict (user_id) do nothing;
    if found then
      return 1;
    end if;
    -- souběžný první zápis z jiného zařízení → ať si klient stáhne a sloučí
    select * into cur from private.progress where user_id = uid;
    return -cur.version;
  end if;

  if cur.updated_at > now() - interval '10 seconds' then
    raise exception 'too many writes' using errcode = 'PT429';
  end if;

  if cur.version <> base_version then
    return -cur.version;
  end if;

  update private.progress
     set data = new_data, version = cur.version + 1, updated_at = now()
   where user_id = uid;
  return cur.version + 1;
end;
$$;

-- ---------------------------------------------------------------- smazání účtu (GDPR)
-- Smaže uživatele z auth.users; řádek s pokrokem zmizí přes ON DELETE CASCADE.
create or replace function api.delete_my_account()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'unauthorized' using errcode = 'PT401';
  end if;
  delete from auth.users where id = uid;
end;
$$;

-- ---------------------------------------------------------------- práva
revoke all on schema api from public, anon;
revoke all on all functions in schema api from public, anon, authenticated;
alter default privileges in schema api revoke execute on functions from public, anon, authenticated;

grant usage on schema api to authenticated;
grant execute on function api.get_progress(integer)          to authenticated;
grant execute on function api.put_progress(jsonb, integer)   to authenticated;
grant execute on function api.delete_my_account()            to authenticated;

-- ---------------------------------------------------------------- menší povrch útoku
alter role authenticated set statement_timeout = '3s';
alter role anon          set statement_timeout = '1s';

-- GraphQL nepoužíváme
drop extension if exists pg_graphql;

-- PostgREST ať si znovu načte schéma
notify pgrst, 'reload schema';
