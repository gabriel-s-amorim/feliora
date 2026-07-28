"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const value = q.trim();
        router.push(value ? `/busca?q=${encodeURIComponent(value)}` : "/busca");
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nome da peça, estilo…"
        className="min-h-12 flex-1 border border-line bg-cream px-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-rose-gold"
        enterKeyHint="search"
        autoComplete="off"
      />
      <button
        type="submit"
        className="min-h-12 border border-rose-gold bg-rose-gold px-5 text-sm tracking-[0.14em] text-cream"
      >
        Buscar
      </button>
    </form>
  );
}
