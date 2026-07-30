-- SEO — campos em products, FTS, categorias, páginas institucionais
-- Idempotente: seguro reexecutar.

alter table public.products
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '';

comment on column public.products.seo_title is 'Title tag / OG title override';
comment on column public.products.seo_description is 'Meta description / OG description override';

create or replace function public.products_refresh_search_vector()
returns trigger
language plpgsql
as $$
declare
  v_category_name text := '';
begin
  if new.category_id is not null then
    select name into v_category_name
    from public.categories
    where id = new.category_id;
  end if;

  new.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(new.name, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(new.seo_title, '')), 'A')
    || setweight(to_tsvector('portuguese', coalesce(new.short_description, '')), 'B')
    || setweight(to_tsvector('portuguese', coalesce(new.seo_description, '')), 'B')
    || setweight(to_tsvector('portuguese', coalesce(v_category_name, '')), 'C');

  return new;
end;
$$;

drop trigger if exists trg_products_search_vector on public.products;
create trigger trg_products_search_vector
before insert or update of name, short_description, seo_title, seo_description, category_id
  on public.products
for each row execute function public.products_refresh_search_vector();

-- Força refresh do search_vector
update public.products set updated_at = updated_at;

-- ---------------------------------------------------------------------------
-- Seed / upsert SEO de categorias
-- ---------------------------------------------------------------------------

update public.categories set
  seo_title = 'Vestidos Femininos | Feliora',
  seo_description = 'Vestidos femininos fluidos e românticos para o dia e a noite. Compre online na Feliora com frete para todo o Brasil.',
  description = coalesce(nullif(trim(description), ''), 'Silhuetas fluidas e românticas para o dia e a noite.')
where slug = 'vestidos';

update public.categories set
  seo_title = 'Blusas Femininas | Feliora',
  seo_description = 'Blusas femininas leves, caneladas e em suplex. Peças versáteis com acabamento delicado na Feliora.',
  description = coalesce(nullif(trim(description), ''), 'Peças leves com acabamento delicado para o dia a dia.')
where slug = 'blusas';

update public.categories set
  seo_title = 'Calças Femininas | Feliora',
  seo_description = 'Calças femininas com caimento elegante. Explore a seleção Feliora e monte looks sofisticados.',
  description = coalesce(nullif(trim(description), ''), 'Caimento elegante para o dia a dia.')
where slug = 'calcas';

update public.categories set
  seo_title = 'Acessórios Femininos | Feliora',
  seo_description = 'Acessórios que finalizam o look com delicadeza. Detalhes selecionados na loja Feliora.',
  description = coalesce(nullif(trim(description), ''), 'Detalhes que fecham o look com presença.')
where slug = 'acessorios';

-- ---------------------------------------------------------------------------
-- Seed SEO de produtos conhecidos
-- ---------------------------------------------------------------------------

update public.products set
  seo_title = 'Vestido Aurora — Moda Feminina Feliora',
  seo_description = 'Vestido Aurora fluido e romântico, modelagem evasê e caimento leve. Compre na Feliora com entrega para todo o Brasil.'
where slug = 'vestido-aurora';

update public.products set
  seo_title = 'Blusa Lila — Moda Feminina Feliora',
  seo_description = 'Blusa Lila com manga bufante suave e toque aveludado. Peça romântica da coleção Feliora.'
where slug = 'blusa-lila';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Blusa manga longa em suplex com decote quadrado — segunda pele confortável e versátil.'),
  seo_title = 'Blusa Manga Longa Decote Quadrado Suplex | Feliora',
  seo_description = 'Blusa feminina manga longa com decote quadrado em tecido suplex. Conforto de segunda pele para o dia a dia. Compre na Feliora.'
where slug = 'blusa-feminina-manga-longa-decote-quadrado-segunda-pele-tecido-suplex';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Blusa canelada manga longa com gola quadrada — elegância e conforto em qualquer estação.'),
  seo_title = 'Blusa Canelada Manga Longa Gola Quadrada | Feliora',
  seo_description = 'Blusa feminina canelada manga longa com gola quadrada. Modelagem que valoriza a silhueta. Frete para todo o Brasil.'
where slug = 'blusa-feminina-canelada-manga-longa-gola-quadrada';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Baby look em suplex leve com decote quadrado — conforto e estilo no dia a dia.'),
  seo_title = 'Blusa Baby Look Suplex Decote Quadrado | Feliora',
  seo_description = 'Blusa feminina baby look em tecido suplex leve e confortável. Ideal para looks casuais. Compre online na Feliora.'
where slug = 'blusa-feminina-baby-look-com-tecido-suplex-leve-e-confortavel';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Kit com 2 blusas manga longa em suplex, decote quadrado — proteção UV e conforto.'),
  seo_title = 'Kit 2 Blusas Manga Longa Suplex Decote Quadrado | Feliora',
  seo_description = 'Kit 2 blusas femininas manga longa em suplex com decote quadrado. Ideal para academia e dia a dia. Compre na Feliora.'
