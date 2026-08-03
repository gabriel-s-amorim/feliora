"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell, RequireAdmin } from "@/components/admin/AdminShell";
import {
  AdminEmpty,
  AdminInput,
  AdminSpinner,
} from "@/components/admin/ui";
import { formatPrice } from "@/lib/utils";
import type { AdminCustomerSummary } from "@/shared/types/customer";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/customers")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Erro ao carregar");
        setCustomers(data);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("pt-BR");
    if (!search) return customers;
    return customers.filter((customer) =>
      [customer.fullName, customer.email, customer.phone].some((value) =>
        value.toLocaleLowerCase("pt-BR").includes(search)
      )
    );
  }, [customers, query]);

  return (
    <RequireAdmin>
      <AdminShell
        title="Clientes"
        description="Consulte compras e gerencie os dados de perfil dos clientes."
      >
        <div className="relative mb-4 max-w-md">
          <Search className="admin-input-icon" aria-hidden />
          <AdminInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone"
            className="admin-input-icon-left"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <AdminSpinner /> Carregando…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={query ? "Nenhum cliente encontrado" : "Nenhum cliente"}
            description={
              query
                ? "Tente outro nome, e-mail ou telefone."
                : "Os clientes cadastrados aparecerão aqui."
            }
          />
        ) : (
          <>
            <ul className="space-y-2.5 md:hidden">
              {filtered.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/admin/clientes/${customer.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-950">
                        {customer.fullName || "Sem nome"}
                      </p>
                      <p className="truncate text-sm text-zinc-500">
                        {customer.email}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {customer.orderCount} pedido(s) ·{" "}
                        {formatPrice(customer.totalSpent)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-zinc-300" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="admin-table-wrap hidden overflow-x-auto md:block">
              <table className="admin-table min-w-full">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Pedidos</th>
                    <th>Total pago</th>
                    <th>Último pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {customer.fullName || "Sem nome"}
                        </Link>
                        <p className="text-xs text-zinc-500">{customer.email}</p>
                      </td>
                      <td>{customer.phone || "—"}</td>
                      <td>{customer.orderCount}</td>
                      <td>{formatPrice(customer.totalSpent)}</td>
                      <td className="text-zinc-500">
                        {customer.lastOrderAt
                          ? new Date(customer.lastOrderAt).toLocaleDateString(
                              "pt-BR"
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
