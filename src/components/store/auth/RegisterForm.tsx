"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  formatPhoneBr,
  isValidPhoneBr,
  normalizePhoneBr,
} from "@/shared/lib/phoneBr";

export function RegisterForm() {
  const { signUp, user, loading } = useCustomerAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/conta");
  }, [loading, user, router]);

  const passwordHint = useMemo(() => {
    if (!password) return "";
    if (password.length < 8) return "Use pelo menos 8 caracteres";
    return "";
  }, [password]);

  const phoneDigits = normalizePhoneBr(phone);
  const phoneInvalid = phoneDigits.length > 0 && !isValidPhoneBr(phoneDigits);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (passwordHint) {
      setError(passwordHint);
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    if (phoneInvalid) {
      setError("Informe um telefone válido com DDD (10 ou 11 dígitos)");
      return;
    }
    if (!acceptedTerms) {
      setError("É necessário aceitar a política de privacidade");
      return;
    }

    setPending(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phoneDigits || undefined,
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
    <div className="mx-auto w-full max-w-md">
      <p className="mb-6 text-sm leading-relaxed text-ink-muted">
        Endereço e CPF serão solicitados apenas no checkout.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
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
            WhatsApp / telefone
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(formatPhoneBr(e.target.value))}
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
          />
          {passwordHint ? (
            <p className="mt-1 text-xs text-ink-muted">{passwordHint}</p>
          ) : null}
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-earth">
            Confirmar senha
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
          />
        </div>
        <label className="flex items-start gap-3 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 accent-[var(--color-rose-gold)]"
          />
          <span>
            Li e aceito a{" "}
            <Link
              href="/pages/privacidade"
              className="text-rose-gold hover:underline"
              target="_blank"
            >
              política de privacidade
            </Link>
            .
          </span>
        </label>
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
    </div>
  );
}