where slug = 'kit-2-blusa-feminina-manga-longa-suplex-decote-quadrado-tee-academia-protecao-uv';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Kit com 3 blusas manga longa em suplex, decote quadrado — economia e versatilidade.'),
  seo_title = 'Kit 3 Blusas Manga Longa Suplex Decote Quadrado | Feliora',
  seo_description = 'Kit 3 blusas femininas manga longa em suplex com decote quadrado. Mais economia para renovar o guarda-roupa na Feliora.'
where slug = 'kit-3-blusa-feminina-manga-longa-suplex-decote-quadrado-tee-academia-protecao-uv';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Kit com 2 baby looks em suplex leve — praticidade e visual moderno.'),
  seo_title = 'Kit 2 Blusas Baby Look Suplex | Feliora',
  seo_description = 'Kit 2 blusas baby look em tecido suplex leve e confortável. Peças versáteis para o dia a dia na Feliora.'
where slug = 'kit-2-blusa-feminina-baby-look-com-tecido-suplex-leve-e-confortavel';

update public.products set
  short_description = coalesce(nullif(trim(short_description), ''), 'Kit com 3 baby looks em suplex leve — mais opções, mesmo conforto.'),
  seo_title = 'Kit 3 Blusas Baby Look Suplex | Feliora',
  seo_description = 'Kit 3 blusas baby look em tecido suplex leve e confortável. Renove o guarda-roupa com economia na Feliora.'
where slug = 'kit-3-blusa-feminina-baby-look-com-tecido-suplex-leve-e-confortavel';

-- ---------------------------------------------------------------------------
-- Páginas institucionais
-- ---------------------------------------------------------------------------

insert into public.content_pages (slug, title, seo_title, seo_description, page_type, content, is_published)
values
(
  'sobre',
  'Sobre a Feliora',
  'Sobre a Feliora — Moda Feminina Autoral',
  'Conheça a Feliora: moda feminina com delicadeza, presença autoral e peças sofisticadas para o seu guarda-roupa.',
  'sections',
  '{"sections":[{"heading":"Nossa essência","body":"A Feliora nasceu para celebrar a moda feminina com delicadeza e presença. Criamos e selecionamos peças que unem romantismo, caimento cuidadoso e sofisticação acessível — para você se sentir linda no dia a dia e em ocasiões especiais."},{"heading":"Compra com confiança","body":"Loja online com pagamento seguro via Mercado Pago, frete cotado com Melhor Envio e atendimento humano pelo WhatsApp e e-mail. Entregamos para todo o Brasil."},{"heading":"Contato","body":"Dúvidas sobre pedidos, trocas ou peças? Use os canais publicados no rodapé da loja ou a área Minha conta."}]}'::jsonb,
  true
),
(
  'trocas',
  'Trocas e devoluções',
  'Trocas e Devoluções — Feliora',
  'Política de trocas e devoluções da Feliora: prazos, condições e como solicitar, conforme o Código de Defesa do Consumidor.',
  'sections',
  '{"sections":[{"heading":"Prazo","body":"Você pode solicitar troca ou devolução em até 7 dias corridos após o recebimento, conforme o CDC."},{"heading":"Condições","body":"A peça deve estar sem uso, com etiquetas e na embalagem original. Entre em contato pelo atendimento da loja com o número do pedido."},{"heading":"Como solicitar","body":"Envie um e-mail ou mensagem pelo WhatsApp informado na loja, com o número do pedido e fotos se necessário. Nossa equipe orienta os próximos passos."}]}'::jsonb,
  true
),
(
  'frete',
  'Frete e entregas',
  'Frete e Entregas — Feliora',
  'Saiba como funciona o frete na Feliora: cotação no checkout, prazos estimados e entrega para todo o Brasil via Melhor Envio.',
  'sections',
  '{"sections":[{"heading":"Como calcular","body":"No checkout, informe seu CEP para ver as opções de frete disponíveis com valores e prazos estimados em tempo real."},{"heading":"Abrangência","body":"Enviamos para todo o Brasil através de transportadoras parceiras do Melhor Envio."},{"heading":"Acompanhamento","body":"Após o envio, você recebe o código de rastreio por e-mail para acompanhar a entrega."}]}'::jsonb,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  page_type = excluded.page_type,
  content = excluded.content,
  is_published = excluded.is_published,
  updated_at = now();

update public.content_pages set
  seo_title = 'Política de Privacidade — Feliora',
  seo_description = 'Como a Feliora coleta, usa e protege dados pessoais e cookies, em conformidade com a LGPD. Seus direitos e canais de contato.'
where slug = 'privacidade';
