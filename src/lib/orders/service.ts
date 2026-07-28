import { VISIBLE_ORDER_FILTER } from "@/shared/const/order";
import {
  buildOrderTotals,
  mapCartItemToOrderItemPayload,
  mapOrderItemRowToOrderItem,
  mapOrderRowToOrder,
  mapOrderRowToSummary,
  type OrderItemRow,
  type OrderRow,
} from "@/shared/lib/orderMapper";
import { CouponEvalError } from "@/shared/lib/coupons";
import type {
  CheckoutInput,
  FulfillmentUpdateInput,
} from "@/shared/schemas/order";
import type { CheckoutPaymentResult } from "@/shared/types/mercadoPago";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  CheckoutResponse,
  Order,
  OrderSummary,
} from "@/shared/types/order";
import {
  dispatchOrderCreatedEmails,
  dispatchOrderEmail,
  dispatchPaymentStatusEmail,
} from "@/lib/brevo/orderEmails";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertCouponApplicable,
  incrementCouponUsage,
} from "@/lib/coupons/service";
import {
  createMercadoPagoOrder,
  getActiveMercadoPagoEnvironment,
  getMercadoPagoOrder,
  mercadoPagoOrderIdentity,
} from "@/lib/mercadoPago/service";
import {
  ensurePaidOrderInMelhorEnvioCart,
  validateShippingSelection,
} from "@/lib/melhorEnvio/service";
import { afterSiteStockDecrement } from "@/lib/marketplace/onMarketplacePaidOrder";

type CartRow = {
  id: string;
  customer_id: string | null;
  status: string;
  coupon_code: string | null;
};

type CartItemRow = {
  id: string;
  cart_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number | string;
  product_name: string;
  product_slug: string;
  product_image: string;
  sku: string;
  size_label: string;
  color_name: string;
};

async function fetchCustomerCartRow(
  customerId: string
): Promise<CartRow | null> {
  const { data, error } = await createAdminClient()
    .from("carts")
    .select("*")
    .eq("customer_id", customerId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CartRow | null;
}

async function fetchCartItems(cartId: string): Promise<CartItemRow[]> {
  const { data, error } = await createAdminClient()
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CartItemRow[];
}

/** Revalida preço e estoque por variant_id antes de fechar o pedido. */
async function syncCartPricesAndValidateStock(
  items: CartItemRow[]
): Promise<CartItemRow[]> {
  const variantIds = Array.from(new Set(items.map((item) => item.variant_id)));
  const { data, error } = await createAdminClient()
    .from("product_variants")
    .select(
      "id, stock_count, is_active, product_id, products ( id, name, price, is_active )"
    )
    .in("id", variantIds);
  if (error) throw new Error(error.message);

  type VariantJoin = {
    id: string;
    stock_count: number;
    is_active: boolean;
    product_id: number;
    products: {
      id: number;
      name: string;
      price: number | string;
      is_active: boolean;
    } | null;
  };

  const variants = new Map(
    ((data ?? []) as unknown as VariantJoin[]).map((variant) => [
      variant.id,
      variant,
    ])
  );

  const requested = new Map<string, { quantity: number; name: string }>();
  const synced: CartItemRow[] = [];

  for (const item of items) {
    const variant = variants.get(item.variant_id);
    const product = variant?.products;
    if (!variant || !variant.is_active || !product || !product.is_active) {
      throw new Error(`Produto indisponível: ${item.product_name}`);
    }

    const currentPrice = Number(product.price);
    if (Number(item.unit_price) !== currentPrice) {
      const { error: updateError } = await createAdminClient()
        .from("cart_items")
        .update({ unit_price: currentPrice })
        .eq("id", item.id);
      if (updateError) throw new Error(updateError.message);
      synced.push({ ...item, unit_price: currentPrice });
    } else {
      synced.push(item);
    }

    const current = requested.get(item.variant_id);
    requested.set(item.variant_id, {
      quantity: (current?.quantity ?? 0) + item.quantity,
      name: item.product_name,
    });
  }

  for (const [variantId, item] of Array.from(requested.entries())) {
    const variant = variants.get(variantId);
    if (!variant || Number(variant.stock_count) < item.quantity) {
      throw new Error(`Estoque insuficiente para ${item.name}`);
    }
  }

  return synced;
}

async function fetchOrderWithItems(
  orderId: string,
  customerId?: string
): Promise<Order> {
  let query = createAdminClient().from("orders").select("*").eq("id", orderId);
  if (customerId) query = query.eq("customer_id", customerId);

  const { data: orderRow, error: orderError } = await query.single();
  if (orderError) throw new Error(orderError.message);

  const { data: itemRows, error: itemsError } = await createAdminClient()
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  const items = (itemRows ?? []).map((row) =>
    mapOrderItemRowToOrderItem(row as OrderItemRow)
  );
  return mapOrderRowToOrder(orderRow as OrderRow, items);
}

export async function listCustomerOrders(
  customerId: string
): Promise<OrderSummary[]> {
  const { data: orderRows, error } = await createAdminClient()
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .or(VISIBLE_ORDER_FILTER)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!orderRows?.length) return [];

  const orderIds = orderRows.map((row) => row.id);
  const { data: itemRows, error: itemsError } = await createAdminClient()
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);

  if (itemsError) throw new Error(itemsError.message);

  const countMap = new Map<string, number>();
  for (const item of itemRows ?? []) {
    const current = countMap.get(item.order_id) ?? 0;
    countMap.set(item.order_id, current + Number(item.quantity));
  }

  return orderRows.map((row) =>
    mapOrderRowToSummary(row as OrderRow, countMap.get(row.id) ?? 0)
  );
}

