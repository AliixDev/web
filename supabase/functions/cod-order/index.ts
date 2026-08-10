// supabase/functions/cod-order/index.ts
//
// Creates a Cash-on-Delivery order for local Pakistan customers.
// There is no payment gateway involved, so this function itself is
// the trust boundary: it re-prices the cart server-side exactly like
// create-checkout does, so a customer can never alter what they'll
// be asked to pay on delivery by tampering with client-side state.
//
// Deploy:
//   supabase functions deploy cod-order
//
// Required secrets:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getServiceRoleClient, priceCart, CartLineInput } from "../_shared/pricing.ts";

interface CodOrderRequest {
  items: CartLineInput[];
  shipping: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    country: string;
  };
}

const SHIPPING_PKR_PAISA = 25000; // flat Rs 250 COD delivery fee

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "You must be signed in to place an order" }, 401);
    }

    const body: CodOrderRequest = await req.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }
    const s = body.shipping;
    if (!s || !s.name || !s.phone || !s.address_line1 || !s.city) {
      return jsonResponse({ error: "Missing shipping details" }, 400);
    }
    if (!s.country || s.country.trim().toLowerCase() !== "pakistan") {
      return jsonResponse({ error: "Cash on Delivery is only available within Pakistan" }, 400);
    }

    const supabase = getServiceRoleClient();

    // COD is PKR-only.
    const priced = await priceCart(supabase, "PKR", body.items);
    const totalMinor = priced.subtotal_minor + SHIPPING_PKR_PAISA;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "cod_pending",
        currency: "PKR",
        subtotal_minor: priced.subtotal_minor,
        shipping_minor: SHIPPING_PKR_PAISA,
        total_minor: totalMinor,
        payment_method: "cod",
        payment_status: "unpaid",
        shipping_name: s.name,
        shipping_phone: s.phone,
        shipping_address_line1: s.address_line1,
        shipping_address_line2: s.address_line2 ?? null,
        shipping_city: s.city,
        shipping_country: s.country,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("COD order insert failed", orderError);
      return jsonResponse({ error: "Could not create order" }, 500);
    }

    const orderItemsPayload = priced.lines.map((line) => ({
      order_id: order.id,
      product_id: line.product_id,
      variant_id: line.variant_id,
      product_name: line.product_name,
      variant_name: line.variant_name,
      quantity: line.quantity,
      unit_price_minor: line.unit_price_minor,
      line_total_minor: line.line_total_minor,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
    if (itemsError) {
      console.error("COD order items insert failed", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return jsonResponse({ error: "Could not create order items" }, 500);
    }

    // Reserve stock immediately for COD, since there is no separate
    // payment-confirmation step to hang the decrement off of.
    for (const line of priced.lines) {
      if (line.variant_id) {
        await supabase.rpc("decrement_variant_stock", {
          p_variant_id: line.variant_id,
          p_quantity: line.quantity,
        });
      } else {
        await supabase.rpc("decrement_product_stock", {
          p_product_id: line.product_id,
          p_quantity: line.quantity,
        });
      }
    }

    return jsonResponse({ order_id: order.id, total_minor: totalMinor }, 200);
  } catch (err) {
    console.error("cod-order error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return jsonResponse({ error: message }, 400);
  }
});
