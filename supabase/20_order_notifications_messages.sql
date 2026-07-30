-- Notificações in-app de pedidos + mensagens cliente/admin vinculadas ao pedido.
-- Idempotente. Triggers geram notificações sem depender de Realtime.

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  kind text not null
    check (kind in (
      'order_created',
      'payment_status',
      'fulfillment_status',
      'tracking_updated',
      'order_canceled',
      'admin_message'
    )),
  title text not null
    check (char_length(title) between 1 and 160),
  body text not null
    check (char_length(body) between 1 and 1000),
  event_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint order_notifications_event_key_unique unique (order_id, event_key)
);

create index if not exists order_notifications_customer_created_idx
  on public.order_notifications (customer_id, created_at desc);
create index if not exists order_notifications_customer_unread_idx
  on public.order_notifications (customer_id)
  where read_at is null;
create index if not exists order_notifications_order_id_idx
  on public.order_notifications (order_id);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null
    check (sender_role in ('customer', 'admin')),
  body text not null
    check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists order_messages_order_created_idx
  on public.order_messages (order_id, created_at asc);
create index if not exists order_messages_customer_created_idx
  on public.order_messages (customer_id, created_at desc);
create index if not exists order_messages_admin_unread_idx
  on public.order_messages (order_id)
  where sender_role = 'customer' and read_at is null;

alter table public.order_notifications enable row level security;
alter table public.order_messages enable row level security;

-- Privileges: cliente autentica só o necessário; service_role continua admin.
revoke all on table public.order_notifications from anon;
revoke all on table public.order_messages from anon;

revoke insert, delete on table public.order_notifications from authenticated;
revoke update on table public.order_notifications from authenticated;
grant select on table public.order_notifications to authenticated;
grant update (read_at) on table public.order_notifications to authenticated;

revoke delete on table public.order_messages from authenticated;
revoke update on table public.order_messages from authenticated;
grant select, insert on table public.order_messages to authenticated;
grant update (read_at) on table public.order_messages to authenticated;

drop policy if exists "order_notifications_own_select" on public.order_notifications;
create policy "order_notifications_own_select"
  on public.order_notifications for select
  to authenticated
  using ((select auth.uid()) = customer_id);

drop policy if exists "order_notifications_own_update_read" on public.order_notifications;
create policy "order_notifications_own_update_read"
  on public.order_notifications for update
  to authenticated
  using ((select auth.uid()) = customer_id)
  with check ((select auth.uid()) = customer_id);

drop policy if exists "order_messages_own_select" on public.order_messages;
create policy "order_messages_own_select"
  on public.order_messages for select
  to authenticated
  using (
    (select auth.uid()) = customer_id
    and exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.customer_id = (select auth.uid())
    )
  );

drop policy if exists "order_messages_own_insert" on public.order_messages;
create policy "order_messages_own_insert"
  on public.order_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = customer_id
    and sender_role = 'customer'
    and exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.customer_id = (select auth.uid())
    )
  );

drop policy if exists "order_messages_own_update_read" on public.order_messages;
create policy "order_messages_own_update_read"
  on public.order_messages for update
  to authenticated
  using (
    (select auth.uid()) = customer_id
    and exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.customer_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = customer_id
    and exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.customer_id = (select auth.uid())
    )
  );

