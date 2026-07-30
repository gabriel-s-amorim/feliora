-- Clientes (perfil + endereços) — acoplado ao Supabase Auth

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  label text not null default 'Principal',
  cep text not null,
  rua text not null,
  numero text not null,
  complemento text not null default '',
  bairro text not null,
  cidade text not null,
  estado text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_customer_id_idx
  on public.customer_addresses (customer_id);

create unique index if not exists customer_addresses_one_default_idx
  on public.customer_addresses (customer_id)
  where is_default = true;

drop trigger if exists trg_customer_profiles_updated_at on public.customer_profiles;
create trigger trg_customer_profiles_updated_at
before update on public.customer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_customer_addresses_updated_at on public.customer_addresses;
create trigger trg_customer_addresses_updated_at
before update on public.customer_addresses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      ''
    ),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_customer();

alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;

drop policy if exists "customer_profiles_own_select" on public.customer_profiles;
create policy "customer_profiles_own_select"
  on public.customer_profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "customer_profiles_own_update" on public.customer_profiles;
create policy "customer_profiles_own_update"
  on public.customer_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "customer_addresses_own_all" on public.customer_addresses;
create policy "customer_addresses_own_select"
  on public.customer_addresses for select
  to authenticated
  using (auth.uid() = customer_id);

create policy "customer_addresses_own_insert"
  on public.customer_addresses for insert
  to authenticated
  with check (auth.uid() = customer_id);

create policy "customer_addresses_own_update"
  on public.customer_addresses for update
  to authenticated
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "customer_addresses_own_delete"
  on public.customer_addresses for delete
  to authenticated
  using (auth.uid() = customer_id);
