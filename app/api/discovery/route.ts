import { NextResponse } from "next/server";
import { hasValidSignalObservation } from "@/lib/server/discovery-truth";

type DiscoveryRow = {
  id: string; title: string; channel_title: string; channel_id: string;
  published_at: string; thumbnail: string; description: string; views: number;
  likes: number; comments: number; duration: string | null; url: string;
  embeddable: boolean; live_broadcast_content: string | null; topic: string;
  format: string; region: string; metadata: Record<string, unknown>;
  acquired_at: string; stats_refreshed_at: string | null;
};

type RankingRow = {
  video_id: string; channel_id: string; region: string | null; topic: string | null;
  category_id: string | null; format: string | null; signal_type: string; signal_labels: string[]; momentum_score: number | null;
  observed_at: string; expires_at: string | null; global_rank: number;
};

type PromotionRow = {
  id: string;
  title: string | null;
  source_url: string;
  youtube_video_id: string;
  trial_ends_at: string | null;
};

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabase(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server configuration is missing");
  }
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

function parseLimit(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? "60");
  return Number.isFinite(requested)
    ? Math.min(100, Math.max(20, Math.floor(requested)))
    : 60;
}

function parseCursor(request: Request) {
  const raw = new URL(request.url).searchParams.get("cursor");
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function parseTimeframe(request: Request) {
  const value = new URL(request.url).searchParams.get("timeframe") || "15m";
  const windows: Record<string, number> = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
  };
  const ms = windows[value] ?? windows["15m"];
  return { id: windows[value] ? value : "15m", since: new Date(Date.now() - ms).toISOString() };
}

function applyRankingFilters(params: URLSearchParams, request: Request) {
  const search = new URL(request.url).searchParams;
  const region = search.get("region")?.trim().slice(0, 32);
  const topic = search.get("topic")?.trim().slice(0, 80);
  const signal = search.get("signal")?.trim().slice(0, 40);
  if (region) params.set("region", `eq.${region}`);
  if (topic) params.set("topic", `eq.${topic}`);
  if (signal) params.set("signal_labels", `cs.${JSON.stringify([signal])}`);
  return params;
}

