import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapSyncJob,
  type MarketplaceSyncJobRow,
} from "@/shared/lib/marketplaceMapper";
import type {
  MarketplaceChannel,
  MarketplaceJobType,
  MarketplaceSyncJob,
} from "@/shared/types/marketplace";

export async function createSyncJob(input: {
  channel?: MarketplaceChannel | null;
  jobType: MarketplaceJobType;
  direction?: "inbound" | "outbound" | "both";
  totalItems?: number;
  payload?: Record<string, unknown>;
}): Promise<MarketplaceSyncJob> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_sync_jobs")
    .insert({
      channel: input.channel ?? null,
      job_type: input.jobType,
      direction: input.direction ?? "outbound",
      status: "pending",
      total_items: input.totalItems ?? 0,
      payload: input.payload ?? {},
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSyncJob(data as MarketplaceSyncJobRow);
}

export async function updateSyncJob(
  id: string,
  patch: Partial<{
    status: MarketplaceSyncJob["status"];
    progress: number;
    totalItems: number;
    doneItems: number;
    errors: MarketplaceSyncJob["errors"];
    startedAt: string | null;
    finishedAt: string | null;
  }>
): Promise<MarketplaceSyncJob> {
  const supabase = createAdminClient();
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.progress !== undefined) row.progress = patch.progress;
  if (patch.totalItems !== undefined) row.total_items = patch.totalItems;
  if (patch.doneItems !== undefined) row.done_items = patch.doneItems;
  if (patch.errors !== undefined) row.errors = patch.errors;
  if (patch.startedAt !== undefined) row.started_at = patch.startedAt;
  if (patch.finishedAt !== undefined) row.finished_at = patch.finishedAt;

  const { data, error } = await supabase
    .from("marketplace_sync_jobs")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSyncJob(data as MarketplaceSyncJobRow);
}

export async function getSyncJob(id: string): Promise<MarketplaceSyncJob | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("marketplace_sync_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSyncJob(data as MarketplaceSyncJobRow);
}

export async function runJobProgress(
  jobId: string,
  total: number,
  runner: (
    report: (done: number, error?: { message: string; productId?: number; externalId?: string }) => Promise<void>
  ) => Promise<void>
): Promise<MarketplaceSyncJob> {
  const errors: MarketplaceSyncJob["errors"] = [];
  await updateSyncJob(jobId, {
    status: "running",
    totalItems: total,
    doneItems: 0,
    progress: 0,
    startedAt: new Date().toISOString(),
    errors: [],
  });

  await runner(async (done, err) => {
    if (err) errors.push(err);
    const progress = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 100;
    await updateSyncJob(jobId, {
      doneItems: done,
      progress,
      errors: [...errors],
    });
  });

  const status =
    errors.length === 0 ? "completed" : errors.length >= total ? "failed" : "partial";

  return updateSyncJob(jobId, {
    status,
    progress: 100,
    doneItems: total,
    finishedAt: new Date().toISOString(),
    errors,
  });
}
