# Dossiê factual — Feliora (pré-README)

Documento interno gerado a partir do código-fonte. **Não inventar** nada fora deste inventário no README final. Itens sem evidência vão como `<!-- TODO -->`.

Gerado em: 2026-07-31  
Repo: https://github.com/gabriel-s-amorim/feliora.git  
Produção: https://www.feliora.com.br

---

## 1. Stack (versões resolvidas)

| Pacote | Versão | Evidência |
|--------|--------|-----------|
| next | 16.2.12 | `package.json` / `npm ls` |
| react / react-dom | 19.2.4 | idem |
| typescript | 5.9.3 | idem |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | idem |
| @supabase/ssr | 0.12.3 | idem |
| @supabase/supabase-js | 2.110.9 | idem |
| zod | 4.4.3 | idem |
| jose | 6.2.4 | admin JWT |
| bcryptjs | 3.0.3 | senhas admin |
| lucide-react | 1.27.0 | ícones |
| @fancyapps/ui | 6.1.14 | galeria PDP |
| @mercadopago/sdk-react | 1.0.7 | Payment Brick |
| xlsx | 0.18.5 | import TikTok |
| sanitize-html | 2.17.6 | conteúdo |
| sharp | 0.35.3 | imagens |
| nanoid | 6.0.0 | IDs |
| fflate | 0.8.3 | compressão |

- **Package manager:** npm (`package-lock.json`)
- **Router:** App Router (`src/app/`). Sem Pages Router.
- **Tailwind v4:** tokens via `@theme` em `src/app/globals.css` — sem `tailwind.config.*`
- **Deploy:** Vercel (`.vercel/project.json` → `feliora`); sem `vercel.json`
- **Scripts atuais:** `dev`, `build`, `start`, `lint`
- **Licença:** MIT (`LICENSE`, Copyright 2026 Gabriel Henrique)
- **UI libs:** sem Radix/shadcn — Tailwind + CSS tokens + lucide + Fancybox + MP SDK

---

## 2. Identidade visual

Fonte: `src/app/globals.css` + `src/shared/const/site.ts` + `src/app/layout.tsx`

| Token / item | Valor |
|--------------|-------|
| `--color-cream` | `#fdf8f4` |
| `--color-ivory` | `#f7f0e8` |
| `--color-rose-gold` | `#b76e79` |
| `--color-rose-gold-light` | `#c9a07a` |
| `--color-blush` | `#d4a59a` |
| `--color-earth` | `#8c7b6a` |
| `--color-ink` | `#2c241b` |
| `--color-ink-muted` | `#6b5e52` |
| Display font | Cormorant Garamond (`--font-cormorant` / `.font-display`) |
| Sans font | Outfit (`--font-outfit`) |
| Theme color | `#B76E79` |
| Logo | `/images/logo-feliora.png` (`SITE_LOGO_PATH`) |
| Tagline | "Moda feminina com delicadeza" |

**Monograma:** não existe como token/componente no código. Branding via logo PNG. Não mencionar monograma no README.

---

## 3. Modelagem de dados (37 tabelas)

Scripts SQL manuais em `supabase/` (`00`–`21`). Sem pasta `migrations/` formal. Sem views.

| # | Tabela | Propósito |
|---|--------|-----------|
| 1 | `categories` | Categorias |
| 2 | `products` | Catálogo + `search_vector` FTS |
| 3 | `product_variants` | SKU tamanho×cor; **estoque real** |
| 4 | `carts` | Guest (`session_id`) ou autenticado |
| 5 | `cart_items` | Itens por `variant_id` |
| 6 | `customer_profiles` | Perfil 1:1 `auth.users` |
| 7 | `customer_addresses` | Endereços |
| 8 | `orders` | Pedidos |
| 9 | `order_items` | Linhas do pedido |
| 10 | `coupons` | Cupons |
| 11 | `banners` | Banners home |
| 12 | `store_settings` | Contato/redes |
| 13 | `content_pages` | CMS (incl. privacidade LGPD) |
| 14 | `product_reviews` | Avaliações |
| 15 | `marketing_subscriptions` | Newsletter + consent |
| 16 | `admin_users` | Admins (bcrypt) |
| 17 | `rate_limit_events` | Rate limit |
| 18 | `mercado_pago_settings` | Credenciais MP |
| 19 | `payment_attempts` | Tentativas pagamento |
| 20 | `melhor_envio_settings` | Credenciais frete |
| 21 | `shipping_quotes` | Cotações |
| 22 | `melhor_envio_shipments` | Envios |
| 23 | `brevo_settings` | Brevo |
| 24 | `brevo_email_deliveries` | Entregas e-mail |
| 25 | `brevo_email_events` | Eventos webhook |
| 26 | `brevo_store_templates` | Templates HTML |
| 27 | `marketplace_channel_settings` | Shopee/TikTok |
| 28 | `marketplace_category_maps` | Map categorias |
| 29 | `marketplace_product_links` | Link produto remoto |
| 30 | `marketplace_variant_links` | Link variante remota |
| 31 | `marketplace_sync_jobs` | Jobs import/export/stock |
| 32 | `marketplace_orders` | Pedidos marketplace |
| 33 | `site_page_views` | Analytics |
| 34 | `site_visitor_presence` | Presença ao vivo |
| 35 | `order_notifications` | Notif. cliente |
| 36 | `order_messages` | Mensagens pedido |
| 37 | `admin_notifications` | Feed admin |

