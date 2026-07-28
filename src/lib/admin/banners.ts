import { createAdminClient } from "@/lib/supabase/admin";
import { deleteStorageImages } from "@/lib/admin/uploads";
import { bannerToRow, mapBanner, type BannerRow } from "@/shared/lib/bannerMapper";
import type { BannerSchemaInput } from "@/shared/schemas/banner";
import type { Banner } from "@/shared/types/banner";

export async function listAdminBanners(): Promise<Banner[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as BannerRow[]).map(mapBanner);
}

export async function getAdminBanner(id: string): Promise<Banner | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapBanner(data as BannerRow) : null;
}

export async function createAdminBanner(
  input: BannerSchemaInput
): Promise<Banner> {
  const supabase = createAdminClient();

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const { data: last } = await supabase
      .from("banners")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("banners")
    .insert(bannerToRow({ ...input, sortOrder }))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapBanner(data as BannerRow);
}

export async function updateAdminBanner(
  id: string,
  input: BannerSchemaInput
): Promise<Banner> {
  const supabase = createAdminClient();
  const previous = await getAdminBanner(id);

  const { data, error } = await supabase
    .from("banners")
    .update(bannerToRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const updated = mapBanner(data as BannerRow);

  // Remove do bucket imagens antigas que foram trocadas
  if (previous) {
    const stale: Array<string | null> = [];
    if (previous.imageUrl && previous.imageUrl !== updated.imageUrl) {
      stale.push(previous.imageUrl);
    }
    if (
      previous.imageUrlMobile &&
      previous.imageUrlMobile !== updated.imageUrlMobile
    ) {
      stale.push(previous.imageUrlMobile);
    }
    await deleteStorageImages(stale);
  }

  return updated;
}

export async function deleteAdminBanner(id: string): Promise<void> {
  const supabase = createAdminClient();
  const existing = await getAdminBanner(id);

  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (existing) {
    await deleteStorageImages([existing.imageUrl, existing.imageUrlMobile]);
  }
}

export async function reorderAdminBanners(
  orderedIds: string[]
): Promise<Banner[]> {
  const supabase = createAdminClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("banners")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
    if (error) throw new Error(error.message);
  }

  return listAdminBanners();
}
