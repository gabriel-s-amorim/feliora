import type { ProductReview } from "@/shared/types/review";

type Props = {
  productName: string;
  ratingAvg: number;
  reviewsCount: number;
  reviews: ProductReview[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <svg
            key={i}
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

export function ProductReviews({
  productName,
  ratingAvg,
  reviewsCount,
  reviews,
}: Props) {
  const count = Math.max(reviewsCount, reviews.length);
  const avg =
    reviewsCount > 0
      ? ratingAvg
      : reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

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
      ) : (
        <p className="mx-auto max-w-md text-center text-sm leading-relaxed text-ink-muted">
          Ainda não há avaliações públicas para esta peça. Depois da compra,
          você poderá deixar a sua — isso ajuda outras clientes e melhora a
          página no Google com as estrelinhas de review.
        </p>
      )}
    </section>
  );
}
