-- Testy izolacji RLS dla public.user_exclusions.
-- Cały plik działa w jednej transakcji zakończonej rollback: nie zostawia danych.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

-- Dwóch użytkowników testowych
insert into auth.users (id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'user-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-b@example.test');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_exclusions'::regclass),
  'RLS jest włączone na public.user_exclusions'
);

-- ===== Użytkownik A =====
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.user_exclusions (product_id) values ('mleko-krowie') $$,
  'A dodaje własne wykluczenie (user_id z auth.uid())'
);

select throws_ok(
  $$ insert into public.user_exclusions (user_id, product_id)
     values ('22222222-2222-2222-2222-222222222222', 'jajka') $$,
  '42501',
  null,
  'A nie może dodać wiersza z user_id B'
);

select throws_ok(
  $$ insert into public.user_exclusions (product_id) values ('mleko-krowie') $$,
  '23505',
  null,
  'Duplikat (user_id, product_id) jest odrzucany'
);

select throws_ok(
  $$ insert into public.user_exclusions (product_id) values ('Mleko krowie') $$,
  '23514',
  null,
  'Slug niezgodny z formatem jest odrzucany przez CHECK'
);

select results_eq(
  $$ select user_id, product_id from public.user_exclusions $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'mleko-krowie'::text) $$,
  'A widzi tylko swoje wiersze'
);

select is_empty(
  $$ update public.user_exclusions set product_id = 'orzechy'
     where product_id = 'mleko-krowie' returning 1 $$,
  'Update własnego wiersza przez A nie zmienia żadnego wiersza (brak polityki update)'
);

-- ===== Użytkownik B =====
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select lives_ok(
  $$ insert into public.user_exclusions (product_id) values ('jajka') $$,
  'B dodaje własne wykluczenie'
);

select results_eq(
  $$ select product_id from public.user_exclusions $$,
  $$ values ('jajka'::text) $$,
  'B nie widzi wierszy A'
);

select is_empty(
  $$ delete from public.user_exclusions
     where user_id = '11111111-1111-1111-1111-111111111111' returning 1 $$,
  'Delete wykonany przez B nie usuwa wiersza A'
);

select is_empty(
  $$ update public.user_exclusions set product_id = 'orzechy'
     where user_id = '11111111-1111-1111-1111-111111111111' returning 1 $$,
  'Update wykonany przez B nie zmienia wiersza A'
);

-- ===== anon =====
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is_empty(
  $$ select 1 from public.user_exclusions $$,
  'anon nie widzi żadnych wierszy'
);

select throws_ok(
  $$ insert into public.user_exclusions (user_id, product_id)
     values ('11111111-1111-1111-1111-111111111111', 'orzechy') $$,
  '42501',
  null,
  'anon nie może dodać wiersza'
);

-- ===== Weryfikacja jako właściciel bazy (bez RLS) =====
reset role;

select results_eq(
  $$ select product_id from public.user_exclusions
     where user_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('mleko-krowie'::text) $$,
  'Wiersz A nadal istnieje i jest niezmieniony po delete/update B i update A'
);

select is(
  (select count(*)::int from public.user_exclusions
   where user_id = '22222222-2222-2222-2222-222222222222'),
  1,
  'B ma dokładnie jeden wiersz (insert A z user_id B nie przeszedł)'
);

select is(
  (select count(*)::int from public.user_exclusions),
  2,
  'Tabela zawiera tylko dwa oczekiwane wiersze (anon niczego nie dodał)'
);

select * from finish();

rollback;
