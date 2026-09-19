/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YT = process.env.YOUTUBE_API_KEY;
const SECRET = process.env.CRON_SECRET;

export const REGIONS = ["IN","US","GB","CA","AU","DE","BR","JP","KR","SG"];

export const CATEGORIES = [
  "1","2","10","15","17","19","20","22","23","24","25","26","27","28","29",
];

const CATEGORY_TOPIC: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Automotive",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "AI & Tech",
  "29": "Nonprofits & Activism",
};

const num = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

async function schedulerAuth(candidate: string | null) {
  if (!candidate || !SB || !KEY) return false;
  const response = await sb("rpc/validate_rallivio_scheduler_token", {
    method: "POST",
    body: JSON.stringify({ candidate }),
  });
  if (!response.ok) {
    console.warn("scheduler token RPC rejected", response.status);
    return false;
  }
  const valid = Boolean(await response.json());
  if (!valid) console.warn("scheduler token RPC returned false");
  return valid;
}

export async function auth(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (SECRET && authorization === `Bearer ${SECRET}`) {
    return null;
  }

  try {
    if (
      (await schedulerAuth(bearer)) ||
      (await schedulerAuth(request.headers.get("x-rallivio-scheduler-token")))
    ) {
      return null;
    }
  } catch (error) {
    console.error("scheduler authentication failed", error);
  }

  return NextResponse.json(
    { ok: false, state: "UNAUTHORIZED" },
    { status: 401 },
  );
}

function config() {
  const missing = [
    !SB && "SUPABASE_URL",
    !KEY && "SUPABASE_SERVICE_ROLE_KEY",
    !YT && "YOUTUBE_API_KEY",
    !SECRET && "CRON_SECRET",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing configuration: ${missing.join(", ")}`);
  }
}

export async function sb(path: string, init: RequestInit = {}) {
  if (!SB || !KEY) throw new Error("Supabase configuration missing");

  return fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

export async function yt(path: string) {
  if (!YT) throw new Error("YOUTUBE_API_KEY missing");

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(YT)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`YouTube API ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  return response.json();
}

async function usage(endpoint: string, metadata: Record<string, any>) {
  const response = await sb("api_usage", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      service: "youtube",
      endpoint,
      units: 1,
      metadata,
    }),
  });

  if (!response.ok) {
    throw new Error(`api_usage write failed: ${response.status}`);
  }
}

async function runConcurrent<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += limit) {
    const batch = items.slice(start, start + limit);
    const batchResults = await Promise.all(
      batch.map((item, offset) => task(item, start + offset)),
    );
    results.push(...batchResults);
  }
  return results;
}

function score(video: any, history: any[]) {
  const views = num(video.statistics?.viewCount);
  const likes = num(video.statistics?.likeCount);
  const comments = num(video.statistics?.commentCount);
  const published = video.snippet?.publishedAt ?? new Date().toISOString();
  const age = Math.max((Date.now() - Date.parse(published)) / 36e5, 0.1);
  const velocity = Math.min(100, Math.log10(1 + views / age) * 18);
  const engagement = Math.min(
    100,
    ((likes + comments) / Math.max(views, 1)) * 2000,
  );
  const efficiency = Math.min(100, Math.log10(1 + views) * 10);

  let acceleration = 0;
  if (history.length >= 2) {
    const first = history[history.length - 1];
    const last = history[0];
    const elapsed = Math.max(
      (Date.parse(last.captured_at) - Date.parse(first.captured_at)) / 36e5,
      0.1,
    );
    acceleration = Math.min(
      100,
      Math.max(
        0,
        (last.views - first.views) /
          elapsed /
          Math.max(
            first.views /
              Math.max(
                (Date.parse(first.captured_at) - Date.parse(published)) / 36e5,
                0.1,
              ),
            1,
          ),
      ) * 30,
    );
  }

  const momentum = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        velocity * 0.45 +
          engagement * 0.15 +
          efficiency * 0.2 +
          acceleration * 0.2,
      ),
    ),
  );

  let signal = "Just Dropped";
  if (video.snippet?.liveBroadcastContent === "live") signal = "Live";
  else if (history.length >= 2 && acceleration >= 45) signal = "Breaking Out";
  else if (history.length >= 2 && velocity >= 35) signal = "On the Rise";
  else if (momentum >= 55) signal = "Now Moving";

  return {
    momentum,
    signal,
    evidence: {
      velocity: Math.round(velocity),
      acceleration: Math.round(acceleration),
      engagement: Math.round(engagement),
      historyAvailable: history.length >= 2,
      observedViews: views,
    },
  };
}

