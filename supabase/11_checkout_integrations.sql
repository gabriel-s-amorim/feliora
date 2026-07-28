-- Fase 6: Mercado Pago + Melhor Envio + RPCs de checkout
-- Baixa de estoque no approve via private.decrement_variant_stock (variant_id)

-- ─── Mercado Pago ────────────────────────────────────────────────────────────

create table if not exists public.mercado_pago_settings (
  environment text primary key check (environment in ('test', 'production')),
  enabled boolean not null default false,
  public_key text not null default '',
  access_token_encrypted text,
  webhook_secret_encrypted text,
  pix_enabled boolean not null default true,
  boleto_enabled boolean not null default true,
  credit_card_enabled boolean not null default true,
  max_installments int not null default 12 check (max_installments between 1 and 12),
  boleto_expiration_days int not null default 3 check (boleto_expiration_days between 1 and 30),
  updated_at timestamptz not null default now()
);

insert into public.mercado_pago_settings (environment)
values ('test'), ('production')
on conflict (environment) do nothing;

alter table public.mercado_pago_settings enable row level security;

create unique index if not exists orders_external_reference_idx
  on public.orders (external_reference) where external_reference is not null;
create unique index if not exists orders_mercado_pago_order_id_idx
  on public.orders (mercado_pago_order_id) where mercado_pago_order_id is not null;

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  idempotency_key uuid not null unique,
  environment text not null check (environment in ('test', 'production')),
  payment_method text not null check (payment_method in ('pix', 'credit_card', 'boleto')),
  mercado_pago_order_id text unique,
  mercado_pago_payment_id text,
  status text not null default 'pending',
  status_detail text,
  request_payload jsonb,
  response_payload jsonb,
  error_payload jsonb,
  accepted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_attempts_order_id_idx
  on public.payment_attempts (order_id);
alter table public.payment_attempts enable row level security;

-- ─── Melhor Envio ────────────────────────────────────────────────────────────

create table if not exists public.melhor_envio_settings (
  id text primary key default 'default' check (id = 'default'),
  environment text not null default 'production'
    check (environment in ('production', 'sandbox')),
  production_client_id text not null default '',
  production_client_secret text not null default '',
  production_access_token text,
  production_refresh_token text,
  production_token_expires_at timestamptz,
  sandbox_client_id text not null default '',
  sandbox_client_secret text not null default '',
  sandbox_access_token text,
  sandbox_refresh_token text,
  sandbox_token_expires_at timestamptz,
  redirect_uri text not null default '',
  user_agent text not null default 'Feliora (contato@feliora.com.br)',
  origin_postal_code text not null default '',
  default_width_cm numeric(8, 2) not null default 20,
  default_height_cm numeric(8, 2) not null default 15,
  default_length_cm numeric(8, 2) not null default 10,
  default_weight_kg numeric(8, 3) not null default 0.5,
  free_shipping_enabled boolean not null default true,
  free_shipping_threshold numeric(10, 2) not null default 299
    check (free_shipping_threshold > 0),
  sender_name text not null default '',
  sender_email text not null default '',
  sender_phone text not null default '',
  sender_document_type text not null default 'cpf'
    check (sender_document_type in ('cpf', 'cnpj')),
  sender_document text not null default '',
  sender_state_register text not null default 'ISENTO',
  sender_address text not null default '',
  sender_number text not null default '',
  sender_complement text not null default '',
  sender_district text not null default '',
  sender_city text not null default '',
  sender_state_abbr text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.melhor_envio_settings enable row level security;

insert into public.melhor_envio_settings (id)
values ('default')
on conflict (id) do nothing;

create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete cascade,
  cart_id uuid references public.carts(id) on delete cascade,
  environment text not null check (environment in ('production', 'sandbox')),
  from_postal_code text not null,
  to_postal_code text not null,
  subtotal numeric(10, 2) not null,
  free_shipping_applied boolean not null default false,
  request_payload jsonb not null,
  response_payload jsonb not null,
  options jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index if not exists shipping_quotes_customer_created_idx
  on public.shipping_quotes (customer_id, created_at desc);
create index if not exists shipping_quotes_cart_created_idx
  on public.shipping_quotes (cart_id, created_at desc);
alter table public.shipping_quotes enable row level security;

-- FK opcional: shipping_quote_id já existe em orders; garante referência
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_shipping_quote_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_shipping_quote_id_fkey
      foreign key (shipping_quote_id) references public.shipping_quotes(id)
      on delete set null;
  end if;
exception
  when others then null;
end $$;

create table if not exists public.melhor_envio_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  volume_index int not null default 0 check (volume_index >= 0),
  environment text not null check (environment in ('production', 'sandbox')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'in_cart', 'failed')),
  melhor_envio_cart_id text,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, volume_index)
);

