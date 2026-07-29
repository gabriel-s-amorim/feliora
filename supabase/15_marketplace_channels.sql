-- Canais Shopee + TikTok Shop: credenciais, links, jobs e pedidos (idempotência)

-- ─── Settings por canal ──────────────────────────────────────────────────────

create table if not exists public.marketplace_channel_settings (
  channel text primary key check (channel in ('shopee', 'tiktok')),
  enabled boolean not null default false,
  -- Shopee: partner_id (numérico como text) + partner_key
  -- TikTok: app_key + app_secret + service_id
  partner_id text not null default '',
  partner_key_encrypted text,
  app_key text not null default '',
  app_secret_encrypted text,
  service_id text not null default '',
  shop_id text not null default '',
  shop_cipher text not null default '',
  shop_name text not null default '',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  refresh_expires_at timestamptz,
  webhook_secret_encrypted text,
  redirect_uri text not null default '',
  warehouse_id text not null default '',
  connected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.marketplace_channel_settings (channel)
values ('shopee'), ('tiktok')
on conflict (channel) do nothing;

alter table public.marketplace_channel_settings enable row level security;

drop trigger if exists marketplace_channel_settings_updated_at
  on public.marketplace_channel_settings;
create trigger marketplace_channel_settings_updated_at
  before update on public.marketplace_channel_settings
  for each row execute function public.set_updated_at();

-- ─── Mapeamento de categorias ────────────────────────────────────────────────

create table if not exists public.marketplace_category_maps (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('shopee', 'tiktok')),
  feliora_category_id uuid not null references public.categories(id) on delete cascade,
  external_category_id text not null,
  external_category_name text not null default '',
  attributes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, feliora_category_id)
);

create index if not exists marketplace_category_maps_channel_idx
  on public.marketplace_category_maps (channel);

alter table public.marketplace_category_maps enable row level security;

drop trigger if exists marketplace_category_maps_updated_at
  on public.marketplace_category_maps;
create trigger marketplace_category_maps_updated_at
  before update on public.marketplace_category_maps
  for each row execute function public.set_updated_at();

-- ─── Links produto ↔ marketplace ─────────────────────────────────────────────

create table if not exists public.marketplace_product_links (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('shopee', 'tiktok')),
  product_id bigint not null references public.products(id) on delete cascade,
  external_item_id text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'listed', 'error', 'unlinked')),
  last_error text,
  last_synced_at timestamptz,
  remote_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, product_id)
);

create index if not exists marketplace_product_links_external_idx
  on public.marketplace_product_links (channel, external_item_id)
  where external_item_id <> '';

alter table public.marketplace_product_links enable row level security;

drop trigger if exists marketplace_product_links_updated_at
  on public.marketplace_product_links;
create trigger marketplace_product_links_updated_at
  before update on public.marketplace_product_links
  for each row execute function public.set_updated_at();

-- ─── Links variante ↔ SKU remoto ─────────────────────────────────────────────

create table if not exists public.marketplace_variant_links (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('shopee', 'tiktok')),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  product_link_id uuid not null references public.marketplace_product_links(id) on delete cascade,
  external_model_id text not null default '',
  external_sku_id text not null default '',
  external_sku text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, variant_id)
);

create index if not exists marketplace_variant_links_external_sku_idx
  on public.marketplace_variant_links (channel, external_sku)
  where external_sku <> '';

create index if not exists marketplace_variant_links_external_sku_id_idx
  on public.marketplace_variant_links (channel, external_sku_id)
  where external_sku_id <> '';

alter table public.marketplace_variant_links enable row level security;

drop trigger if exists marketplace_variant_links_updated_at
  on public.marketplace_variant_links;
create trigger marketplace_variant_links_updated_at
  before update on public.marketplace_variant_links
  for each row execute function public.set_updated_at();

-- ─── Jobs de sync ────────────────────────────────────────────────────────────

create table if not exists public.marketplace_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  channel text check (channel in ('shopee', 'tiktok')),
  job_type text not null
    check (job_type in ('import', 'export', 'price', 'stock', 'full')),
  direction text not null default 'outbound'
    check (direction in ('inbound', 'outbound', 'both')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed', 'partial')),
  progress int not null default 0 check (progress between 0 and 100),
  total_items int not null default 0,
  done_items int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_sync_jobs_created_idx
  on public.marketplace_sync_jobs (created_at desc);

alter table public.marketplace_sync_jobs enable row level security;

drop trigger if exists marketplace_sync_jobs_updated_at
  on public.marketplace_sync_jobs;
create trigger marketplace_sync_jobs_updated_at
  before update on public.marketplace_sync_jobs
  for each row execute function public.set_updated_at();

-- ─── Pedidos marketplace (idempotência de baixa de estoque) ──────────────────

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('shopee', 'tiktok')),
  external_order_id text not null,
  status text not null default 'paid',
  stock_decremented_at timestamptz,
  stock_restored_at timestamptz,
  line_items jsonb not null default '[]'::jsonb,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_order_id)
);

create index if not exists marketplace_orders_channel_created_idx
  on public.marketplace_orders (channel, created_at desc);

alter table public.marketplace_orders enable row level security;

drop trigger if exists marketplace_orders_updated_at
  on public.marketplace_orders;
create trigger marketplace_orders_updated_at
  before update on public.marketplace_orders
  for each row execute function public.set_updated_at();
