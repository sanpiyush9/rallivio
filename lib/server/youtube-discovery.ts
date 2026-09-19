/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YT = process.env.YOUTUBE_API_KEY;
const SECRET = process.env.CRON_SECRET;

export const REGIONS = ["IN","US","GB","CA","AU","DE","BR","JP","KR","SG","FR","ES","IT","MX","AR","CO","CL","PE","ZA","NG","KE","EG","AE","SA","TR","NL","SE","NO","DK","FI","PL","PT","ID","MY","TH","PH","VN","NZ","IE","CH","AT","BE","GR","CZ","RO","HU","IL","PK","BD","LK"];

export const CATEGORIES = [
  "1","2","10","15","17","19","20","22","23","24","25","26","27","28","29",
];

export const RALLIVIO_TOPICS = [
  "AI & Tech", "Travel", "Food", "Gaming", "Fitness", "Podcasts", "Lifestyle",
  "Music", "Fashion", "Education", "Business", "Finance", "Sports", "Comedy",
  "Science", "Automotive", "Beauty", "Entertainment", "DIY & Home", "News", "Pets",
] as const;

const CATEGORY_TOPIC: Record<string, string> = {
  "1": "Entertainment",
  "2": "Automotive",
  "10": "Music",
  "15": "Pets",
  "17": "Sports",
  "19": "Travel",
  "20": "Gaming",
  "22": "Lifestyle",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News",
  "26": "DIY & Home",
  "27": "Education",
  "28": "AI & Tech",
  "29": "News",
};

function classifyRallivioTopic(video: any, category: string) {
  const text = `${video.snippet?.title ?? ""} ${video.snippet?.description ?? ""} ${video.snippet?.channelTitle ?? ""}`.toLowerCase();

  const keywordTopics: Array<[string, RegExp]> = [
    ["Education", /\b(education|educational|tutorial|course|lesson|learn|learning|study|exam|school|university|college)\b/i],
    ["Travel", /\b(travel|tourism|vacation|holiday|trip|itinerary|destination|hotel review|travel vlog)\b/i],
    ["Food", /\b(food|recipe|cooking|cook|restaurant|cuisine|baking|chef|meal|street food|restaurant review)\b/i],
    ["Fitness", /\b(fitness|workout|gym|exercise|yoga|weight loss|bodybuilding|training)\b/i],
    ["Podcasts", /\b(podcast|podcasts|interview show|episode)\b/i],
    ["Finance", /\b(finance|investing|investment|stocks|stock market|trading|crypto|mutual fund|banking)\b/i],
    ["Business", /\b(business|startup|entrepreneur|marketing|sales|company|founder|small business)\b/i],
    ["Science", /\b(science|physics|chemistry|biology|space|astronomy|research|experiment)\b/i],
    ["Beauty", /\b(beauty|makeup|skincare|cosmetics|haircare|hair style)\b/i],
    ["Fashion", /\b(fashion|outfit|clothing|style|streetwear|fashion haul)\b/i],
    ["DIY & Home", /\b(diy|do it yourself|home decor|home improvement|craft|woodworking|interior design|how to)\b/i],
    ["Technology", /\b(programming|software|coding|developer|technology|tech|ai|artificial intelligence|machine learning|gadget|smartphone|computer)\b/i],
  ];

  for (const [topic, pattern] of keywordTopics) {
    if (pattern.test(text)) return topic === "Technology" ? "AI & Tech" : topic;
  }

  return CATEGORY_TOPIC[category] ?? "Entertainment";
}

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

