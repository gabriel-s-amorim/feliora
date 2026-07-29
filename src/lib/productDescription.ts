import sanitizeHtml from "sanitize-html";

const DESCRIPTION_TAGS = [
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "h2",
  "h3",
];

/** HTML seguro para exibição na página do produto. */
export function sanitizeProductDescription(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: DESCRIPTION_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}

/** Texto sem marcação para metadata e JSON-LD. */
export function productDescriptionText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}
