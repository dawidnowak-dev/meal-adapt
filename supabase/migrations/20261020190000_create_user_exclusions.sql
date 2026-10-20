-- Wykluczenia produktów przypisane do właściciela.
-- Tylko właściciel może czytać, dodawać i usuwać swoje wiersze; brak polityki update.

create table public.user_exclusions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id text not null
    constraint user_exclusions_product_id_slug_check
    check (product_id ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

comment on table public.user_exclusions is
  'Wykluczenia produktów użytkownika. product_id odnosi się do selectableExclusionIds katalogu JSON (src/data/meal-catalog.v1.json); wybieralność produktu waliduje API, nie baza.';

alter table public.user_exclusions enable row level security;

-- authenticated: tylko własne wiersze
create policy "user_exclusions_select_own_authenticated"
  on public.user_exclusions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "user_exclusions_insert_own_authenticated"
  on public.user_exclusions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "user_exclusions_delete_own_authenticated"
  on public.user_exclusions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- anon: brak dostępu
create policy "user_exclusions_select_anon"
  on public.user_exclusions
  for select
  to anon
  using (false);

create policy "user_exclusions_insert_anon"
  on public.user_exclusions
  for insert
  to anon
  with check (false);

create policy "user_exclusions_delete_anon"
  on public.user_exclusions
  for delete
  to anon
  using (false);
