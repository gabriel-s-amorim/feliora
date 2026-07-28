import type { Category, CategoryNavItem } from "@/shared/types/category";

/** Row snake_case do Postgres */
export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seo_title: string;
  seo_description: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCategoryToNavItem(row: CategoryRow): CategoryNavItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    href: `/categoria/${row.slug}`,
  };
}

export function categoryToRow(
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  }>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.description !== undefined) row.description = input.description;
  if (input.seoTitle !== undefined) row.seo_title = input.seoTitle;
  if (input.seoDescription !== undefined) row.seo_description = input.seoDescription;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}
