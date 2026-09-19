import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")).filter(([k,v]) => k && v));
  const timestamp = Number(parts.t);
  const signatures = Object.entries(parts).filter(([k]) => k.startsWith("v1")).map(([,v]) => v as string);
  if (!timestamp || Math.abs(Date.now()/1000 - timestamp) > 300 || signatures.length === 0) return false;
  const signed = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return signatures.some((sig) => sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!signature || !webhookSecret || !serviceKey || !supabaseUrl) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  if (!verifyStripeSignature(payload, signature, webhookSecret)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const event = JSON.parse(payload);
  const object = event.data?.object ?? {};
  let userId = object.metadata?.user_id || object.subscription_details?.metadata?.user_id || null;
  if (!userId && object.customer) {
    const { data } = await createClient(supabaseUrl, serviceKey).from("subscriptions").select("user_id").eq("provider_customer_id", object.customer).maybeSingle();
    userId = data?.user_id ?? null;
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { error: eventError } = await admin.from("subscription_events").insert({ provider_event_id:event.id, event_type:event.type, user_id:userId, payload:event });
  if (eventError && !eventError.message.includes("duplicate")) return NextResponse.json({ error: "Event persistence failed" }, { status: 500 });

  if (event.type === "checkout.session.completed") {
    const subscriptionId = object.subscription;
    if (subscriptionId && userId) {
      await admin.from("subscriptions").upsert({ user_id:userId, plan_id:"pro", status:"active", provider:"stripe", provider_customer_id:object.customer, provider_subscription_id:subscriptionId, updated_at:new Date().toISOString() });
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const status = event.type.endsWith("deleted") ? "canceled" : object.status;
    if (userId) {
      await admin.from("subscriptions").upsert({
        user_id:userId, plan_id:"pro", status, provider:"stripe", provider_customer_id:object.customer,
        provider_subscription_id:object.id, provider_price_id:object.items?.data?.[0]?.price?.id || null,
        current_period_end:object.current_period_end ? new Date(object.current_period_end*1000).toISOString() : null,
        cancel_at_period_end:!!object.cancel_at_period_end, updated_at:new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
