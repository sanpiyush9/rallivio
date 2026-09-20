import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["youtube_video","youtube_channel","website","article","product","brand","social","music","app","link"]);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY;

function normalizeUrl(value: string) {
  const url = new URL(value.trim());
  if (!["http:","https:"].includes(url.protocol)) throw new Error("Only http and https links can be promoted.");
  if (!url.hostname || url.hostname.length > 253) throw new Error("Enter a valid public content URL.");
  return url;
}

function classify(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.toLowerCase();
  if (host === "youtube.com" || host === "youtu.be") return path.includes("/channel/") || path.includes("/@") ? "youtube_channel" : "youtube_video";
  if (/instagram|tiktok|linkedin|facebook|x\.com|twitter/.test(host)) return "social";
  if (/spotify|soundcloud|music.apple/.test(host)) return "music";
  if (/product|shop|store/.test(path)) return "product";
  if (/blog|article|news/.test(path)) return "article";
  return "website";
}

function youtubeVideoId(url: URL) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
  if (host === "youtube.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "live") return parts[1] || null;
  }
  return null;
}

async function supabaseAdmin(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Server distribution configuration is missing.");
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

async function hydrateYouTubePromotion(videoId: string, campaignId: string) {
  if (!YOUTUBE_API_KEY) return { hydrated: false, reason: "YOUTUBE_API_KEY_MISSING" };

  const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
  endpoint.searchParams.set("part", "snippet,contentDetails,statistics,status");
  endpoint.searchParams.set("id", videoId);
  endpoint.searchParams.set("key", YOUTUBE_API_KEY);

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    console.error("promotion YouTube lookup failed", response.status, await response.text());
    return { hydrated: false, reason: "YOUTUBE_LOOKUP_FAILED" };
  }

  const payload = await response.json() as { items?: Array<{
    id: string;
    snippet?: { title?: string; description?: string; channelId?: string; channelTitle?: string; publishedAt?: string; categoryId?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } } };
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
    status?: { embeddable?: boolean; privacyStatus?: string; madeForKids?: boolean };
  }> };

  const item = payload.items?.[0];
  if (!item || item.status?.privacyStatus === "private") return { hydrated: false, reason: "VIDEO_NOT_PUBLIC" };

  const s = item.snippet ?? {};
  const stats = item.statistics ?? {};
  const views = Number(stats.viewCount ?? 0);
  const likes = Number(stats.likeCount ?? 0);
  const comments = Number(stats.commentCount ?? 0);
  const publishedAt = s.publishedAt || new Date().toISOString();
  const thumbnail = s.thumbnails?.high?.url || s.thumbnails?.medium?.url || s.thumbnails?.default?.url || "";
  const metadata = {
    promotion_campaign_id: campaignId,
    promotion_distribution: "rallivio_owned",
    promotion_status: "active",
    youtube_category_id: s.categoryId || null,
    made_for_kids: Boolean(item.status?.madeForKids),
  };

  const poolRow = {
    id: item.id,
    title: s.title || "Promoted video",
    channel_title: s.channelTitle || "YouTube creator",
    channel_id: s.channelId || "",
    published_at: publishedAt,
    thumbnail,
    description: s.description || "",
    views,
    likes,
    comments,
    duration: item.contentDetails?.duration || null,
    category_id: s.categoryId || null,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    embeddable: item.status?.embeddable !== false,
    live_broadcast_content: null,
    topic: "All",
    format: "all",
    region: "WORLDWIDE",
    source: "youtube",
    metadata,
    topic_tags: ["All"],
    acquired_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    promotion_reason: "active_campaign",
    tier: "hot",
    observation_priority: 1000,
    next_observation_at: new Date().toISOString(),
    signal_dirty_at: new Date().toISOString(),
  };

  const upsert = await supabaseAdmin("youtube_discovery_pool?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(poolRow),
  });
  if (!upsert.ok) {
    console.error("promotion pool upsert failed", upsert.status, await upsert.text());
    return { hydrated: false, reason: "POOL_UPSERT_FAILED" };
  }

  const snapshot = await supabaseAdmin("video_stats_snapshots?on_conflict=video_id,captured_at", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ video_id: item.id, views, likes, comments }),
  });
  if (!snapshot.ok) {
    console.error("promotion snapshot insert failed", snapshot.status, await snapshot.text());
  }

  await supabaseAdmin(`promotion_campaigns?id=eq.${encodeURIComponent(campaignId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ youtube_video_id: item.id, youtube_channel_id: s.channelId || null, last_distributed_at: new Date().toISOString() }),
  });

  return {
    hydrated: true,
    videoId: item.id,
    channelId: s.channelId || null,
    title: s.title || null,
    views,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, state: "AUTH_REQUIRED" }, { status: 401 });

    const body = await request.json() as { url?: string; type?: string; title?: string };
    if (!body.url) return NextResponse.json({ ok: false, state: "URL_REQUIRED" }, { status: 400 });

    let parsed: URL;
    try {
      parsed = normalizeUrl(body.url);
    } catch (error) {
      return NextResponse.json({ ok: false, state: error instanceof Error ? error.message : "INVALID_URL" }, { status: 400 });
    }

    const contentType = body.type && allowedTypes.has(body.type) ? body.type : classify(parsed);
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 180) : null;
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase.from("promotion_campaigns").insert({
      user_id: user.id,
      source_url: parsed.toString(),
      source_host: parsed.hostname,
      content_type: contentType,
      title: title || parsed.hostname,
      status: "active",
      distribution_mode: "rallivio_owned",
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      started_at: trialStartedAt.toISOString(),
    }).select("id,source_url,source_host,content_type,title,status,distribution_mode,trial_ends_at,started_at").single();

    if (error) {
      console.error("promotion campaign create failed", error);
      return NextResponse.json({ ok: false, state: "CAMPAIGN_CREATE_FAILED" }, { status: 500 });
    }

    const videoId = contentType === "youtube_video" ? youtubeVideoId(parsed) : null;
    const distribution = videoId ? await hydrateYouTubePromotion(videoId, data.id) : { hydrated: false, reason: "NON_YOUTUBE_VIDEO" };

    return NextResponse.json({
      ok: true,
      campaign: { ...data, youtube_video_id: distribution.hydrated ? distribution.videoId : null },
      distribution,
    });
  } catch (error) {
    console.error("promotion campaign request failed", error);
    return NextResponse.json({ ok: false, state: "CAMPAIGN_CREATE_FAILED" }, { status: 500 });
  }
}
