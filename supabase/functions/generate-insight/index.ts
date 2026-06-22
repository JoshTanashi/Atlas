import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

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
  const userId = userData.user.id;

  const { data: profile } = await callerClient
    .from("profiles")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_pro) {
    return new Response(JSON.stringify({ error: "Pro subscription required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [eventsRes, incomeRes] = await Promise.all([
    callerClient
      .from("financial_events")
      .select("amount_cents, direction, category, occurred_at")
      .gte("occurred_at", since.toISOString()),
    callerClient.from("baseline_income").select("monthly_income_cents").maybeSingle(),
  ]);

  const events = eventsRes.data ?? [];
  if (events.length === 0) {
    return new Response(
      JSON.stringify({ content: "Not enough logged activity yet to generate an insight — log a few entries first." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const byCategory: Record<string, number> = {};
  let totalExpenseCents = 0;
  let totalIncomeCents = 0;
  for (const e of events) {
    if (e.direction === "expense") {
      totalExpenseCents += e.amount_cents;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount_cents;
    } else {
      totalIncomeCents += e.amount_cents;
    }
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, cents]) => `${category}: R${(cents / 100).toFixed(2)}`)
    .join(", ");

  const summary = [
    `Last 90 days total spend: R${(totalExpenseCents / 100).toFixed(2)}`,
    `Last 90 days total income logged: R${(totalIncomeCents / 100).toFixed(2)}`,
    `Spend by category: ${topCategories || "none"}`,
    incomeRes.data?.monthly_income_cents
      ? `Stated monthly income: R${(incomeRes.data.monthly_income_cents / 100).toFixed(2)}`
      : "Monthly income not set",
  ].join("\n");

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      system:
        "You write short, calm, honest observations for a personal financial journal app called Atlas. " +
        "Tone: descriptive, not preachy or judgmental — never tell the user what to do, just describe what the data shows. " +
        "Cite real numbers from the data given, in Rands. 2-3 short sentences max. No bullet points, no generic advice, no disclaimers.",
      messages: [{ role: "user", content: `Here is a summary of this person's last 90 days:\n\n${summary}` }],
    }),
  });

  if (!anthropicRes.ok) {
    return new Response(JSON.stringify({ error: "Could not generate insight" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropicData = await anthropicRes.json();
  const content: string = anthropicData?.content?.[0]?.text?.trim() ?? "No insight available right now.";

  await callerClient.from("ai_insights").upsert({
    user_id: userId,
    content,
    generated_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ content }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
