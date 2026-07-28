-- Banners, settings, content pages, reviews, marketing, admin_users

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  alt_text text not null default 'Banner Feliora',
  image_url text not null,
  image_url_mobile text,
  link_url text,
  object_position text not null default 'center center',
  object_position_mobile text not null default 'center center',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_active_sort_idx
  on public.banners (is_active, sort_order asc);

drop trigger if exists trg_banners_updated_at on public.banners;
create trigger trg_banners_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

alter table public.banners enable row level security;

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read"
  on public.banners for select
  to anon, authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  contact_email text not null default '',
  whatsapp_number text not null default '',
  whatsapp_display text not null default '',
  address_line text not null default '',
  instagram_url text not null default '',
  facebook_url text not null default '',
  tiktok_url text not null default '',
  twitter_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (true)
on conflict (id) do nothing;

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

drop policy if exists "store_settings_public_read" on public.store_settings;
create policy "store_settings_public_read"
  on public.store_settings for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------

create table if not exists public.content_pages (
  slug text primary key,
  title text not null,
  seo_title text not null default '',
  seo_description text not null default '',
  page_type text not null check (page_type in ('howto', 'sections', 'faq')),
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_content_pages_updated_at on public.content_pages;
create trigger trg_content_pages_updated_at
before update on public.content_pages
for each row execute function public.set_updated_at();

alter table public.content_pages enable row level security;

drop policy if exists "content_pages_public_read" on public.content_pages;
create policy "content_pages_public_read"
  on public.content_pages for select
  to anon, authenticated
  using (is_published = true);

-- Seed mínimo LGPD (editável no admin depois)
insert into public.content_pages (
  slug, title, seo_title, seo_description, page_type, content, is_published
)
values (
  'privacidade',
  'Política de Privacidade',
  'Política de Privacidade — Feliora',
  'Como a Feliora trata dados pessoais e cookies, em conformidade com a LGPD.',
  'sections',
  '{"sections":[{"heading":"Introdução","body":"Esta política descreve como coletamos e usamos dados na loja Feliora. Substitua este texto pelo conteúdo jurídico definitivo."}]}'::jsonb,
  true
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id, is_approved);

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read"
  on public.product_reviews for select
  to anon, authenticated
  using (is_approved = true);

-- ---------------------------------------------------------------------------

create table if not exists public.marketing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed')),
  source text not null default 'website',
  consent_at timestamptz not null,
  consent_source text not null default 'newsletter_form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists marketing_subscriptions_email_idx
  on public.marketing_subscriptions (lower(email));

alter table public.marketing_subscriptions enable row level security;

-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  name text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_idx
  on public.admin_users (lower(email));

alter table public.admin_users enable row level security;
-- Sem policies públicas — acesso só service role
