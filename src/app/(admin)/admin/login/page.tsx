"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminAlert,
  AdminButton,
  AdminField,
  AdminInput,
  AdminSpinner,
} from "@/components/admin/ui";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminApiError } from "@/lib/admin/client";
import { SITE_NAME } from "@/shared/const/site";
import "@/styles/admin.css";

export default function AdminLoginPage() {
  const { isAuthenticated, isLoading, login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "Não foi possível entrar"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="admin-app flex min-h-dvh items-center justify-center gap-3 text-sm text-zinc-500">
        <AdminSpinner />
        Carregando…
      </div>
    );
  }

  return (
    <div className="admin-app flex min-h-dvh w-full">
      <section className="relative hidden w-[42%] flex-col justify-between bg-zinc-950 p-10 text-zinc-100 lg:flex xl:p-14">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-zinc-950">
            F
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-400">{SITE_NAME}</p>
        </div>
        <div className="max-w-sm">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Painel operacional
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Gerencie catálogo, estoque, banners e configurações da loja.
          </p>
        </div>
        <p className="text-xs text-zinc-600">Acesso restrito · sessão segura</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-5 py-10">
        <div className="w-full max-w-sm admin-enter">
          <div className="mb-8">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white lg:hidden">
              F
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Entrar
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Acesse com o e-mail e a senha do administrador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminField label="E-mail">
              <div className="relative">
                <Mail className="admin-input-icon" aria-hidden />
                <AdminInput
                  type="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="voce@email.com"
                  className="admin-input-icon-left"
                />
              </div>
            </AdminField>

            <AdminField label="Senha">
              <div className="relative">
                <Lock className="admin-input-icon" aria-hidden />
                <AdminInput
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  placeholder="••••••••"
                  className="admin-input-icon-both"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 hover:text-zinc-700"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </AdminField>

            {error ? <AdminAlert>{error}</AdminAlert> : null}

            <AdminButton
              type="submit"
              disabled={submitting || !email || !password}
              className="mt-2 w-full"
            >
              {submitting ? (
                <>
                  <AdminSpinner />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </AdminButton>
          </form>
        </div>
      </section>
    </div>
  );
}
