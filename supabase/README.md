# Schema Supabase — Feliora

Execute os arquivos **na ordem numérica** no SQL Editor do projeto Supabase da Feliora (ou via CLI de migrations).

| Arquivo | Conteúdo |
|---------|----------|
| `00_helpers.sql` | `set_updated_at`, schema `private` |
| `01_categories.sql` | Categorias (sem seed — cadastro via admin) |
| `02_products_and_variants.sql` | Produtos + `product_variants` + RLS + sync de estoque + FTS |
| `03_cart.sql` | Carrinhos / itens com `variant_id` |
| `04_customers.sql` | Perfis, endereços, trigger no signup |
| `05_orders.sql` | Pedidos / itens com `variant_id` |
| `06_coupons.sql` | Cupons |
| `07_content_reviews_admin.sql` | Banners, settings, pages, reviews, marketing, admin_users |
| `08_stock_rpc.sql` | RPC atômica `decrement_variant_stock` |
| `09_seed_demo_optional.sql` | **Opcional** — categorias + 2 produtos demo (rode só se quiser ver o catálogo preenchido) |
| `10_storage_and_rate_limit.sql` | Storage + rate limit admin |
| `11_checkout_integrations.sql` | Mercado Pago + Melhor Envio + RPCs checkout |
| `12_brevo_fulfillment.sql` | Brevo (settings, deliveries, templates) + sync newsletter + índice fulfillment |
| `13_brevo_email_templates_v2.sql` | Templates de e-mail Feliora (visual editorial + itens) — pode reexecutar |
| `14_lgpd_privacy_content.sql` | Atualiza `content_pages` slug `privacidade` (texto LGPD completo) |
| `15_marketplace_channels.sql` | Shopee + TikTok: settings, links, jobs, pedidos (idempotência) |
| `16_google_oauth_profile.sql` | Trigger de perfil lê `name` do Google OAuth (além de `full_name`) |
| `17_seo.sql` | SEO: `products.seo_title/seo_description`, FTS, seed categorias/páginas |

## Categorias

Não há categorias hardcoded no código nem seed de Vestidos/Blusas/etc.  
Crie categorias pelo admin (Fase 5) ou com um `INSERT` manual no SQL Editor. A navegação da loja lê apenas categorias com `is_active = true`.

## Variáveis

Configure no app (`.env.local` na raiz do projeto):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
```

## Login com Google (OAuth)

O app já tem botões em `/conta/entrar` e `/conta/cadastro`, mais a rota `/auth/callback`.
As credenciais ficam no **Google Cloud** + **Supabase Dashboard** (não no `.env` do Next).

### 1. SQL (se o projeto já estava rodando)

No SQL Editor do Supabase, execute `16_google_oauth_profile.sql` (ou a função atualizada em `04_customers.sql`).

### 2. Google Cloud Console

1. Abra [Google Cloud Console](https://console.cloud.google.com/) e crie/selecione um projeto.
2. Em **Google Auth Platform** → **Clients** → **Create client** → tipo **Web application**.
3. **Authorized JavaScript origins**
   - `http://localhost:3000` (dev)
   - `https://seu-dominio.com` (produção)
4. **Authorized redirect URIs** — use a URL do callback do **Supabase** (não a do Next):
   - No Dashboard: [Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers?provider=Google)
   - Formato: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
5. Copie o **Client ID** e o **Client Secret**.

Scopes necessários (Data Access): `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.

### 3. Supabase Dashboard

1. **Authentication → Providers → Google** → Enable → cole Client ID e Client Secret → Save.
2. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3000` (dev) ou `https://seu-dominio.com`
   - **Redirect URLs** (allow list), adicione:
     - `http://localhost:3000/auth/callback`
     - `https://seu-dominio.com/auth/callback`
     - (opcional) `http://localhost:3000/auth/callback?**` se usar wildcards no projeto

### 4. Testar

1. Abra `/conta/entrar` ou `/conta/cadastro`.
2. Clique em **Entrar/Cadastrar com Google**.
3. Após o consentimento, você deve voltar logado em `/conta` (ou no `?next=` do checkout).

**Nota:** quem entra só com Google pode completar telefone depois em Conta → Perfil. Se a mesma pessoa já tiver conta por e-mail/senha, ative o vínculo automático de identidades no Auth do Supabase (Automatic linking), se disponível no plano.
