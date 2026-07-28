import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref = "/catalogo",
  actionLabel = "Ver catálogo",
}: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div
        className="mx-auto mb-6 size-16 rounded-full border border-line"
        aria-hidden
      />
      <h2 className="font-display text-2xl font-light tracking-[0.06em] text-ink">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>
      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-8 inline-flex min-h-12 items-center justify-center border border-rose-gold px-7 text-sm tracking-[0.14em] text-rose-gold transition-colors hover:bg-rose-gold hover:text-cream"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
