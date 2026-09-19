import { NextResponse } from "next/server";

type DiscoveryRow = {
  id: string;
  title: string;
  channel_title: string;
  channel_id: string;
  published_at: string;
  thumbnail: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  duration: string | null;
  url: string;
  embeddable: boolean;
  live_broadcast_content: string | null;
  topic: string;
  format: string;
  region: string;
  metadata: Record<string, unknown>;
  acquired_at: string;
  stats_refreshed_at: string | null;
};

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

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, state: "CONFIGURATION_REQUIRED" },
      { status: 503 },
    );
  }

  try {
    const params = new URLSearchParams({
      select:
        "id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at",
      order: "views.desc",
      limit: "500",
    });

    const response = await supabase(`youtube_discovery_pool?${params}`, {
      headers: { Prefer: "count=exact" },
    });
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, state: "DATA_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const items = (await response.json()) as DiscoveryRow[];
    const poolCount = Number(response.headers.get("content-range")?.split("/")[1] ?? items.length);

    const usageResponse = await supabase(
      "api_usage?select=created_at,endpoint&order=created_at.desc&limit=1",
    );
    const usageRows = usageResponse.ok
      ? ((await usageResponse.json()) as { created_at: string; endpoint: string }[])
      : [];

    const signalResponse = await supabase(
      "discovery_signals?select=video_id,signal_type,momentum_score&order=momentum_score.desc&limit=1000",
      { headers: { Prefer: "count=exact" } },
    );
    const signals = signalResponse.ok
      ? ((await signalResponse.json()) as {
          video_id: string;
          signal_type: string;
          momentum_score: number;
        }[])
      : [];

    const signalCount = Number(
      signalResponse.headers.get("content-range")?.split("/")[1] ?? signals.length,
    );
    const signalByVideo = new Map(signals.map((item) => [item.video_id, item]));

    const enriched = items.map((item) => {
      const signal = signalByVideo.get(item.id);
      const metadata = { ...item.metadata };
      // Acquisition metadata is not a verified signal. Only the signal
      // computation job is allowed to publish signal/momentum state.
      delete metadata.signal;
      delete metadata.momentum_score;

      if (signal) {
        metadata.signal = signal.signal_type;
        metadata.momentum_score = signal.momentum_score;
      }

      return { ...item, metadata };
    });

    const refreshedAt =
      enriched
        .map((item) => item.stats_refreshed_at)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

    return NextResponse.json(
      {
        ok: true,
        source: "RALLIVIO_DISCOVERY_POOL",
        refreshedAt,
        apiUsageLatestAt: usageRows[0]?.created_at ?? null,
        apiUsageLatestEndpoint: usageRows[0]?.endpoint ?? null,
        poolCount,
        verifiedSignalCount: signalCount,
        items: enriched,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("discovery read failed", error);
    return NextResponse.json(
      { ok: false, state: "DATA_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
