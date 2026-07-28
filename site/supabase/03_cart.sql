-- Carrinho — guest (session_id) ou cliente (customer_id); itens por variant_id

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete cascade,
  session_id text,
  status text not null default 'active' check (status in ('active', 'converted')),
  coupon_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (
    (customer_id is not null and session_id is null)
    or (customer_id is null and session_id is not null)
  )
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  product_name text not null,
  product_slug text not null,
  product_image text not null,
  sku text not null,
  size_label text not null,
  color_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create unique index if not exists carts_active_customer_idx
  on public.carts (customer_id)
  where status = 'active' and customer_id is not null;

create unique index if not exists carts_active_session_idx
  on public.carts (session_id)
  where status = 'active' and session_id is not null;

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);
create index if not exists cart_items_variant_id_idx on public.cart_items (variant_id);

drop trigger if exists trg_carts_updated_at on public.carts;
create trigger trg_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
-- Acesso via Route Handlers (service role). Sem policies públicas de escrita.
