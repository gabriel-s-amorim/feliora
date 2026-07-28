import {
  mapCategory,
  mapCategoryToNavItem,
  type CategoryRow,
} from "@/shared/lib/categoryMapper";
import type { Category, CategoryNavItem } from "@/shared/types/category";
import {
  createPublicClient,
  hasSupabasePublicEnv,
} from "@/lib/supabase/public";

/**
 * Categorias ativas para navegação — sempre vindas do banco.
 * Sem env Supabase configurado, retorna [] (loja sobe sem quebrar).
 */
export async function listActiveCategoryNav(): Promise<CategoryNavItem[]> {
  if (!hasSupabasePublicEnv()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, name, description, seo_title, seo_description, image_url, sort_order, is_active, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("[categories] listActiveCategoryNav", error?.message);
      return [];
    }

    return (data as CategoryRow[]).map(mapCategoryToNavItem);
  } catch (err) {
    console.error("[categories] listActiveCategoryNav", err);
    return [];
  }
}

export async function listActiveCategories(): Promise<Category[]> {
  if (!hasSupabasePublicEnv()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) {
      console.error("[categories] listActiveCategories", error?.message);
      return [];
    }

    return (data as CategoryRow[]).map(mapCategory);
  } catch (err) {
    console.error("[categories] listActiveCategories", err);
    return [];
  }
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return mapCategory(data as CategoryRow);
  } catch {
    return null;
  }
}
