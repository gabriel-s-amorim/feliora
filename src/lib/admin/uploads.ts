import { nanoid } from "nanoid";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const WEBP_QUALITY = 82;

export type UploadFolder = "products" | "banners";

const MAX_DIMENSION_BY_FOLDER: Record<UploadFolder, number> = {
  products: 1600,
  banners: 2400,
};

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAllowedImageMime(mimetype: string): boolean {
  return ALLOWED_MIME.has(mimetype.toLowerCase());
}

async function toOptimizedWebp(
  buffer: Buffer,
  folder: UploadFolder
): Promise<Buffer> {
  const maxSide = MAX_DIMENSION_BY_FOLDER[folder];
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

export async function uploadAdminImage(
  file: { buffer: Buffer; mimetype: string },
  folder: UploadFolder = "products"
): Promise<string> {
  if (!isAllowedImageMime(file.mimetype)) {
    throw new Error("Formato não suportado. Use JPG, PNG, WEBP ou GIF.");
  }

  if (file.buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo muito grande (máx. 12 MB).");
  }

  const supabase = createAdminClient();
  const isGif = file.mimetype === "image/gif";

  let body: Buffer;
  let contentType: string;
  let path: string;

  if (isGif) {
    body = file.buffer;
    contentType = "image/gif";
    path = `${folder}/${Date.now()}-${nanoid(8)}.gif`;
  } else {
    try {
      body = await toOptimizedWebp(file.buffer, folder);
    } catch {
      throw new Error(
        "Não foi possível processar a imagem. Tente outro arquivo JPG, PNG ou WEBP."
      );
    }
    contentType = "image/webp";
    path = `${folder}/${Date.now()}-${nanoid(8)}.webp`;
  }

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, body, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha no upload: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}
