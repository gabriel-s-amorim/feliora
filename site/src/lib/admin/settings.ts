import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapStoreSettings,
  storeSettingsToRow,
  type StoreSettingsRow,
} from "@/shared/lib/storeSettingsMapper";
import type { StoreSettingsSchemaInput } from "@/shared/schemas/storeSettings";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/shared/types/storeSettings";

export async function getAdminStoreSettings(): Promise<StoreSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_STORE_SETTINGS;
  return mapStoreSettings(data as StoreSettingsRow);
}

export async function updateAdminStoreSettings(
  input: StoreSettingsSchemaInput
): Promise<StoreSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .upsert({ id: true, ...storeSettingsToRow(input) })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapStoreSettings(data as StoreSettingsRow);
}
