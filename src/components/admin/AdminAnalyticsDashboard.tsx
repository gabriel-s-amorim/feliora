"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  MonitorSmartphone,
  Radio,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminSpinner } from "@/components/admin/ui";
import { percentChange } from "@/shared/lib/analytics";
import type { AnalyticsRange, SiteAnalyticsOverview } from "@/shared/types/analytics";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Este mês" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDelta(delta: number | null): string {
  if (delta == null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}%`;
}

function deviceLabel(device: string): string {
  if (device === "mobile") return "Mobile";
  if (device === "tablet") return "Tablet";
  return "Desktop";
}

function pathLabel(path: string): string {
  if (path === "/") return "Home";
  return path.length > 42 ? `${path.slice(0, 39)}…` : path;
}

function Trend({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const delta = percentChange(current, previous);
  if (delta == null) {
    return <span className="text-[11px] text-zinc-400">sem base</span>;
  }
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        up ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <Icon className="size-3.5" />
      {formatDelta(delta)}
      <span className="ml-0.5 font-normal text-zinc-400">vs período ant.</span>
    </span>
  );
}

function Sparkline({
  series,
  metric,
}: {
  series: SiteAnalyticsOverview["series"];
  metric: "uniqueVisitors" | "pageViews";
}) {
  const points = series.map((item) => item[metric]);
  const max = Math.max(...points, 1);
  const width = 320;
  const height = 88;
  const pad = 4;

  if (points.length === 0) {
    return (
      <div className="flex h-[88px] items-center justify-center text-xs text-zinc-400">
        Sem dados no período
      </div>
    );
  }

  const coords = points.map((value, index) => {
    const x =
      points.length === 1
        ? width / 2
        : pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - (value / max) * (height - pad * 2);
    return `${x},${y}`;
  });

  const line = coords.join(" ");
  const area = `M ${pad},${height - pad} L ${line.replace(/ /g, " L ")} L ${
    width - pad
  },${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full overflow-visible"
      role="img"
      aria-label="Evolução no período"
    >
      <defs>
        <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18181b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#analyticsFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#18181b"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((value, index) => {
        const [x, y] = coords[index].split(",").map(Number);
        return (
          <circle
            key={`${series[index]?.date}-${index}`}
            cx={x}
            cy={y}
            r={points.length > 20 ? 1.5 : 2.5}
            fill="#fff"
            stroke="#18181b"
            strokeWidth="1.5"
          >
            <title>
              {series[index]?.date}: {formatNumber(value)}
            </title>
          </circle>
        );
      })}
    </svg>
  );
}

