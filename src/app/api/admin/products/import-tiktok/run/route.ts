import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { runTikTokXlsxImport } from "@/lib/admin/tiktokImport/runImport";
import type { TikTokParsedProduct } from "@/lib/admin/tiktokImport/types";
import { createSyncJob, runJobProgress } from "@/lib/marketplace/jobs";

const selectionSchema = z.object({
  tiktokProductId: z.string().min(1),
  action: z.enum(["create", "update"]),
  categoryId: z.string().uuid().nullable(),
  singleVariationAs: z.enum(["size", "color"]),
});

const runSchema = z.object({
  products: z.array(z.record(z.string(), z.unknown())).min(1),
  selections: z.array(selectionSchema).min(1).max(100),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = runSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const products = parsed.data.products as unknown as TikTokParsedProduct[];
    const productIds = new Set(products.map((p) => p.tiktokProductId));
    for (const sel of parsed.data.selections) {
      if (!productIds.has(sel.tiktokProductId)) {
        return NextResponse.json(
          { error: `Seleção inválida: ${sel.tiktokProductId}` },
          { status: 400 }
        );
      }
    }

    const job = await createSyncJob({
      channel: "tiktok",
      jobType: "import",
      direction: "inbound",
      totalItems: parsed.data.selections.length,
      payload: {
        source: "xlsx",
        selectionIds: parsed.data.selections.map((s) => s.tiktokProductId),
      },
    });

    void (async () => {
      await runJobProgress(
        job.id,
        parsed.data.selections.length,
        async (report) => {
          await runTikTokXlsxImport({
            products,
            selections: parsed.data.selections,
            report,
          });
        }
      );
    })();

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao iniciar importação",
      },
      { status: 500 }
    );
  }
}
