/**
 * Pedidos aceitos pelo Mercado Pago ou já pagos.
 * Tentativas locais rejeitadas antes de aceite não aparecem.
 */
export const VISIBLE_ORDER_FILTER =
  "and(mercado_pago_order_id.not.is.null,payment_status.neq.rejected),status.eq.paid";
