import { NextResponse } from "next/server";

const BASE = (process.env.RALLIVIO_BASE_URL || "https://rallivio.com").replace(/\/$/, "");

export async function GET() {
  return NextResponse.json({
    name: "RALLIVIO Distribution Network",
    version: 1,
    status: "active",
    model: "authorized_syndication",
    automatic_updates: true,
    refresh_seconds: 300,
    feed: `${BASE}/api/embed`,
    network_script: `${BASE}/rallivio-network.js`,
    redirect: `${BASE}/r/{videoId}`,
    publisher_installation: "one_time",
    publisher_action_required: "one_time_install",
    prohibited: ["spam", "fake_engagement", "unauthorized_posting", "paid_placement"],
    supported_surfaces: ["custom_html", "wordpress", "shopify", "webflow", "cms", "owned_sites", "authorized_partner_sites"]
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}