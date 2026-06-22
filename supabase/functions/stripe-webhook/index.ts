import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
    const plan = session.metadata?.plan ?? null;
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

    if (userId && customerId) {
      let periodEnd: string | null = null;
      if (typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      await adminClient
        .from("profiles")
        .update({
          is_pro: true,
          stripe_customer_id: customerId,
          pro_plan: plan,
          pro_current_period_end: periodEnd,
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const isActive = subscription.status === "active" || subscription.status === "trialing";

    await adminClient
      .from("profiles")
      .update({
        is_pro: isActive,
        pro_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
