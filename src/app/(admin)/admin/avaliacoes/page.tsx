"use client";

import { Check, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminEmpty,
  AdminPanel,
  AdminSpinner,
} from "@/components/admin/ui";
import {
  AdminApiError,
  adminListReviews,
  adminReviewAction,
} from "@/lib/admin/client";
import type { AdminProductReview } from "@/shared/types/review";

type Tab = "pending" | "approved";

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<AdminProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    setError("");
    try {
      setReviews(await adminListReviews(status));
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Erro ao carregar avaliações"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  async function handleAction(
    reviewId: string,
    action: "approve" | "reject"
  ) {
    setActingId(reviewId);
    setError("");
    try {
      await adminReviewAction(reviewId, action);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Erro ao atualizar avaliação"
      );
    } finally {
      setActingId(null);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell
        title="Avaliações"
        description="Aprove para publicar na loja e no Google (estrelinhas SEO)."
      >
        <div className="space-y-6">
          <div className="flex gap-2">
            <AdminButton
              type="button"
              variant={tab === "pending" ? "primary" : "ghost"}
              onClick={() => setTab("pending")}
            >
              Pendentes
            </AdminButton>
            <AdminButton
              type="button"
              variant={tab === "approved" ? "primary" : "ghost"}
              onClick={() => setTab("approved")}
            >
              Aprovadas
            </AdminButton>
          </div>

          {error ? <AdminAlert>{error}</AdminAlert> : null}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
              <AdminSpinner />
              Carregando…
            </div>
          ) : reviews.length === 0 ? (
            <AdminEmpty
              title={
                tab === "pending"
                  ? "Nenhuma avaliação pendente"
                  : "Nenhuma avaliação aprovada"
              }
              description={
                tab === "pending"
                  ? "Quando clientes enviarem reviews, elas aparecerão aqui para moderação."
                  : "Aprove avaliações pendentes para publicá-las na loja."
              }
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <AdminPanel key={review.id}>
                  <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-[var(--admin-ink)]">
                          {review.productName}
                        </p>
                        <AdminBadge>
                          {review.isApproved ? "Aprovada" : "Pendente"}
                        </AdminBadge>
                      </div>
                      {review.productSlug ? (
                        <Link
                          href={`/produto/${review.productSlug}`}
                          target="_blank"
                          className="mt-1 inline-block text-xs text-[var(--admin-accent)] hover:underline"
                        >
                          Ver produto
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${
                            i < review.rating ? "fill-current" : "opacity-30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[var(--admin-ink)]">
                      {review.authorName}
                      <span className="ml-2 text-xs font-normal text-[var(--admin-muted)]">
                        {new Date(review.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </p>
                    {review.title ? (
                      <p className="mt-1 text-sm text-[var(--admin-ink)]">
                        {review.title}
                      </p>
                    ) : null}
                    <p className="mt-1 whitespace-pre-line text-sm text-[var(--admin-muted)]">
                      {review.body}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!review.isApproved ? (
                      <AdminButton
                        type="button"
                        disabled={actingId === review.id}
                        onClick={() => handleAction(review.id, "approve")}
                      >
                        <Check className="size-4" />
                        Aprovar
                      </AdminButton>
                    ) : null}
                    <AdminButton
                      type="button"
                      variant="ghost"
                      disabled={actingId === review.id}
                      onClick={() => {
                        if (
                          !confirm(
                            review.isApproved
                              ? "Remover esta avaliação aprovada?"
                              : "Rejeitar e excluir esta avaliação?"
                          )
                        ) {
                          return;
                        }
                        void handleAction(review.id, "reject");
                      }}
                    >
                      <Trash2 className="size-4" />
                      {review.isApproved ? "Remover" : "Rejeitar"}
                    </AdminButton>
                  </div>
                  </div>
                </AdminPanel>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </RequireAdmin>
  );
}
