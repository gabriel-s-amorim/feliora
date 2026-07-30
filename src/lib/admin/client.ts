import type { Banner } from "@/shared/types/banner";
import type { Category } from "@/shared/types/category";
import type { Coupon } from "@/shared/types/coupon";
import type { Product } from "@/shared/types/product";
import type { StoreSettings } from "@/shared/types/storeSettings";

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AdminApiError(
      typeof data.error === "string" ? data.error : "Erro na requisição",
      res.status
    );
  }

  return data as T;
}

export type AdminMe = {
  admin: { id: string; email: string; name: string };
};

export function adminMe() {
  return adminFetch<AdminMe>("/api/admin/me");
}

export function adminLogin(email: string, password: string) {
  return adminFetch<AdminMe>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function adminLogout() {
  return adminFetch<{ ok: boolean }>("/api/admin/logout", { method: "POST" });
}

export function adminListProducts() {
  return adminFetch<Product[]>("/api/admin/products");
}

export function adminGetProduct(id: number) {
  return adminFetch<Product>(`/api/admin/products/${id}`);
}

export function adminCreateProduct(body: unknown) {
  return adminFetch<Product>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminUpdateProduct(id: number, body: unknown) {
  return adminFetch<Product>(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function adminDeleteProduct(id: number) {
  return adminFetch<void>(`/api/admin/products/${id}`, { method: "DELETE" });
}

export function adminListCategories() {
  return adminFetch<Category[]>("/api/admin/categories");
}

export function adminCreateCategory(body: unknown) {
  return adminFetch<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminUpdateCategory(id: string, body: unknown) {
  return adminFetch<Category>(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function adminDeleteCategory(id: string) {
  return adminFetch<void>(`/api/admin/categories/${id}`, { method: "DELETE" });
}

export function adminListCoupons(search?: string) {
  const q = search?.trim()
    ? `?q=${encodeURIComponent(search.trim())}`
    : "";
  return adminFetch<Coupon[]>(`/api/admin/coupons${q}`);
}

export function adminCreateCoupon(body: unknown) {
  return adminFetch<Coupon>("/api/admin/coupons", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminUpdateCoupon(id: string, body: unknown) {
  return adminFetch<Coupon>(`/api/admin/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function adminPatchCoupon(id: string, body: unknown) {
  return adminFetch<Coupon>(`/api/admin/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function adminDeleteCoupon(id: string) {
  return adminFetch<void>(`/api/admin/coupons/${id}`, { method: "DELETE" });
}

export function adminListBanners() {
  return adminFetch<Banner[]>("/api/admin/banners");
}

export function adminCreateBanner(body: unknown) {
  return adminFetch<Banner>("/api/admin/banners", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function adminUpdateBanner(id: string, body: unknown) {
  return adminFetch<Banner>(`/api/admin/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function adminDeleteBanner(id: string) {
  return adminFetch<void>(`/api/admin/banners/${id}`, { method: "DELETE" });
}

export function adminReorderBanners(orderedIds: string[]) {
  return adminFetch<Banner[]>("/api/admin/banners/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
}

export function adminGetSettings() {
  return adminFetch<StoreSettings>("/api/admin/settings");
}

export function adminUpdateSettings(body: unknown) {
  return adminFetch<StoreSettings>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminUploadImage(
  file: File,
  folder: "products" | "banners" = "products"
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const data = await adminFetch<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: form,
  });

  return data.url;
}

export type TikTokParseSummary = {
  productCount: number;
  variantCount: number;
  imageCount: number;
  estimatedSeconds: number;
  duplicates: number;
  unmappedCategories: number;
};

export function adminParseTikTokXlsx(file: File) {
  const form = new FormData();
  form.append("file", file);
  return adminFetch<{
    products: import("@/lib/admin/tiktokImport/types").TikTokParsedProduct[];
    summary: TikTokParseSummary;
  }>("/api/admin/products/import-tiktok/parse", {
    method: "POST",
    body: form,
  });
}

export function adminRunTikTokImport(body: {
  products: import("@/lib/admin/tiktokImport/types").TikTokParsedProduct[];
  selections: Array<{
    tiktokProductId: string;
    action: "create" | "update";
    categoryId: string | null;
    singleVariationAs: "size" | "color";
  }>;
}) {
  return adminFetch<{ jobId: string }>(
    "/api/admin/products/import-tiktok/run",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}
