// supabase/functions/stripe-webhook/index.ts
//
// Idempotent Stripe webhook listener. Verifies the Stripe signature
// against the raw request body, then updates the corresponding
// `orders` row using the service role key (bypassing RLS, since this
// runs entirely server-side and never trusts client input).
//
// Deploy WITHOUT JWT verification, since Stripe — not a logged-in
// Supabase user — calls this endpoint:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Required secrets:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SIGNING_SECRET   (from `stripe listen` or the Stripe dashboard)
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import Stripe from "https://esm.sh/stripe@16.9.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceRoleClient } from "../_shared/pricing.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") ?? "";

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // Signature verification MUST run against the raw, unparsed body.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response(`Webhook signature verification failed`, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  // Idempotency guard: record every processed Stripe event id so a
  // retried delivery (Stripe retries on any non-2xx or timeout) never
  // double-applies side effects such as decrementing stock twice.
  const { error: dedupeError } = await supabase
    .from("processed_stripe_events")
    .insert({ event_id: event.id });

  if (dedupeError) {
    // Unique violation means we've already handled this event id.
    if (dedupeError.code === "23505") {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Failed to record processed event", dedupeError);
    return new Response("Internal error", { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (!orderId) {
          console.error("checkout.session.completed missing order_id metadata");
          break;
        }

        const { data: order, error: fetchError } = await supabase
          .from("orders")
          .select("id, status, payment_status")
          .eq("id", orderId)
          .single();

        if (fetchError || !order) {
          console.error("Order referenced by webhook not found", orderId);
          break;
        }

        // Idempotent no-op if this order was already marked paid.
        if (order.payment_status === "paid") {
          break;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "processing",
            payment_status: "paid",
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .eq("id", orderId);

        if (updateError) {
          console.error("Failed to mark order paid", updateError);
          throw updateError;
        }

        await decrementStock(supabase, orderId);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId)
            .eq("payment_status", "unpaid");
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.order_id;
        if (orderId) {
          await supabase
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", orderId);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged but ignored.
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error processing webhook event", err);
    // Returning 500 lets Stripe retry delivery; our dedupe table
    // already recorded the event id, so on retry we short-circuit
    // as "duplicate" above rather than reprocessing. To allow a
    // genuine retry after a transient failure, delete the dedupe row
    // for failed attempts:
    await supabase.from("processed_stripe_events").delete().eq("event_id", event.id);
    return new Response("Internal error", { status: 500 });
  }
});

async function decrementStock(
  supabase: ReturnType<typeof getServiceRoleClient>,
  orderId: string,
) {
  const { data: items, error } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId);

  if (error || !items) {
    console.error("Failed to load order items for stock decrement", error);
    return;
  }

  for (const item of items) {
    if (item.variant_id) {
      await supabase.rpc("decrement_variant_stock", {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      });
    } else {
      await supabase.rpc("decrement_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }
}
