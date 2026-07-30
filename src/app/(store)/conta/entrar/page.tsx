import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/store/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta Feliora.",
};

export default function EntrarPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Conta
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
          Entrar
        </h1>
      </header>
      <Suspense
        fallback={
          <div className="mx-auto h-40 w-full max-w-md animate-pulse bg-line/40" />
        }
      >
        <LoginForm />
      </Suspense>
    </section>
  );
}