export async function getCustomerOrder(
  customerId: string,
  orderId: string
): Promise<Order> {
  let order = await fetchOrderWithItems(orderId, customerId);
  if (
    order.paymentStatus === "pending" ||
    order.paymentStatus === "processing"
  ) {
    const { data: row } = await createAdminClient()
      .from("orders")
      .select("mercado_pago_order_id")
      .eq("id", orderId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (row?.mercado_pago_order_id) {
      try {
        const { data: attempt } = await createAdminClient()
          .from("payment_attempts")
          .select("environment")
          .eq("order_id", orderId)
          .maybeSingle();
        const payload = await getMercadoPagoOrder(
          row.mercado_pago_order_id,
          attempt?.environment as "test" | "production" | undefined
        );
        const identity = mercadoPagoOrderIdentity(payload);
        await createAdminClient().rpc("reconcile_mercado_pago_payment", {
          p_mercado_pago_order_id: identity.orderId,
          p_mercado_pago_payment_id: identity.paymentId,
          p_payment_status: identity.status,
          p_status_detail: identity.statusDetail,
          p_response: payload,
        });
        if (identity.status === "approved") {
          try {
            await ensurePaidOrderInMelhorEnvioCart(orderId);
          } catch (shippingError) {
            console.error(
              "Erro ao preparar etiqueta Melhor Envio:",
              shippingError
            );
          }
          void afterSiteStockDecrement(orderId).catch((mktError) =>
            console.error(
              "Erro ao sincronizar estoque marketplace:",
              mktError
            )
          );
          void dispatchPaymentStatusEmail(orderId, "approved").catch(
            (emailError) =>
              console.error("Erro ao enviar e-mail de pagamento:", emailError)
          );
        }
        if (identity.instructions) {
          await createAdminClient()
            .from("orders")
            .update({
              payment_instructions: identity.instructions,
              payment_expires_at: identity.instructions.expirationDate ?? null,
            })
            .eq("id", orderId);
        }
        order = await fetchOrderWithItems(orderId, customerId);
      } catch (error) {
        console.error("Erro ao atualizar pagamento pendente:", error);
      }
    }
  }
  return order;
}

export async function createOrderFromCheckout(
  customerId: string,
  input: CheckoutInput
): Promise<CheckoutResponse> {
  const { data: existingAttempt, error: attemptError } =
    await createAdminClient()
      .from("payment_attempts")
      .select(
        "order_id, status, status_detail, mercado_pago_order_id, environment"
      )
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
  if (attemptError) throw new Error(attemptError.message);
  let order: Order;
  let paymentEnvironment: "test" | "production";

  if (existingAttempt) {
    const existingOrder = await fetchOrderWithItems(existingAttempt.order_id);
    if (existingOrder.customerId !== customerId) {
      throw new Error("Chave idempotente inválida");
    }
    if (
      existingOrder.shippingQuoteId !== input.shipping.quoteId ||
      existingOrder.shippingServiceId !== input.shipping.serviceId
    ) {
      throw new Error("A entrega mudou. Gere uma nova tentativa de pagamento.");
    }
    if (
      existingAttempt.mercado_pago_order_id ||
      existingOrder.paymentStatus !== "pending" ||
      existingOrder.paymentInstructions
    ) {
      const payment: CheckoutPaymentResult = {
        outcome:
          existingOrder.paymentStatus === "approved"
            ? "approved"
            : existingOrder.paymentStatus === "rejected"
              ? "rejected"
              : "pending",
        orderId: existingOrder.id,
        paymentStatus: existingOrder.paymentStatus,
        statusDetail: existingOrder.paymentStatusDetail,
        instructions: existingOrder.paymentInstructions,
      };
      return { success: true, order: existingOrder, payment };
    }
    order = existingOrder;
    paymentEnvironment = existingAttempt.environment as "test" | "production";
  } else {
    const cartRow = await fetchCustomerCartRow(customerId);
    if (!cartRow) throw new Error("Carrinho vazio");

    const cartItemsRaw = await fetchCartItems(cartRow.id);
    if (cartItemsRaw.length === 0) throw new Error("Carrinho vazio");
    const cartItems = await syncCartPricesAndValidateStock(cartItemsRaw);

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0
    );

    let discountAmount = 0;
    let couponCode: string | null = null;
    if (cartRow.coupon_code) {
      try {
        const application = await assertCouponApplicable({
          code: cartRow.coupon_code,
          subtotal,
          customerId,
        });
        discountAmount = application.discountAmount;
        couponCode = application.code;
      } catch (error) {
        await createAdminClient()
          .from("carts")
          .update({ coupon_code: null })
          .eq("id", cartRow.id);
        if (error instanceof CouponEvalError) {
          throw new Error(error.message);
        }
        throw error;
      }
    }

    const selectedShipping = await validateShippingSelection({
      customerId,
      cartId: cartRow.id,
      quoteId: input.shipping.quoteId,
      serviceId: input.shipping.serviceId,
      toPostalCode: input.shippingAddress.cep,
      subtotal,
      items: cartItems,
    });
    const shippingAmount = selectedShipping.chargedPrice;
    const totals = buildOrderTotals(subtotal, shippingAmount, discountAmount);
    const itemsPayload = cartItems.map(mapCartItemToOrderItemPayload);
    const environment = await getActiveMercadoPagoEnvironment();
    paymentEnvironment = environment;
    const { data, error } = await createAdminClient().rpc(
      "checkout_create_payment_order",
      {
        p_customer_id: customerId,
        p_cart_id: cartRow.id,
        p_total_amount: totals.totalAmount,
        p_shipping_amount: shippingAmount,
        p_discount_amount: totals.discountAmount,
        p_coupon_code: couponCode,
        p_shipping_address: input.shippingAddress,
        p_payment_method: input.paymentMethod,
        p_items: itemsPayload,
        p_idempotency_key: input.idempotencyKey,
        p_environment: environment,
        p_shipping_quote_id: selectedShipping.quoteId,
        p_shipping_service_id: selectedShipping.service.id,
        p_shipping_service_name: selectedShipping.service.name,
        p_shipping_company: selectedShipping.service.company,
        p_shipping_delivery_days: selectedShipping.service.customDeliveryTime,
        p_shipping_environment: selectedShipping.environment,
        p_shipping_quote_snapshot: selectedShipping.snapshot,
        p_shipping_recipient: input.recipient,
      }
    );
    if (error) {
      if (error.code === "23505") {
        return createOrderFromCheckout(customerId, input);
      }
      throw new Error(error.message);
    }
    order = await fetchOrderWithItems((data as OrderRow).id);
    if (couponCode) {
      await incrementCouponUsage(couponCode);
    }
  }

  const customer = await fetchCustomerInfo(customerId);
  if (!customer.email) throw new Error("Cliente sem e-mail para pagamento");

  try {
    const created = await createMercadoPagoOrder({
      order,
      checkout: input,
      payer: { email: customer.email, firstName: customer.name ?? undefined },
      environment: paymentEnvironment,
    });
    const identity = mercadoPagoOrderIdentity(created.raw);

    if (created.result.outcome === "rejected") {
      await Promise.all([
        createAdminClient()
          .from("orders")
          .update({
            mercado_pago_order_id: identity.orderId || null,
            mercado_pago_payment_id: identity.paymentId,
            payment_status: "rejected",
            payment_status_detail: identity.statusDetail,
          })
          .eq("id", order.id),
        createAdminClient()
          .from("payment_attempts")
          .update({
            mercado_pago_order_id: identity.orderId || null,
            mercado_pago_payment_id: identity.paymentId,
            status: "rejected",
            status_detail: identity.statusDetail,
            response_payload: created.raw,
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", order.id),
      ]);
    } else {
      const { error: acceptError } = await createAdminClient().rpc(
        "checkout_accept_payment",
        {
          p_order_id: order.id,
          p_mercado_pago_order_id: identity.orderId,
          p_mercado_pago_payment_id: identity.paymentId,
          p_payment_status: identity.status,
          p_status_detail: identity.statusDetail,
          p_expires_at: identity.instructions?.expirationDate ?? null,
          p_instructions: identity.instructions,
          p_response: created.raw,
        }
      );
      if (acceptError) throw new Error(acceptError.message);

      void dispatchOrderCreatedEmails(order.id).catch((emailError) =>
        console.error("Erro ao enviar e-mails de pedido criado:", emailError)
      );

      if (identity.status === "approved") {
        const { error: reconcileError } = await createAdminClient().rpc(
          "reconcile_mercado_pago_payment",
          {
            p_mercado_pago_order_id: identity.orderId,
            p_mercado_pago_payment_id: identity.paymentId,
            p_payment_status: identity.status,
            p_status_detail: identity.statusDetail,
            p_response: created.raw,
          }
        );
        if (reconcileError) throw new Error(reconcileError.message);
        try {
          await ensurePaidOrderInMelhorEnvioCart(order.id);
        } catch (shippingError) {
          console.error(
            "Erro ao preparar etiqueta Melhor Envio:",
            shippingError
          );
        }
        void afterSiteStockDecrement(order.id).catch((mktError) =>
          console.error(
            "Erro ao sincronizar estoque marketplace:",
            mktError
          )
        );
        void dispatchPaymentStatusEmail(order.id, "approved").catch(
          (emailError) =>
            console.error("Erro ao enviar e-mail de pagamento:", emailError)
        );
      }
    }

    return {
      success: true,
      order: await fetchOrderWithItems(order.id),
      payment: created.result,
    };
  } catch (error) {
    const payload = (error as Error & { payload?: unknown }).payload;
    await createAdminClient()
      .from("payment_attempts")
      .update({
        error_payload: payload ?? {
          message: error instanceof Error ? error.message : "Erro",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", order.id);
    throw error;
  }
}

async function fetchCustomerInfo(customerId: string | null): Promise<{
  name: string | null;
  email: string | null;
  phone: string | null;
}> {
  if (!customerId) {
    return { name: null, email: null, phone: null };
  }

  const supabase = createAdminClient();
  const [{ data: profile }, { data: authData }] = await Promise.all([
    supabase
      .from("customer_profiles")
      .select("full_name, phone")
      .eq("id", customerId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(customerId),
  ]);

  return {
    name: profile?.full_name ? String(profile.full_name) : null,
    email: authData?.user?.email ?? null,
    phone: profile?.phone == null ? null : String(profile.phone),
  };
}

async function buildItemCountMap(
  orderIds: string[]
): Promise<Map<string, number>> {
  const countMap = new Map<string, number>();
  if (!orderIds.length) return countMap;

  const { data: itemRows, error: itemsError } = await createAdminClient()
    .from("order_items")
    .select("order_id, quantity")
    .in("order_id", orderIds);

  if (itemsError) throw new Error(itemsError.message);

  for (const item of itemRows ?? []) {
    const current = countMap.get(item.order_id) ?? 0;
    countMap.set(item.order_id, current + Number(item.quantity));
  }

  return countMap;
}

export async function listAllOrders(): Promise<AdminOrderSummary[]> {
  const { data: orderRows, error } = await createAdminClient()
    .from("orders")
    .select("*")
    .or(VISIBLE_ORDER_FILTER)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!orderRows?.length) return [];

  const orderIds = orderRows.map((row) => row.id);
  const countMap = await buildItemCountMap(orderIds);

  const customerIds = Array.from(
    new Set(orderRows.map((row) => row.customer_id).filter(Boolean))
  ) as string[];
  const customerInfoMap = new Map<
    string,
    { name: string | null; email: string | null }
  >();

  await Promise.all(
    customerIds.map(async (customerId) => {
      const info = await fetchCustomerInfo(customerId);
      customerInfoMap.set(customerId, { name: info.name, email: info.email });
    })
  );

  return orderRows.map((row) => {
    const summary = mapOrderRowToSummary(
      row as OrderRow,
      countMap.get(row.id) ?? 0
    );
    const customerInfo = row.customer_id
      ? customerInfoMap.get(row.customer_id)
      : undefined;

    return {
      ...summary,
      customerId: row.customer_id,
      customerName: customerInfo?.name ?? null,
      customerEmail: customerInfo?.email ?? null,
    };
  });
}

export async function getOrderById(orderId: string): Promise<AdminOrderDetail> {
  const order = await fetchOrderWithItems(orderId);
  const [customerInfo, shipmentResult] = await Promise.all([
    fetchCustomerInfo(order.customerId),
    createAdminClient()
      .from("melhor_envio_shipments")
      .select(
        "id, volume_index, status, melhor_envio_cart_id, error_message, attempt_count"
      )
      .eq("order_id", orderId)
      .order("volume_index", { ascending: true }),
  ]);
  if (shipmentResult.error) throw new Error(shipmentResult.error.message);

  return {
    ...order,
    customerName: customerInfo.name,
    customerEmail: customerInfo.email,
    customerPhone: customerInfo.phone,
    shipments: (shipmentResult.data ?? []).map((shipment) => ({
      id: shipment.id,
      volumeIndex: shipment.volume_index,
      status: shipment.status as AdminOrderDetail["shipments"][number]["status"],
      melhorEnvioCartId: shipment.melhor_envio_cart_id,
      errorMessage: shipment.error_message,
      attemptCount: Number(shipment.attempt_count),
    })),
  };
}

export async function updateOrderFulfillment(
  orderId: string,
  input: FulfillmentUpdateInput
): Promise<AdminOrderDetail> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    fulfillment_status: input.status,
  };

  if (input.trackingCode !== undefined) {
    patch.tracking_code = input.trackingCode?.trim() || null;
  }
  if (input.trackingUrl !== undefined) {
    patch.tracking_url = input.trackingUrl?.trim() || null;
  }
  if (input.status === "processing") patch.processing_at = now;
  if (input.status === "shipped") patch.shipped_at = now;
  if (input.status === "delivered") patch.delivered_at = now;

  const { data, error } = await createAdminClient()
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Pedido não encontrado");

  const event =
    input.status === "processing"
      ? "order_processing"
      : input.status === "shipped"
        ? "order_shipped"
        : input.status === "delivered"
          ? "order_delivered"
          : null;
  if (event) {
    void dispatchOrderEmail(orderId, event).catch((emailError) =>
      console.error("Erro ao enviar e-mail de fulfillment:", emailError)
    );
  }

  return getOrderById(orderId);
}
