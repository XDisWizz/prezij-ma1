-- Obrana do hloubky (reakce na Security Advisor, lint 0029):
-- get_progress a put_progress běží s právy volajícího (SECURITY INVOKER), takže je navíc hlídá RLS:
-- i kdyby funkce měla chybu, databáze přihlášenému uživateli nedovolí sáhnout na cizí řádek.
--
-- Schéma `private` dál NENÍ vystavené přes Data API (Exposed schemas = jen `api`),
-- takže přímý přístup k tabulce přes REST není možný; práva níž platí jen uvnitř funkcí.
-- DELETE právo uživatel nemá vůbec – mazání jde jen přes api.delete_my_account().
--
-- api.delete_my_account() zůstává SECURITY DEFINER záměrně: maže z auth.users, kam uživatel
-- sám nesmí. Maže výhradně řádek auth.uid(), žádný parametr nepřijímá.

grant usage on schema private to authenticated;
grant select, insert, update on table private.progress to authenticated;

drop policy if exists progress_select_own on private.progress;
drop policy if exists progress_insert_own on private.progress;
drop policy if exists progress_update_own on private.progress;

create policy progress_select_own on private.progress
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy progress_insert_own on private.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy progress_update_own on private.progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter function api.get_progress(integer) security invoker;
alter function api.put_progress(jsonb, integer) security invoker;

notify pgrst, 'reload schema';
