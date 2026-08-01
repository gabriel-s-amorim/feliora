"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const { user, loading, updatePassword } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [ready, setReady] = useState(false);

  const needsVerify = Boolean(tokenHash && typeParam === "recovery");

  const passwordHint = useMemo(() => {
    if (!password) return "";
    if (password.length < 8) return "Use pelo menos 8 caracteres";
    return "";
  }, [password]);

  useEffect(() => {
    if (loading) return;
    if (user && !needsVerify) {
      setReady(true);
    }
  }, [loading, user, needsVerify]);

  async function verifyRecoveryLink() {
    if (!tokenHash || typeParam !== "recovery") return;
    setVerifying(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: typeParam as EmailOtpType,
        token_hash: tokenHash,
      });
      if (verifyError) {
        throw new Error(
          "Link inválido ou expirado. Solicite um novo e-mail de recuperação."
        );
      }
      setReady(true);
      router.replace("/conta/redefinir-senha");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível validar o link"
      );
    } finally {
      setVerifying(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      if (password.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }
      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }
      await updatePassword(password);
      setInfo("Senha atualizada. Redirecionando…");
      router.replace("/conta");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível atualizar a senha"
      );
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto h-40 w-full max-w-md animate-pulse bg-line/40" />
    );
  }

  if (needsVerify && !ready) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 text-center">
        <p className="text-sm text-ink-muted">
          Clique no botão abaixo para continuar a redefinição da senha.
        </p>
        {error ? <p className="text-sm text-rose-gold">{error}</p> : null}
        <button
          type="button"
          disabled={verifying}
          onClick={() => void verifyRecoveryLink()}
          className="min-h-12 w-full border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream disabled:opacity-50"
        >
          {verifying ? "Validando…" : "Continuar"}
        </button>
        <p className="text-sm text-ink-muted">
          <Link
            href="/conta/recuperar-senha"
            className="text-rose-gold hover:underline"
          >
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  if (!ready && !user) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 text-center">
        <p className="text-sm text-ink-muted">
          Este link expirou ou é inválido. Solicite um novo e-mail de
          recuperação.
        </p>
        <Link
          href="/conta/recuperar-senha"
          className="inline-flex min-h-12 items-center justify-center border border-rose-gold bg-rose-gold px-6 text-sm tracking-[0.16em] text-cream"
        >
          Recuperar senha
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <p className="text-center text-sm text-ink-muted">
        Escolha uma nova senha para a sua conta.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.14em] text-earth">
            Nova senha
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
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
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-2 min-h-12 w-full border border-line bg-cream px-4 text-sm outline-none focus:border-rose-gold"
          />
        </div>
        {error ? <p className="text-sm text-rose-gold">{error}</p> : null}
        {info ? <p className="text-sm text-earth">{info}</p> : null}
        <button
          type="submit"
          disabled={pending || Boolean(passwordHint)}
          className="min-h-12 w-full border border-rose-gold bg-rose-gold text-sm tracking-[0.16em] text-cream disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