Storage: bucket `product-images`.

### RPCs relevantes

- `decrement_variant_stock` / `check_variants_availability` (`08_stock_rpc.sql`) — atômico, `FOR UPDATE`, só `service_role`
- Checkout: `checkout_create_payment_order`, `checkout_accept_payment`, `reconcile_mercado_pago_payment`
- Admin: `admin_cancel_order` (restaura estoque), `increment_variant_stock`

### FTS (nuance)

- Coluna `products.search_vector`, índice GIN, config `portuguese`, trigger de refresh — **existe no schema**.
- App em `src/lib/products.ts` busca com **`ilike`** em name/short_description — **não usa FTS ainda**.
- README: “infra FTS pronta; busca atual ILIKE”; roadmap: ligar FTS.

### LGPD

- Sem tabelas LGPD dedicadas.
- Conteúdo: `14_lgpd_privacy_content.sql` → `/pages/privacidade`
- Cookie consent `feliora_cookie_consent` + componente `CookieConsent`
- `marketing_subscriptions.consent_at` / analytics gated por consentimento

---

## 4. Mapa de rotas

### Loja (`src/app/(store)/`)

| URL | Página |
|-----|--------|
| `/` | Home |
| `/catalogo` | Catálogo |
| `/categoria/[slug]` | Categoria |
| `/produto/[slug]` | PDP |
| `/busca` | Busca |
| `/carrinho` | Carrinho |
| `/checkout` | Checkout (sucesso in-place) |
| `/favoritos` | Favoritos |
| `/notificacoes` | Notificações |
| `/conta` | Conta |
| `/conta/entrar` | Login |
| `/conta/cadastro` | Cadastro |
| `/conta/pedidos/[id]` | Detalhe pedido |
| `/pages/[slug]` | CMS (sobre, trocas, frete, privacidade) |

Extras: `sitemap.ts`, `robots.ts`, `auth/callback`, `middleware.ts` (sessão Supabase).

### Admin (`src/app/(admin)/admin/`)

| URL | Página |
|-----|--------|
| `/admin` | Dashboard |
| `/admin/login` | Login admin |
| `/admin/produtos` (+ novo/[id]) | Produtos |
| `/admin/pedidos` (+ [id]) | Pedidos |
| `/admin/clientes` (+ [id]) | Clientes |
| `/admin/categorias` | Categorias |
| `/admin/cupons` | Cupons |
| `/admin/banners` | Banners |
| `/admin/canais` | Marketplace Shopee/TikTok |
| `/admin/integracoes` | MP / ME / Brevo |
| `/admin/settings` | Configurações |
| `/admin/notificacoes` | Notificações |

---

## 5. Features — status confirmado

| Feature | Status | Evidência |
|---------|--------|-----------|
| Guest cart `feliora_sid` httpOnly | Implementado | `src/lib/cart/session.ts` |
| Merge carrinho no login | Implementado | `POST /api/cart/merge` + `CustomerAuthContext` |
| Decremento atômico estoque | Implementado | `08_stock_rpc.sql` + checkout/reconcile |
| Import TikTok via planilha `.xlsx` | Implementado | `TikTokImportModal` + `tiktokImport/` + APIs parse/run |
| FTS Postgres na UI | Parcial | Schema sim; query app = `ilike` |
| LGPD MVP | Implementado | Cookie consent + página privacidade + opt-in |
| JSON-LD Product | Implementado | `src/lib/seo/jsonld.ts` + PDP |
| Auth cliente | Implementado | Supabase Auth (email + Google OAuth) |
| Auth admin | Implementado | JWT cookie `feliora_admin_token` + bcrypt |
| Checkout MP + Melhor Envio | Implementado | `/checkout` + webhooks |
| Credenciais criptografadas | Implementado | AES-256-GCM `secretCrypto.ts` |

---

## 6. Segurança e integrações

### Cookies httpOnly

- `feliora_sid` — sessão carrinho guest (180 dias, sameSite=lax, secure em prod)
- `feliora_admin_token` — JWT admin HS256
- `feliora_cookie_consent` — consentimento (não é auth)

### Env (nomes — `.env.example` + código)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` (+ fallback `SUPABASE_SERVICE_ROLE_KEY`)
- `NEXT_PUBLIC_APP_URL`, `APP_URL`
- `ADMIN_JWT_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`
- `MERCADO_PAGO_ENCRYPTION_KEY`, `MELHOR_ENVIO_ENCRYPTION_KEY`, `BREVO_ENCRYPTION_KEY`
- `SHOPEE_ENCRYPTION_KEY`, `TIKTOK_ENCRYPTION_KEY` (código; fora do `.env.example` atual)
- `BREVO_WEBHOOK_TOKEN` (opcional)

