import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, ProductOption } from "@mall/types";

export interface OrderCartItem {
  orderItemId: string;
  product: Product;
  selectedOption: ProductOption | null;
  quantity: number;
}

interface OrderState {
  // 장바구니 항목
  cartItems: OrderCartItem[];
  // 위시리스트 상품 ID
  wishlistIds: string[];

  // 장바구니 액션
  addCartItem: (product: Product, selectedOption: ProductOption | null, quantity: number) => void;
  removeCartItem: (orderItemId: string) => void;
  updateCartQuantity: (orderItemId: string, quantity: number) => void;
  clearCart: () => void;

  // 위시리스트 액션
  toggleWishlist: (productId: string) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      cartItems: [],
      wishlistIds: [],

      // 장바구니 아이템 추가
      addCartItem: (product, selectedOption, quantity) => {
        set((state) => {
          const orderItemId = `${product.productId}-${selectedOption?.optionId || "default"}`;
          const existingIndex = state.cartItems.findIndex((item) => item.orderItemId === orderItemId);

          if (existingIndex > -1) {
            const updated = [...state.cartItems];
            updated[existingIndex].quantity += quantity;
            return { cartItems: updated };
          }

          return {
            cartItems: [
              ...state.cartItems,
              { orderItemId, product, selectedOption, quantity },
            ],
          };
        });
      },

      // 장바구니 아이템 삭제
      removeCartItem: (orderItemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.orderItemId !== orderItemId),
        }));
      },

      // 수량 변경
      updateCartQuantity: (orderItemId, quantity) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.orderItemId === orderItemId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },

      clearCart: () => set({ cartItems: [] }),

      // 위시리스트 토글
      toggleWishlist: (productId) => {
        set((state) => {
          const exists = state.wishlistIds.includes(productId);
          return {
            wishlistIds: exists
              ? state.wishlistIds.filter((id) => id !== productId)
              : [...state.wishlistIds, productId],
          };
        });
      },
    }),
    {
      name: "d2c-order-storage",
    }
  )
);