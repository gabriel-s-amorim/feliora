import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  MAX_UPLOAD_BYTES,
  uploadAdminImage,
  type UploadFolder,
} from "@/lib/admin/uploads";

const FOLDERS = new Set<UploadFolder>(["products", "banners"]);

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folderRaw = String(form.get("folder") ?? "products");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie um arquivo no campo 'file'" },
        { status: 400 }
      );
    }

    if (!FOLDERS.has(folderRaw as UploadFolder)) {
      return NextResponse.json(
        { error: "Pasta inválida (products | banners)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx. 12 MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadAdminImage(
      { buffer, mimetype: file.type || "image/jpeg" },
      folderRaw as UploadFolder
    );

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro no upload",
      },
      { status: 500 }
    );
  }
}