function DeviceBars({
  devices,
}: {
  devices: SiteAnalyticsOverview["devices"];
}) {
  const total = devices.reduce((sum, item) => sum + item.visitors, 0) || 1;
  if (!devices.length) {
    return <p className="text-sm text-zinc-400">Sem dados de dispositivo.</p>;
  }
  return (
    <ul className="space-y-3">
      {devices.map((item) => {
        const pct = Math.round((item.visitors / total) * 100);
        return (
          <li key={item.device}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-zinc-800">
                {deviceLabel(String(item.device))}
              </span>
              <span className="text-zinc-500">
                {formatNumber(item.visitors)} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminAnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRange>("today");
  const [data, setData] = useState<SiteAnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<"uniqueVisitors" | "pageViews">(
    "uniqueVisitors"
  );
  const [tick, setTick] = useState(0);

  const loading = !error && (!data || data.range !== range);

  useEffect(() => {
    let cancelled = false;
    const currentRange = range;

    void (async () => {
      try {
        const res = await fetch(`/api/admin/analytics?range=${currentRange}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar");
        setData(json);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range, tick]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 20_000);
    return () => window.clearInterval(timer);
  }, []);

  const kpis = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: "unique",
        label: "Visitantes únicos",
        value: data.uniqueVisitors,
        previous: data.previous.uniqueVisitors,
        icon: Users,
      },
      {
        key: "views",
        label: "Visualizações",
        value: data.pageViews,
        previous: data.previous.pageViews,
        icon: Eye,
      },
      {
        key: "sessions",
        label: "Sessões",
        value: data.sessions,
        previous: data.previous.sessions,
        icon: Activity,
      },
      {
        key: "pps",
        label: "Págs. / sessão",
        value: data.pagesPerSession,
        previous: null as number | null,
        icon: MonitorSmartphone,
        format: (v: number) =>
          v.toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }),
      },
    ];
  }, [data]);

  return (
    <section className="admin-enter space-y-3.5 sm:space-y-4">
      {/* Live hero */}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-zinc-950 text-white shadow-[var(--admin-shadow)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,255,255,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(255,255,255,0.08), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5 lg:p-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-200">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Ao vivo
            </div>
            <p className="mt-3 text-sm text-zinc-400">Visitantes ativos agora</p>
            <p className="mt-1 flex items-baseline gap-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              {loading && !data ? (
                <AdminSpinner className="text-white" />
              ) : (
                formatNumber(data?.activeNow ?? 0)
              )}
              <Radio className="size-5 text-emerald-400 sm:size-6" />
            </p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500 sm:text-sm">
              Atualiza a cada ~20s. Conta quem navegou nos últimos 5 minutos com
              cookies de análise aceitos.
            </p>
          </div>

          {data?.livePaths?.length ? (
            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 sm:w-[min(100%,18rem)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Páginas agora
              </p>
              <ul className="mt-2 space-y-1.5">
                {data.livePaths.map((item) => (
                  <li
                    key={item.path}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate text-zinc-200">
                      {pathLabel(item.path)}
                    </span>
                    <span className="shrink-0 font-semibold text-white">
                      {item.visitors}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* Range filters */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RANGES.map((item) => {
          const active = range === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setRange(item.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error.includes("Could not find") || error.includes("function")
            ? "Execute o SQL supabase/19_site_analytics.sql no Supabase para ativar as métricas."
            : error}
        </p>
      ) : null}

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className="rounded-[1.15rem] border border-zinc-200 bg-white p-3.5 shadow-[var(--admin-shadow)] sm:p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 sm:text-[11px]">
                  {kpi.label}
                </p>
                <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                  <Icon className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[1.75rem]">
                {loading && !data ? (
                  <AdminSpinner />
                ) : kpi.format ? (
                  kpi.format(Number(kpi.value))
                ) : (
                  formatNumber(Number(kpi.value))
                )}
              </p>
              <div className="mt-1.5 min-h-[1.1rem]">
                {kpi.previous != null && data ? (
                  <Trend current={Number(kpi.value)} previous={kpi.previous} />
                ) : (
                  <span className="text-[11px] text-zinc-400">no período</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + side panels */}
      <div className="grid gap-2.5 lg:grid-cols-[1.4fr_0.9fr] lg:gap-3">
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white p-4 shadow-[var(--admin-shadow)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
                Evolução
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {range === "today" || range === "yesterday"
                  ? "Volume do dia selecionado"
                  : "Visitantes e páginas por dia"}
              </p>
            </div>
            <div className="flex rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
              {(
                [
                  { key: "uniqueVisitors", label: "Únicos" },
                  { key: "pageViews", label: "Views" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setChartMetric(opt.key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    chartMetric === opt.key
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {loading && !data ? (
              <div className="flex h-[88px] items-center justify-center">
                <AdminSpinner />
              </div>
            ) : (
              <Sparkline series={data?.series ?? []} metric={chartMetric} />
            )}
          </div>
          {data?.series && data.series.length > 1 ? (
            <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
              <span>
                {new Date(data.series[0].date + "T12:00:00").toLocaleDateString(
                  "pt-BR",
                  { day: "2-digit", month: "short" }
                )}
              </span>
              <span>
                {new Date(
                  data.series[data.series.length - 1].date + "T12:00:00"
                ).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.15rem] border border-zinc-200 bg-white p-4 shadow-[var(--admin-shadow)] sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
            Dispositivos
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Visitantes únicos por tipo
          </p>
          <div className="mt-4">
            {loading && !data ? <AdminSpinner /> : <DeviceBars devices={data?.devices ?? []} />}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2 lg:gap-3">
        <div className="rounded-[1.15rem] border border-zinc-200 bg-white p-4 shadow-[var(--admin-shadow)] sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
            Páginas mais vistas
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">No período selecionado</p>
          {!data?.topPages?.length ? (
            <p className="mt-4 text-sm text-zinc-400">
              Ainda sem pageviews. Aceite cookies de análise na loja para começar
              a medir.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {data.topPages.map((page, index) => (
                <li
                  key={page.path}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-zinc-800">
                    {pathLabel(page.path)}
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-500">
                    {formatNumber(page.views)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[1.15rem] border border-zinc-200 bg-white p-4 shadow-[var(--admin-shadow)] sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-950 sm:text-base">
            Origens
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Referrers externos (quando disponíveis)
          </p>
          {!data?.referrers?.length ? (
            <p className="mt-4 text-sm text-zinc-400">
              Sem tráfego de referência no período.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {data.referrers.map((item) => (
                <li
                  key={item.host ?? "direct"}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="truncate font-medium text-zinc-800">
                    {item.host || "Direto / interno"}
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-500">
                    {formatNumber(item.visitors)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
