import { NextResponse } from "next/server";

type CatalogRow = {
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
  category_id: string | null;
  url: string;
  embeddable: boolean;
  live_broadcast_content: string | null;
  topic: string;
  format: string;
  region: string;
  source: string;
  verified_at: string;
  fetched_at: string;
  last_seen_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  topic_tags: string[];
  acquired_at: string | null;
  stats_refreshed_at: string | null;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(state: string, status = 503) {
  return NextResponse.json({ ok: false, source: "RALLIVIO_CATALOG", state }, { status });
}

async function supabase(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });
}

function clean(value: string, max: number) {
  return value.replace(/[\\*(),]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return fail("CATALOG_NOT_CONFIGURED");

  const { searchParams } = new URL(request.url);
  const q = clean(searchParams.get("q") || "", 80);
  const region = clean(searchParams.get("region") || "", 12).toUpperCase();
  const topic = clean(searchParams.get("topic") || "", 60);
  const format = clean(searchParams.get("format") || "", 20);
  const signal = clean(searchParams.get("signal") || "", 40);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 24), 1), 50);
  const offset = Math.min(Math.max(Number(searchParams.get("offset") || 0), 0), 5000);

  const select = [
    "id","title","channel_title","channel_id","published_at","thumbnail","description",
    "views","likes","comments","duration","category_id","url","embeddable",
    "live_broadcast_content","topic","format","region","source","verified_at",
    "fetched_at","last_seen_at","expires_at","metadata","topic_tags","acquired_at",
    "stats_refreshed_at",
  ].join(",");

  const params = new URLSearchParams({ select, limit: String(limit), offset: String(offset) });
  if (region) params.set("region", `eq.${region}`);
  if (topic) params.set("topic", `ilike.*${topic}*`);
  if (format && format !== "all") params.set("format", `eq.${format}`);
  params.set("order", "last_seen_at.desc");

  if (q) {
    const query = q.replace(/ /g, "*");
    params.set("or", `(title.ilike.*${query}*,channel_title.ilike.*${query}*,description.ilike.*${query}*)`);
  }

  const response = await supabase(`youtube_discovery_pool?${params.toString()}`);
  if (!response) return fail("CATALOG_NOT_CONFIGURED");
  if (!response.ok) return fail("CATALOG_READ_FAILED");

  const rows = (await response.json()) as CatalogRow[];
  const items = rows
    .filter(row => !signal || String(row.metadata?.signal || "") === signal)
    .map(row => ({
      id: row.id,
      title: row.title,
      channelTitle: row.channel_title,
      channelId: row.channel_id,
      publishedAt: row.published_at,
      thumbnail: row.thumbnail,
      description: row.description,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      url: row.url,
      embeddable: row.embeddable !== false,
      signal: typeof row.metadata?.signal === "string" ? row.metadata.signal : undefined,
      momentumScore: typeof row.metadata?.momentum_score === "number" ? row.metadata.momentum_score : undefined,
      format: row.format,
      region: row.region,
      topic: row.topic,
      live: row.live_broadcast_content === "live",
      source: "RALLIVIO_CATALOG",
      verifiedAt: row.verified_at,
      statsRefreshedAt: row.stats_refreshed_at,
    }));

  return NextResponse.json(
    {
      ok: true,
      source: "RALLIVIO_CATALOG",
      query: q || null,
      region: region || "ALL",
      topic: topic || "ALL",
      format: format || "all",
      signal: signal || "all",
      offset,
      limit,
      count: items.length,
      items,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    },
  );
}
