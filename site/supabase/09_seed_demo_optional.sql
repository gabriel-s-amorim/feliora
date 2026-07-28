-- Seed opcional de demonstração (NÃO é hardcode do front).
-- Rode no SQL Editor se quiser ver o catálogo com dados de exemplo.
-- Remova ou substitua quando cadastrar o catálogo real no admin.

insert into public.categories (slug, name, description, sort_order, is_active)
values
  ('vestidos', 'Vestidos', 'Silhuetas fluidas para o dia e a noite.', 1, true),
  ('blusas', 'Blusas', 'Peças leves com acabamento delicado.', 2, true),
  ('calcas', 'Calças', 'Caimento elegante no dia a dia.', 3, true),
  ('acessorios', 'Acessórios', 'Detalhes que fecham o look.', 4, true)
on conflict do nothing;

-- products: use insert only if slugs don't exist
insert into public.products (
  slug, name, category_id, price, original_price, image, images,
  badge, featured, is_new, short_description, description,
  sizes, colors, highlights, is_active
)
select
  'vestido-aurora',
  'Vestido Aurora',
  c.id,
  289.90,
  349.90,
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
  '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80"]'::jsonb,
  'Novidade',
  true,
  true,
  'Fluido, romântico e leve — o vestido assinatura da temporada.',
  'Modelagem evasê em tecido fluido, com decote delicado e caimento que acompanha o movimento.',
  '[{"label":"P"},{"label":"M"},{"label":"G"}]'::jsonb,
  '[{"name":"Blush","hex":"#D4A59A"},{"name":"Off-white","hex":"#F7F0E8"}]'::jsonb,
  '["Tecido fluido","Forro interno","Fecho invisível"]'::jsonb,
  true
from public.categories c
where c.slug = 'vestidos'
  and not exists (select 1 from public.products p where p.slug = 'vestido-aurora');

insert into public.products (
  slug, name, category_id, price, image, images,
  featured, is_new, short_description, description,
  sizes, colors, is_active
)
select
  'blusa-lila',
  'Blusa Lila',
  c.id,
  159.90,
  'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80',
  '["https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80"]'::jsonb,
  true,
  true,
  'Manga bufante suave e toque aveludado na pele.',
  'Blusa com manga volumosa e gola delicada.',
  '[{"label":"P"},{"label":"M"},{"label":"G"}]'::jsonb,
  '[{"name":"Rose","hex":"#B76E79"},{"name":"Areia","hex":"#C9A07A"}]'::jsonb,
  true
from public.categories c
where c.slug = 'blusas'
  and not exists (select 1 from public.products p where p.slug = 'blusa-lila');

-- Variantes Aurora
insert into public.product_variants (product_id, size_label, color_name, sku, stock_count, is_active)
select p.id, v.size_label, v.color_name, v.sku, v.stock_count, true
from public.products p
cross join (values
  ('P','Blush','AUR-P-BLU',4),
  ('M','Blush','AUR-M-BLU',6),
  ('G','Blush','AUR-G-BLU',2),
  ('P','Off-white','AUR-P-OFF',3),
  ('M','Off-white','AUR-M-OFF',5),
  ('G','Off-white','AUR-G-OFF',0)
) as v(size_label, color_name, sku, stock_count)
where p.slug = 'vestido-aurora'
  and not exists (
    select 1 from public.product_variants pv where pv.sku = v.sku
  );

-- Variantes Lila
insert into public.product_variants (product_id, size_label, color_name, sku, stock_count, is_active)
select p.id, v.size_label, v.color_name, v.sku, v.stock_count, true
from public.products p
cross join (values
  ('P','Rose','LIL-P-ROS',5),
  ('M','Rose','LIL-M-ROS',5),
  ('G','Rose','LIL-G-ROS',3),
  ('P','Areia','LIL-P-ARE',4),
  ('M','Areia','LIL-M-ARE',4),
  ('G','Areia','LIL-G-ARE',2)
) as v(size_label, color_name, sku, stock_count)
where p.slug = 'blusa-lila'
  and not exists (
    select 1 from public.product_variants pv where pv.sku = v.sku
  );
