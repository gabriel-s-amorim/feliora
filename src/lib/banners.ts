import { mapBanner, type BannerRow } from "@/shared/lib/bannerMapper";
import type { Banner } from "@/shared/types/banner";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

export async function listActiveBanners(): Promise<Banner[]> {
  if (!hasSupabasePublicEnv()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data) {
      console.error("[banners] listActiveBanners", error?.message);
      return [];
    }

    return (data as BannerRow[]).map(mapBanner);
  } catch (err) {
    console.error("[banners] listActiveBanners", err);
    return [];
  }
}
