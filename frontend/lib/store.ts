// frontend/lib/store.ts
//
// Zustand store for cart contents and the active display currency.
// Persisted to localStorage so the cart survives a page reload (this
// is a fully static, client-rendered site — there is no server
// session to hold cart state instead).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Currency } from "./types";

interface StoreState {
  currency: Currency;
  cart: CartItem[];
  wishlist: string[];
  setCurrency: (currency: Currency) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotalMinor: () => number;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

function sameLine(a: CartItem, productId: string, variantId: string | null) {
  return a.product_id === productId && a.variant_id === variantId;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      cart: [],
      wishlist: [],

      setCurrency: (currency) => set({ currency }),

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((c) => sameLine(c, item.product_id, item.variant_id));
          if (existing) {
            const nextQuantity = Math.min(existing.quantity + item.quantity, existing.max_stock);
            return {
              cart: state.cart.map((c) =>
                sameLine(c, item.product_id, item.variant_id)
                  ? { ...c, quantity: nextQuantity }
                  : c,
              ),
            };
          }
          return {
            cart: [...state.cart, { ...item, quantity: Math.min(item.quantity, item.max_stock) }],
          };
        });
      },

      removeFromCart: (productId, variantId) => {
        set((state) => ({
          cart: state.cart.filter((c) => !sameLine(c, productId, variantId)),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        set((state) => ({
          cart: state.cart
            .map((c) =>
              sameLine(c, productId, variantId)
                ? { ...c, quantity: Math.max(1, Math.min(quantity, c.max_stock)) }
                : c,
            )
            .filter((c) => c.quantity > 0),
        }));
      },

      clearCart: () => set({ cart: [] }),

      cartCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      cartSubtotalMinor: () => {
        const { currency, cart } = get();
        return cart.reduce((sum, item) => {
          const unit = currency === "USD" ? item.unit_price_usd_cents : item.unit_price_pkr_paisa;
          return sum + unit * item.quantity;
        }, 0);
      },

      toggleWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId],
        }));
      },

      isWishlisted: (productId) => get().wishlist.includes(productId),
    }),
    {
      name: "storefront-cart-v1",
      partialize: (state) => ({
        currency: state.currency,
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    },
  ),
);
