-- Notificações in-app do painel admin (cadastro, pedido, pagamento, mensagem do cliente).
-- Idempotente. Acesso via service_role nas APIs admin (sem policies públicas).

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    check (kind in (
      'customer_registered',
      'order_created',
      'payment_approved',
      'customer_message',
      'review_submitted'
    )),
  title text not null
    check (char_length(title) between 1 and 160),
  body text not null
    check (char_length(body) between 1 and 1000),
  link_path text
    check (link_path is null or char_length(link_path) between 1 and 300),
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references auth.users(id) on delete set null,
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_notifications_event_key_unique unique (event_key)
);

create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (created_at desc)
  where read_at is null;
create index if not exists admin_notifications_order_id_idx
  on public.admin_notifications (order_id)
  where order_id is not null;
create index if not exists admin_notifications_customer_id_idx
  on public.admin_notifications (customer_id)
  where customer_id is not null;

alter table public.admin_notifications enable row level security;

revoke all on table public.admin_notifications from anon, authenticated;

create or replace function private.insert_admin_notification(
  p_kind text,
  p_title text,
  p_body text,
  p_event_key text,
  p_link_path text default null,
  p_order_id uuid default null,
  p_customer_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (
    kind, title, body, event_key, link_path, order_id, customer_id
  )
  values (
    p_kind, p_title, p_body, p_event_key, p_link_path, p_order_id, p_customer_id
  )
  on conflict (event_key) do nothing;
end;
$$;

revoke all on function private.insert_admin_notification(text, text, text, text, text, uuid, uuid)
  from public;
revoke all on function private.insert_admin_notification(text, text, text, text, text, uuid, uuid)
  from anon, authenticated;

create or replace function private.notify_admin_customer_registered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
begin
  v_name := nullif(trim(coalesce(new.full_name, '')), '');
  select email into v_email from auth.users where id = new.id;

  perform private.insert_admin_notification(
    'customer_registered',
    'Novo cadastro',
    format(
      '%s acabou de criar uma conta%s.',
      coalesce(v_name, 'Um cliente'),
      case
        when v_email is not null then format(' (%s)', v_email)
        else ''
      end
    ),
    'customer_registered:' || new.id::text,
    '/admin/clientes/' || new.id::text,
    null,
    new.id
  );

  return new;
end;
$$;

create or replace function private.notify_admin_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_total text;
begin
  if new.customer_id is not null then
    select nullif(trim(full_name), '')
      into v_name
    from public.customer_profiles
    where id = new.customer_id;
  end if;

  v_total := to_char(coalesce(new.total_amount, 0), 'FM999999990.00');

  perform private.insert_admin_notification(
    'order_created',
    'Novo pedido',
    format(
      'Pedido #%s de %s · R$ %s.',
      upper(left(new.id::text, 8)),
      coalesce(v_name, 'cliente'),
      v_total
    ),
    'order_created:' || new.id::text,
    '/admin/pedidos/' || new.id::text,
    new.id,
    new.customer_id
  );

  return new;
end;
$$;

create or replace function private.notify_admin_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_total text;
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;

  if new.payment_status is distinct from 'approved' then
    return new;
  end if;

  if new.customer_id is not null then
    select nullif(trim(full_name), '')
      into v_name
    from public.customer_profiles
    where id = new.customer_id;
  end if;

  v_total := to_char(coalesce(new.total_amount, 0), 'FM999999990.00');

  perform private.insert_admin_notification(
    'payment_approved',
    'Pagamento aprovado',
    format(
      'Pedido #%s de %s foi pago · R$ %s.',
      upper(left(new.id::text, 8)),
      coalesce(v_name, 'cliente'),
      v_total
    ),
    'payment_approved:' || new.id::text,
    '/admin/pedidos/' || new.id::text,
    new.id,
    new.customer_id
  );

  return new;
end;
$$;

create or replace function private.notify_admin_customer_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_preview text;
begin
  if new.sender_role is distinct from 'customer' then
    return new;
  end if;

  if new.customer_id is not null then
    select nullif(trim(full_name), '')
      into v_name
    from public.customer_profiles
    where id = new.customer_id;
  end if;

  v_preview := left(btrim(new.body), 140);
  if char_length(btrim(new.body)) > 140 then
    v_preview := v_preview || '...';
  end if;

  perform private.insert_admin_notification(
    'customer_message',
    'Mensagem do cliente',
    format(
      '%s no pedido #%s: %s',
      coalesce(v_name, 'Cliente'),
      upper(left(new.order_id::text, 8)),
      v_preview
    ),
    'customer_message:' || new.id::text,
    '/admin/pedidos/' || new.order_id::text,
    new.order_id,
    new.customer_id
  );

  return new;
end;
$$;

drop trigger if exists trg_admin_notify_customer_registered on public.customer_profiles;
create trigger trg_admin_notify_customer_registered
after insert on public.customer_profiles
for each row
execute function private.notify_admin_customer_registered();

drop trigger if exists trg_admin_notify_order_created on public.orders;
create trigger trg_admin_notify_order_created
after insert on public.orders
for each row
execute function private.notify_admin_order_created();

drop trigger if exists trg_admin_notify_order_paid on public.orders;
create trigger trg_admin_notify_order_paid
after update of payment_status on public.orders
for each row
execute function private.notify_admin_order_paid();

-- Só cria o trigger de mensagem se a tabela já existir (migration 20).
do $$
begin
  if to_regclass('public.order_messages') is not null then
    execute 'drop trigger if exists trg_admin_notify_customer_message on public.order_messages';
    execute $t$
      create trigger trg_admin_notify_customer_message
      after insert on public.order_messages
      for each row
      execute function private.notify_admin_customer_message()
    $t$;
  end if;
end;
$$;
