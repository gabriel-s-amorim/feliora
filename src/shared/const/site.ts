/** Identidade e defaults de SEO da Feliora (client + server). */

export const SITE_NAME = "Feliora";
export const SITE_TAGLINE = "Moda feminina com delicadeza";
export const SITE_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  "Moda feminina com presença autoral. Feliora — peças sofisticadas e românticas.";
export const SITE_KEYWORDS =
  "feliora, moda feminina, moda autoral, lookbook, vestuário feminino";
export const SITE_LOCALE = "pt_BR";
export const SITE_THEME_COLOR = "#B76E79";
export const SITE_BG_COLOR = "#FDF8F4";
export const SITE_LOGO_PATH = "/images/logo-feliora.png";
export const SITE_OG_IMAGE_PATH = "/images/og-feliora.png";
/** Domínio canônico público (sem barra final). Placeholder até o domínio definitivo. */
export const SITE_ORIGIN = "https://feliora.com.br";

export const DEFAULT_TITLE_TEMPLATE = `%s — ${SITE_NAME}`;

/** Link fixo da loja (não é categoria). Categorias vêm do banco. */
export const CATALOG_NAV = {
  href: "/catalogo",
  label: "Catálogo",
} as const;
