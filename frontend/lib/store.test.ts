// frontend/lib/store.test.ts

import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "./store";
import type { CartItem } from "./types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: "p1",
    variant_id: null,
    slug: "product-one",
    name: "Product One",
    variant_name: null,
    image_url: null,
    unit_price_usd_cents: 2500,
    unit_price_pkr_paisa: 450000,
    quantity: 1,
    max_stock: 10,
    ...overrides,
  };
}

beforeEach(() => {
  // Reset the singleton store before every test
  useStore.setState({ cart: [], currency: "PKR" });
});

describe("addToCart", () => {
  it("adds a new line when the cart is empty", () => {
    useStore.getState().addToCart(makeItem());
    expect(useStore.getState().cart).toHaveLength(1);
    expect(useStore.getState().cart[0].quantity).toBe(1);
  });

  it("merges lines with the same product + variant", () => {
    const store = useStore.getState();
    store.addToCart(makeItem());
    store.addToCart(makeItem({ quantity: 2 }));
    const cart = useStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  it("keeps separate lines for different variants of the same product", () => {
    const store = useStore.getState();
    store.addToCart(makeItem({ variant_id: "v1", variant_name: "Small" }));
    store.addToCart(makeItem({ variant_id: "v2", variant_name: "Large" }));
    expect(useStore.getState().cart).toHaveLength(2);
  });

  it("clamps quantity to max_stock when merging", () => {
    const store = useStore.getState();
    store.addToCart(makeItem({ quantity: 8 }));
    store.addToCart(makeItem({ quantity: 5 })); // 13 would exceed max_stock 10
    expect(useStore.getState().cart[0].quantity).toBe(10);
  });
});

describe("updateQuantity", () => {
  it("updates the quantity of the matching line", () => {
    useStore.getState().addToCart(makeItem());
    useStore.getState().updateQuantity("p1", null, 4);
    expect(useStore.getState().cart[0].quantity).toBe(4);
  });

  it("clamps below to 1", () => {
    useStore.getState().addToCart(makeItem());
    useStore.getState().updateQuantity("p1", null, 0);
    expect(useStore.getState().cart[0].quantity).toBe(1);
  });

  it("clamps above to max_stock", () => {
    useStore.getState().addToCart(makeItem());
    useStore.getState().updateQuantity("p1", null, 99);
    expect(useStore.getState().cart[0].quantity).toBe(10);
  });
});

describe("removeFromCart", () => {
  it("removes the matching line only", () => {
    const store = useStore.getState();
    store.addToCart(makeItem());
    store.addToCart(makeItem({ product_id: "p2", slug: "product-two", name: "Product Two" }));
    store.removeFromCart("p1", null);
    const cart = useStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].product_id).toBe("p2");
  });
});

describe("clearCart", () => {
  it("empties the cart", () => {
    const store = useStore.getState();
    store.addToCart(makeItem());
    store.clearCart();
    expect(useStore.getState().cart).toHaveLength(0);
  });
});

describe("cartCount", () => {
  it("sums all quantities", () => {
    const store = useStore.getState();
    store.addToCart(makeItem());
    store.addToCart(makeItem({ variant_id: "v1", variant_name: "Small" }));
    store.addToCart(makeItem({ variant_id: "v2", variant_name: "Large", quantity: 3 }));
    expect(useStore.getState().cartCount()).toBe(5);
  });
});

describe("cartSubtotalMinor", () => {
  it("uses the PKR field when currency is PKR", () => {
    const store = useStore.getState();
    store.setCurrency("PKR");
    store.addToCart(makeItem({ quantity: 2 }));
    expect(store.cartSubtotalMinor()).toBe(900000); // 2 × 450000 paisa
  });

  it("uses the USD field when currency is USD", () => {
    const store = useStore.getState();
    store.setCurrency("USD");
    store.addToCart(makeItem({ quantity: 2 }));
    expect(store.cartSubtotalMinor()).toBe(5000); // 2 × 2500 cents
  });
});
