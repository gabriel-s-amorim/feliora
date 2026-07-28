-- Cupons (sem is_map_reward — feature excluída da Feliora)

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null check (type in ('percentage', 'fixed', 'free_shipping')),
  value numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  min_subtotal numeric(10, 2) check (min_subtotal is null or min_subtotal >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  max_uses_per_customer integer check (max_uses_per_customer is null or max_uses_per_customer > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint coupons_value_by_type_check check (
    (type = 'percentage' and value > 0 and value <= 100)
    or (type = 'fixed' and value >= 0)
    or (type = 'free_shipping' and value >= 0)
  )
);

create unique index if not exists coupons_code_lower_idx
  on public.coupons (lower(code));

create index if not exists coupons_active_idx
  on public.coupons (is_active)
  where is_active = true;

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;
-- Sem SELECT público — validação via API (service role)
