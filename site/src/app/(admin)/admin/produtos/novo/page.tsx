"use client";

import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function AdminNewProductPage() {
  return (
    <RequireAdmin>
      <AdminShell
        title="Novo produto"
        description="Cadastre a peça com imagens, tamanhos, cores e estoque por variante."
      >
        <ProductForm mode="create" />
      </AdminShell>
    </RequireAdmin>
  );
}
