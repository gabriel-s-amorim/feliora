-- Pedidos do site — itens referenciam variant_id + snapshots

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  cart_id uuid references public.carts(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'canceled')),
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  shipping_amount numeric(10, 2) not null default 0 check (shipping_amount >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  coupon_code text,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_method text
    check (payment_method is null or payment_method in ('pix', 'credit_card', 'boleto')),
  payment_status text not null default 'pending'
    check (payment_status in (
      'pending', 'processing', 'approved', 'rejected',
      'canceled', 'expired', 'refunded'
    )),
  external_reference text unique,
  mercado_pago_order_id text,
  mercado_pago_payment_id text,
  payment_status_detail text,
  payment_expires_at timestamptz,
  paid_at timestamptz,
  payment_instructions jsonb,
  shipping_quote_id uuid,
  shipping_service_id text,
  shipping_service_name text,
  shipping_company text,
  shipping_delivery_days integer,
  shipping_environment text,
  shipping_quote_snapshot jsonb,
  shipping_recipient jsonb,
  fulfillment_status text not null default 'unfulfilled'
    check (fulfillment_status in (
      'unfulfilled', 'processing', 'shipped', 'delivered', 'canceled'
    )),
  tracking_code text,
  tracking_url text,
  processing_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0),
  product_name text not null,
  product_slug text not null,
  image text not null default '',
  sku text not null default '',
  size_label text not null,
  color_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_own_select" on public.orders;
create policy "orders_own_select"
  on public.orders for select
  to authenticated
  using (auth.uid() = customer_id);

drop policy if exists "order_items_own_select" on public.order_items;
create policy "order_items_own_select"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );
