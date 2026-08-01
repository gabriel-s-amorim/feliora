import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/store/auth/ForgotPasswordForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Recuperar senha",
    description: "Redefina a senha da sua conta Feliora.",
    path: "/conta/recuperar-senha",
    noIndex: true,
  }),
};

export default function RecuperarSenhaPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Conta
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
          Esqueceu a senha?
        </h1>
      </header>
      <Suspense
        fallback={
          <div className="mx-auto h-40 w-full max-w-md animate-pulse bg-line/40" />
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </section>
  );
}
