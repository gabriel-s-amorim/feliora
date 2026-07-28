"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminApiError, adminGetProduct } from "@/lib/admin/client";
import type { Product } from "@/shared/types/product";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await adminGetProduct(id);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof AdminApiError
              ? err.message
              : "Erro ao carregar produto"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <RequireAdmin>
      <AdminShell
        title={product?.name ?? "Editar produto"}
        description={
          product ? `Editando /${product.slug}` : "Carregando produto…"
        }
      >
        {loading ? (
          <p className="text-sm text-[var(--admin-muted)]">Carregando…</p>
        ) : error ? (
          <p className="text-sm text-[var(--admin-danger)]">{error}</p>
        ) : product ? (
          <ProductForm mode="edit" initial={product} />
        ) : null}
      </AdminShell>
    </RequireAdmin>
  );
}