async function getPromotedItems() {
  const now = new Date().toISOString();
  const campaignResponse = await supabase(
    `promotion_campaigns?select=id,title,source_url,youtube_video_id,trial_ends_at&status=eq.active&youtube_video_id=not.is.null&trial_ends_at=gte.${encodeURIComponent(now)}&order=created_at.desc&limit=8`,
  );
  if (!campaignResponse.ok) return [];

  const campaigns = (await campaignResponse.json()) as PromotionRow[];
  if (!campaigns.length) return [];

  const ids = campaigns.map(c => c.youtube_video_id).filter(Boolean);
  const poolResponse = await supabase(
    "youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at,language&id=in.(" + ids.join(",") + ")",
  );
  if (!poolResponse.ok) return [];

  const pool = (await poolResponse.json()) as DiscoveryRow[];
  const byId = new Map(pool.map(item => [item.id, item]));

  return campaigns.map(campaign => {
    const item = byId.get(campaign.youtube_video_id);
    if (!item) return null;
    return {
      ...item,
      metadata: {
        ...item.metadata,
        promoted: true,
        promotion_campaign_id: campaign.id,
        promotion_label: "RALLIVIO Campaign",
        promotion_title: campaign.title || item.title,
      },
    };
  }).filter(Boolean) as Array<DiscoveryRow & { metadata: Record<string, unknown> }>;
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, state: "CONFIGURATION_REQUIRED" }, { status: 503 });
  }

  try {
    const limit = parseLimit(request);
    const cursor = parseCursor(request);
    const timeframe = parseTimeframe(request);
    const promotedItems = await getPromotedItems();

    let rankings: RankingRow[];
    if (timeframe.id === "15m" || timeframe.id === "1h" || timeframe.id === "1d" || timeframe.id === "1w" || timeframe.id === "1m") {
      // Timeframe feeds read the observation history directly. The database does
      // the window filter and ordering, so even a million-row history never
      // reaches the browser; only the top slice needed by the UI is returned.
      const search = new URL(request.url).searchParams;
      const signal = search.get("signal")?.trim().slice(0, 40);
      const signalParams = new URLSearchParams({
        select: "video_id,channel_id,signal_type,signal_labels,momentum_score,observed_at,expires_at",
        observed_at: `gte.${timeframe.since}`,
        order: "momentum_score.desc.nullslast,observed_at.desc",
        limit: String(Math.min(1000, Math.max(250, limit * 8))),
      });
      if (signal) signalParams.set("signal_type", `eq.${signal}`);
      if (cursor !== null) signalParams.set("offset", String(cursor));
      const signalResponse = await supabase(`discovery_signals?${signalParams}`);
      if (!signalResponse.ok) {
        return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
      }
      const rows = await signalResponse.json() as Array<{
        video_id: string; channel_id: string; signal_type: string; signal_labels: string[];
        momentum_score: number | null; observed_at: string; expires_at: string | null;
      }>;
      const seen = new Set<string>();
      rankings = rows
        .filter(row => {
          if (seen.has(row.video_id)) return false;
          seen.add(row.video_id);
          return true;
        })
        .slice(0, limit)
        .map((row, index) => ({
          ...row,
          region: null,
          topic: null,
          category_id: null,
          format: null,
          global_rank: (cursor ?? 0) + index + 1,
        }));
    } else {
      const feedParams = applyRankingFilters(
        new URLSearchParams({
          select: "video_id,channel_id,region,topic,category_id,format,signal_type,signal_labels,momentum_score,observed_at,expires_at,global_rank",
          order: "global_rank.asc",
          limit: String(limit),
        }),
        request,
      );
      if (cursor !== null) feedParams.set("global_rank", `gt.${cursor}`);
      const feedResponse = await supabase(`feed_rankings?${feedParams}`);
      if (!feedResponse.ok) {
        return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
      }
      rankings = (await feedResponse.json()) as RankingRow[];
    }

    const overviewResponse = await supabase("rpc/get_discovery_overview", {
      method: "POST",
      body: "{}",
    });
    if (!overviewResponse.ok) {
      throw new Error(`Discovery overview failed: ${overviewResponse.status} ${await overviewResponse.text()}`);
    }
    const overview = await overviewResponse.json() as {
      poolCount?: number;
      trackedCreators?: number;
      verifiedSignals?: number;
      risingCreators?: number;
      activeTopics?: number;
      regions?: string[];
      signalCounts?: Record<string, number>;
      topicCounts?: Record<string, number>;
    };

    const verifiedSignalCount = Number(overview.verifiedSignals ?? 0);
    let signalCounts = overview.signalCounts ?? {};
    const poolCount = Number(overview.poolCount ?? 0);

    // Counts are computed in Postgres for the selected observation window.
    // They are never derived from the 100-card UI slice.
    const timeframeCountsResponse = await supabase("rpc/get_discovery_timeframe_signal_counts", {
      method: "POST",
      body: JSON.stringify({ p_since: timeframe.since }),
    });
    if (timeframeCountsResponse.ok) {
      const counts = await timeframeCountsResponse.json() as Record<string, number>;
      signalCounts = counts;
    }

    const topTopicNames = Object.entries(overview.topicCounts ?? {})
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([topic]) => topic);
    const momentumResponse = topTopicNames.length
      ? await supabase("rpc/get_topic_momentum_windows", {
          method: "POST",
          body: JSON.stringify({ p_topics: topTopicNames, p_windows: 12 }),
        })
      : null;
    const topicMomentumRows = momentumResponse?.ok
      ? (await momentumResponse.json()) as Array<{ topic: string; window_start: string; momentum: number; video_count: number }>
      : [];
    const topicMomentumWindows = topTopicNames.reduce<Record<string, number[]>>((acc, topic) => {
      acc[topic] = topicMomentumRows
        .filter(row => row.topic === topic)
        .sort((a, b) => Date.parse(a.window_start) - Date.parse(b.window_start))
        .slice(-12)
        .map(row => Number(row.momentum) || 0);
      return acc;
    }, {});
    const topicTrendMeta = topTopicNames.reduce<Record<string, {
      firstWindow: string | null;
      latestWindow: string | null;
      windows: number;
      firstVideos: number;
      latestVideos: number;
      minVideos: number;
      maxVideos: number;
    }>>((acc, topic) => {
      const rows = topicMomentumRows
        .filter(row => row.topic === topic)
        .sort((a, b) => Date.parse(a.window_start) - Date.parse(b.window_start))
        .slice(-12);
      const counts = rows.map(row => Number(row.video_count) || 0);
      acc[topic] = {
        firstWindow: rows[0]?.window_start ?? null,
        latestWindow: rows.at(-1)?.window_start ?? null,
        windows: rows.length,
        firstVideos: counts[0] ?? 0,
        latestVideos: counts.at(-1) ?? 0,
        minVideos: counts.length ? Math.min(...counts) : 0,
        maxVideos: counts.length ? Math.max(...counts) : 0,
      };
      return acc;
    }, {});

    const usageResponse = await supabase(
      "api_usage?select=created_at,endpoint&order=created_at.desc&limit=1",
    );
    const usageRows = usageResponse.ok
      ? ((await usageResponse.json()) as { created_at: string; endpoint: string }[])
      : [];

    if (!rankings.length) {
      return NextResponse.json(
        {
          ok: true, source: "RALLIVIO_DISCOVERY_POOL", refreshedAt: null,
          apiUsageLatestAt: usageRows[0]?.created_at ?? null,
          apiUsageLatestEndpoint: usageRows[0]?.endpoint ?? null,
          poolCount: Number(overview.poolCount ?? poolCount),
          verifiedSignalCount: Number(overview.verifiedSignals ?? verifiedSignalCount),
          trackedCreators: Number(overview.trackedCreators ?? 0),
          risingCreators: Number(overview.risingCreators ?? 0),
          activeTopics: Number(overview.activeTopics ?? 0),
          regions: Array.isArray(overview.regions) ? overview.regions : [],
          signalCounts: overview.signalCounts ?? signalCounts,
          topicCounts: overview.topicCounts ?? {},
          topicMomentumWindows: {},
          topicTrendMeta: {},
          promotedItems,
          items: [],
        },
        { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
      );
    }

    const ids = rankings.map((item) => item.video_id);
    const poolPath =
      "youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at,language&id=in.(" +
      ids.join(",") +
      ")";
    const poolResponse = await supabase(poolPath);
    if (!poolResponse.ok) {
      return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
    }

    const poolItems = (await poolResponse.json()) as DiscoveryRow[];
    const poolById = new Map(poolItems.map((item) => [item.id, item]));

    // Signal evidence is persisted by the authoritative signal engine. Fetch it
    // separately so the UI can display real velocity/audience-relative evidence
    // without manufacturing presentation numbers.
    const signalEvidenceResponse = await supabase(
      "discovery_signals?select=video_id,observed_at,signal_type,evidence&video_id=in.(" + ids.join(",") + ")&order=observed_at.desc&limit=1000",
    );
    const signalEvidenceRows = signalEvidenceResponse.ok
      ? (await signalEvidenceResponse.json()) as Array<{
          video_id: string;
          observed_at: string;
          signal_type: string;
          evidence: Record<string, unknown> | null;
        }>
      : [];
    const evidenceByVideo = new Map<string, {
      signal_type: string;
      observed_at: string;
      evidence: Record<string, unknown> | null;
    }>();
    for (const row of signalEvidenceRows) {
      if (!evidenceByVideo.has(row.video_id)) evidenceByVideo.set(row.video_id, row);
    }

    const enriched = rankings
      .map((ranking) => {
        const item = poolById.get(ranking.video_id);
        if (!item) return null;

        const signalFreshEnough = hasValidSignalObservation(
          item.stats_refreshed_at,
          ranking.observed_at,
        );

        const metadata = { ...item.metadata };
        delete metadata.signal;
        delete metadata.signals;
        delete metadata.momentum_score;

        const requestedSignal = new URL(request.url).searchParams.get("signal")?.trim() || null;
        const matchingSignals = signalFreshEnough ? ranking.signal_labels : [];
        metadata.primary_signal = signalFreshEnough ? ranking.signal_type : null;
        metadata.signal = signalFreshEnough
          ? (requestedSignal && matchingSignals.includes(requestedSignal) ? requestedSignal : ranking.signal_type)
          : null;
        metadata.signals = matchingSignals;
        const signalEvidence = signalFreshEnough ? evidenceByVideo.get(item.id) : undefined;
        metadata.momentum_score = signalFreshEnough ? ranking.momentum_score : null;
        metadata.signal_evidence = signalEvidence?.evidence ?? null;

        return { ...item, metadata };
      })
      .filter((item): item is DiscoveryRow & { metadata: Record<string, unknown> } => Boolean(item))
      .filter((item) => item.stats_refreshed_at !== null && item.metadata.signal !== null);

    const refreshedAt =
      enriched.map((item) => item.stats_refreshed_at)
        .filter((value): value is string => Boolean(value))
        .sort().at(-1) ?? null;

    return NextResponse.json(
      {
        ok: true, source: "RALLIVIO_DISCOVERY_POOL", refreshedAt,
        apiUsageLatestAt: usageRows[0]?.created_at ?? null,
        apiUsageLatestEndpoint: usageRows[0]?.endpoint ?? null,
        poolCount: Number(overview.poolCount ?? poolCount),
        verifiedSignalCount: Number(overview.verifiedSignals ?? verifiedSignalCount),
        trackedCreators: Number(overview.trackedCreators ?? 0),
        risingCreators: Number(overview.risingCreators ?? 0),
        activeTopics: Number(overview.activeTopics ?? 0),
        regions: Array.isArray(overview.regions) ? overview.regions : [],
        signalCounts: overview.signalCounts ?? signalCounts,
        topicCounts: overview.topicCounts ?? {},
        topicMomentumWindows,
        topicTrendMeta,
        promotedItems,
        items: enriched,
        nextCursor: rankings.length === limit ? rankings[rankings.length - 1]?.global_rank ?? null : null,
      },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("discovery read failed", error);
    return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
  }
}
