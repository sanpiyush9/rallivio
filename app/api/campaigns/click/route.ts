import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function admin(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server configuration is missing.");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("campaign_id");
    if (!campaignId || !/^[0-9a-f-]{36}$/i.test(campaignId)) {
      return NextResponse.json({ ok: false, state: "INVALID_CAMPAIGN" }, { status: 400 });
    }

    const response = await admin(
      `promotion_campaigns?select=id,source_url,status,trial_ends_at&id=eq.${campaignId}&limit=1`,
    );
    if (!response.ok) return NextResponse.json({ ok: false, state: "CAMPAIGN_LOOKUP_FAILED" }, { status: 503 });

    const rows = await response.json() as Array<{ id: string; source_url: string; status: string; trial_ends_at: string | null }>;
    const campaign = rows[0];
    if (!campaign || campaign.status !== "active" || (campaign.trial_ends_at && Date.parse(campaign.trial_ends_at) < Date.now())) {
      return NextResponse.json({ ok: false, state: "CAMPAIGN_INACTIVE" }, { status: 404 });
    }

    const current = await admin(`promotion_campaigns?id=eq.${campaignId}&select=clicks&limit=1`);
    const currentRows = current.ok ? await current.json() as Array<{ clicks: number }> : [];
    const clicks = Number(currentRows[0]?.clicks ?? 0);

    await admin(`promotion_campaigns?id=eq.${campaignId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ clicks: clicks + 1, updated_at: new Date().toISOString() }),
    });

    return NextResponse.redirect(campaign.source_url);
  } catch (error) {
    console.error("promotion click failed", error);
    return NextResponse.json({ ok: false, state: "CAMPAIGN_CLICK_FAILED" }, { status: 503 });
  }
}
