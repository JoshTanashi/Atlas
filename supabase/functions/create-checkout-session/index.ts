import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});
const SITE_URL = Deno.env.get("SITE_URL")!;
const PRICE_IDS: Record<string, string> = {
  monthly: Deno.env.get("STRIPE_PRICE_ID_MONTHLY")!,
  yearly: Deno.env.get("STRIPE_PRICE_ID_YEARLY")!,
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { plan } = await req.json().catch(() => ({}));
  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return new Response(JSON.stringify({ error: "Invalid plan" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const callerClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const user = userData.user;

  const { data: profile } = await callerClient
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/insights?checkout=success`,
    cancel_url: `${SITE_URL}/insights`,
    metadata: { supabase_user_id: user.id, plan },
    subscription_data: { metadata: { supabase_user_id: user.id, plan } },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