function circularCells<T>(cells: T[], start: number, count: number) {
  if (!cells.length || count <= 0) return [] as T[];
  return Array.from({ length: Math.min(count, cells.length) }, (_, i) => cells[(start + i) % cells.length]);
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
    const first = history[0];
    const last = history[history.length - 1];
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


  // The mostPopular chart finds already-popular videos. Add a daily newest-upload
  // sweep plus an active-live sweep so the pool also sees fresh creators before
  // they become popular. search.list is capped at 100 calls/day by default, so
  // the 100-cell sweep runs once per daily acquisition and rotates through the
  // full region/category matrix over successive days.
  const allSearchCells = REGIONS.flatMap((region) =>
    CATEGORIES.map((category) => ({ region, category })),
  );
  const dayIndex = Math.floor(Date.now() / 86400000);
  const recentSearchCells = circularCells(allSearchCells, dayIndex * 70, 70);
  const liveSearchCells = circularCells(allSearchCells, dayIndex * 30 + 367, 30);
  const searchJobs = [
    ...recentSearchCells.map((cell) => ({ ...cell, mode: "recent" as const })),
    ...liveSearchCells.map((cell) => ({ ...cell, mode: "live" as const })),
  ];

  const searchResults = await runConcurrent(searchJobs, 10, async ({ region, category, mode }) => {
    const p = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "50",
      order: "date",
      regionCode: region,
      videoCategoryId: category,
    });
    if (mode === "recent") {
      p.set("publishedAfter", new Date(Date.now() - 24 * 36e5).toISOString());
    } else {
      p.set("eventType", "live");
    }

    try {
      const data = (await yt("search?" + p.toString())) as any;
      await usage("search.list", { phase: "acquire", region, category, mode });
      return { region, category, mode, items: data.items ?? [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/quota|exceeded|403/i.test(message)) {
        console.warn("Skipping YouTube search sweep cell", { region, category, mode, message });
        return { region, category, mode, items: [] };
      }
      throw error;
    }
  });

  const searchVideoSources = new Map<string, { region: string; category: string }>();
  for (const result of searchResults) {
    for (const item of result.items) {
      const id = item.id?.videoId;
      if (id && !searchVideoSources.has(id)) {
        searchVideoSources.set(id, { region: result.region, category: result.category });
      }
    }
  }

  const searchVideoIds = [...searchVideoSources.keys()];
  const searchHydrateBatches = Array.from(
    { length: Math.ceil(searchVideoIds.length / 50) },
    (_, i) => searchVideoIds.slice(i * 50, i * 50 + 50),
  );
  const searchHydrated = await runConcurrent(searchHydrateBatches, 10, async (batch, index) => {
    if (!batch.length) return [];
    const p = new URLSearchParams({
      part: "snippet,contentDetails,statistics,status",
      id: batch.join(","),
    });
    const data = (await yt("videos?" + p.toString())) as any;
    await usage("videos.list:searchHydrate", {
      phase: "acquire",
      batch: index,
      videoCount: batch.length,
    });
    return data.items ?? [];
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
  for (const video of searchHydrated.flat()) {
    if (video.id && !seen.has(video.id)) {
      const source = searchVideoSources.get(video.id);
      if (source) seen.set(video.id, { video, region: source.region, category: source.category });
    }
  }

  // Keep the full unique acquisition set. Discovery growth is handled by the
  // database pool; refresh capacity, not an arbitrary row cap, controls how
  // quickly observations become signal-ready.
  const baseRows = [...seen.values()];

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
    const topic = classifyRallivioTopic(video, category);
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
      format:
        video.snippet?.liveBroadcastContent === "live"
          ? "live"
          : (() => {
              const match = String(video.contentDetails?.duration ?? "").match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
              const seconds = Number(match?.[1] ?? 0) * 3600 + Number(match?.[2] ?? 0) * 60 + Number(match?.[3] ?? 0);
              return seconds < 60 ? "short" : "video";
            })(),
      region,
      source: "youtube",
      verified_at: now,
      fetched_at: now,
      last_seen_at: now,
      expires_at: new Date(Date.now() + 36 * 36e5).toISOString(),
      metadata: {
        subscriber_count: subscriberCount,
        category_id: category,
      },
      topic_tags: [topic],
      acquired_at: now,
      // Intentionally omitted: stats_refreshed_at must survive rediscovery.
      // A repeated acquisition is not a new observation.
      language: video.snippet?.defaultLanguage ?? null,
      language_confidence: video.snippet?.defaultLanguage ? 1 : null,
      relevance_score: 1,
      relevance_confidence: 1,
    };
  });

  const acquisitionRows = rows.map(({ stats_refreshed_at: _statsRefreshedAt, ...row }) => row);
  const write = await sb("youtube_discovery_pool?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(acquisitionRows),
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
    youtubeCalls:
      jobs.length +
      searchJobs.length +
      searchHydrateBatches.length +
      Math.ceil(channelIds.length / 50),
    searchCalls: searchJobs.length,
    searchVideos: searchVideoIds.length,
    regions: REGIONS.length,
    categories: CATEGORIES.length,
  };
}

