"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) setError(authError);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível enviar o e-mail");
      }
      setInfo(
        data.message ??
          "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar o e-mail"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <p className="text-center text-sm text-ink-muted">
        Informe o e-mail da sua conta. Enviaremos um link para criar uma nova
        senha.
      </p>
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
        {error ? <p className="text-sm text-rose-gold">{error}</p> : null}
        {info ? <p className="text-sm text-earth">{info}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream disabled:opacity-50"
        >
          {pending ? "Enviando…" : "Enviar link"}
        </button>
        <p className="text-center text-sm text-ink-muted">
          <Link href="/conta/entrar" className="text-rose-gold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </form>
    </div>
  );
}
