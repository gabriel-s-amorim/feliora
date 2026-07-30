import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertCouponApplicable,
  CouponEvalError,
} from "@/lib/coupons/service";
import type { Cart, CartItem } from "@/shared/types/cart";
import type { CouponApplication } from "@/shared/types/coupon";
import { emptyCart } from "@/lib/cart/empty";
import { normalizeCouponCode } from "@/shared/lib/coupons";

export { emptyCart };

export type CartIdentity =
  | { kind: "session"; sessionId: string }
  | { kind: "customer"; customerId: string };

type CartRow = {
  id: string;
  session_id: string | null;
  customer_id: string | null;
  status: "active" | "converted";
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
  product_variants?: { stock_count: number } | null;
};

function mapItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    cartId: row.cart_id,
    variantId: row.variant_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    productName: row.product_name,
    productSlug: row.product_slug,
    productImage: row.product_image,
    sku: row.sku,
    sizeLabel: row.size_label,
    colorName: row.color_name,
    stockCount: row.product_variants?.stock_count,
  };
}

function imageForColor(
  colors: unknown,
  colorName: string,
  fallback: string
): string {
  if (!Array.isArray(colors) || !colorName) return fallback;

  const normalizedColor = colorName.trim().toLowerCase();
  const match = colors.find((item) => {
    if (!item || typeof item !== "object" || !("name" in item)) return false;
    return String(item.name).trim().toLowerCase() === normalizedColor;
  });

  if (!match || typeof match !== "object" || !("imageUrl" in match)) {
    return fallback;
  }

  return typeof match.imageUrl === "string" && match.imageUrl.trim()
    ? match.imageUrl.trim()
    : fallback;
}

function buildCart(cart: CartRow, items: CartItem[]): Cart {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  return {
    id: cart.id,
    sessionId: cart.session_id,
    customerId: cart.customer_id,
    status: cart.status,
    couponCode: cart.coupon_code,
    items,
    itemCount,
    subtotal,
  };
}

async function loadItems(cartId: string): Promise<CartItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("*, product_variants ( stock_count )")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[cart] loadItems", error?.message);
    return [];
  }

  return (data as CartItemRow[]).map(mapItem);
}

export async function getActiveCart(
  identity: CartIdentity
): Promise<Cart | null> {
  const supabase = createAdminClient();
  let query = supabase.from("carts").select("*").eq("status", "active");

  query =
    identity.kind === "session"
      ? query.eq("session_id", identity.sessionId)
      : query.eq("customer_id", identity.customerId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[cart] getActiveCart", error.message);
    return null;
  }
  if (!data) return null;

  const items = await loadItems(data.id);
  return buildCart(data as CartRow, items);
}

/** @deprecated use getActiveCart */
export async function getActiveCartBySession(sessionId: string) {
  return getActiveCart({ kind: "session", sessionId });
}

async function getOrCreateCart(identity: CartIdentity): Promise<CartRow> {
  const existing = await getActiveCart(identity);
  if (existing) {
    return {
      id: existing.id,
      session_id: existing.sessionId,
      customer_id: existing.customerId,
      status: existing.status,
      coupon_code: existing.couponCode,
    };
  }

  const supabase = createAdminClient();

  if (identity.kind === "session") {
    const { data, error } = await supabase
      .from("carts")
      .insert({ session_id: identity.sessionId, status: "active" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Falha ao criar carrinho");
    }
    return data as CartRow;
  }

  const { data, error } = await supabase
    .from("carts")
    .insert({ customer_id: identity.customerId, status: "active" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao criar carrinho");
  }

  return data as CartRow;
}

export async function addVariantToCart(
  identity: CartIdentity,
  variantId: string,
  quantity: number
): Promise<Cart> {
  const supabase = createAdminClient();

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .select(
      "id, size_label, color_name, sku, stock_count, is_active, product_id"
    )
    .eq("id", variantId)
    .maybeSingle();

  if (variantError || !variant) throw new Error("Variante não encontrada");
  if (!variant.is_active) throw new Error("Variante indisponível");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, slug, image, colors, price, is_active")
    .eq("id", variant.product_id)
    .maybeSingle();

  if (productError || !product || !product.is_active) {
    throw new Error("Produto indisponível");
  }

  if (variant.stock_count < quantity) throw new Error("Estoque insuficiente");

  const productImage = imageForColor(
    product.colors,
    variant.color_name ?? "",
    product.image
  );
  const cart = await getOrCreateCart(identity);

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existingItem) {
    const nextQty = existingItem.quantity + quantity;
    if (nextQty > variant.stock_count) throw new Error("Estoque insuficiente");

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: nextQty,
        unit_price: product.price,
        product_name: product.name,
        product_slug: product.slug,
        product_image: productImage,
        sku: variant.sku,
        size_label: variant.size_label,
        color_name: variant.color_name ?? "",
      })
      .eq("id", existingItem.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      variant_id: variantId,
      quantity,
      unit_price: product.price,
      product_name: product.name,
      product_slug: product.slug,
      product_image: productImage,
      sku: variant.sku,
      size_label: variant.size_label,
      color_name: variant.color_name ?? "",
    });

    if (error) throw new Error(error.message);
  }

  const items = await loadItems(cart.id);
  return buildCart(cart, items);
}

export async function addVariantToSessionCart(
  sessionId: string,
  variantId: string,
  quantity: number
) {
  return addVariantToCart({ kind: "session", sessionId }, variantId, quantity);
}

