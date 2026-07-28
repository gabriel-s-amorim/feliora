import { createAdminClient } from "@/lib/supabase/admin";
import {
  mapProduct,
  productToRow,
  type ProductRow,
  type ProductVariantRow,
} from "@/shared/lib/productMapper";
import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductVariantInput,
} from "@/shared/schemas/product";
import type { Product } from "@/shared/types/product";

const PRODUCT_SELECT = `
  *,
  categories ( id, slug, name ),
  product_variants ( * )
`;

type VariantInput = {
  sizeLabel: string;
  colorName: string;
  sku: string;
  stockCount: number;
  isActive: boolean;
};

function variantKey(sizeLabel: string, colorName: string): string {
  return `${sizeLabel.trim().toLowerCase()}::${colorName.trim().toLowerCase()}`;
}

async function syncVariants(
  productId: number,
  variants: VariantInput[]
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing, error: listError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId);

  if (listError) throw new Error(listError.message);

  const existingRows = (existing ?? []) as ProductVariantRow[];
  const byKey = new Map(
    existingRows.map((row) => [variantKey(row.size_label, row.color_name), row])
  );
  const seen = new Set<string>();

  for (const variant of variants) {
    const key = variantKey(variant.sizeLabel, variant.colorName);
    seen.add(key);
    const current = byKey.get(key);

    if (current) {
      const { error } = await supabase
        .from("product_variants")
        .update({
          sku: variant.sku,
          stock_count: variant.stockCount,
          is_active: variant.isActive,
          size_label: variant.sizeLabel.trim(),
          color_name: variant.colorName.trim(),
        })
        .eq("id", current.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("product_variants").insert({
        product_id: productId,
        size_label: variant.sizeLabel.trim(),
        color_name: variant.colorName.trim(),
        sku: variant.sku,
        stock_count: variant.stockCount,
        is_active: variant.isActive,
      });
      if (error) throw new Error(error.message);
    }
  }

  const toDeactivate = existingRows.filter(
    (row) => !seen.has(variantKey(row.size_label, row.color_name))
  );

  for (const row of toDeactivate) {
    const { error } = await supabase
      .from("product_variants")
      .update({ is_active: false })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }
}

async function fetchProductById(id: number): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductRow) : null;
}

export async function listAdminProducts(): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map(mapProduct);
}

export async function getAdminProduct(id: number): Promise<Product | null> {
  return fetchProductById(id);
}

export async function createAdminProduct(
  input: ProductCreateInput
): Promise<Product> {
  const supabase = createAdminClient();
  const { variants, ...productFields } = input;

  const { data, error } = await supabase
    .from("products")
    .insert(productToRow(productFields))
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const productId = data.id as number;
  await syncVariants(productId, variants as VariantInput[]);

  const product = await fetchProductById(productId);
  if (!product) throw new Error("Produto criado mas não encontrado");
  return product;
}

export async function updateAdminProduct(
  id: number,
  input: ProductUpdateInput
): Promise<Product> {
  const supabase = createAdminClient();
  const { variants, ...productFields } = input;

  const row = productToRow(productFields);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (variants !== undefined) {
    if (variants.length < 1) {
      throw new Error("Informe ao menos uma variante");
    }
    await syncVariants(id, variants as ProductVariantInput[]);
  }

  const product = await fetchProductById(id);
  if (!product) throw new Error("Produto não encontrado");
  return product;
}

export async function deleteAdminProduct(id: number): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminProductSlugExists(
  slug: string,
  excludeId?: number
): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("id")
    .ilike("slug", slug)
    .limit(1);

  if (excludeId !== undefined) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}
