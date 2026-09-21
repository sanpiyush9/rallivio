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
    const now = new Date().toISOString();

    const rate = await sb("rpc/consume_embed_request", {
      method: "POST",
      body: JSON.stringify({ p_source_host: sourceHost })
    });
    if (!rate.ok) {
      return NextResponse.json({ ok:false, items:[], state:"RATE_LIMITED" }, { status:429 });
    }

    // CRITICAL: the external distribution network is campaign-only.
    // RALLIVIO's discovery pool is never used as an automatic distribution source.
    const campaignQuery = [
      "select=id,source_url,source_host,content_type,title,status,distribution_mode,trial_ends_at,created_at,youtube_video_id,youtube_channel_id",
      "status=eq.active",
      "distribution_mode=eq.rallivio_owned",
      `trial_ends_at=gt.${encodeURIComponent(now)}`,
      "order=created_at.desc",
      `limit=${Math.max(limit, 20)}`
    ];

    const campaignResponse = await sb(`promotion_campaigns?${campaignQuery.join("&")}`);
    if (!campaignResponse.ok) {
      console.error("promotion distribution query failed", campaignResponse.status, await campaignResponse.text());
      return NextResponse.json({ ok:true, items:[], total:0, state:"EMPTY" }, {
        headers: { "Access-Control-Allow-Origin":"*" }
      });
    }

    const campaigns = await campaignResponse.json() as Array<Record<string, unknown>>;
    const youtubeIds = campaigns
      .map(c => typeof c.youtube_video_id === "string" ? c.youtube_video_id : "")
      .filter(Boolean);

    let poolRows: Array<Record<string, unknown>> = [];
    if (youtubeIds.length) {
      const uniqueIds = [...new Set(youtubeIds)].slice(0, 50);
      const poolPath = [
        "youtube_discovery_pool",
        `select=id,title,channel_title,channel_id,thumbnail,topic,region,tier,relevance_score,views,last_movement_at`,
        `id=in.(${uniqueIds.map(encodeURIComponent).join(",")})`
      ];
      if (topic) poolPath.push(`topic=eq.${encodeURIComponent(topic)}`);
      if (region) poolPath.push(`region=eq.${encodeURIComponent(region)}`);
      const poolResponse = await sb(poolPath.join("?"));
      if (poolResponse.ok) poolRows = await poolResponse.json();
    }

    const poolById = new Map(poolRows.map(row => [String(row.id), row]));
    const eligible = campaigns.filter(c => {
      if (!topic && !region) return true;
      if (!c.youtube_video_id) return false;
      const row = poolById.get(String(c.youtube_video_id));
      if (!row) return false;
      return (!topic || String(row.topic || "") === topic) &&
             (!region || String(row.region || "") === region);
    });

    const items = eligible.slice(0, limit).map(campaign => {
      const videoId = typeof campaign.youtube_video_id === "string" ? campaign.youtube_video_id : "";
      const row = videoId ? poolById.get(videoId) : undefined;
      return {
        id: String(campaign.id),
        campaignId: String(campaign.id),
        title: String(campaign.title || row?.title || "RALLIVIO promoted content"),
        channel: String(row?.channel_title || campaign.source_host || "Promoted source"),
        channelId: row?.channel_id || campaign.youtube_channel_id || null,
        thumbnail: String(row?.thumbnail || ""),
        contentType: String(campaign.content_type || "link"),
        sourceUrl: String(campaign.source_url),
        url: `/go/${encodeURIComponent(String(campaign.id))}?src=${encodeURIComponent(sourceHost)}`,
        topic: String(row?.topic || "Promoted"),
        region: String(row?.region || "GLOBAL"),
        source: videoId ? "youtube" : "campaign",
        tier: String(row?.tier || "PROMOTED"),
        relevance: Number(row?.relevance_score || 0),
        views: Number(row?.views || 0),
        lastMovementAt: row?.last_movement_at || null
      };
    });

    return NextResponse.json({
      ok:true,
      mode:"promoted_campaigns_only",
      total: campaigns.length,
      eligible: eligible.length,
      discovery_pool_included: false,
      refreshSeconds:300,
      items
    }, {
      headers: {
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("promotion distribution feed failed", error);
    return NextResponse.json({ ok:true, items:[], total:0, state:"EMPTY" }, {
      headers: { "Access-Control-Allow-Origin":"*" }
    });
  }
}