### Webhooks

- `/api/webhooks/mercado-pago`
- `/api/webhooks/brevo`
- `/api/webhooks/shopee`
- `/api/webhooks/tiktok`

### Crypto

- Integrações: AES-256-GCM (`v1.iv.tag.payload`), chave = SHA-256 da env (≥32 chars)
- Admin passwords: bcrypt 12 rounds

### RLS (tema)

- Catálogo/conteúdo público: SELECT se ativo/publicado
- Dados do cliente: own-row `auth.uid()`
- Carrinho, settings, marketplace, Brevo, analytics: RLS on, sem policies públicas → `service_role` via Route Handlers

---

## 7. Árvore de pastas (resumo)

```
feliora/
├── src/
│   ├── app/
│   │   ├── (store)/          # loja pública
│   │   ├── (admin)/admin/    # painel
│   │   ├── api/              # Route Handlers
│   │   ├── auth/callback/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── sitemap.ts / robots.ts
│   ├── components/           # admin, checkout, store, seo, legal
│   ├── contexts/
│   ├── hooks/
│   ├── lib/                  # cart, orders, crypto, marketplace, seo…
│   ├── shared/               # const, schemas Zod, types
│   ├── styles/
│   └── middleware.ts
├── supabase/                 # 00–21 SQL
├── public/
├── scripts/                  # (a criar: capture-screenshots)
└── docs/
```

---

## 8. Métricas / Resultados

**Nenhuma métrica de performance, Lighthouse, CWV ou contagem de produtos migrados documentada no repo.**

README deve usar:
- Fatos arquiteturais verificáveis (37 tabelas, integrações, etc.)
- `<!-- TODO: preencher com dado real -->` onde quiser número de tráfego/score/produtos

---

## 9. Screenshots planejados

| Arquivo | Tela | Status captura |
|---------|------|----------------|
| `01-home.png` | Home | OK |
| `02-catalogo.png` | Catálogo | OK |
| `03-produto.png` | PDP | OK |
| `04-carrinho.png` | Carrinho com itens | OK |
| `05-carrinho-vazio.png` | Carrinho vazio | OK |
| `06-checkout.png` | Gate de auth do checkout (`?next=/checkout`) — formulário completo exige cliente logado; sem criar users em prod | OK (gate) |
| `07-conta-entrar.png` | Login cliente | OK |
| `08-admin-login.png` | Login admin | OK |
| `09-admin-dashboard.png` | Dashboard | OK |
| `10-admin-produtos.png` | Produtos | OK |
| `11-admin-import-tiktok.png` | Modal importador TikTok | OK |
| `12-admin-pedidos.png` | Pedidos | OK |
| `13-home-mobile.png` | Home mobile | OK |
| `demo.webm` / `demo.gif` | Fluxo completo | OK |

URL captura default: `https://www.feliora.com.br` (`FELIORA_URL`).

**Nota:** Checkout autenticado (endereço/frete/pagamento) ficou como TODO no README — captura do gate é o comportamento real para visitante.
---

## 10. Decisões técnicas candidatas (problema → solução)

| Problema | Solução no código |
|----------|-------------------|
| Combinações tamanho×cor em moda | Tabela `product_variants` com estoque por SKU; sync agregado no produto |
| Catálogo TikTok antes da API oficial | Importador `.xlsx` Seller Center + `marketplace_sync_jobs`; schema de canais já preparado para API |
| Carrinho visitante + autenticado | Cookie `feliora_sid` + merge idempotente em `/api/cart/merge` |
| Overselling | RPC `decrement_variant_stock` com `FOR UPDATE`, só service_role |
| Credenciais de terceiros no DB | AES-256-GCM em colunas `*_encrypted` |
| Admin em serverless | JWT httpOnly (`feliora_admin_token`), sem sessão em memória |
| SEO de produto | JSON-LD Product + sitemap/robots + domínio canônico www |
| LGPD no MVP | Banner de cookies + página privacidade + consent marketing |
| Busca | Índice FTS no Postgres; query atual ainda ILIKE (migração no roadmap) |

---

## 11. Roadmap candidatas (reais / em aberto)

- Ligar query da loja ao `search_vector` (FTS)
- Aprovação / uso da API oficial TikTok Shop (substituir ou complementar XLSX)
- Expansão SEO (CWV medidos, rich results validados) — <!-- TODO métricas -->
- Sincronização bidirecional de estoque marketplace mais madura
- <!-- TODO: outros itens que o autor quiser incluir -->

---

## 12. README atual (a substituir)

[`README.md`](../README.md) está desatualizado: ainda menciona `cd site` e só Fases 0–2. App vive na raiz.

---

## Checklist de revisão humana

- [ ] Contagem 37 tabelas OK?
- [ ] Nuance FTS (schema sim / UI ilike) OK para o tom do README?
- [ ] Sem monograma — OK?
- [ ] URL de captura produção OK?
- [ ] Quais `<!-- TODO -->` de métricas você quer preencher depois?
