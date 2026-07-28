import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import {
  exportProductToChannel,
  importRemoteProducts,
  listRemoteProducts,
} from "@/lib/marketplace/catalog";
import { createSyncJob, getSyncJob, runJobProgress } from "@/lib/marketplace/jobs";
import {
  getExportReadiness,
  listCategoryMaps,
  listProductLinks,
  upsertCategoryMap,
} from "@/lib/marketplace/links";
import {
  pushPriceForProduct,
  pushStockForProduct,
} from "@/lib/marketplace/syncStock";
import { shopeeGetCategory } from "@/lib/marketplace/shopee/client";
import { tiktokGetCategories, tiktokGetWarehouses } from "@/lib/marketplace/tiktok/client";
import { getChannelAdminStatus } from "@/lib/marketplace/settings";
import {
  marketplaceCategoryMapSchema,
  marketplaceExportSchema,
  marketplaceImportSchema,
  marketplaceSyncSchema,
} from "@/shared/schemas/marketplace";
import type { MarketplaceChannel } from "@/shared/types/marketplace";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "status";

  try {
    if (action === "status") {
      const [shopee, tiktok] = await Promise.all([
        getChannelAdminStatus("shopee"),
        getChannelAdminStatus("tiktok"),
      ]);
      return NextResponse.json({ shopee, tiktok });
    }

    if (action === "remote-products") {
      const channel = searchParams.get("channel") as MarketplaceChannel;
      if (channel !== "shopee" && channel !== "tiktok") {
        return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
      }
      const page = Number(searchParams.get("page") ?? "0") || 0;
      const result = await listRemoteProducts(channel, page);
      return NextResponse.json(result);
    }

    if (action === "categories") {
      const channel = searchParams.get("channel") as MarketplaceChannel;
      if (channel !== "shopee" && channel !== "tiktok") {
        return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
      }
      if (channel === "shopee") {
        const data = await shopeeGetCategory();
        return NextResponse.json({
          categories: (data.category_list ?? []).map((c) => ({
            id: String(c.category_id),
            name: c.display_category_name || c.original_category_name,
            parentId:
              c.parent_category_id && c.parent_category_id !== 0
                ? String(c.parent_category_id)
                : null,
            hasChildren: c.has_children,
          })),
        });
      }
      const data = await tiktokGetCategories();
      return NextResponse.json({
        categories: (data.categories ?? []).map((c) => ({
          id: c.id,
          name: c.local_name ?? c.id,
          parentId: c.parent_id && c.parent_id !== "0" ? c.parent_id : null,
          hasChildren: !c.is_leaf,
        })),
      });
    }

    if (action === "category-maps") {
      const channel = searchParams.get("channel") as MarketplaceChannel | null;
      const maps = await listCategoryMaps(
        channel === "shopee" || channel === "tiktok" ? channel : undefined
      );
      return NextResponse.json({ maps });
    }

    if (action === "links") {
      const ids = searchParams.get("productIds");
      const productIds = ids
        ? ids.split(",").map((x) => Number(x)).filter((n) => n > 0)
        : undefined;
      const links = await listProductLinks(productIds);
      return NextResponse.json({ links });
    }

    if (action === "readiness") {
      const channel = searchParams.get("channel") as MarketplaceChannel;
      const ids = (searchParams.get("productIds") ?? "")
        .split(",")
        .map((x) => Number(x))
        .filter((n) => n > 0);
      if (channel !== "shopee" && channel !== "tiktok") {
        return NextResponse.json({ error: "Canal inválido" }, { status: 400 });
      }
      const readiness = await getExportReadiness(ids, channel);
      return NextResponse.json({ readiness });
    }

    if (action === "warehouses") {
      const data = await tiktokGetWarehouses();
      return NextResponse.json({ warehouses: data.warehouses ?? [] });
    }

    if (action === "job") {
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
      }
      const job = await getSyncJob(id);
      if (!job) {
        return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: "action inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "";

  try {
    const body = await request.json().catch(() => ({}));

    if (action === "category-map") {
      const parsed = marketplaceCategoryMapSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
          { status: 400 }
        );
      }
      const map = await upsertCategoryMap(parsed.data);
      return NextResponse.json(map);
    }

    if (action === "import") {
      const parsed = marketplaceImportSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
          { status: 400 }
        );
      }
      const job = await createSyncJob({
        channel: parsed.data.channel,
        jobType: "import",
        direction: "inbound",
        totalItems: parsed.data.externalItemIds.length,
        payload: parsed.data as unknown as Record<string, unknown>,
      });

      // Processa de forma síncrona (lote ≤50) — UX com progresso via job
      void (async () => {
        await runJobProgress(
          job.id,
          parsed.data.externalItemIds.length,
          async (report) => {
            let done = 0;
            for (const externalId of parsed.data.externalItemIds) {
              try {
                const result = await importRemoteProducts(
                  parsed.data.channel,
                  [externalId],
                  parsed.data.categoryId
                );
                if (result.errors[0]) {
                  await report(done + 1, {
                    message: result.errors[0].message,
                    externalId,
                  });
                } else {
                  await report(done + 1);
                }
              } catch (err) {
                await report(done + 1, {
                  message: err instanceof Error ? err.message : "Erro",
                  externalId,
                });
              }
              done += 1;
            }
          }
        );
      })();

      return NextResponse.json({ jobId: job.id });
    }

    if (action === "export") {
      const parsed = marketplaceExportSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
          { status: 400 }
        );
      }

      const tasks = parsed.data.channels.flatMap((channel) =>
        parsed.data.productIds.map((productId) => ({ channel, productId }))
      );

      const job = await createSyncJob({
        jobType: "export",
        direction: "outbound",
        totalItems: tasks.length,
        payload: parsed.data as unknown as Record<string, unknown>,
      });

      void (async () => {
        await runJobProgress(job.id, tasks.length, async (report) => {
          let done = 0;
          for (const task of tasks) {
            try {
              await exportProductToChannel(task.channel, task.productId);
              await report(done + 1);
            } catch (err) {
              await report(done + 1, {
                message: err instanceof Error ? err.message : "Erro",
                productId: task.productId,
              });
            }
            done += 1;
          }
        });
      })();

      return NextResponse.json({ jobId: job.id });
    }

    if (action === "sync") {
      const parsed = marketplaceSyncSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
          { status: 400 }
        );
      }

      const channels: MarketplaceChannel[] =
        parsed.data.channels?.length
          ? parsed.data.channels
          : ["shopee", "tiktok"];

      let productIds = parsed.data.productIds;
      if (!productIds?.length) {
        const links = await listProductLinks();
        productIds = [
          ...new Set(
            links
              .filter(
                (l) =>
                  l.status === "listed" && channels.includes(l.channel)
              )
              .map((l) => l.productId)
          ),
        ];
      }

      const tasks = channels.flatMap((channel) =>
        (productIds ?? []).map((productId) => ({ channel, productId }))
      );

      const job = await createSyncJob({
        jobType: parsed.data.type,
        direction: "outbound",
        totalItems: tasks.length,
        payload: parsed.data as unknown as Record<string, unknown>,
      });

      void (async () => {
        await runJobProgress(job.id, tasks.length, async (report) => {
          let done = 0;
          for (const task of tasks) {
            try {
              if (parsed.data.type === "price" || parsed.data.type === "full") {
                await pushPriceForProduct(task.channel, task.productId);
              }
              if (parsed.data.type === "stock" || parsed.data.type === "full") {
                await pushStockForProduct(task.channel, task.productId);
              }
              await report(done + 1);
            } catch (err) {
              await report(done + 1, {
                message: err instanceof Error ? err.message : "Erro",
                productId: task.productId,
              });
            }
            done += 1;
          }
        });
      })();

      return NextResponse.json({ jobId: job.id, total: tasks.length });
    }

    return NextResponse.json({ error: "action inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro" },
      { status: 500 }
    );
  }
}
