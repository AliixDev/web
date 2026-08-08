// supabase/functions/local-gateway-checkout/index.ts
//
// MOCK TEMPLATE for a local Pakistani payment gateway (Safepay or
// JazzCash). Both gateways follow the same shape: you POST an order
// amount + a return URL to their API, they hand back a redirect URL
// (or, for JazzCash, an HTML auto-post form), and later they call
// your webhook / return URL with a signed status.
//
// This function is intentionally NOT wired to a live gateway: it
// creates the order exactly like create-checkout / cod-order, then
// returns a *mock* redirect URL so the frontend flow can be built and
// tested end-to-end today. To go live, replace `callMockGateway()`
// below with a real call to the Safepay or JazzCash API using
// credentials from Deno.env.get(...), following the vendor's
// integration guide.
//
// Deploy:
//   supabase functions deploy local-gateway-checkout
//
// Required secrets (once a real gateway is wired in):
//   SAFEPAY_API_KEY / SAFEPAY_API_SECRET, or
//   JAZZCASH_MERCHANT_ID / JAZZCASH_PASSWORD / JAZZCASH_INTEGRITY_SALT
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SITE_URL

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getServiceRoleClient, priceCart, CartLineInput } from "../_shared/pricing.ts";

interface LocalGatewayRequest {
  gateway: "jazzcash" | "safepay";
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

const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

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
      return jsonResponse({ error: "You must be signed in to check out" }, 401);
    }

    const body: LocalGatewayRequest = await req.json();

    if (!["jazzcash", "safepay"].includes(body.gateway)) {
      return jsonResponse({ error: "Unknown gateway" }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }

    const supabase = getServiceRoleClient();
    const priced = await priceCart(supabase, "PKR", body.items);
    const shippingMinor = 25000;
    const totalMinor = priced.subtotal_minor + shippingMinor;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        currency: "PKR",
        subtotal_minor: priced.subtotal_minor,
        shipping_minor: shippingMinor,
        total_minor: totalMinor,
        payment_method: body.gateway,
        payment_status: "unpaid",
        shipping_name: body.shipping.name,
        shipping_phone: body.shipping.phone,
        shipping_address_line1: body.shipping.address_line1,
        shipping_address_line2: body.shipping.address_line2 ?? null,
        shipping_city: body.shipping.city,
        shipping_country: body.shipping.country,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert failed", orderError);
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
      console.error("Order items insert failed", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return jsonResponse({ error: "Could not create order items" }, 500);
    }

    const redirectUrl = await callMockGateway(body.gateway, order.id, totalMinor);

    return jsonResponse({ url: redirectUrl, order_id: order.id }, 200);
  } catch (err) {
    console.error("local-gateway-checkout error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return jsonResponse({ error: message }, 400);
  }
});

/**
 * MOCK gateway call. Replace this function body with a real request
 * to the Safepay or JazzCash API when going live. The real
 * integration should:
 *   1. POST the order amount (in PKR) and a return_url of
 *      `${siteUrl}/order-confirmation/?order_id=${orderId}` to the
 *      gateway's session/order-creation endpoint, signed per their
 *      integrity/HMAC scheme.
 *   2. Return the redirect URL (Safepay) or auto-submit form
 *      (JazzCash) the frontend should send the customer to.
 *   3. Add a second Edge Function, e.g. `local-gateway-webhook`,
 *      mirroring stripe-webhook, that verifies the gateway's callback
 *      signature and flips the order to payment_status = 'paid'.
 */
async function callMockGateway(
  gateway: "jazzcash" | "safepay",
  orderId: string,
  totalMinor: number,
): Promise<string> {
  const returnUrl = `${siteUrl}/order-confirmation/?order_id=${orderId}&mock=1`;
  return `${returnUrl}&gateway=${gateway}&amount=${totalMinor}`;
}
