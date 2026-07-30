import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/store/auth/RegisterForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Criar conta",
    description: "Cadastre-se na Feliora.",
    path: "/conta/cadastro",
    noIndex: true,
  }),
};

export default function CadastroPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-rose-gold">
          Conta
        </p>
        <h1 className="mt-3 font-display text-3xl font-light tracking-[0.06em] text-ink">
          Criar conta
        </h1>
      </header>
      <Suspense
        fallback={
          <div className="mx-auto h-40 w-full max-w-md animate-pulse bg-line/40" />
        }
      >
        <RegisterForm />
      </Suspense>
    </section>
  );
}
