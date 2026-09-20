import { API_ENDPOINTS } from "@mall/constants";
import type { CartItem, Order, OrderShippingAddress, Product, ProductPost } from "@mall/types";

export interface ProductDetail extends ProductPost {
  productPostProducts: { products: Product; displayOrder: number }[];
}

// No React, Next, or Supabase dependency: the caller supplies the session token.
export async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || `요청에 실패했습니다 (${response.status}).`);
  }
  return result.data as T;
}

export const shopApi = {
  posts: (signal?: AbortSignal) => request<ProductPost[]>(API_ENDPOINTS.CLIENT_PRODUCT_POSTS.BASE, { signal }),
  post: (id: string) => request<ProductDetail>(API_ENDPOINTS.CLIENT_PRODUCT_POSTS.BY_ID(encodeURIComponent(id))),
  cart: (token: string) => request<CartItem[]>(API_ENDPOINTS.CLIENT_CART.BASE, {}, token),
  add: (token: string, productId: string, quantity: number) => request(API_ENDPOINTS.CLIENT_CART.BASE, {
    method: "POST", body: JSON.stringify({ productId, quantity }),
  }, token),
  remove: (token: string, id: string) => request(`${API_ENDPOINTS.CLIENT_CART.BASE}/${encodeURIComponent(id)}`, { method: "DELETE" }, token),
  order: (token: string, id: string) => request<Order>(API_ENDPOINTS.CLIENT_ORDERS.BY_ID(encodeURIComponent(id)), {}, token),
  createOrder: (token: string, input: {
    clientId: string;
    paymentId: string;
    items: { productId: string; quantity: number }[];
    shippingAddress: OrderShippingAddress;
  }) => request<Order>(API_ENDPOINTS.CLIENT_ORDERS.BASE, {
    method: "POST", body: JSON.stringify({ ...input, pointAmount: 0 }),
  }, token),
};
