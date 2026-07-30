"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminField,
  AdminInput,
  AdminPanel,
  AdminSelect,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminListCoupons,
  adminPatchCoupon,
  adminUpdateCoupon,
} from "@/lib/admin/client";
import { formatPrice } from "@/lib/utils";
import type { Coupon } from "@/shared/types/coupon";

type CouponFormType = "percentage" | "fixed";

const emptyForm = {
  code: "",
  type: "percentage" as CouponFormType,
  value: "",
  minSubtotal: "",
  maxUses: "",
  endsAt: "",
  isActive: true,
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatCouponValue(coupon: Coupon): string {
  if (coupon.type === "percentage") return `${coupon.value}%`;
  if (coupon.type === "fixed") return formatPrice(coupon.value);
  return "Frete grátis";
}

function formatUses(coupon: Coupon): string {
  const used = coupon.usageCount;
  if (coupon.maxUses == null) return `${used} / ∞`;
  return `${used} / ${coupon.maxUses}`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(q?: string) {
    setLoading(true);
    try {
      setCoupons(await adminListCoupons(q));
      setError("");
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao carregar cupons"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toUpperCase();
    if (!term) return coupons;
    return coupons.filter((c) => c.code.toUpperCase().includes(term));
  }, [coupons, search]);

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type === "fixed" ? "fixed" : "percentage",
      value: String(coupon.value),
      minSubtotal:
        coupon.minSubtotal == null ? "" : String(coupon.minSubtotal),
      maxUses: coupon.maxUses == null ? "" : String(coupon.maxUses),
      endsAt: toDatetimeLocalValue(coupon.endsAt),
      isActive: coupon.isActive,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function buildPayload() {
    const value = Number(form.value);
    const minSubtotal =
      form.minSubtotal.trim() === "" ? null : Number(form.minSubtotal);
    const maxUses =
      form.maxUses.trim() === "" ? null : Number(form.maxUses);

    return {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      isActive: form.isActive,
      endsAt: fromDatetimeLocalValue(form.endsAt),
      minSubtotal:
        minSubtotal != null && Number.isFinite(minSubtotal)
          ? minSubtotal
          : null,
      maxUses:
        maxUses != null && Number.isFinite(maxUses) ? maxUses : null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = buildPayload();
      if (editingId) {
        await adminUpdateCoupon(editingId, payload);
      } else {
        await adminCreateCoupon(payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Erro ao salvar cupom"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(coupon: Coupon) {
    try {
      await adminPatchCoupon(coupon.id, { isActive: !coupon.isActive });
      await load();
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Falha ao atualizar");
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Excluir cupom "${coupon.code}"?`)) return;
    try {
      await adminDeleteCoupon(coupon.id);
      if (editingId === coupon.id) resetForm();
      await load();
    } catch (err) {
      alert(err instanceof AdminApiError ? err.message : "Falha ao excluir");
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Cupons"
        description="Crie e gerencie cupons de desconto do checkout."
      >
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <AdminField label="Buscar por código">
              <AdminInput
                value={search}
                onChange={(e) => setSearch(e.target.value.toUpperCase())}
                placeholder="Ex.: BEMVINDA10"
              />
            </AdminField>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
                <AdminSpinner />
                Carregando…
              </div>
            ) : filtered.length === 0 ? (
              <AdminEmpty
                title="Nenhum cupom"
                description="Crie o primeiro cupom para oferecer desconto no checkout."
              />
            ) : (
              <div className="admin-table-wrap overflow-hidden">
                <ul className="divide-y divide-[var(--admin-line)]">
                  {filtered.map((coupon) => {
                    const expired =
                      coupon.endsAt != null &&
                      new Date(coupon.endsAt).getTime() < Date.now();
                    return (
                      <li
                        key={coupon.id}
                        className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[rgba(183,110,121,0.04)]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[var(--admin-ink)]">
                              {coupon.code}
                            </p>
                            <AdminBadge
                              tone={
                                coupon.isActive && !expired
                                  ? "success"
                                  : "muted"
                              }
                            >
                              {!coupon.isActive
                                ? "Inativo"
                                : expired
                                  ? "Expirado"
                                  : "Ativo"}
                            </AdminBadge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                            {coupon.type === "percentage"
                              ? "Percentual"
                              : coupon.type === "fixed"
                                ? "Valor fixo"
                                : "Frete grátis"}{" "}
                            · {formatCouponValue(coupon)} · usos{" "}
                            {formatUses(coupon)}
                            {coupon.endsAt
                              ? ` · até ${new Date(coupon.endsAt).toLocaleDateString("pt-BR")}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <label className="mr-1 inline-flex items-center gap-1.5 text-xs text-[var(--admin-muted)]">
                            <input
                              type="checkbox"
                              className="accent-[var(--admin-accent)]"
                              checked={coupon.isActive}
                              onChange={() => void handleToggle(coupon)}
                              aria-label={
                                coupon.isActive
                                  ? "Desativar cupom"
                                  : "Ativar cupom"
                              }
                            />
                          </label>
                          <AdminButton
                            type="button"
                            variant="ghost"
                            className="!px-2.5"
                            onClick={() => startEdit(coupon)}
                          >
                            <Pencil className="size-4" />
                          </AdminButton>
                          <AdminButton
                            type="button"
                            variant="danger"
                            className="!px-2.5"
                            onClick={() => void handleDelete(coupon)}
                          >
                            <Trash2 className="size-4" />
                          </AdminButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <AdminPanel
            title={editingId ? "Editar cupom" : "Novo cupom"}
            description="Código em maiúsculas. Uso incrementa só na confirmação do pedido."
          >
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
              <AdminField label="Código">
                <AdminInput
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="BEMVINDA10"
                />
              </AdminField>

              <AdminField label="Tipo">
                <AdminSelect
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as CouponFormType,
                    }))
                  }
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </AdminSelect>
              </AdminField>

              <AdminField
                label={form.type === "percentage" ? "Percentual" : "Valor (R$)"}
              >
                <AdminInput
                  required
                  type="number"
                  min={0}
                  max={form.type === "percentage" ? 100 : undefined}
                  step="0.01"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </AdminField>

              <AdminField label="Pedido mínimo (R$)" hint="Opcional">
                <AdminInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minSubtotal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minSubtotal: e.target.value }))
                  }
                  placeholder="Sem mínimo"
                />
              </AdminField>

              <AdminField label="Máximo de usos" hint="Vazio = ilimitado">
                <AdminInput
                  type="number"
                  min={1}
                  step={1}
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxUses: e.target.value }))
                  }
                  placeholder="Ilimitado"
                />
              </AdminField>

              <AdminField label="Validade" hint="Opcional">
                <AdminInput
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                />
              </AdminField>

              <label className="inline-flex items-center gap-2 text-sm text-[var(--admin-ink)]">
                <input
                  type="checkbox"
                  className="accent-[var(--admin-accent)]"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Cupom ativo
              </label>

              {error ? <AdminAlert>{error}</AdminAlert> : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <AdminButton type="submit" disabled={saving}>
                  {saving ? <AdminSpinner /> : <Plus className="size-4" />}
                  {saving ? "Salvando…" : "Salvar"}
                </AdminButton>
                {editingId ? (
                  <AdminButton
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                  >
                    Cancelar
                  </AdminButton>
                ) : null}
              </div>
            </form>
          </AdminPanel>
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
