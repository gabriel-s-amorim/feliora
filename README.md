# Feliora

Loja virtual de moda feminina. Stack: Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Desenvolvimento

```bash
cd site
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> O app Next.js vive em `site/` (scaffold inicial). A pasta raiz `feliora/` também guarda assets temporários da logo.

## Fase 0 (concluída)

- Design tokens, `site.ts`, layout, home, 404, logo

## Fase 1 (schema)

SQL em `supabase/` (ordem numérica). Categorias **não** são hardcoded — cadastre no admin (Fase 5) ou via SQL; a nav lê só `categories` ativas.

Para ver o catálogo com dados de exemplo, rode também `09_seed_demo_optional.sql` no SQL Editor.

```bash
cp .env.example .env.local
# preencha URL + keys
npm run dev
```

## Fase 2 (catálogo)

- `/catalogo`, `/categoria/[slug]`, `/produto/[slug]`, `/busca`
- Grid mobile-first, Quick View, filtros (bottom sheet), swatches, galeria, JSON-LD
- Home com lookbook + destaques/categorias dinâmicas
