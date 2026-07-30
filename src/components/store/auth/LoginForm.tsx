"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  AuthDivider,
  GoogleAuthButton,
} from "@/components/store/auth/GoogleAuthButton";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/conta";
  }
  return next;
}

export function LoginForm() {
  const { signIn, user, loading } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) setError(authError);
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.push(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível entrar"
      );
    } finally {
      setPending(false);
    }
  }

  const cadastroHref =
    next !== "/conta"
      ? `/conta/cadastro?next=${encodeURIComponent(next)}`
      : "/conta/cadastro";

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <GoogleAuthButton next={next} label="Entrar com Google" />
      <AuthDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-earth">
            E-mail
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-earth">
            Senha
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
          />
        </div>
        {error ? <p className="text-sm text-rose-gold">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-center text-sm text-ink-muted">
          Ainda não tem conta?{" "}
          <Link href={cadastroHref} className="text-rose-gold hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