export async function updateCartItemQuantity(
  identity: CartIdentity,
  itemId: string,
  quantity: number
): Promise<Cart> {
  const cart = await getActiveCart(identity);
  if (!cart) throw new Error("Carrinho não encontrado");

  const supabase = createAdminClient();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item não encontrado");

  if (quantity <= 0) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cart.id);
    if (error) throw new Error(error.message);
  } else {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_count")
      .eq("id", item.variantId)
      .maybeSingle();

    if (!variant || variant.stock_count < quantity) {
      throw new Error("Estoque insuficiente");
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("cart_id", cart.id);
    if (error) throw new Error(error.message);
  }

  return (await getActiveCart(identity)) ?? emptyCart();
}

export async function removeCartItem(
  identity: CartIdentity,
  itemId: string
): Promise<Cart> {
  return updateCartItemQuantity(identity, itemId, 0);
}

export async function mergeGuestCartIntoCustomer(
  customerId: string,
  guestSessionId: string | null
): Promise<Cart> {
  const customerIdentity: CartIdentity = {
    kind: "customer",
    customerId,
  };

  if (!guestSessionId) {
    return (await getActiveCart(customerIdentity)) ?? emptyCart();
  }

  const supabase = createAdminClient();
  const { data: guestCart } = await supabase
    .from("carts")
    .select("*")
    .eq("session_id", guestSessionId)
    .eq("status", "active")
    .maybeSingle();

  if (!guestCart) {
    return (await getActiveCart(customerIdentity)) ?? emptyCart();
  }

  // Mesmo carrinho já vinculado? (edge)
  if (guestCart.customer_id === customerId) {
    return buildCart(guestCart as CartRow, await loadItems(guestCart.id));
  }

  const userCart = await getOrCreateCart(customerIdentity);
  const guestItems = await loadItems(guestCart.id);

  for (const guestItem of guestItems) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock_count, is_active")
      .eq("id", guestItem.variantId)
      .maybeSingle();

    if (!variant?.is_active) continue;

    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", userCart.id)
      .eq("variant_id", guestItem.variantId)
      .maybeSingle();

    const mergedQty = (existingItem?.quantity ?? 0) + guestItem.quantity;
    const finalQty = Math.min(mergedQty, variant.stock_count);
    if (finalQty <= 0) continue;

    if (existingItem) {
      await supabase
        .from("cart_items")
        .update({
          quantity: finalQty,
          unit_price: guestItem.unitPrice,
          product_name: guestItem.productName,
          product_slug: guestItem.productSlug,
          product_image: guestItem.productImage,
          sku: guestItem.sku,
          size_label: guestItem.sizeLabel,
          color_name: guestItem.colorName,
        })
        .eq("id", existingItem.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: userCart.id,
        variant_id: guestItem.variantId,
        quantity: finalQty,
        unit_price: guestItem.unitPrice,
        product_name: guestItem.productName,
        product_slug: guestItem.productSlug,
        product_image: guestItem.productImage,
        sku: guestItem.sku,
        size_label: guestItem.sizeLabel,
        color_name: guestItem.colorName,
      });
    }
  }

  if (guestCart.coupon_code && !userCart.coupon_code) {
    await supabase
      .from("carts")
      .update({ coupon_code: guestCart.coupon_code })
      .eq("id", userCart.id);
  }

  await supabase.from("cart_items").delete().eq("cart_id", guestCart.id);
  await supabase.from("carts").delete().eq("id", guestCart.id);

  return (await getActiveCart(customerIdentity)) ?? emptyCart();
}

export async function resolveCouponApplicationForCart(
  cart: Cart
): Promise<{ cart: Cart; couponApplication: CouponApplication | null }> {
  if (!cart.id || !cart.couponCode) {
    return { cart, couponApplication: null };
  }

  try {
    const couponApplication = await assertCouponApplicable({
      code: cart.couponCode,
      subtotal: cart.subtotal,
      customerId: cart.customerId,
    });
    return { cart, couponApplication };
  } catch (error) {
    if (!(error instanceof CouponEvalError)) throw error;

    const supabase = createAdminClient();
    await supabase
      .from("carts")
      .update({ coupon_code: null })
      .eq("id", cart.id);

    return {
      cart: { ...cart, couponCode: null },
      couponApplication: null,
    };
  }
}

export async function applyCouponToCart(
  identity: CartIdentity,
  code: string
): Promise<{ cart: Cart; couponApplication: CouponApplication }> {
  const cart = await getActiveCart(identity);
  if (!cart || !cart.id || cart.items.length === 0) {
    throw new CouponEvalError("invalid", "Carrinho vazio");
  }

  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    throw new CouponEvalError("invalid", "Cupom inválido");
  }

  const couponApplication = await assertCouponApplicable({
    code: normalized,
    subtotal: cart.subtotal,
    customerId: cart.customerId,
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("carts")
    .update({ coupon_code: couponApplication.code })
    .eq("id", cart.id);

  if (error) throw new Error(error.message);

  return {
    cart: { ...cart, couponCode: couponApplication.code },
    couponApplication,
  };
}

export async function removeCouponFromCart(
  identity: CartIdentity
): Promise<Cart> {
  const cart = await getActiveCart(identity);
  if (!cart || !cart.id) return emptyCart();

  if (!cart.couponCode) return cart;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("carts")
    .update({ coupon_code: null })
    .eq("id", cart.id);

  if (error) throw new Error(error.message);

  return { ...cart, couponCode: null };
}
