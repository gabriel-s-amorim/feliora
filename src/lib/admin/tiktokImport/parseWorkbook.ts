import * as XLSX from "xlsx";

const REQUIRED_COLUMNS = [
  "product_id",
  "category",
  "product_name",
  "sku_id",
  "variation_value",
  "product_description",
  "price",
  "quantity",
  "main_image",
] as const;

const IMAGE_COLUMNS = [
  "main_image",
  "image_2",
  "image_3",
  "image_4",
  "image_5",
  "image_6",
  "image_7",
  "image_8",
  "image_9",
] as const;

export type TikTokRawRow = {
  product_id: string;
  category: string;
  product_name: string;
  sku_id: string;
  variation_value: string;
  product_description: string;
  brand: string;
  price: string;
  quantity: string;
  seller_sku: string;
  parcel_weight: string;
  parcel_length: string;
  parcel_width: string;
  parcel_height: string;
  main_image: string;
  image_2: string;
  image_3: string;
  image_4: string;
  image_5: string;
  image_6: string;
  image_7: string;
  image_8: string;
  image_9: string;
};

function cellStr(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/** Parse da planilha Bulk Edit (aba Template). Dados começam na linha 6. */
export function parseTikTokWorkbook(buffer: Buffer): TikTokRawRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName =
    workbook.SheetNames.find((n) => /^template$/i.test(n)) ??
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Planilha vazia ou inválida.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(
    sheet,
    { header: 1, defval: "", raw: false }
  );

  if (rows.length < 6) {
    throw new Error(
      "Formato inválido: a planilha deve ter 5 linhas de cabeçalho e dados a partir da linha 6 (export Bulk Edit do TikTok Seller Center)."
    );
  }

  const headers = (rows[0] ?? []).map((h) => cellStr(h).toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing.join(", ")}. Confirme que exportou o template "All Information".`
    );
  }

  const indexOf = (name: string) => headers.indexOf(name);

  const dataRows: TikTokRawRow[] = [];
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const productId = cellStr(row[indexOf("product_id")]);
    const productName = cellStr(row[indexOf("product_name")]);
    if (!productId && !productName) continue;

    const images: Record<string, string> = {};
    for (const col of IMAGE_COLUMNS) {
      const idx = indexOf(col);
      images[col] = idx >= 0 ? cellStr(row[idx]) : "";
    }

    dataRows.push({
      product_id: productId,
      category: cellStr(row[indexOf("category")]),
      product_name: productName,
      sku_id: cellStr(row[indexOf("sku_id")]),
      variation_value: cellStr(row[indexOf("variation_value")]),
      product_description: cellStr(row[indexOf("product_description")]),
      brand: cellStr(row[indexOf("brand")]),
      price: cellStr(row[indexOf("price")]),
      quantity: cellStr(row[indexOf("quantity")]),
      seller_sku: cellStr(row[indexOf("seller_sku")]),
      parcel_weight: cellStr(row[indexOf("parcel_weight")]),
      parcel_length: cellStr(row[indexOf("parcel_length")]),
      parcel_width: cellStr(row[indexOf("parcel_width")]),
      parcel_height: cellStr(row[indexOf("parcel_height")]),
      main_image: images.main_image,
      image_2: images.image_2,
      image_3: images.image_3,
      image_4: images.image_4,
      image_5: images.image_5,
      image_6: images.image_6,
      image_7: images.image_7,
      image_8: images.image_8,
      image_9: images.image_9,
    });
  }

  if (dataRows.length === 0) {
    throw new Error(
      "Nenhum produto encontrado na planilha. Os dados devem começar na linha 6."
    );
  }

  return dataRows;
}

export function collectImageUrls(row: TikTokRawRow): string[] {
  const urls: string[] = [];
  for (const col of IMAGE_COLUMNS) {
    const url = row[col];
    if (url && /^https?:\/\//i.test(url)) urls.push(url);
  }
  return [...new Set(urls)];
}

export function parseNumber(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Extrai `"Blusas e camisas (601265)"` → name + code. */
export function parseTikTokCategory(raw: string): {
  name: string | null;
  code: string | null;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { name: null, code: null };
  const match = trimmed.match(/^(.*?)\s*\((\d+)\)\s*$/);
  if (match) {
    return { name: match[1].trim() || null, code: match[2] };
  }
  return { name: trimmed, code: null };
}
