import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { buildPreviewProducts } from "@/lib/admin/tiktokImport/mapProduct";
import { parseTikTokWorkbook } from "@/lib/admin/tiktokImport/parseWorkbook";

const MAX_XLSX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie o arquivo .xlsx no campo 'file'" },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Aceitamos apenas arquivos .xlsx do TikTok Seller Center." },
        { status: 400 }
      );
    }

    if (file.size > MAX_XLSX_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande (máx. 15 MB)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseTikTokWorkbook(buffer);
    const products = await buildPreviewProducts(rows);

    const imageCount = products.reduce(
      (sum, p) => sum + p.imageUrls.length,
      0
    );

    return NextResponse.json({
      products,
      summary: {
        productCount: products.length,
        variantCount: products.reduce((s, p) => s + p.variants.length, 0),
        imageCount,
        estimatedSeconds: Math.max(5, Math.round(imageCount * 1.5)),
        duplicates: products.filter((p) => p.duplicate.matchedBy).length,
        unmappedCategories: products.filter((p) => !p.categoryMapped).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao ler a planilha TikTok",
      },
      { status: 400 }
    );
  }
}
