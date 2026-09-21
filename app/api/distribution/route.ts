import { NextResponse } from "next/server";

const BASE = (process.env.RALLIVIO_BASE_URL || "https://rallivio.com").replace(/\/$/, "");

export async function GET() {
  return NextResponse.json({
    name: "RALLIVIO Distribution Network",
    version: 2,
    status: "active",
    model: "authorized_campaign_syndication",
    automatic_updates: true,
    refresh_seconds: 300,
    feed: `${BASE}/api/distribution/feed`,
    network_script: `${BASE}/rallivio-network.js`,
    redirect: `${BASE}/go/{campaignId}`,
    publisher_installation: "one_time",
    publisher_action_required: "one_time_install",
    eligibility: "registered_user_submitted_active_promotion_only",
    discovery_pool_distribution: false,
    prohibited: ["spam", "fake_engagement", "unauthorized_posting", "paid_placement"],
    supported_surfaces: ["custom_html", "wordpress", "shopify", "webflow", "cms", "owned_sites", "authorized_partner_sites"]
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}