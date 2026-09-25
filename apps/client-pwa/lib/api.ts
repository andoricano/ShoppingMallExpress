import type { Cart, JsonObject, Order, OrderItem, OrderStatus, ProductPostDetail, ProductPostSummary } from "@mall/types";
import { createClient } from "./supabase/client";

// Mall v2 Consumer boundary: public ProductPost RPCs, authenticated Cart/Order RPCs
// (ownership from auth.uid()) and owner-scoped RLS reads. No Ware/Warehouse data.

type OrderItemRow = {
  id: string; order_id: string; product_id: string; product_variant_id: string;
  quantity: number; unit_price: number; line_total: number;
  product_name_snapshot: string; variant_label_snapshot: string | null;
  option_snapshot: JsonObject; image_url_snapshot: string | null; created_at: string;
};

type OrderRow = {
  id: string; client_id: string; order_number: string | null; status: OrderStatus;
  shipping_address: JsonObject | null; subtotal: number; discount_amount: number;
  shipping_amount: number; total_amount: number; payment_reference: string | null;
  ordered_at: string; created_at: string; updated_at: string; order_items: OrderItemRow[] | null;
};

// Consumer-readable columns only; internal Ware allocations are never selected.
const ORDER_SELECT =
  "id, client_id, order_number, status, shipping_address, subtotal, discount_amount, shipping_amount, total_amount, payment_reference, ordered_at, created_at, updated_at, order_items(id, order_id, product_id, product_variant_id, quantity, unit_price, line_total, product_name_snapshot, variant_label_snapshot, option_snapshot, image_url_snapshot, created_at)";

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id, orderId: row.order_id, productId: row.product_id, productVariantId: row.product_variant_id,
    quantity: row.quantity, unitPrice: Number(row.unit_price), lineTotal: Number(row.line_total),
    productNameSnapshot: row.product_name_snapshot, variantLabelSnapshot: row.variant_label_snapshot,
    optionSnapshot: row.option_snapshot, imageUrlSnapshot: row.image_url_snapshot, createdAt: row.created_at,
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id, clientId: row.client_id, orderNumber: row.order_number, status: row.status,
    shippingAddress: row.shipping_address, subtotal: Number(row.subtotal), discountAmount: Number(row.discount_amount),
    shippingAmount: Number(row.shipping_amount), totalAmount: Number(row.total_amount),
    paymentReference: row.payment_reference, orderedAt: row.ordered_at, createdAt: row.created_at, updatedAt: row.updated_at,
    items: (row.order_items ?? []).map(toOrderItem).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

// Maps Mall v2 RPC errors to user messages without exposing stock quantities.
function toMessage(error: unknown, fallback: string) {
  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message: unknown }).message) : "";
  if (message.includes("Authentication required")) return "로그인이 필요합니다.";
  if (message.includes("Cart is empty") || message.includes("Cart does not exist")) return "장바구니가 비어 있습니다.";
  if (message.includes("Insufficient stock")) return "재고가 부족한 상품이 있습니다. 수량을 줄이거나 삭제해 주세요.";
  if (message.includes("is not available")) return "현재 판매하지 않는 상품이 있습니다. 장바구니에서 삭제해 주세요.";
  if (message.includes("Quantity must be greater than zero")) return "수량은 1개 이상이어야 합니다.";
  return fallback;
}

async function call<T>(run: PromiseLike<{ data: unknown; error: unknown }>, fallback: string): Promise<T> {
  const { data, error } = await run;
  if (error) throw new Error(toMessage(error, fallback));
  return data as T;
}

/** ClientAddress field names, as used by the client-web order snapshot. */
export interface ShippingAddressInput {
  recipientName: string; phone: string; zonecode: string; address: string; addressDetail: string;
}

export const shopApi = {
  posts: () => call<ProductPostSummary[] | null>(
    createClient().rpc("list_product_posts", { p_category_id: null, p_limit: 100, p_offset: 0 }),
    "상품을 불러오지 못했습니다.",
  ).then((data) => (Array.isArray(data) ? data : [])),
  // null: not found, unpublished, or scheduled for later.
  post: (id: string) => call<ProductPostDetail | null>(
    createClient().rpc("get_product_post_detail", { p_product_post_id: id }),
    "상품 정보를 불러오지 못했습니다.",
  ),
  cart: () => call<Cart>(createClient().rpc("get_cart"), "장바구니를 불러오지 못했습니다."),
  add: (productId: string, productVariantId: string, quantity: number) => call<unknown>(
    createClient().rpc("add_cart_item", { p_product_id: productId, p_product_variant_id: productVariantId, p_quantity: quantity }),
    "장바구니에 상품을 담지 못했습니다.",
  ),
  remove: (cartItemId: string) => call<unknown>(
    createClient().rpc("remove_cart_item", { p_cart_item_id: cartItemId }),
    "장바구니 상품 삭제에 실패했습니다.",
  ),
  // Orders the whole server Cart; prices and stock are resolved inside the RPC.
  createOrder: (shippingAddress: ShippingAddressInput) => call<string>(
    createClient().rpc("create_order_from_cart", { p_shipping_address: shippingAddress, p_payment_reference: null }),
    "주문을 생성하지 못했습니다.",
  ),
  order: async (id: string) => {
    const row = await call<OrderRow | null>(
      createClient().from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle(),
      "주문을 불러오지 못했습니다.",
    );
    return row ? toOrder(row) : null;
  },
};
