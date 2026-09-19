import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function stripeForm(values: Record<string,string>) {
  return new URLSearchParams(values);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/pricing", request.url), 303);

  const form = await request.formData();
  const plan = form.get("plan")?.toString() || "pro";
  const interval = form.get("interval")?.toString() === "year" ? "year" : "month";
  if (plan !== "pro") return NextResponse.redirect(new URL("/pricing?error=invalid-plan", request.url), 303);

  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = interval === "year" ? process.env.STRIPE_PRICE_PRO_ANNUAL : process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!secret || !priceId) return NextResponse.redirect(new URL("/pricing?error=billing-not-configured", request.url), 303);

  const body = stripeForm({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: new URL("/account?subscription=success", request.url).toString(),
    cancel_url: new URL("/pricing?canceled=1", request.url).toString(),
    customer_email: user.email || "",
    "metadata[user_id]": user.id,
    "metadata[plan_id]": "pro",
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan_id]": "pro",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || !data.url) return NextResponse.redirect(new URL("/pricing?error=checkout-failed", request.url), 303);
  return NextResponse.redirect(data.url, 303);
}
