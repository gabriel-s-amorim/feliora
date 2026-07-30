/** Identidade e defaults de SEO da Feliora (client + server). */

export const SITE_NAME = "Feliora";
export const SITE_LEGAL_NAME = "Feliora";
export const SITE_TAGLINE = "Moda feminina com delicadeza";
export const SITE_TITLE = `${SITE_NAME} | Moda Feminina Online`;
export const SITE_DESCRIPTION =
  "Loja de moda feminina Feliora — vestidos, blusas e peças sofisticadas com delicadeza. Compre online com frete para todo o Brasil.";
export const SITE_KEYWORDS = [
  "feliora",
  "moda feminina",
  "loja de roupa feminina",
  "vestidos femininos",
  "blusas femininas",
  "moda online brasil",
  "roupa feminina delicada",
  "moda romântica",
] as const;
export const SITE_LOCALE = "pt_BR";
export const SITE_LOCALE_BCP47 = "pt-BR";
export const SITE_THEME_COLOR = "#B76E79";
export const SITE_BG_COLOR = "#FDF8F4";
export const SITE_LOGO_PATH = "/images/logo-feliora.png";
export const SITE_OG_IMAGE_PATH = "/images/og-feliora.png";
/** Dimensões recomendadas pelo Facebook/LinkedIn/WhatsApp (1.91:1). */
export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;
export const SITE_OG_IMAGE_ALT = "Feliora — moda feminina com delicadeza";

/**
 * Domínio canônico público (sem barra final).
 * A Vercel redireciona o domínio apex para www.
 */
export const SITE_ORIGIN = "https://www.feliora.com.br";
export const SITE_WWW_ORIGIN = "https://www.feliora.com.br";

export const DEFAULT_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

/** Link fixo da loja (não é categoria). Categorias vêm do banco. */
export const CATALOG_NAV = {
  href: "/catalogo",
  label: "Catálogo",
} as const;

/** Rotas públicas indexáveis (além de produtos/categorias/páginas dinâmicas). */
export const SEO_STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/catalogo", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/pages/sobre", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/pages/trocas", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/pages/frete", priority: 0.4, changeFrequency: "monthly" as const },
  {
    path: "/pages/privacidade",
    priority: 0.3,
    changeFrequency: "yearly" as const,
  },
] as const;
