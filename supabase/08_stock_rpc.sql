-- RPC atômica de estoque — baixa no approve (service_role only)

create or replace function private.decrement_variant_stock(
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
  v_stock integer;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'itens vazios';
  end if;

  -- Ordena por variant_id para evitar deadlock
  for v_item in
    select value
    from jsonb_array_elements(p_items) as t(value)
    order by (value->>'variant_id')
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    if v_qty is null or v_qty <= 0 then
      raise exception 'quantidade inválida para variante %', v_variant_id;
    end if;

    select stock_count into v_stock
    from public.product_variants
    where id = v_variant_id
      and is_active = true
    for update;

    if not found then
      raise exception 'variante % não encontrada ou inativa', v_variant_id;
    end if;

    if v_stock < v_qty then
      raise exception 'estoque insuficiente para variante % (disponível %, pedido %)',
        v_variant_id, v_stock, v_qty;
    end if;

    update public.product_variants
    set stock_count = stock_count - v_qty
    where id = v_variant_id;
  end loop;
end;
$$;

-- Wrapper público só para service_role (chamado pelos Route Handlers)
create or replace function public.decrement_variant_stock(
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.decrement_variant_stock(p_items);
end;
$$;

revoke all on function public.decrement_variant_stock(jsonb) from public;
revoke all on function public.decrement_variant_stock(jsonb) from anon, authenticated;
grant execute on function public.decrement_variant_stock(jsonb) to service_role;

-- Checagem de disponibilidade sem decrementar (checkout create)
create or replace function public.check_variants_availability(
  p_items jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant_id uuid;
  v_qty integer;
  v_stock integer;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    select stock_count into v_stock
    from public.product_variants
    where id = v_variant_id and is_active = true;

    if not found or v_stock < v_qty then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.check_variants_availability(jsonb) from public;
revoke all on function public.check_variants_availability(jsonb) from anon, authenticated;
grant execute on function public.check_variants_availability(jsonb) to service_role;
