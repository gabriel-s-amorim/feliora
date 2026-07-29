import * as XLSX from "xlsx";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

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

/**
 * Alguns exports do Seller Center mantêm `!ref` limitado ao cabeçalho mesmo
 * quando há células gravadas abaixo dele. Calcula o intervalo pelas células
 * reais para que o SheetJS não descarte as linhas de produto.
 */
function getEffectiveRange(sheet: XLSX.WorkSheet): XLSX.Range | undefined {
  const addresses = Object.keys(sheet).filter((key) => !key.startsWith("!"));
  if (addresses.length === 0) return undefined;

  let minRow = Number.POSITIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxRow = 0;
  let maxCol = 0;

  for (const address of addresses) {
    const cell = XLSX.utils.decode_cell(address);
    minRow = Math.min(minRow, cell.r);
    minCol = Math.min(minCol, cell.c);
    maxRow = Math.max(maxRow, cell.r);
    maxCol = Math.max(maxCol, cell.c);
  }

  return {
    s: { r: minRow, c: minCol },
    e: { r: maxRow, c: maxCol },
  };
}

/**
 * O TikTok gera alguns arquivos com células até dezenas/centenas de linhas,
 * mas deixa `<dimension ref="A1:AL5">` no XML. O SheetJS respeita esse valor
 * e nem carrega as células posteriores. Quando isso ocorrer, corrige apenas
 * o metadado de dimensão dentro do ZIP e faz o parse novamente.
 */
function repairBrokenWorksheetDimensions(buffer: Buffer): Buffer {
  const files = unzipSync(new Uint8Array(buffer));
  let changed = false;

  for (const [name, bytes] of Object.entries(files)) {
    if (!/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)) continue;

    let xml = strFromU8(bytes);
    const cells = xml.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"/g);
    let range: XLSX.Range | null = null;

    for (const match of cells) {
      const cell = XLSX.utils.decode_cell(match[1]);
      if (!range) {
        range = { s: { ...cell }, e: { ...cell } };
      } else {
        range.s.r = Math.min(range.s.r, cell.r);
        range.s.c = Math.min(range.s.c, cell.c);
        range.e.r = Math.max(range.e.r, cell.r);
        range.e.c = Math.max(range.e.c, cell.c);
      }
    }

    if (!range) continue;

    const actualRef = XLSX.utils.encode_range(range);
    const currentRef = xml.match(/<dimension\b[^>]*\bref="([^"]+)"/)?.[1];
    if (!currentRef) continue;

    const currentRange = XLSX.utils.decode_range(currentRef);
    if (
      currentRange.e.r >= range.e.r &&
      currentRange.e.c >= range.e.c
    ) {
      continue;
    }

    xml = xml.replace(
      /<dimension\b[^>]*(?:\/>|>[\s\S]*?<\/dimension>)/,
      `<dimension ref="${actualRef}"/>`
    );
    files[name] = strToU8(xml);
    changed = true;
  }

  return changed ? Buffer.from(zipSync(files, { level: 6 })) : buffer;
}

function readTemplateRows(buffer: Buffer): {
  rows: (string | number | null | undefined)[][];
  sheetName: string | null;
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName =
    workbook.SheetNames.find((n) => /^template$/i.test(n)) ??
    workbook.SheetNames[0] ??
    null;

  if (!sheetName) return { rows: [], sheetName: null };

  const sheet = workbook.Sheets[sheetName];
  const range = getEffectiveRange(sheet);
  const rows = XLSX.utils.sheet_to_json<
    (string | number | null | undefined)[]
  >(sheet, { header: 1, defval: "", raw: false, range });

  return { rows, sheetName };
}

/** Parse da planilha Bulk Edit (aba Template). Dados começam na linha 6. */
export function parseTikTokWorkbook(buffer: Buffer): TikTokRawRow[] {
  let parsed = readTemplateRows(buffer);

  if (!parsed.sheetName) {
    throw new Error("Planilha vazia ou inválida.");
  }

  if (parsed.rows.length < 6) {
    parsed = readTemplateRows(repairBrokenWorksheetDimensions(buffer));
  }

  const rows = parsed.rows;
  const headers = (rows[0] ?? []).map((h) => cellStr(h).toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing.join(", ")}. Confirme que exportou o template "All Information".`
    );
  }

  if (rows.length < 6) {
    throw new Error(
      "A planilha tem o cabeçalho correto, mas não contém produtos. Salve o arquivo após preencher/exportar os dados e selecione essa cópia."
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
