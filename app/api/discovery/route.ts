import { NextResponse } from "next/server";

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
  category_id: string | null; signal_type: string; momentum_score: number | null;
  observed_at: string; expires_at: string | null; global_rank: number;
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

function applyRankingFilters(params: URLSearchParams, request: Request) {
  const search = new URL(request.url).searchParams;
  const region = search.get("region")?.trim().slice(0, 32);
  const topic = search.get("topic")?.trim().slice(0, 80);
  const signal = search.get("signal")?.trim().slice(0, 40);
  if (region) params.set("region", `eq.${region}`);
  if (topic) params.set("topic", `eq.${topic}`);
  if (signal) params.set("signal_type", `eq.${signal}`);
  return params;
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, state: "CONFIGURATION_REQUIRED" }, { status: 503 });
  }

  try {
    const limit = parseLimit(request);
    const cursor = parseCursor(request);

    const feedParams = applyRankingFilters(
      new URLSearchParams({
        select: "video_id,channel_id,region,topic,category_id,signal_type,momentum_score,observed_at,expires_at,global_rank",
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
    const rankings = (await feedResponse.json()) as RankingRow[];

    // Exact count is a separate HEAD request: zero signal rows are transferred.
    const countParams = applyRankingFilters(new URLSearchParams({ select: "video_id" }), request);
    const countResponse = await supabase(`feed_rankings?${countParams}`, {
      method: "HEAD",
      headers: { Prefer: "count=exact", Range: "0-0" },
    });
    const verifiedSignalCount = Number(
      countResponse.headers.get("content-range")?.split("/")[1] ?? rankings.length,
    );

    const poolCountResponse = await supabase("youtube_discovery_pool?select=id", {
      method: "HEAD",
      headers: { Prefer: "count=exact", Range: "0-0" },
    });
    const poolCount = Number(poolCountResponse.headers.get("content-range")?.split("/")[1] ?? 0);

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
          poolCount, verifiedSignalCount, items: [],
        },
        { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
      );
    }

    const ids = rankings.map((item) => item.video_id);
    const poolPath =
      "youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at&id=in.(" +
      ids.join(",") +
      ")";
    const poolResponse = await supabase(poolPath);
    if (!poolResponse.ok) {
      return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
    }

    const poolItems = (await poolResponse.json()) as DiscoveryRow[];
    const poolById = new Map(poolItems.map((item) => [item.id, item]));

    const enriched = rankings
      .map((ranking) => {
        const item = poolById.get(ranking.video_id);
        if (!item) return null;
        const metadata = { ...item.metadata };
        delete metadata.signal;
        delete metadata.momentum_score;
        metadata.signal = ranking.signal_type;
        metadata.momentum_score = ranking.momentum_score ?? 0;
        return { ...item, metadata };
      })
      .filter((item): item is DiscoveryRow & { metadata: Record<string, unknown> } => Boolean(item));

    const refreshedAt =
      enriched.map((item) => item.stats_refreshed_at)
        .filter((value): value is string => Boolean(value))
        .sort().at(-1) ?? null;

    return NextResponse.json(
      {
        ok: true, source: "RALLIVIO_DISCOVERY_POOL", refreshedAt,
        apiUsageLatestAt: usageRows[0]?.created_at ?? null,
        apiUsageLatestEndpoint: usageRows[0]?.endpoint ?? null,
        poolCount, verifiedSignalCount, items: enriched,
        nextCursor: rankings.length === limit ? rankings[rankings.length - 1]?.global_rank ?? null : null,
      },
      { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("discovery read failed", error);
    return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
  }
}
