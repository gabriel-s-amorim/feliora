-- Fase 7: Brevo (e-mails) + índice de fulfillment
-- Execute após 11_checkout_integrations.sql

-- ─── Brevo settings ──────────────────────────────────────────────────────────

create table if not exists public.brevo_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  api_key_encrypted text,
  webhook_token_encrypted text,
  default_sender_id bigint check (default_sender_id is null or default_sender_id > 0),
  default_sender_email text not null default '',
  default_sender_name text not null default '',
  reply_to text not null default '',
  merchant_notify_email text not null default '',
  default_list_id bigint check (default_list_id is null or default_list_id > 0),
  template_order_received bigint,
  template_order_received_merchant bigint,
  template_payment_approved bigint,
  template_payment_failed bigint,
  template_payment_refunded bigint,
  template_order_processing bigint,
  template_order_shipped bigint,
  template_order_delivered bigint,
  account_email text,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.brevo_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.brevo_settings enable row level security;
revoke all on table public.brevo_settings from anon, authenticated;

-- ─── Marketing subscriptions (campos de sync Brevo) ─────────────────────────

alter table public.marketing_subscriptions
  add column if not exists name text,
  add column if not exists consent_ip inet,
  add column if not exists consent_user_agent text,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists brevo_contact_id text,
  add column if not exists brevo_list_ids bigint[] not null default '{}',
  add column if not exists sync_status text not null default 'pending',
  add column if not exists sync_error text,
  add column if not exists synced_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'marketing_subscriptions_sync_status_check'
  ) then
    alter table public.marketing_subscriptions
      add constraint marketing_subscriptions_sync_status_check
      check (sync_status in ('pending', 'synced', 'failed'));
  end if;
end $$;

revoke all on table public.marketing_subscriptions from anon, authenticated;

-- ─── Deliveries + webhook events ─────────────────────────────────────────────

create table if not exists public.brevo_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  event text,
  idempotency_key text unique,
  kind text not null check (kind in ('transactional', 'campaign', 'test')),
  message_id text,
  campaign_id bigint,
  recipient_email text,
  template_id bigint,
  status text not null default 'queued',
  subject text,
  error_message text,
  attempt_count int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists brevo_email_deliveries_message_recipient_idx
  on public.brevo_email_deliveries (message_id, coalesce(recipient_email, ''))
  where message_id is not null;
create index if not exists brevo_email_deliveries_status_idx
  on public.brevo_email_deliveries (status, created_at desc);
create index if not exists brevo_email_deliveries_order_idx
  on public.brevo_email_deliveries (order_id, created_at desc)
  where order_id is not null;

create table if not exists public.brevo_email_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  message_id text,
  campaign_id bigint,
  email text,
  event_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists brevo_email_events_message_idx
  on public.brevo_email_events (message_id, event_at desc)
  where message_id is not null;
create index if not exists brevo_email_events_email_idx
  on public.brevo_email_events (lower(email), event_at desc)
  where email is not null;

alter table public.brevo_email_deliveries enable row level security;
alter table public.brevo_email_events enable row level security;
revoke all on table public.brevo_email_deliveries from anon, authenticated;
revoke all on table public.brevo_email_events from anon, authenticated;

-- ─── Templates HTML da loja ──────────────────────────────────────────────────

create table if not exists public.brevo_store_templates (
  event text primary key
    check (event in (
      'order_received',
      'order_received_merchant',
      'payment_approved'
    )),
  name text not null,
  subject text not null,
  html_content text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.brevo_store_templates enable row level security;
revoke all on table public.brevo_store_templates from anon, authenticated;

insert into public.brevo_store_templates (event, name, subject, html_content)
values
(
  'order_received',
  'Pedido criado → cliente',
  'Recebemos seu pedido {{ORDER_SHORT_ID}}',
  $html$
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #2C241B; line-height: 1.55; background: #FDF8F4; padding: 28px;">
  <p style="font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #B76E79; margin: 0 0 8px;">Feliora</p>
  <h1 style="font-size: 22px; font-weight: 400; margin: 0 0 16px;">Pedido recebido</h1>
  <p>Olá, {{CUSTOMER_NAME}}!</p>
  <p>Recebemos o seu pedido <strong>#{{ORDER_SHORT_ID}}</strong>.</p>
  <p style="margin-top: 20px;"><strong>Resumo</strong></p>
  <p>
    Subtotal: {{SUBTOTAL}}<br>
    Frete: {{SHIPPING_AMOUNT}}<br>
    Total: <strong>{{TOTAL}}</strong><br>
    Pagamento: {{PAYMENT_METHOD}}
  </p>
  <p style="margin-top: 20px;"><strong>Itens</strong></p>
  <ul>{{ITEMS_HTML}}</ul>
  <p style="margin-top: 20px;"><strong>Entrega</strong><br>{{ADDRESS}}</p>
  <p style="margin-top: 24px;">
    <a href="{{ORDER_URL}}" style="display:inline-block;background:#B76E79;color:#FDF8F4;padding:12px 18px;text-decoration:none;">
      Ver meus pedidos
    </a>
  </p>
</div>
$html$
),
(
  'order_received_merchant',
  'Pedido criado → loja',
  'Novo pedido #{{ORDER_SHORT_ID}} — {{TOTAL}}',
  $html$
<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2C241B; line-height: 1.5;">
  <h1 style="font-size: 20px; margin-bottom: 8px;">Novo pedido na Feliora</h1>
  <p>
    Pedido: <strong>#{{ORDER_SHORT_ID}}</strong><br>
    Cliente: {{CUSTOMER_NAME}}<br>
    Total: <strong>{{TOTAL}}</strong><br>
    Pagamento: {{PAYMENT_METHOD}} · {{PAYMENT_STATUS}}
  </p>
  <p style="margin-top: 16px;"><strong>Itens</strong></p>
  <ul>{{ITEMS_HTML}}</ul>
  <p style="margin-top: 16px;"><strong>Endereço</strong><br>{{ADDRESS}}</p>
</div>
$html$
),
(
  'payment_approved',
  'Pagamento aprovado → cliente',
  'Pagamento confirmado — pedido {{ORDER_SHORT_ID}}',
  $html$
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #2C241B; line-height: 1.55; background: #FDF8F4; padding: 28px;">
  <p style="font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: #B76E79; margin: 0 0 8px;">Feliora</p>
  <h1 style="font-size: 22px; font-weight: 400; margin: 0 0 16px;">Pagamento confirmado</h1>
  <p>Olá, {{CUSTOMER_NAME}}!</p>
  <p>
    Confirmamos o pagamento do pedido <strong>#{{ORDER_SHORT_ID}}</strong>
    no valor de <strong>{{TOTAL}}</strong>.
  </p>
  <p>Já estamos preparando tudo para o envio.</p>
  <p style="margin-top: 20px;"><strong>Itens</strong></p>
  <ul>{{ITEMS_HTML}}</ul>
  <p style="margin-top: 24px;">
    <a href="{{ORDER_URL}}" style="display:inline-block;background:#B76E79;color:#FDF8F4;padding:12px 18px;text-decoration:none;">
      Acompanhar pedido
    </a>
  </p>
</div>
$html$
)
on conflict (event) do nothing;

-- ─── Fulfillment index ───────────────────────────────────────────────────────

create index if not exists orders_fulfillment_status_created_idx
  on public.orders (fulfillment_status, created_at desc);
