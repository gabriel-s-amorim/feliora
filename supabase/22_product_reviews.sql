-- Avaliações de produto: tabela, alinhamento de agregados, trigger e notificação admin.
-- Idempotente. Writes via service_role nas APIs (sem policies de INSERT/UPDATE públicas).

-- ---------------------------------------------------------------------------
-- 1) Alinhar colunas de agregado em products (legado rating/reviews → canônico)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'rating'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'rating_avg'
  ) then
    alter table public.products rename column rating to rating_avg;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'reviews'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'reviews_count'
  ) then
    alter table public.products rename column reviews to reviews_count;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'rating_avg'
  ) then
    alter table public.products
      add column rating_avg numeric(2, 1) not null default 0;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'reviews_count'
  ) then
    alter table public.products
      add column reviews_count integer not null default 0
        check (reviews_count >= 0);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Tabela product_reviews
-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Se a tabela já existia sem order_id (ex.: migration 07), adiciona a coluna.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_reviews'
      and column_name = 'order_id'
  ) then
    alter table public.product_reviews
      add column order_id uuid references public.orders(id) on delete set null;
  end if;
end $$;

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id, is_approved);

create unique index if not exists product_reviews_product_customer_unique_idx
  on public.product_reviews (product_id, customer_id)
  where customer_id is not null;

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_public_read" on public.product_reviews;
create policy "product_reviews_public_read"
  on public.product_reviews for select
  to anon, authenticated
  using (is_approved = true);

-- Cliente autenticado pode ver a própria review (pendente ou aprovada)
drop policy if exists "product_reviews_own_read" on public.product_reviews;
create policy "product_reviews_own_read"
  on public.product_reviews for select
  to authenticated
  using (customer_id = auth.uid());

revoke insert, update, delete on public.product_reviews from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Trigger: sync rating_avg / reviews_count a partir de reviews aprovadas
-- ---------------------------------------------------------------------------

create or replace function public.sync_product_review_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id bigint;
  v_avg numeric(2, 1);
  v_count integer;
begin
  v_product_id := coalesce(
    new.product_id,
    old.product_id
  );

  select
    coalesce(round(avg(rating)::numeric, 1), 0),
    count(*)::integer
  into v_avg, v_count
  from public.product_reviews
  where product_id = v_product_id
    and is_approved = true;

  update public.products
  set
    rating_avg = v_avg,
    reviews_count = v_count
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_product_reviews_sync_aggregates on public.product_reviews;
create trigger trg_product_reviews_sync_aggregates
after insert or update of is_approved, rating, product_id or delete
on public.product_reviews
for each row
execute function public.sync_product_review_aggregates();

-- ---------------------------------------------------------------------------
-- 4) Notificação admin: kind review_submitted (só se o schema canônico existir)
-- ---------------------------------------------------------------------------

do $$
declare
  v_conname text;
  v_has_kind boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_notifications'
      and column_name = 'kind'
  ) into v_has_kind;

  if not v_has_kind then
    return;
  end if;

  select c.conname into v_conname
  from pg_constraint c
  where c.conrelid = 'public.admin_notifications'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%customer_registered%';

  if v_conname is not null then
    execute format('alter table public.admin_notifications drop constraint %I', v_conname);
  end if;

  begin
    alter table public.admin_notifications
      add constraint admin_notifications_kind_check
      check (kind in (
        'customer_registered',
        'order_created',
        'payment_approved',
        'customer_message',
        'review_submitted'
      ));
  exception
    when duplicate_object then
      null;
  end;
end $$;
