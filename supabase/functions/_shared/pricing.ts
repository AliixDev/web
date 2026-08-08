// supabase/functions/_shared/pricing.ts
// Server-side price recomputation. The client sends only product_id,
// variant_id and quantity for each cart line — never a price. This
// module looks up the authoritative price from Postgres so that no
// request, however crafted, can alter what a customer is charged.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export interface CartLineInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

export interface PricedLine {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price_minor: number;
  line_total_minor: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal_minor: number;
}

export function getServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Re-prices a cart against the products/product_variants tables using
 * the service-role client (bypasses RLS, reads the true catalog
 * price). Throws if a product/variant is missing, inactive, or out
 * of stock, or if the quantity requested exceeds available stock.
 */
export async function priceCart(
  supabase: SupabaseClient,
  currency: "USD" | "PKR",
  lines: CartLineInput[],
): Promise<PricedCart> {
  if (!lines.length) {
    throw new Error("Cart is empty");
  }

  const priced: PricedLine[] = [];
  let subtotal = 0;

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 999) {
      throw new Error(`Invalid quantity for product ${line.product_id}`);
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, price_usd_cents, price_pkr_paisa, is_active, stock_quantity")
      .eq("id", line.product_id)
      .single();

    if (productError || !product) {
      throw new Error(`Product ${line.product_id} not found`);
    }
    if (!product.is_active) {
      throw new Error(`Product "${product.name}" is no longer available`);
    }

    let unitPrice = currency === "USD" ? product.price_usd_cents : product.price_pkr_paisa;
    let variantName: string | null = null;
    let availableStock = product.stock_quantity;

    if (line.variant_id) {
      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id, name, price_usd_cents, price_pkr_paisa, is_active, stock_quantity, product_id")
        .eq("id", line.variant_id)
        .single();

      if (variantError || !variant || variant.product_id !== product.id) {
        throw new Error(`Variant ${line.variant_id} not found for product ${product.id}`);
      }
      if (!variant.is_active) {
        throw new Error(`Variant "${variant.name}" is no longer available`);
      }

      const variantPrice = currency === "USD" ? variant.price_usd_cents : variant.price_pkr_paisa;
      if (variantPrice !== null && variantPrice !== undefined) {
        unitPrice = variantPrice;
      }
      variantName = variant.name;
      availableStock = variant.stock_quantity;
    }

    if (line.quantity > availableStock) {
      throw new Error(`Insufficient stock for "${product.name}${variantName ? " - " + variantName : ""}"`);
    }

    const lineTotal = unitPrice * line.quantity;
    subtotal += lineTotal;

    priced.push({
      product_id: product.id,
      variant_id: line.variant_id ?? null,
      product_name: product.name,
      variant_name: variantName,
      quantity: line.quantity,
      unit_price_minor: unitPrice,
      line_total_minor: lineTotal,
    });
  }

  return { lines: priced, subtotal_minor: subtotal };
}