create unique index if not exists melhor_envio_shipments_cart_id_idx
  on public.melhor_envio_shipments (melhor_envio_cart_id)
  where melhor_envio_cart_id is not null;
alter table public.melhor_envio_shipments enable row level security;

-- ─── Cupom ───────────────────────────────────────────────────────────────────

create or replace function public.increment_coupon_usage(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set usage_count = usage_count + 1,
      updated_at = now()
  where lower(code) = lower(trim(p_code))
    and is_active = true;
end;
$$;

revoke all on function public.increment_coupon_usage(text) from public;
revoke all on function public.increment_coupon_usage(text) from anon, authenticated;
grant execute on function public.increment_coupon_usage(text) to service_role;

-- ─── RPC checkout create ─────────────────────────────────────────────────────

create or replace function public.checkout_create_payment_order(
  p_customer_id uuid,
  p_cart_id uuid,
  p_total_amount numeric,
  p_shipping_amount numeric,
  p_coupon_code text,
  p_shipping_address jsonb,
  p_payment_method text,
  p_items jsonb,
  p_idempotency_key uuid,
  p_environment text,
  p_shipping_quote_id uuid,
  p_shipping_service_id text,
  p_shipping_service_name text,
  p_shipping_company text,
  p_shipping_delivery_days int,
  p_shipping_environment text,
  p_shipping_quote_snapshot jsonb,
  p_shipping_recipient jsonb,
  p_discount_amount numeric default 0
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts%rowtype;
  v_order public.orders%rowtype;
  v_item jsonb;
begin
  select * into v_cart from public.carts
  where id = p_cart_id and customer_id = p_customer_id and status = 'active'
  for update;

  if not found or p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Carrinho vazio ou inválido';
  end if;

  if not exists (
    select 1 from public.shipping_quotes
    where id = p_shipping_quote_id
      and customer_id = p_customer_id
      and cart_id = p_cart_id
      and expires_at > now()
  ) then
    raise exception 'Cotação de frete inválida ou expirada';
  end if;

  insert into public.orders (
    customer_id, status, payment_status, total_amount, shipping_amount,
    discount_amount, coupon_code, shipping_address, payment_method,
    external_reference, cart_id,
    shipping_quote_id, shipping_service_id, shipping_service_name,
    shipping_company, shipping_delivery_days, shipping_environment,
    shipping_quote_snapshot, shipping_recipient
  ) values (
    p_customer_id, 'pending', 'pending', p_total_amount, p_shipping_amount,
    coalesce(p_discount_amount, 0), p_coupon_code, p_shipping_address,
    p_payment_method, gen_random_uuid()::text, p_cart_id,
    p_shipping_quote_id, p_shipping_service_id, p_shipping_service_name,
    p_shipping_company, p_shipping_delivery_days, p_shipping_environment,
    p_shipping_quote_snapshot, p_shipping_recipient
  ) returning * into v_order;

  update public.orders set external_reference = v_order.id::text where id = v_order.id
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id, variant_id, quantity, price,
      product_name, product_slug, image, sku, size_label, color_name
    ) values (
      v_order.id,
      nullif(v_item->>'variant_id', '')::uuid,
      (v_item->>'quantity')::int,
      (v_item->>'price')::numeric,
      coalesce(v_item->>'product_name', ''),
      coalesce(v_item->>'product_slug', ''),
      coalesce(v_item->>'image', ''),
      coalesce(v_item->>'sku', ''),
      coalesce(v_item->>'size_label', ''),
      coalesce(v_item->>'color_name', '')
    );
  end loop;

  insert into public.payment_attempts (
    order_id, idempotency_key, environment, payment_method
  ) values (
    v_order.id, p_idempotency_key, p_environment, p_payment_method
  );

  return v_order;
end;
$$;

-- ─── RPC accept (limpa carrinho; NÃO decrementa estoque) ─────────────────────

create or replace function public.checkout_accept_payment(
  p_order_id uuid,
  p_mercado_pago_order_id text,
  p_mercado_pago_payment_id text,
  p_payment_status text,
  p_status_detail text,
  p_expires_at timestamptz,
  p_instructions jsonb,
  p_response jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
begin
  update public.orders set
    mercado_pago_order_id = p_mercado_pago_order_id,
    mercado_pago_payment_id = p_mercado_pago_payment_id,
    payment_status = p_payment_status,
    payment_status_detail = p_status_detail,
    payment_expires_at = p_expires_at,
    payment_instructions = p_instructions
  where id = p_order_id
  returning cart_id into v_cart_id;

  update public.payment_attempts set
    mercado_pago_order_id = p_mercado_pago_order_id,
    mercado_pago_payment_id = p_mercado_pago_payment_id,
    status = p_payment_status,
    status_detail = p_status_detail,
    response_payload = p_response,
    accepted_at = coalesce(accepted_at, now()),
    updated_at = now()
  where order_id = p_order_id;

  if v_cart_id is not null then
    delete from public.cart_items where cart_id = v_cart_id;
    update public.carts set status = 'converted' where id = v_cart_id and status = 'active';
  end if;
end;
$$;

-- ─── RPC reconcile (1ª aprovação → baixa atômica por variant_id) ─────────────

create or replace function public.reconcile_mercado_pago_payment(
  p_mercado_pago_order_id text,
  p_mercado_pago_payment_id text,
  p_payment_status text,
  p_status_detail text,
  p_response jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_first_approval boolean := false;
  v_stock_items jsonb;
begin
  select * into v_order from public.orders
  where mercado_pago_order_id = p_mercado_pago_order_id
  for update;

  if not found then return null; end if;
  v_first_approval := p_payment_status = 'approved' and v_order.payment_status <> 'approved';

  update public.orders set
    payment_status = p_payment_status,
    payment_status_detail = p_status_detail,
    mercado_pago_payment_id = coalesce(p_mercado_pago_payment_id, mercado_pago_payment_id),
    status = case
      when p_payment_status = 'approved' then 'paid'
      when p_payment_status in ('canceled', 'expired') then 'canceled'
      else status
    end,
    paid_at = case when v_first_approval then now() else paid_at end
  where id = v_order.id;

  update public.payment_attempts set
    mercado_pago_payment_id = coalesce(p_mercado_pago_payment_id, mercado_pago_payment_id),
    status = p_payment_status,
    status_detail = p_status_detail,
    response_payload = p_response,
    approved_at = case when v_first_approval then now() else approved_at end,
    updated_at = now()
  where order_id = v_order.id;

  if v_first_approval then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'variant_id', oi.variant_id,
          'quantity', oi.quantity
        )
        order by oi.variant_id
      ),
      '[]'::jsonb
    )
    into v_stock_items
    from (
      select variant_id, sum(quantity)::int as quantity
      from public.order_items
      where order_id = v_order.id
        and variant_id is not null
      group by variant_id
    ) oi;

    if jsonb_array_length(v_stock_items) > 0 then
      perform private.decrement_variant_stock(v_stock_items);
    end if;
  end if;

  return v_order.id;
end;
$$;

revoke all on function public.checkout_create_payment_order(
  uuid, uuid, numeric, numeric, text, jsonb, text, jsonb, uuid, text,
  uuid, text, text, text, int, text, jsonb, jsonb, numeric
) from public, anon, authenticated;
grant execute on function public.checkout_create_payment_order(
  uuid, uuid, numeric, numeric, text, jsonb, text, jsonb, uuid, text,
  uuid, text, text, text, int, text, jsonb, jsonb, numeric
) to service_role;

revoke all on function public.checkout_accept_payment(
  uuid, text, text, text, text, timestamptz, jsonb, jsonb
) from public, anon, authenticated;
grant execute on function public.checkout_accept_payment(
  uuid, text, text, text, text, timestamptz, jsonb, jsonb
) to service_role;

revoke all on function public.reconcile_mercado_pago_payment(
  text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.reconcile_mercado_pago_payment(
  text, text, text, text, jsonb
) to service_role;
