import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_LIMIT = 20;

function hostFrom(request: Request) {
  const h = request.headers.get("origin") || request.headers.get("referer") || "";
  try { return new URL(h).hostname.replace(/^www\./, "").toLowerCase() || "direct"; }
  catch { return "direct"; }
}

async function sb(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Distribution feed configuration is missing.");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit") || 5)));
    const topic = url.searchParams.get("topic") || "";
    const region = url.searchParams.get("region") || "";
    const sourceHost = hostFrom(request);

    const rate = await sb("rpc/consume_embed_request", {
      method: "POST",
      body: JSON.stringify({ p_source_host: sourceHost })
    });
    if (!rate.ok) return NextResponse.json({ ok:false, items:[], state:"RATE_LIMITED" }, { status:429 });

    const filters = [
      "select=id,title,channel_title,channel_id,thumbnail,url,topic,region,source,tier,relevance_score,last_movement_at,updated_at,views",
      "embeddable=eq.true",
      "expires_at=is.null",
      "order=relevance_score.desc,last_movement_at.desc,updated_at.desc"
    ];
    if (topic) filters.push(`topic=eq.${encodeURIComponent(topic)}`);
    if (region) filters.push(`region=eq.${encodeURIComponent(region)}`);

    // Rotate through the complete RALLIVIO discovery pool so repeated publisher
    // requests do not keep showing the same first page.
    const slot = Math.floor(Date.now() / 300000);
    const offset = (slot * limit) % 1000000;
    filters.push(`offset=${offset}`, `limit=${limit}`);

    const response = await sb(`youtube_discovery_pool?${filters.join("&")}`, {
      headers: { Prefer: "count=exact" }
    });
    if (!response.ok) {
      console.error("distribution feed query failed", response.status, await response.text());
      return NextResponse.json({ ok:true, items:[], total:0, state:"EMPTY" }, { headers: { "Access-Control-Allow-Origin":"*" } });
    }

    const rows = await response.json() as Array<Record<string, unknown>>;
    const range = response.headers.get("content-range") || "";
    const total = Number((range.split("/")[1] || "0")) || 0;

    const items = rows.map(row => ({
      id: row.id,
      title: row.title || "RALLIVIO discovery",
      channel: row.channel_title || "Unknown creator",
      channelId: row.channel_id || null,
      thumbnail: row.thumbnail || "",
      url: `/r/${encodeURIComponent(String(row.id))}?src=${encodeURIComponent(sourceHost)}`,
      topic: row.topic || "All",
      region: row.region || "WORLDWIDE",
      source: row.source || "youtube",
      tier: row.tier || null,
      relevance: Number(row.relevance_score || 0),
      views: Number(row.views || 0),
      lastMovementAt: row.last_movement_at || null
    }));

    return NextResponse.json({
      ok:true,
      mode:"all_discovered_content",
      total,
      rotated:true,
      refreshSeconds:300,
      items
    }, {
      headers: {
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("distribution feed failed", error);
    return NextResponse.json({ ok:true, items:[], total:0, state:"EMPTY" }, {
      headers: { "Access-Control-Allow-Origin":"*" }
    });
  }
}