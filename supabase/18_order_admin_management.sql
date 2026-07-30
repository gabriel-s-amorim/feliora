-- Gestão administrativa de pedidos: cancelamento idempotente, reposição de
-- estoque e exclusão controlada de pedidos já cancelados.

alter table public.orders
  add column if not exists stock_decremented_at timestamptz,
  add column if not exists stock_restored_at timestamptz,
  add column if not exists canceled_at timestamptz;

-- Pedidos antigos só são marcados quando há evidência da baixa feita pelo
-- reconciliador. Isso evita devolver estoque de pagamentos aprovados que não
-- chegaram a concluir a baixa.
update public.orders o
set stock_decremented_at = coalesce(pa.approved_at, o.paid_at)
from public.payment_attempts pa
where pa.order_id = o.id
  and pa.approved_at is not null
  and o.stock_decremented_at is null;

create or replace function private.increment_variant_stock(
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant_id uuid;
  v_qty integer;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'itens vazios';
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items) as t(value)
    order by (value->>'variant_id')
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    if v_variant_id is null or v_qty is null or v_qty <= 0 then
      raise exception 'item de estoque inválido';
    end if;

    update public.product_variants
    set stock_count = stock_count + v_qty
    where id = v_variant_id;

    if not found then
      raise exception 'variante % não encontrada; cancelamento interrompido',
        v_variant_id;
    end if;
  end loop;
end;
$$;

create or replace function public.admin_cancel_order(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_stock_items jsonb;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_order.fulfillment_status = 'delivered' then
    raise exception 'Pedido entregue não pode ser cancelado';
  end if;

  if v_order.status = 'canceled'
     and (
       v_order.stock_decremented_at is null
       or v_order.stock_restored_at is not null
     ) then
    return v_order;
  end if;

  if v_order.stock_decremented_at is not null
     and v_order.stock_restored_at is null then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'variant_id', grouped.variant_id,
          'quantity', grouped.quantity
        )
        order by grouped.variant_id
      ),
      '[]'::jsonb
    )
    into v_stock_items
    from (
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id
        and variant_id is not null
      group by variant_id
    ) grouped;

    if jsonb_array_length(v_stock_items) > 0 then
      perform private.increment_variant_stock(v_stock_items);
    end if;

    v_order.stock_restored_at := now();
  end if;

  update public.orders
  set status = 'canceled',
      fulfillment_status = 'canceled',
      canceled_at = coalesce(canceled_at, now()),
      stock_restored_at = v_order.stock_restored_at
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.admin_delete_canceled_orders(
  p_order_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_count integer;
  v_deletable_count integer;
  v_deleted_count integer;
begin
  select count(distinct value)::integer
  into v_requested_count
  from unnest(p_order_ids) as requested(value);

  if v_requested_count = 0 then
    raise exception 'Selecione ao menos um pedido';
  end if;

  select count(*)::integer
  into v_deletable_count
  from public.orders
  where id = any(p_order_ids)
    and status = 'canceled'
    and (
      stock_decremented_at is null
      or stock_restored_at is not null
    );

  if v_deletable_count <> v_requested_count then
    raise exception 'Somente pedidos cancelados e com estoque regularizado podem ser excluídos';
  end if;

  delete from public.orders
  where id = any(p_order_ids)
    and status = 'canceled'
    and (
      stock_decremented_at is null
      or stock_restored_at is not null
    );

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

-- Reconciliador atualizado: registra a baixa e também devolve o estoque se o
-- provedor cancelar/expirar/estornar um pagamento que já havia baixado estoque.
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
  v_should_restore boolean := false;
  v_stock_items jsonb;
begin
  select * into v_order from public.orders
  where mercado_pago_order_id = p_mercado_pago_order_id
  for update;

  if not found then return null; end if;

  v_first_approval :=
    p_payment_status = 'approved'
    and v_order.stock_decremented_at is null;
  v_should_restore :=
    p_payment_status in ('canceled', 'expired', 'refunded')
    and v_order.stock_decremented_at is not null
    and v_order.stock_restored_at is null;

  if v_first_approval or v_should_restore then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'variant_id', grouped.variant_id,
          'quantity', grouped.quantity
        )
        order by grouped.variant_id
      ),
      '[]'::jsonb
    )
    into v_stock_items
    from (
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id
        and variant_id is not null
      group by variant_id
    ) grouped;
  end if;

  if v_first_approval and jsonb_array_length(v_stock_items) > 0 then
    perform private.decrement_variant_stock(v_stock_items);
  elsif v_should_restore and jsonb_array_length(v_stock_items) > 0 then
    perform private.increment_variant_stock(v_stock_items);
  end if;

  update public.orders set
    payment_status = p_payment_status,
    payment_status_detail = p_status_detail,
    mercado_pago_payment_id = coalesce(
      p_mercado_pago_payment_id,
      mercado_pago_payment_id
    ),
    status = case
      when p_payment_status = 'approved' then 'paid'
      when p_payment_status in ('canceled', 'expired', 'refunded') then 'canceled'
      else status
    end,
    fulfillment_status = case
      when p_payment_status in ('canceled', 'expired', 'refunded') then 'canceled'
      else fulfillment_status
    end,
    paid_at = case when v_first_approval then now() else paid_at end,
    stock_decremented_at = case
      when v_first_approval then now()
      else stock_decremented_at
    end,
    stock_restored_at = case
      when v_should_restore then now()
      when v_first_approval then null
      else stock_restored_at
    end,
    canceled_at = case
      when p_payment_status in ('canceled', 'expired', 'refunded')
        then coalesce(canceled_at, now())
      else canceled_at
    end
  where id = v_order.id;

  update public.payment_attempts set
    mercado_pago_payment_id = coalesce(
      p_mercado_pago_payment_id,
      mercado_pago_payment_id
    ),
    status = p_payment_status,
    status_detail = p_status_detail,
    response_payload = p_response,
    approved_at = case when v_first_approval then now() else approved_at end,
    updated_at = now()
  where order_id = v_order.id;

  return v_order.id;
end;
$$;

revoke all on function public.admin_cancel_order(uuid) from public;
revoke all on function public.admin_cancel_order(uuid) from anon, authenticated;
grant execute on function public.admin_cancel_order(uuid) to service_role;

revoke all on function public.admin_delete_canceled_orders(uuid[]) from public;
revoke all on function public.admin_delete_canceled_orders(uuid[]) from anon, authenticated;
grant execute on function public.admin_delete_canceled_orders(uuid[]) to service_role;

revoke all on function public.reconcile_mercado_pago_payment(
  text, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.reconcile_mercado_pago_payment(
  text, text, text, text, jsonb
) to service_role;
