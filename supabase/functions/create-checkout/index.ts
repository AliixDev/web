// supabase/functions/create-checkout/index.ts
//
// Creates a pending `orders` row (+ order_items) and a Stripe
// Checkout Session for international customers. Runs with the
// service role key, so it — not the browser — is the sole source of
// truth for the amount charged. The client only ever sends product
// ids, variant ids, quantities and shipping details; every price is
// looked up fresh from Postgres via priceCart().
//
// Deploy:
//   supabase functions deploy create-checkout --no-verify-jwt=false
//
// Required secrets (supabase secrets set ...):
//   STRIPE_SECRET_KEY
//   SUPABASE_URL                (auto-provided in hosted Edge Functions)
//   SUPABASE_SERVICE_ROLE_KEY
//   SITE_URL                    e.g. https://<user>.github.io/<repo>

import Stripe from "https://esm.sh/stripe@16.9.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, handleCorsPreflight, jsonResponse } from "../_shared/cors.ts";
import { getServiceRoleClient, priceCart, CartLineInput } from "../_shared/pricing.ts";

interface CreateCheckoutRequest {
  currency: "USD" | "PKR";
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

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // Identify the calling user from their JWT (the anon-key client
    // on the frontend automatically forwards the user's access token
    // in the Authorization header when the user is signed in).
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

    const body: CreateCheckoutRequest = await req.json();

    if (!body.currency || !["USD", "PKR"].includes(body.currency)) {
      return jsonResponse({ error: "Invalid currency" }, 400);
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }
    const s = body.shipping;
    if (!s || !s.name || !s.phone || !s.address_line1 || !s.city || !s.country) {
      return jsonResponse({ error: "Missing shipping details" }, 400);
    }

    const supabase = getServiceRoleClient();

    // Re-price the cart server-side. This is the only trusted amount.
    const priced = await priceCart(supabase, body.currency, body.items);

    const shippingMinor = body.currency === "USD" ? 500 : 25000; // flat shipping: $5 or Rs 250
    const totalMinor = priced.subtotal_minor + shippingMinor;

    // Create the pending order first so we have an id to embed as
    // Stripe metadata (used by the webhook to find the order again).
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        currency: body.currency,
        subtotal_minor: priced.subtotal_minor,
        shipping_minor: shippingMinor,
        total_minor: totalMinor,
        payment_method: "stripe",
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

    // Stripe requires a three-letter ISO currency code, lowercase.
    const stripeCurrency = body.currency.toLowerCase();

    const lineItems = priced.lines.map((line) => ({
      price_data: {
        currency: stripeCurrency,
        product_data: {
          name: line.variant_name ? `${line.product_name} - ${line.variant_name}` : line.product_name,
        },
        unit_amount: line.unit_price_minor,
      },
      quantity: line.quantity,
    }));

    lineItems.push({
      price_data: {
        currency: stripeCurrency,
        product_data: { name: "Shipping" },
        unit_amount: shippingMinor,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: user.email ?? undefined,
      success_url: `${siteUrl}/order-confirmation/?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/?cancelled=1`,
      metadata: {
        order_id: order.id,
        supabase_user_id: user.id,
      },
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to attach session id to order", updateError);
    }

    return jsonResponse({ url: session.url, order_id: order.id }, 200);
  } catch (err) {
    console.error("create-checkout error", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return jsonResponse({ error: message }, 400);
  }
});
