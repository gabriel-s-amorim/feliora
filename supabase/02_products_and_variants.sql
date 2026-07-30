-- Produtos + variantes (estoque real = product_variants)

create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text not null,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  image text not null default '',
  images jsonb not null default '[]'::jsonb,
  badge text not null default '',
  badge_color text not null default '#B76E79',
  featured boolean not null default false,
  is_new boolean not null default false,
  short_description text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  description text not null default '',
  materials jsonb not null default '[]'::jsonb,
  care_instructions jsonb not null default '[]'::jsonb,
  -- Metadados de exibição (ordem dos swatches). Estoque NÃO vive aqui.
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  in_stock boolean not null default false,
  stock_count integer not null default 0 check (stock_count >= 0),
  width_cm numeric(8, 2),
  height_cm numeric(8, 2),
  length_cm numeric(8, 2),
  weight_kg numeric(8, 3),
  faq jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  rating_avg numeric(2, 1) not null default 0,
  reviews_count integer not null default 0 check (reviews_count >= 0),
  search_vector tsvector,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists products_slug_unique_idx
  on public.products (lower(slug));

create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (featured) where featured = true;
create index if not exists products_active_idx on public.products (is_active) where is_active = true;
create index if not exists products_search_vector_idx on public.products using gin (search_vector);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Variantes: unidade vendável (produto × tamanho × cor)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  size_label text not null,
  color_name text not null default '',
  sku text not null,
  stock_count integer not null default 0 check (stock_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_size_not_empty check (length(trim(size_label)) > 0)
);

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (lower(sku));

create unique index if not exists product_variants_combo_unique_idx
  on public.product_variants (product_id, lower(size_label), lower(color_name));

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists product_variants_active_idx
  on public.product_variants (product_id, is_active)
  where is_active = true;

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

-- Mantém agregados do produto a partir das variantes
create or replace function public.sync_product_stock_from_variants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id bigint;
  v_sum integer;
  v_any boolean;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  select
    coalesce(sum(stock_count), 0),
    coalesce(bool_or(stock_count > 0 and is_active), false)
  into v_sum, v_any
  from public.product_variants
  where product_id = v_product_id
    and is_active = true;

  update public.products
  set
    stock_count = v_sum,
    in_stock = v_any,
    updated_at = now()
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_variants_sync_stock on public.product_variants;
create trigger trg_variants_sync_stock
after insert or update or delete on public.product_variants
for each row execute function public.sync_product_stock_from_variants();

-- search_vector
create or replace function public.products_refresh_search_vector()
returns trigger
language plpgsql
as $$
declare
  v_category_name text := '';
begin
  if new.category_id is not null then
    select name into v_category_name
    from public.categories
    where id = new.category_id;
  end if;

  new.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(new.name, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(new.seo_title, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(new.short_description, '')), 'B')
    || setweight(to_tsvector('portuguese', coalesce(new.seo_description, '')), 'B')
    || setweight(to_tsvector('portuguese', coalesce(v_category_name, '')), 'C');

  return new;
end;
$$;

drop trigger if exists trg_products_search_vector on public.products;
create trigger trg_products_search_vector
before insert or update of name, short_description, seo_title, seo_description, category_id on public.products
for each row execute function public.products_refresh_search_vector();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read"
  on public.product_variants
  for select
  to anon, authenticated
  using (is_active = true);
