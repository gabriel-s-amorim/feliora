"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

export function RegisterForm() {
  const { signUp, user, loading } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/conta");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      if (result.needsEmailConfirmation) {
        setInfo(
          "Conta criada. Confirme o e-mail se o Supabase exigir verificação, depois entre."
        );
      } else {
        router.push("/conta");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível cadastrar"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-4">
      <div>
        <label className="text-xs uppercase tracking-[0.14em] text-earth">
          Nome completo
        </label>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
        />
      </div>
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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
        />
      </div>
      {error ? <p className="text-sm text-rose-gold">{error}</p> : null}
      {info ? <p className="text-sm text-earth">{info}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar conta"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link href="/conta/entrar" className="text-rose-gold hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
