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

## Categorias

Não há categorias hardcoded no código nem seed de Vestidos/Blusas/etc.  
Crie categorias pelo admin (Fase 5) ou com um `INSERT` manual no SQL Editor. A navegação da loja lê apenas categorias com `is_active = true`.

## Variáveis

Configure no app (`site/.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
```
