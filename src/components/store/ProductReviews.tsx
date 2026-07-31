"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { ProductReview } from "@/shared/types/review";
import type { ReviewEligibility } from "@/shared/types/review";

type Props = {
  productId: number;
  productSlug: string;
  productName: string;
  ratingAvg: number;
  reviewsCount: number;
  reviews: ProductReview[];
};

function Stars({
  rating,
  interactive,
  onSelect,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} de 5`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const value = i + 1;
        const filled = i < Math.round(rating);
        if (interactive && onSelect) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className={`size-7 transition-colors ${
                value <= rating ? "text-rose-gold" : "text-line hover:text-rose-gold/60"
              }`}
              aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="size-full">
                <path d="M10 1.5l2.35 4.76 5.25.76-3.8 3.7.9 5.24L10 13.77 5.3 15.96l.9-5.24-3.8-3.7 5.25-.76L10 1.5z" />
              </svg>
            </button>
          );
        }
        return (
          <svg
            key={value}
            className={`size-3.5 ${filled ? "text-rose-gold" : "text-line"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 1.5l2.35 4.76 5.25.76-3.8 3.7.9 5.24L10 13.77 5.3 15.96l.9-5.24-3.8-3.7 5.25-.76L10 1.5z" />
          </svg>
        );
      })}
    </span>
  );
}

function ReviewForm({
  productId,
  productSlug,
  onSubmitted,
}: {
  productId: number;
  productSlug: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            productSlug,
            rating,
            title,
            body,
            ...(authorName.trim() ? { authorName: authorName.trim() } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Erro ao enviar"
          );
        }
        onSubmitted();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-xl space-y-5 border-t border-line/70 pt-10 text-left"
    >
      <div>
        <p className="font-display text-lg font-light tracking-[0.04em] text-ink">
          Deixe sua avaliação
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Sua opinião aparece na página após aprovação.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-earth">
          Nota
        </p>
        <Stars rating={rating} interactive onSelect={setRating} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-earth">
          Seu nome (opcional)
        </span>
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
          className="w-full border border-line bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rose-gold"
          placeholder="Como quer aparecer"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-earth">
          Título (opcional)
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          className="w-full border border-line bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rose-gold"
          placeholder="Resumo da sua experiência"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-earth">
          Avaliação
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          className="w-full resize-y border border-line bg-cream/40 px-3 py-2.5 text-sm text-ink outline-none transition focus:border-rose-gold"
          placeholder="Conte como foi usar a peça…"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || body.trim().length < 10}
        className="inline-flex items-center justify-center bg-ink px-6 py-3 text-xs font-medium uppercase tracking-[0.18em] text-cream transition hover:bg-ink/90 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}

function EligibilityMessage({
  eligibility,
  productId,
  productSlug,
  onSubmitted,
}: {
  eligibility: ReviewEligibility | null;
  productId: number;
  productSlug: string;
  onSubmitted: () => void;
}) {
  if (!eligibility) {
    return (
      <p className="mt-8 text-center text-sm text-ink-muted">
        Carregando…
      </p>
    );
  }

  if (eligibility.reason === "unauthenticated") {
    return (
      <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-ink-muted">
        Faça{" "}
        <Link
          href={`/conta/entrar?next=${encodeURIComponent(`/produto/${productSlug}#avaliacoes`)}`}
          className="text-rose-gold underline-offset-2 hover:underline"
        >
          login
        </Link>{" "}
        para avaliar esta peça após a entrega do pedido.
      </p>
    );
  }

  if (eligibility.reason === "pending_review") {
    return (
      <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-ink-muted">
        Sua avaliação foi enviada e está aguardando aprovação. Obrigada!
      </p>
    );
  }

  if (eligibility.reason === "already_reviewed") {
    return (
      <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-ink-muted">
        Você já avaliou esta peça. Obrigada pelo feedback!
      </p>
    );
  }

  if (eligibility.reason === "not_purchased") {
    return (
      <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-ink-muted">
        Ainda não há avaliações públicas para esta peça. Depois da compra e
        entrega, você poderá deixar a sua — isso ajuda outras clientes e
        melhora a página no Google com as estrelinhas de review.
      </p>
    );
  }

  if (eligibility.canReview) {
    return (
      <ReviewForm
        productId={productId}
        productSlug={productSlug}
        onSubmitted={onSubmitted}
      />
    );
  }

  return null;
}

export function ProductReviews({
  productId,
  productSlug,
  productName,
  ratingAvg,
  reviewsCount,
  reviews,
}: Props) {
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null
  );
  const [submitted, setSubmitted] = useState(false);
  const count = Math.max(reviewsCount, reviews.length);
  const avg =
    reviewsCount > 0
      ? ratingAvg
      : reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

  useEffect(() => {
    let cancelled = false;
    void fetch(
      `/api/reviews/eligibility?productId=${productId}&slug=${encodeURIComponent(productSlug)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setEligibility({
            authenticated: false,
            canReview: false,
            reason: "unauthenticated",
          });
          return;
        }
        setEligibility(data as ReviewEligibility);
      })
      .catch(() => {
        if (!cancelled) {
          setEligibility({
            authenticated: false,
            canReview: false,
            reason: "unauthenticated",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, productSlug, submitted]);

  return (
    <section
      id="avaliacoes"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mb-10 text-center sm:mb-12">
        <p className="font-display text-xs uppercase tracking-[0.42em] text-rose-gold">
          Avaliações
        </p>
        <h2 className="mt-4 font-display text-2xl font-light tracking-[0.08em] text-ink sm:text-3xl">
          O que dizem sobre {productName}
        </h2>
        {count > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
            <Stars rating={avg} />
            <span>
              {avg.toFixed(1)} · {count}{" "}
              {count === 1 ? "avaliação" : "avaliações"}
            </span>
          </p>
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <ul className="mx-auto grid max-w-3xl gap-8">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="border-t border-line/70 pt-8 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Stars rating={review.rating} />
                <p className="text-sm font-medium text-ink">{review.authorName}</p>
                <time
                  className="text-xs text-ink-muted"
                  dateTime={review.createdAt.slice(0, 10)}
                >
                  {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                </time>
              </div>
              {review.title ? (
                <p className="mt-3 font-display text-base tracking-[0.02em] text-ink">
                  {review.title}
                </p>
              ) : null}
              {review.body ? (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted whitespace-pre-line">
                  {review.body}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {submitted || eligibility?.reason === "pending_review" ? (
        <p className="mx-auto mt-8 max-w-md text-center text-sm leading-relaxed text-ink-muted">
          Sua avaliação foi enviada e está aguardando aprovação. Obrigada!
        </p>
      ) : (
        <EligibilityMessage
          eligibility={eligibility}
          productId={productId}
          productSlug={productSlug}
          onSubmitted={() => setSubmitted(true)}
        />
      )}
    </section>
  );
}
