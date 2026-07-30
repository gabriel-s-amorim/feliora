import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrderRowToSummary, type OrderRow } from "@/shared/lib/orderMapper";
import type {
  AdminCustomerDetail,
  AdminCustomerSummary,
} from "@/shared/types/customer";
import type { AdminOrderSummary } from "@/shared/types/order";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
};

type CustomerOrderRow = OrderRow & { customer_id: string };

export async function listAdminCustomers(): Promise<AdminCustomerSummary[]> {
  const supabase = createAdminClient();
  const [{ data: profiles, error: profilesError }, { data: orders, error: ordersError }] =
    await Promise.all([
      supabase
        .from("customer_profiles")
        .select("id, full_name, phone, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("customer_id, total_amount, status, created_at")
        .not("customer_id", "is", null),
    ]);

  if (profilesError) throw new Error(profilesError.message);
  if (ordersError) throw new Error(ordersError.message);

  const { data: authData, error: authError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) throw new Error(authError.message);
  const emailById = new Map(
    authData.users.map((user) => [user.id, user.email ?? ""])
  );

  const stats = new Map<
    string,
    { orderCount: number; totalSpent: number; lastOrderAt: string | null }
  >();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    const current = stats.get(order.customer_id) ?? {
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    };
    current.orderCount += 1;
    if (order.status === "paid") {
      current.totalSpent += Number(order.total_amount);
    }
    if (!current.lastOrderAt || order.created_at > current.lastOrderAt) {
      current.lastOrderAt = order.created_at;
    }
    stats.set(order.customer_id, current);
  }

  return ((profiles ?? []) as ProfileRow[]).map((profile) => {
    const customerStats = stats.get(profile.id);
    return {
      id: profile.id,
      fullName: profile.full_name ?? "",
      email: emailById.get(profile.id) ?? "",
      phone: profile.phone ?? "",
      createdAt: profile.created_at,
      orderCount: customerStats?.orderCount ?? 0,
      totalSpent: customerStats?.totalSpent ?? 0,
      lastOrderAt: customerStats?.lastOrderAt ?? null,
    };
  });
}

export async function getAdminCustomer(
  customerId: string
): Promise<AdminCustomerDetail> {
  const supabase = createAdminClient();
  const [
    { data: profile, error: profileError },
    { data: authData, error: authError },
    { data: addresses, error: addressesError },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("id, full_name, phone, created_at")
      .eq("id", customerId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(customerId),
    supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (authError) throw new Error(authError.message);
  if (addressesError) throw new Error(addressesError.message);
  if (ordersError) throw new Error(ordersError.message);
  if (!profile || !authData.user) throw new Error("Cliente não encontrado");

  const orderRows = (orders ?? []) as CustomerOrderRow[];
  const orderIds = orderRows.map((order) => order.id);
  const itemCounts = new Map<string, number>();
  if (orderIds.length) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", orderIds);
    if (itemsError) throw new Error(itemsError.message);
    for (const item of items ?? []) {
      itemCounts.set(
        item.order_id,
        (itemCounts.get(item.order_id) ?? 0) + Number(item.quantity)
      );
    }
  }

  const mappedOrders: AdminOrderSummary[] = orderRows.map((row) => ({
    ...mapOrderRowToSummary(row, itemCounts.get(row.id) ?? 0),
    customerId,
    customerName: profile.full_name || null,
    customerEmail: authData.user.email ?? null,
    stockDecrementedAt: row.stock_decremented_at ?? null,
    stockRestoredAt: row.stock_restored_at ?? null,
  }));
  const paidOrders = orderRows.filter((order) => order.status === "paid");

  return {
    id: customerId,
    fullName: profile.full_name ?? "",
    email: authData.user.email ?? "",
    phone: profile.phone ?? "",
    createdAt: profile.created_at,
    orderCount: orderRows.length,
    totalSpent: paidOrders.reduce(
      (total, order) => total + Number(order.total_amount),
      0
    ),
    lastOrderAt: orderRows[0]?.created_at ?? null,
    addresses: (addresses ?? []).map((address) => ({
      id: address.id,
      label: address.label,
      isDefault: address.is_default,
      cep: address.cep,
      rua: address.rua,
      numero: address.numero,
      complemento: address.complemento,
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
    })),
    orders: mappedOrders,
  };
}

export async function updateAdminCustomer(
  customerId: string,
  input: { fullName: string; email: string; phone: string }
): Promise<AdminCustomerDetail> {
  const supabase = createAdminClient();
  const { data: current, error: currentError } =
    await supabase.auth.admin.getUserById(customerId);
  if (currentError || !current.user) {
    throw new Error(currentError?.message ?? "Cliente não encontrado");
  }

  if (current.user.email !== input.email) {
    const { error } = await supabase.auth.admin.updateUserById(customerId, {
      email: input.email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  }

  const { error: profileError } = await supabase
    .from("customer_profiles")
    .upsert({
      id: customerId,
      full_name: input.fullName,
      phone: input.phone,
    });
  if (profileError) throw new Error(profileError.message);

  await supabase.auth.admin.updateUserById(customerId, {
    user_metadata: {
      ...current.user.user_metadata,
      full_name: input.fullName,
      phone: input.phone,
    },
  });

  return getAdminCustomer(customerId);
}
