-- Fix 403: upsert de perfil no client precisa de INSERT
drop policy if exists "customer_profiles_own_insert" on public.customer_profiles;
create policy "customer_profiles_own_insert"
  on public.customer_profiles for insert
  to authenticated
  with check (auth.uid() = id);