export async function acquire() {
  config();
  const now = new Date().toISOString();
  const jobs = REGIONS.flatMap((region) =>
    CATEGORIES.map((category) => ({ region, category })),
  );

  const results = await runConcurrent(jobs, 10, async ({ region, category }) => {
    const p = new URLSearchParams({
      part: "snippet,contentDetails,statistics,status",
      chart: "mostPopular",
      regionCode: region,
      videoCategoryId: category,
      maxResults: "50",
    });
    try {
      const data = (await yt(`videos?${p}`)) as any;
      await usage("videos.list:mostPopular", {
        phase: "acquire",
        region,
        category,
        topic: CATEGORY_TOPIC[category] ?? "Other",
      });
      return { region, category, items: data.items ?? [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const unavailableChart =
        /YouTube API (400|404)/.test(message) &&
        /(videoChartNotFound|Requested entity was not found|notFound)/i.test(message);

      if (!unavailableChart) throw error;

      console.warn("Skipping unavailable YouTube acquisition cell", {
        region,
        category,
        message,
      });

      // A rejected/unsupported chart cell is not a fatal worker failure.
      // Keep the acquisition pass moving so one regional/category gap cannot
      // prevent the remaining valid cells from refreshing the pool.
      return { region, category, items: [] };
    }
  });

  const seen = new Map<string, any>();
  for (const result of results) {
    for (const video of result.items) {
      if (video.id && !seen.has(video.id)) {
        seen.set(video.id, {
          video,
          region: result.region,
          category: result.category,
        });
      }
    }
  }

  const baseRows = [...seen.values()].slice(0, 2500);

  const channelIds = [
    ...new Set(
      baseRows
        .map(({ video }) => video.snippet?.channelId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const channelResults = await runConcurrent(
    Array.from({ length: Math.ceil(channelIds.length / 50) }, (_, i) =>
      channelIds.slice(i * 50, i * 50 + 50),
    ),
    5,
    async (batch, index) => {
      const p = new URLSearchParams({
        part: "statistics",
        id: batch.join(","),
      });
      const data = (await yt(`channels?${p}`)) as any;
      await usage("channels.list:statistics", {
        phase: "acquire",
        batch: index,
        channelCount: batch.length,
      });
      return data.items ?? [];
    },
  );

  const subscribers = new Map<string, number>();
  for (const channel of channelResults.flat()) {
    if (channel.id) {
      subscribers.set(channel.id, num(channel.statistics?.subscriberCount));
    }
  }

  const rows = baseRows.map(({ video, region, category }) => {
    const topic = CATEGORY_TOPIC[category] ?? "Other";
    const scored = score(video, []);
    const channelId = video.snippet?.channelId ?? "";
    const subscriberCount = subscribers.get(channelId) ?? null;

    return {
      id: video.id,
      title: video.snippet?.title ?? "Untitled video",
      channel_title: video.snippet?.channelTitle ?? "Unknown channel",
      channel_id: channelId,
      published_at: video.snippet?.publishedAt ?? now,
      thumbnail:
        video.snippet?.thumbnails?.high?.url ??
        video.snippet?.thumbnails?.medium?.url ??
        `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      description: video.snippet?.description ?? "",
      views: num(video.statistics?.viewCount),
      likes: num(video.statistics?.likeCount),
      comments: num(video.statistics?.commentCount),
      duration: video.contentDetails?.duration ?? null,
      category_id: video.snippet?.categoryId ?? category,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      embeddable: video.status?.embeddable !== false,
      live_broadcast_content: video.snippet?.liveBroadcastContent ?? null,
      topic,
      format: "all",
      region,
      source: "youtube",
      verified_at: now,
      fetched_at: now,
      last_seen_at: now,
      expires_at: new Date(Date.now() + 36 * 36e5).toISOString(),
      metadata: {
        subscriber_count: subscriberCount,
        signal: scored.signal,
        momentum_score: scored.momentum,
        category_id: category,
      },
      topic_tags: [topic],
      acquired_at: now,
      stats_refreshed_at: null,
      language: video.snippet?.defaultLanguage ?? null,
      language_confidence: video.snippet?.defaultLanguage ? 1 : null,
      relevance_score: 1,
      relevance_confidence: 1,
    };
  });

  const write = await sb("youtube_discovery_pool?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!write.ok) {
    throw new Error(`Pool write failed: ${write.status} ${await write.text()}`);
  }

  const initialSnapshots = rows.map((row) => ({
    video_id: row.id,
    captured_at: now,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
  }));

  const snapshotWrite = await sb("video_stats_snapshots", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(initialSnapshots),
  });

  if (!snapshotWrite.ok) {
    throw new Error(`Initial snapshot write failed: ${snapshotWrite.status} ${await snapshotWrite.text()}`);
  }

  return {
    inserted: rows.length,
    youtubeCalls: jobs.length + Math.ceil(channelIds.length / 50),
    regions: REGIONS.length,
    categories: CATEGORIES.length,
  };
}

export async function refresh() {
  config();

  const poolResponse = await sb(
    "youtube_discovery_pool?select=*&order=views.desc&limit=2500",
  );
  if (!poolResponse.ok) {
    throw new Error(`Pool read failed: ${poolResponse.status}`);
  }

  const pool = (await poolResponse.json()) as any[];
  const poolById = new Map(pool.map((row) => [String(row.id), row]));
  const now = new Date().toISOString();
  const batches = Array.from(
    { length: Math.ceil(pool.length / 50) },
    (_, i) => pool.slice(i * 50, i * 50 + 50),
  );

  await runConcurrent(batches, 8, async (batch, index) => {
    if (!batch.length) return null;

    const p = new URLSearchParams({
      part: "snippet,statistics,status",
      id: batch.map((x) => x.id).join(","),
    });
    const data = (await yt(`videos?${p}`)) as any;

    await usage("videos.list:statistics", {
      phase: "refresh",
      batch: index,
      videoCount: batch.length,
    });

    const items = data.items ?? [];
    const poolRows = items
      .map((v: any) => {
        const existing = poolById.get(String(v.id));
        if (!existing) return null;

        return {
          ...existing,
          views: num(v.statistics?.viewCount),
          likes: num(v.statistics?.likeCount),
          comments: num(v.statistics?.commentCount),
          fetched_at: now,
          last_seen_at: now,
          stats_refreshed_at: now,
          verified_at: now,
          updated_at: now,
        };
      })
      .filter(Boolean);

    const write = await sb("youtube_discovery_pool?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(poolRows),
    });

    if (!write.ok) {
      throw new Error(`Pool refresh failed: ${write.status} ${await write.text()}`);
    }

    const snapshots = items.map((v: any) => ({
      video_id: v.id,
      captured_at: now,
      views: num(v.statistics?.viewCount),
      likes: num(v.statistics?.likeCount),
      comments: num(v.statistics?.commentCount),
    }));

    const snapshotWrite = await sb("video_stats_snapshots", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(snapshots),
    });

    if (!snapshotWrite.ok) {
      throw new Error(`Snapshot write failed: ${snapshotWrite.status}`);
    }

    return null;
  });

  return { refreshed: pool.length, youtubeCalls: batches.length };
}

export async function signals() {
  config();

  const poolResponse = await sb(
    "youtube_discovery_pool?select=id,channel_id,views,likes,comments,published_at,live_broadcast_content,metadata,region,topic&order=views.desc&limit=2500",
  );
  if (!poolResponse.ok) {
    throw new Error(`Pool read failed: ${poolResponse.status}`);
  }

  const pool = (await poolResponse.json()) as any[];
  if (!pool.length) {
    return { signals: 0, eligibleVideos: 0, suppressedVideos: 0 };
  }

  const ids = pool.map((x) => String(x.id));
  const snapshotResponse = await sb(
    `video_stats_snapshots?select=video_id,captured_at,views,likes,comments&video_id=in.(${ids.join(",")})&order=captured_at.desc&limit=10000`,
  );
  if (!snapshotResponse.ok) {
    throw new Error(`Snapshot read failed: ${snapshotResponse.status}`);
  }

  const grouped = new Map<string, any[]>();
  for (const item of (await snapshotResponse.json()) as any[]) {
    const list = grouped.get(item.video_id) ?? [];
    if (list.length < 5) list.push(item);
    grouped.set(item.video_id, list);
  }

  const ready = pool.filter(
    (x) => (grouped.get(String(x.id))?.length ?? 0) >= 2,
  );

  const cleanup = await sb("discovery_signals?signal_type=not.is.null", {
    method: "DELETE",
  });
  if (!cleanup.ok) {
    throw new Error(`Signal cleanup failed: ${cleanup.status}`);
  }

  const now = new Date().toISOString();
  const rows = ready.map((x) => {
    const q = score(
      {
        id: x.id,
        snippet: {
          publishedAt: x.published_at,
          liveBroadcastContent: x.live_broadcast_content,
        },
        statistics: {
          viewCount: x.views,
          likeCount: x.likes,
          commentCount: x.comments,
        },
      },
      grouped.get(String(x.id)) ?? [],
    );

    return {
      channel_id: String(x.channel_id),
      video_id: String(x.id),
      signal_type: q.signal,
      momentum_score: q.momentum,
      evidence: q.evidence,
      cell_key: `${String(x.region ?? "WORLDWIDE")}:${String(x.topic ?? "Other")}:all`,
      observed_at: now,
      expires_at: new Date(Date.now() + 36 * 36e5).toISOString(),
    };
  });

  for (let i = 0; i < rows.length; i += 500) {
    const write = await sb("discovery_signals", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(rows.slice(i, i + 500)),
    });

    if (!write.ok) {
      throw new Error(`Signal write failed: ${write.status}`);
    }
  }

  return {
    signals: rows.length,
    eligibleVideos: ready.length,
    suppressedVideos: pool.length - ready.length,
  };
}
