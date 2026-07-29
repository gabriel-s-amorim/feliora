import { uploadAdminImage } from "@/lib/admin/uploads";
import { mapPool } from "@/lib/admin/tiktokImport/concurrency";
import type { TikTokImageMap } from "@/lib/admin/tiktokImport/types";

function sniffMime(buffer: Buffer, contentType: string | null): string {
  const ct = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (
    ct === "image/jpeg" ||
    ct === "image/png" ||
    ct === "image/webp" ||
    ct === "image/gif"
  ) {
    return ct;
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  return "image/jpeg";
}

export async function downloadTikTokImage(
  url: string
): Promise<{ buffer: Buffer; mimetype: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "FelioraImporter/1.0",
      Accept: "image/*,*/*",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Falha ao baixar imagem (${res.status})`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0) {
    throw new Error("Imagem vazia");
  }
  const mimetype = sniffMime(buffer, res.headers.get("content-type"));
  return { buffer, mimetype };
}

/**
 * Baixa URL do TikTok e sobe via uploadAdminImage (mesmo pipeline WebP do form).
 */
export async function importImageFromUrl(url: string): Promise<string> {
  const file = await downloadTikTokImage(url);
  return uploadAdminImage(file, "products");
}

export type ResolveImagesResult = {
  felioraUrls: string[];
  imageMap: TikTokImageMap;
  warnings: string[];
  convertedCount: number;
};

/**
 * Resolve imagens: reutiliza mapa existente se a URL TikTok não mudou;
 * principal é obrigatória; secundárias best-effort.
 */
export async function resolveProductImages(input: {
  sourceUrls: string[];
  existingMap?: TikTokImageMap;
}): Promise<ResolveImagesResult> {
  const sourceUrls = input.sourceUrls.filter(Boolean);
  const existingMap = input.existingMap ?? {};
  const warnings: string[] = [];
  const imageMap: TikTokImageMap = {};
  let convertedCount = 0;

  if (sourceUrls.length === 0) {
    throw new Error("Produto sem imagem principal");
  }

  const mainUrl = sourceUrls[0];
  const secondaryUrls = sourceUrls.slice(1);

  async function resolveOne(
    url: string,
    required: boolean
  ): Promise<string | null> {
    const cached = existingMap[url];
    if (cached) {
      imageMap[url] = cached;
      return cached;
    }
    try {
      const felioraUrl = await importImageFromUrl(url);
      imageMap[url] = felioraUrl;
      convertedCount += 1;
      return felioraUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "erro desconhecido";
      if (required) {
        throw new Error(`Imagem principal: ${message}`);
      }
      warnings.push(`Imagem secundária ignorada (${url.slice(0, 60)}…): ${message}`);
      return null;
    }
  }

  const mainFeli = await resolveOne(mainUrl, true);
  if (!mainFeli) {
    throw new Error("Produto sem imagem principal");
  }

  const secondaryResults = await mapPool(secondaryUrls, 4, async (url) =>
    resolveOne(url, false)
  );

  const felioraUrls = [
    mainFeli,
    ...secondaryResults.filter((u): u is string => Boolean(u)),
  ];

  return { felioraUrls, imageMap, warnings, convertedCount };
}
