const COLOR_HEX: Record<string, string> = {
  preto: "#1C1C1C",
  preta: "#1C1C1C",
  black: "#1C1C1C",
  branco: "#F7F4EE",
  branca: "#F7F4EE",
  white: "#F7F4EE",
  "off-white": "#F2EBDD",
  "off white": "#F2EBDD",
  creme: "#EFE2C6",
  cream: "#EFE2C6",
  bege: "#D8C3A5",
  beige: "#D8C3A5",
  areia: "#C9B18C",
  marrom: "#70452F",
  brown: "#70452F",
  caramelo: "#B8753D",
  nude: "#D6B49A",
  cinza: "#858585",
  gray: "#858585",
  grey: "#858585",
  azul: "#315C8C",
  blue: "#315C8C",
  marinho: "#233451",
  navy: "#233451",
  verde: "#527052",
  green: "#527052",
  vermelho: "#A9363E",
  red: "#A9363E",
  rosa: "#D88FA1",
  rose: "#C98792",
  blush: "#D9A3A7",
  pink: "#D88FA1",
  amarelo: "#E2BD45",
  yellow: "#E2BD45",
  laranja: "#D9783D",
  orange: "#D9783D",
  roxo: "#74558A",
  purple: "#74558A",
  lilas: "#AA8CC5",
  dourado: "#B99345",
  gold: "#B99345",
  prata: "#A9ADB3",
  prateado: "#A9ADB3",
  silver: "#A9ADB3",
  vinho: "#6F263D",
  bordo: "#6F263D",
  terracota: "#B8664B",
  coral: "#D87367",
};

function normalizeColorName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function colorTokens(name: string): string[] {
  return name
    .split(/\s*(?:\+|\/|\be\b)\s*/i)
    .map(normalizeColorName)
    .filter(Boolean);
}

export function productColorHex(
  name: string,
  fallback = "#8C7B6A"
): string {
  const token = colorTokens(name)[0] ?? normalizeColorName(name);
  return COLOR_HEX[token] ?? fallback;
}

/**
 * Cor CSS do swatch. Combinações como "Branca + Preta" viram um círculo
 * dividido em segmentos, preservando visualmente cada cor da variante.
 */
export function productColorBackground(
  name: string,
  fallback = "#8C7B6A"
): string {
  const tokens = colorTokens(name);
  if (tokens.length <= 1) return productColorHex(name, fallback);

  const colors = tokens.map((token) => COLOR_HEX[token] ?? fallback);
  const segments = colors.map((hex, index) => {
    const start = (index / colors.length) * 100;
    const end = ((index + 1) / colors.length) * 100;
    return `${hex} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}