-- Inserção idempotente de notificação (security definer no schema private)
create or replace function private.insert_order_notification(
  p_order_id uuid,
  p_customer_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_event_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_customer_id is null then
    return;
  end if;

  insert into public.order_notifications (
    order_id, customer_id, kind, title, body, event_key
  )
  values (
    p_order_id, p_customer_id, p_kind, p_title, p_body, p_event_key
  )
  on conflict (order_id, event_key) do nothing;
end;
$$;

revoke all on function private.insert_order_notification(uuid, uuid, text, text, text, text)
  from public;
revoke all on function private.insert_order_notification(uuid, uuid, text, text, text, text)
  from anon, authenticated;

create or replace function private.payment_status_label(p_status text)
returns text
language sql
immutable
set search_path = public
as $$
  select case p_status
    when 'pending' then 'aguardando pagamento'
    when 'processing' then 'processando pagamento'
    when 'approved' then 'pagamento aprovado'
    when 'rejected' then 'pagamento recusado'
    when 'canceled' then 'pagamento cancelado'
    when 'expired' then 'pagamento expirado'
    when 'refunded' then 'pagamento reembolsado'
    else coalesce(p_status, 'atualizado')
  end;
$$;

create or replace function private.fulfillment_status_label(p_status text)
returns text
language sql
immutable
set search_path = public
as $$
  select case p_status
    when 'unfulfilled' then 'ainda não preparado'
    when 'processing' then 'em preparação'
    when 'shipped' then 'enviado'
    when 'delivered' then 'entregue'
    when 'canceled' then 'cancelado'
    else coalesce(p_status, 'atualizado')
  end;
$$;

create or replace function private.notify_order_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is null then
    return new;
  end if;

  perform private.insert_order_notification(
    new.id,
    new.customer_id,
    'order_created',
    'Pedido recebido',
    format('Recebemos o seu pedido. Acompanhe o status em Meus pedidos.'),
    'order_created'
  );

  return new;
end;
$$;

create or replace function private.notify_order_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canceled boolean;
  v_was_canceled boolean;
begin
  if new.customer_id is null then
    return new;
  end if;

  v_canceled :=
    new.status = 'canceled'
    or new.fulfillment_status = 'canceled'
    or new.canceled_at is not null;

  v_was_canceled :=
    old.status = 'canceled'
    or old.fulfillment_status = 'canceled'
    or old.canceled_at is not null;

  if v_canceled and not v_was_canceled then
    perform private.insert_order_notification(
      new.id,
      new.customer_id,
      'order_canceled',
      'Pedido cancelado',
      'O seu pedido foi cancelado. Se precisar de ajuda, fale conosco pela conversa do pedido.',
      'order_canceled'
    );
  end if;

  if new.payment_status is distinct from old.payment_status then
    perform private.insert_order_notification(
      new.id,
      new.customer_id,
      'payment_status',
      'Atualização de pagamento',
      format(
        'O status do pagamento do seu pedido agora é: %s.',
        private.payment_status_label(new.payment_status)
      ),
      'payment:' || new.payment_status
    );
  end if;

  if new.fulfillment_status is distinct from old.fulfillment_status
     and new.fulfillment_status is distinct from 'canceled' then
    perform private.insert_order_notification(
      new.id,
      new.customer_id,
      'fulfillment_status',
      'Atualização do pedido',
      format(
        'O status do envio do seu pedido agora é: %s.',
        private.fulfillment_status_label(new.fulfillment_status)
      ),
      'fulfillment:' || new.fulfillment_status
    );
  end if;

  if (
       new.tracking_code is distinct from old.tracking_code
       or new.tracking_url is distinct from old.tracking_url
     )
     and (
       coalesce(nullif(btrim(new.tracking_code), ''), null) is not null
       or coalesce(nullif(btrim(new.tracking_url), ''), null) is not null
     ) then
    perform private.insert_order_notification(
      new.id,
      new.customer_id,
      'tracking_updated',
      'Rastreio atualizado',
      case
        when nullif(btrim(coalesce(new.tracking_code, '')), '') is not null then
          format(
            'Código de rastreio: %s. Acompanhe a entrega do seu pedido.',
            btrim(new.tracking_code)
          )
        else
          'As informações de rastreio do seu pedido foram atualizadas.'
      end,
      'tracking:' || md5(
        coalesce(new.tracking_code, '') || '|' || coalesce(new.tracking_url, '')
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_order_notifications_insert on public.orders;
create trigger trg_order_notifications_insert
after insert on public.orders
for each row
execute function private.notify_order_created();

drop trigger if exists trg_order_notifications_update on public.orders;
create trigger trg_order_notifications_update
after update of
  status,
  payment_status,
  fulfillment_status,
  tracking_code,
  tracking_url,
  canceled_at
on public.orders
for each row
execute function private.notify_order_changes();

-- Dá contexto inicial aos pedidos já existentes quando esta migration é aplicada.
insert into public.order_notifications (
  order_id,
  customer_id,
  kind,
  title,
  body,
  event_key,
  created_at
)
select
  o.id,
  o.customer_id,
  'order_created',
  'Pedido recebido',
  'Recebemos o seu pedido. Acompanhe o status em Meus pedidos.',
  'order_created',
  o.created_at
from public.orders o
where o.customer_id is not null
on conflict (order_id, event_key) do nothing;