export async function refresh(options?: { limit?: number; worker?: string }) {
  config();

  const requestedLimit = Number(options?.limit ?? process.env.OBSERVATION_BATCH_LIMIT ?? 1500);
  const limit = Math.max(50, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 1500, 5000));
  const worker = options?.worker ?? `vercel-observer:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const claim = await sb("rpc/claim_youtube_observation_jobs", {
    method: "POST",
    body: JSON.stringify({
      p_limit: limit,
      p_worker: worker,
      p_lease_seconds: 240,
    }),
  });
  if (!claim.ok) {
    throw new Error(`Observation claim failed: ${claim.status} ${await claim.text()}`);
  }

  const pool = (await claim.json()) as any[];
  if (!pool.length) {
    return {
      refreshed: 0,
      youtubeCalls: 0,
      worker,
      queue: "empty",
    };
  }

  const now = new Date();
  const isoNow = now.toISOString();
  const batches = Array.from(
    { length: Math.ceil(pool.length / 50) },
    (_, i) => pool.slice(i * 50, i * 50 + 50),
  );

  let refreshed = 0;
  await runConcurrent(batches, 12, async (batch, index) => {
    if (!batch.length) return null;

    try {
      const p = new URLSearchParams({
        part: "statistics",
        id: batch.map((x) => x.id).join(","),
      });
      const data = (await yt(`videos:batchGetStats?${p}`)) as any;
      await usage("videos.batchGetStats", {
        phase: "adaptive-observation",
        batch: index,
        videoCount: batch.length,
      });

      const items = data.items ?? [];
      const byId = new Map(batch.map((x) => [String(x.id), x]));
      const nextTimes: string[] = [];
      const successfulIds: string[] = [];

      const poolRows = items.map((v: any) => {
        const existing = byId.get(String(v.id));
        if (!existing) return null;

        const nextViews = num(v.statistics?.viewCount);
        const previousViews = num(existing.views);
        const growth = previousViews > 0
          ? (nextViews - previousViews) / previousViews
          : nextViews > 0 ? 1 : 0;

        const isLive = existing.live_broadcast_content === "live";
        const tierMinutes =
          existing.tier === "hot" ? 5 :
          existing.tier === "warm" ? 30 :
          existing.tier === "unknown" ? 15 :
          720;

        // Adaptive sampling: unusually fast movement immediately increases
        // observation frequency even before the next tier rebalance.
        const nextMinutes =
          isLive ? 2 :
          growth >= 0.10 ? 2 :
          growth >= 0.02 ? Math.min(tierMinutes, 10) :
          tierMinutes;

        const nextAt = new Date(now.getTime() + nextMinutes * 60000).toISOString();
        successfulIds.push(String(v.id));
        nextTimes.push(nextAt);

        return {
          id: String(v.id),
          views: nextViews,
          likes: num(v.statistics?.likeCount),
          comments: num(v.statistics?.commentCount),
          fetched_at: isoNow,
          last_seen_at: isoNow,
          last_observed_at: isoNow,
          stats_refreshed_at: isoNow,
          verified_at: isoNow,
          last_movement_at:
            growth >= 0.02 ? isoNow : existing.last_movement_at ?? null,
          observation_priority:
            growth >= 0.10 ? Math.max(num(existing.observation_priority), 100) :
            growth >= 0.02 ? Math.max(num(existing.observation_priority), 50) :
            num(existing.observation_priority),
          signal_dirty_at: isoNow,
          updated_at: isoNow,
        };
      }).filter(Boolean);

      if (poolRows.length) {
        const write = await sb("youtube_discovery_pool?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(poolRows),
        });
        if (!write.ok) {
          throw new Error(`Pool observation write failed: ${write.status} ${await write.text()}`);
        }

        const snapshots = items.map((v: any) => ({
          video_id: String(v.id),
          captured_at: isoNow,
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
          throw new Error(`Snapshot write failed: ${snapshotWrite.status} ${await snapshotWrite.text()}`);
        }

        const complete = await sb("rpc/complete_youtube_observation_jobs", {
          method: "POST",
          body: JSON.stringify({
            p_video_ids: successfulIds,
            p_next_observation_at: nextTimes,
            p_worker: worker,
          }),
        });
        if (!complete.ok) {
          throw new Error(`Observation completion failed: ${complete.status} ${await complete.text()}`);
        }

        refreshed += successfulIds.length;
      }

      // A video that vanished from the batch is not deleted from RALLIVIO;
      // it simply gets a normal retry window on the next scheduler pass.
      const missingIds = batch
        .map((x) => String(x.id))
        .filter((id) => !successfulIds.includes(id));
      if (missingIds.length) {
        await sb("rpc/fail_youtube_observation_jobs", {
          method: "POST",
          body: JSON.stringify({
            p_video_ids: missingIds,
            p_error: "video_not_returned_by_batch_stats",
            p_worker: worker,
          }),
        });
      }

      return null;
    } catch (error) {
      await sb("rpc/fail_youtube_observation_jobs", {
        method: "POST",
        body: JSON.stringify({
          p_video_ids: batch.map((x) => String(x.id)),
          p_error: error instanceof Error ? error.message : "observation_failed",
          p_worker: worker,
        }),
      }).catch(() => undefined);
      throw error;
    }
  });

  return {
    refreshed,
    youtubeCalls: batches.length,
    worker,
    tiers: pool.reduce<Record<string, number>>((acc, row) => {
      acc[row.tier] = (acc[row.tier] ?? 0) + 1;
      return acc;
    }, {}),
    adaptiveIntervalsMinutes: {
      hot: 5,
      warm: 30,
      unknown: 15,
      cold: 720,
      live: 2,
      fastGrowth: 2,
    },
  };
}

export async function signals() {
  config();

  const recompute = await sb("rpc/recompute_discovery_signals", {
    method: "POST",
    body: "{}",
  });
  if (!recompute.ok) {
    throw new Error(`Signal engine failed: ${recompute.status} ${await recompute.text()}`);
  }

  const result = (await recompute.json()) as Record<string, any>;

  const rebalance = await sb("rpc/rebalance_youtube_observation_tiers", {
    method: "POST",
    body: "{}",
  });
  if (!rebalance.ok) {
    throw new Error(`Tier rebalance failed: ${rebalance.status} ${await rebalance.text()}`);
  }

  const feedRefresh = await sb("rpc/refresh_discovery_feed_rankings", {
    method: "POST",
    body: "{}",
  });
  if (!feedRefresh.ok) {
    throw new Error(`Feed ranking refresh failed: ${feedRefresh.status} ${await feedRefresh.text()}`);
  }

  return {
    ...result,
    engine: "database-windowed-signal-engine",
    rebalance: await rebalance.json(),
    feedRefreshed: true,
  };
}
