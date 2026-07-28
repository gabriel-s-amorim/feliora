-- Categorias — somente via cadastro (admin). Sem seed hardcoded de nomes.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists categories_slug_unique_idx
  on public.categories (lower(slug));

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order asc, name asc);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true);

-- Escrita apenas via service role (bypassa RLS). Sem policies de insert/update/delete públicas.
