import {
  mapStoreSettings,
  type StoreSettingsRow,
} from "@/shared/lib/storeSettingsMapper";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/shared/types/storeSettings";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

export async function getPublicStoreSettings(): Promise<StoreSettings> {
  if (!hasSupabasePublicEnv()) return DEFAULT_STORE_SETTINGS;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (error || !data) return DEFAULT_STORE_SETTINGS;
    return mapStoreSettings(data as StoreSettingsRow);
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}
