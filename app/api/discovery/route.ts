import { NextResponse } from "next/server";

type PoolRow = {
  id: string; title: string; channel_title: string; channel_id: string; published_at: string; thumbnail: string;
  description: string; views: number; likes: number; comments: number; duration: string | null; url: string;
  embeddable: boolean; live_broadcast_content: string | null; topic: string; format: string; region: string;
  metadata: Record<string, unknown> | null; acquired_at: string; stats_refreshed_at: string | null;
};
type TimeframeRow = {
  video_id: string; channel_id: string; topic: string | null; region: string | null; format: string | null;
  signal_type: string; signal_labels: unknown; momentum_score: number | null; evidence: Record<string, unknown> | null; observed_at: string;
};
type PromotionRow = { id: string; title: string | null; source_url: string; youtube_video_id: string; trial_ends_at: string | null };

export const dynamic = "force-dynamic";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server configuration is missing");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
}
function parseLimit(request: Request) { const n = Number(new URL(request.url).searchParams.get("limit") ?? "60"); return Number.isFinite(n) ? Math.min(100, Math.max(20, Math.floor(n))) : 60; }
function parseCursor(request: Request) { const n = Number(new URL(request.url).searchParams.get("cursor") ?? "0"); return Number.isInteger(n) && n >= 0 ? n : 0; }
function parseTimeframe(request: Request) {
  const value = new URL(request.url).searchParams.get("timeframe") || "15m";
  const windows: Record<string, number> = { "15m": 15 * 60 * 1000, "1h": 60 * 60 * 1000, "1d": 24 * 60 * 60 * 1000, "1w": 7 * 24 * 60 * 60 * 1000, "1m": 30 * 24 * 60 * 60 * 1000 };
  const id = windows[value] ? value : "15m";
  return { id, since: new Date(Date.now() - windows[id]).toISOString(), windowMs: windows[id] };
}
function labels(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []; }
function num(value: unknown, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function sourceFamily(metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.source_family ?? metadata?.sourceFamily;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "YouTube";
}
function sourceType(format: string | null | undefined, metadata: Record<string, unknown> | null | undefined) {
  const raw = metadata?.source_type ?? metadata?.sourceType;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  const f = String(format ?? "video").toLowerCase();
  if (f.includes("article") || f.includes("news") || f.includes("blog")) return "article";
  if (f.includes("post") || f.includes("tweet") || f.includes("social")) return "post";
  if (f.includes("reel") || f.includes("short")) return "short-video";
  if (f.includes("live")) return "live";
  return "video";
}

async function getPromotedItems() {
  const now = new Date().toISOString();
  const campaignsResponse = await supabase(`promotion_campaigns?select=id,title,source_url,youtube_video_id,trial_ends_at&status=eq.active&youtube_video_id=not.is.null&trial_ends_at=gte.${encodeURIComponent(now)}&order=created_at.desc&limit=8`);
  if (!campaignsResponse.ok) return [];
  const campaigns = await campaignsResponse.json() as PromotionRow[];
  if (!campaigns.length) return [];
  const ids = campaigns.map(c => c.youtube_video_id).filter(Boolean);
  const poolResponse = await supabase(`youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at&id=in.(${ids.join(",")})`);
  if (!poolResponse.ok) return [];
  const pool = await poolResponse.json() as PoolRow[];
  const byId = new Map(pool.map(x => [x.id, x]));
  return campaigns.map(c => { const item = byId.get(c.youtube_video_id); if (!item) return null; return { ...item, metadata: { ...(item.metadata ?? {}), promoted: true, promotion_campaign_id: c.id, promotion_label: "RALLIVIO Campaign", promotion_title: c.title || item.title, source_family: sourceFamily(item.metadata), source_type: sourceType(item.format, item.metadata) } }; }).filter(Boolean);
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ ok: false, state: "CONFIGURATION_REQUIRED" }, { status: 503 });
  try {
    const url = new URL(request.url);
    const limit = parseLimit(request); const cursor = parseCursor(request); const timeframe = parseTimeframe(request);
    const signal = url.searchParams.get("signal")?.trim().slice(0, 40) || null;
    const topic = url.searchParams.get("topic")?.trim().slice(0, 80) || null;
    const source = url.searchParams.get("source")?.trim().slice(0, 40) || null;

    const feedResponse = await supabase("rpc/get_discovery_timeframe_feed", { method: "POST", body: JSON.stringify({ p_since: timeframe.since, p_limit: Math.min(1000, Math.max(100, limit * 8)), p_offset: cursor, p_signal: signal, p_topic: topic && topic !== "Trending" ? topic : null }) });
    if (!feedResponse.ok) return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
    const feedRows = await feedResponse.json() as TimeframeRow[];

    const metricsResponse = await supabase("rpc/get_discovery_timeframe_metrics", { method: "POST", body: JSON.stringify({ p_since: timeframe.since }) });
    const metrics = metricsResponse.ok ? await metricsResponse.json() as { verifiedSignals?: number; activeVideos?: number; trackedCreators?: number; risingCreators?: number; activeTopics?: number } : {};
    const countsResponse = await supabase("rpc/get_discovery_timeframe_signal_counts", { method: "POST", body: JSON.stringify({ p_since: timeframe.since }) });
    const signalCounts = countsResponse.ok ? await countsResponse.json() as Record<string, number> : {};
    const overviewResponse = await supabase("rpc/get_discovery_timeframe_overview", { method: "POST", body: JSON.stringify({ p_since: timeframe.since }) });
    const overview = overviewResponse.ok ? await overviewResponse.json() as { topicCounts?: Record<string, number>; regions?: string[]; refreshedAt?: string | null } : {};

    const coverageResponse = await supabase(`discovery_signal_observations?select=observed_at&observed_at=gte.${encodeURIComponent(timeframe.since)}&order=observed_at.asc&limit=1`);
    const coverageRows = coverageResponse.ok ? await coverageResponse.json() as { observed_at: string }[] : [];
    const coverageStart = coverageRows[0]?.observed_at ?? null;
    const coverageEnd = overview.refreshedAt ?? feedRows[0]?.observed_at ?? null;
    const coverageHours = coverageStart && coverageEnd ? Math.max(0, (Date.parse(coverageEnd) - Date.parse(coverageStart)) / 36e5) : 0;
    const requestedHours = timeframe.windowMs / 36e5;

    const promotedItems = await getPromotedItems();
    const ids = feedRows.map(x => x.video_id);
    let poolRows: PoolRow[] = [];
    if (ids.length) {
      const poolResponse = await supabase(`youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at&id=in.(${ids.join(",")})`);
      if (!poolResponse.ok) return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
      poolRows = await poolResponse.json() as PoolRow[];
    }
    const byId = new Map(poolRows.map(x => [x.id, x]));
    const items = feedRows.map(row => {
      const pool = byId.get(row.video_id); if (!pool) return null;
      const family = sourceFamily(pool.metadata);
      const type = sourceType(row.format ?? pool.format, pool.metadata);
      if (source && family.toLowerCase() !== source.toLowerCase()) return null;
      const evidence = row.evidence ?? {};
      const metadata = { ...(pool.metadata ?? {}), signal: row.signal_type, signals: labels(row.signal_labels), momentum_score: row.momentum_score, signal_evidence: evidence, source_family: family, source_type: type };
      const views = num(pool.views); const likes = num(pool.likes); const comments = num(pool.comments);
      return { id: pool.id, title: pool.title, channel_title: pool.channel_title, published_at: pool.published_at, observed_at: row.observed_at, thumbnail: pool.thumbnail, description: pool.description ?? "", views, likes, comments, engagement: views > 0 ? ((likes + comments) / views) * 100 : 0, velocity: num(evidence.velocity), live: pool.live_broadcast_content === "live", url: pool.url, embeddable: Boolean(pool.embeddable), topic: pool.topic, format: row.format ?? pool.format, region: row.region ?? pool.region, source_family: family, source_type: type, metadata, stats_refreshed_at: pool.stats_refreshed_at ?? undefined };
    }).filter(Boolean);

    const usageResponse = await supabase("api_usage?select=created_at,endpoint&order=created_at.desc&limit=1");
    const usageRows = usageResponse.ok ? await usageResponse.json() as { created_at: string; endpoint: string }[] : [];
    const topicNames = Object.entries(overview.topicCounts ?? {}).filter(([, count]) => num(count) > 0).sort((a, b) => num(b[1]) - num(a[1])).map(([name]) => name);
    const momentumResponse = topicNames.length ? await supabase("rpc/get_topic_momentum_windows", { method: "POST", body: JSON.stringify({ p_topics: topicNames, p_windows: 12 }) }) : null;
    const momentumRows = momentumResponse?.ok ? await momentumResponse.json() as Array<{ topic: string; window_start: string; momentum: number; video_count: number }> : [];
    const topicMomentumWindows: Record<string, number[]> = {}; const topicTrendMeta: Record<string, { firstWindow: string | null; latestWindow: string | null; windows: number; firstVideos: number; latestVideos: number; minVideos: number; maxVideos: number }> = {};
    for (const name of topicNames) { const rows = momentumRows.filter(r => r.topic === name).sort((a, b) => Date.parse(a.window_start) - Date.parse(b.window_start)).slice(-12); const counts = rows.map(r => num(r.video_count)); topicMomentumWindows[name] = rows.map(r => num(r.momentum)); topicTrendMeta[name] = { firstWindow: rows[0]?.window_start ?? null, latestWindow: rows.at(-1)?.window_start ?? null, windows: rows.length, firstVideos: counts[0] ?? 0, latestVideos: counts.at(-1) ?? 0, minVideos: counts.length ? Math.min(...counts) : 0, maxVideos: counts.length ? Math.max(...counts) : 0 }; }
    const requestedSize = Math.min(1000, Math.max(100, limit * 8));
    const nextCursor = feedRows.length >= requestedSize ? cursor + feedRows.length : null;
    const sourceFamilies = Array.from(new Set((items as Array<{ source_family?: string }>).map(x => x.source_family).filter(Boolean) as string[]));
    return NextResponse.json({ ok: true, source: "RALLIVIO_DISCOVERY_OBSERVATIONS", timeframe: timeframe.id, refreshedAt: overview.refreshedAt ?? feedRows[0]?.observed_at ?? null, apiUsageLatestAt: usageRows[0]?.created_at ?? null, apiUsageLatestEndpoint: usageRows[0]?.endpoint ?? null, poolCount: num(metrics.activeVideos), verifiedSignalCount: num(metrics.verifiedSignals), trackedCreators: num(metrics.trackedCreators), risingCreators: num(metrics.risingCreators), activeTopics: num(metrics.activeTopics), regions: Array.isArray(overview.regions) ? overview.regions : [], signalCounts, topicCounts: overview.topicCounts ?? {}, coverage: { requestedHours, observedHours: Number(coverageHours.toFixed(2)), start: coverageStart, end: coverageEnd, complete: coverageHours >= requestedHours * 0.98 }, sourceFamilies: sourceFamilies.length ? sourceFamilies : ["YouTube"], promotedItems, items, nextCursor, sourceFilter: source ?? null }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
  } catch (error) { return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE", message: error instanceof Error ? error.message : "Unknown error" }, { status: 503 }); }
}
