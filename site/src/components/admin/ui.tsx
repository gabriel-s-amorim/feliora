import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function AdminPanel({
  children,
  className,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("admin-panel overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-line)] px-5 py-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight text-[var(--admin-ink)] sm:text-xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminField({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="admin-label">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-xs text-[var(--admin-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("admin-input", props.className)} />;
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("admin-input resize-y", props.className)} />;
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("admin-input", props.className)} />;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";

export function AdminButton({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...props}
      className={cn(
        "admin-btn",
        variant === "primary" && "admin-btn-primary",
        variant === "secondary" && "admin-btn-secondary",
        variant === "ghost" && "admin-btn-ghost",
        variant === "danger" && "admin-btn-danger",
        className
      )}
    />
  );
}

export function AdminBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "success" | "muted";
}) {
  return (
    <span
      className={cn(
        "admin-badge",
        tone === "success" ? "admin-badge-success" : "admin-badge-muted"
      )}
    >
      {children}
    </span>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--admin-radius)] border border-dashed border-[var(--admin-line)] bg-[var(--admin-surface)]/70 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
        <span className="text-lg">◇</span>
      </div>
      <p className="text-lg font-semibold tracking-tight text-[var(--admin-ink)]">
        {title}
      </p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function AdminAlert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success";
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-3.5 py-2.5 text-sm",
        tone === "error" &&
          "border border-red-200/80 bg-red-50 text-[var(--admin-danger)]",
        tone === "success" &&
          "border border-emerald-200/80 bg-emerald-50 text-[var(--admin-success)]"
      )}
    >
      {children}
    </p>
  );
}

export function AdminSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      )}
      aria-hidden
    />
  );
}
