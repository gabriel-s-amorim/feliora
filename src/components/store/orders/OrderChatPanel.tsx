"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { OrderMessage } from "@/shared/types/orderCommunication";

type Props = {
  apiPath: string;
  viewerRole: "customer" | "admin";
  className?: string;
  footerNote?: string;
  pollMs?: number;
};

export function OrderChatPanel({
  apiPath,
  viewerRole,
  className,
  footerNote,
  pollMs = 0,
}: Props) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(apiPath)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 503) {
            setMessages([]);
            setError(null);
            return;
          }
          throw new Error(data.error ?? "Erro ao carregar mensagens");
        }
        setMessages(data.messages ?? []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar mensagens"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiPath]);

  useEffect(() => {
    if (!pollMs || pollMs < 5000) return;
    const id = window.setInterval(() => {
      void fetch(apiPath)
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          setMessages(data.messages ?? []);
        })
        .catch(() => {
          // polling silencioso
        });
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, apiPath]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.issues?.[0]?.message ?? data.error ?? "Erro ao enviar"
        );
      }
      setMessages((prev) => [...prev, data.message as OrderMessage]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  const remaining = 2000 - body.length;

  return (
    <section className={cn("flex flex-col", className)}>
      <div
        ref={listRef}
        className="max-h-72 min-h-[10rem] space-y-3 overflow-y-auto rounded-lg border border-line bg-cream/30 p-3 sm:max-h-96"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            Carregando mensagens…
          </p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            Nenhuma mensagem ainda. Escreva abaixo para iniciar a conversa.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderRole === viewerRole;
            const isAdmin = message.senderRole === "admin";
            const senderLabel = isAdmin
              ? "Feliora"
              : viewerRole === "customer"
                ? "Você"
                : "Cliente";
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  mine ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                    mine
                      ? isAdmin
                        ? "rounded-br-md bg-zinc-900 text-white"
                        : "rounded-br-md bg-rose-gold text-cream"
                      : isAdmin
                        ? "rounded-bl-md border border-line bg-ivory text-ink"
                        : "rounded-bl-md border border-zinc-200 bg-white text-zinc-800"
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] opacity-70">
                    {senderLabel}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {message.body}
                  </p>
                  <p className="mt-1.5 text-[10px] opacity-60">
                    {new Date(message.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-rose-gold">{error}</p>
      ) : null}

      <form onSubmit={(e) => void sendMessage(e)} className="mt-3 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder={
            viewerRole === "admin"
              ? "Responder ao cliente…"
              : "Escreva sua mensagem para a Feliora…"
          }
          className="min-h-[5rem] w-full resize-y rounded-lg border border-line bg-cream px-3 py-2.5 text-sm outline-none focus:border-rose-gold"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-ink-muted">
            {remaining} caracteres restantes
          </p>
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className={cn(
              "min-h-10 px-4 text-xs tracking-[0.12em] text-cream disabled:opacity-50",
              viewerRole === "admin"
                ? "rounded-lg bg-zinc-900 hover:bg-zinc-800"
                : "border border-rose-gold bg-rose-gold"
            )}
          >
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>

      {footerNote ? (
        <p className="mt-2 text-xs text-ink-muted">{footerNote}</p>
      ) : null}
    </section>
  );
}
