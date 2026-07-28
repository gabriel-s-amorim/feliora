import { createAdminClient } from "@/lib/supabase/admin";
import { categoryToRow, mapCategory, type CategoryRow } from "@/shared/lib/categoryMapper";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/shared/schemas/category";
import type { Category } from "@/shared/types/category";

export async function listAdminCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getAdminCategory(id: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapCategory(data as CategoryRow) : null;
}

export async function createAdminCategory(
  input: CategoryCreateInput
): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(categoryToRow(input))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCategory(data as CategoryRow);
}

export async function updateAdminCategory(
  id: string,
  input: CategoryUpdateInput
): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update(categoryToRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCategory(data as CategoryRow);
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
