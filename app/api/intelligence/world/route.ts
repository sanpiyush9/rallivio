import { NextResponse } from "next/server";
import { collectOpenWebSignals } from "@/lib/server/world-sensors";
import type { DiscoverySourceItem } from "@/lib/server/source-adapters";
import { buildWorldEvents } from "@/lib/server/world-intelligence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path: string) {
  if (!url || !key) throw new Error("Supabase server configuration is missing");
  return fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
}

function youtubeItem(row: Record<string, unknown>): DiscoverySourceItem {
  const metadata = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const format = String(row.format ?? "video");
  const title = String(row.title ?? "Untitled");
  return {
    source: "youtube",
    sourceKind: format.toLowerCase().includes("short") ? "video" : format.toLowerCase().includes("live") ? "video" : "video",
    externalId: String(row.id), title, description: String(row.description ?? ""),
    creatorId: row.channel_id ? String(row.channel_id) : null, creatorName: row.channel_title ? String(row.channel_title) : null,
    publishedAt: row.published_at ? String(row.published_at) : null, observedAt: String(row.observed_at ?? row.stats_refreshed_at ?? row.updated_at ?? new Date().toISOString()),
    url: String(row.url ?? `https://www.youtube.com/watch?v=${row.id}`), thumbnailUrl: row.thumbnail ? String(row.thumbnail) : null,
    topic: row.topic ? String(row.topic) : null, region: row.region ? String(row.region) : "GLOBAL", language: row.language ? String(row.language) : null,
    entityKeys: Array.isArray(metadata.entity_keys) ? metadata.entity_keys.filter((x): x is string => typeof x === "string") : [],
    metrics: { views: Number(row.views ?? 0), likes: Number(row.likes ?? 0), comments: Number(row.comments ?? 0), raw: { momentum: Number(row.momentum_score ?? metadata.momentum_score ?? 0) } },
    raw: { signal_type: row.signal_type ?? null, evidence: row.evidence ?? null, metadata },
  };
}

export async function GET(request: Request) {
  if (!url || !key) return NextResponse.json({ ok: false, state: "CONFIGURATION_REQUIRED" }, { status: 503 });
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(24, Math.max(6, Number(searchParams.get("limit") ?? 12)));
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const observationsResponse = await supabase(`discovery_signal_observations?select=video_id,channel_id,topic,region,format,signal_type,signal_labels,momentum_score,evidence,observed_at&observed_at=gte.${encodeURIComponent(since)}&order=observed_at.desc&limit=80`);
    if (!observationsResponse.ok) throw new Error(`Observation store HTTP ${observationsResponse.status}`);
    const observations = await observationsResponse.json() as Array<Record<string, unknown>>;
    const ids = [...new Set(observations.map((x) => String(x.video_id)).filter(Boolean))].slice(0, 80);
    const poolResponse = ids.length ? await supabase(`youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,url,topic,format,region,language,metadata,updated_at,stats_refreshed_at&id=in.(${ids.map(encodeURIComponent).join(",")})`) : null;
    const poolRows = poolResponse?.ok ? await poolResponse.json() as Array<Record<string, unknown>> : [];
    const pool = new Map(poolRows.map((row) => [String(row.id), row]));
    const youtube = observations.map((observation) => ({ ...pool.get(String(observation.video_id)), ...observation })).filter((x) => x.id).map(youtubeItem);
    const openWebResults = await collectOpenWebSignals(12);
    const openWeb = openWebResults.filter((x): x is DiscoverySourceItem => !("error" in x));
    const errors = openWebResults.filter((x): x is { source: string; error: string } => "error" in x);
    const all = [...youtube, ...openWeb];
    const events = buildWorldEvents(all, limit);
    const sources = [...new Set(all.map((x) => x.source))];
    const sourceStatus = [
      { id: "youtube", label: "YouTube", connected: true, kind: "video" },
      { id: "wikipedia", label: "Wikipedia", connected: openWeb.some((x) => x.source === "wikipedia"), kind: "open-web" },
      { id: "hackernews", label: "Hacker News", connected: openWeb.some((x) => x.source === "hackernews"), kind: "open-web" },
      { id: "instagram", label: "Instagram", connected: Boolean(process.env.INSTAGRAM_ACCESS_TOKEN), kind: "social" },
      { id: "x", label: "X", connected: Boolean(process.env.X_API_BEARER_TOKEN), kind: "social" },
      { id: "tiktok", label: "TikTok", connected: Boolean(process.env.TIKTOK_ACCESS_TOKEN), kind: "social" },
      { id: "reddit", label: "Reddit", connected: Boolean(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET), kind: "social" },
      { id: "rss", label: "Authorized RSS", connected: true, kind: "feed" },
      { id: "markets", label: "Markets", connected: false, kind: "market" },
    ];
    return NextResponse.json({ ok: true, observedAt: new Date().toISOString(), signalCount: all.length, eventCount: events.length, sourceCount: sources.length, sources, sourceStatus, events, errors, architecture: ["sources", "normalized observations", "event correlation", "trend intelligence", "campaign network", "authorized distribution"] }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch (error) {
    return NextResponse.json({ ok: false, state: "WORLD_INTELLIGENCE_UNAVAILABLE", message: error instanceof Error ? error.message : "Unknown error" }, { status: 503 });
  }
}
