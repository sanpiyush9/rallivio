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
    ["Food", /\\b(food|recipe|cooking|cook|restaurant|cuisine|baking|chef|meal|street food|restaurant review)\\b/i],
    ["Fitness", /\\b(fitness|workout|gym|exercise|yoga|weight loss|bodybuilding|training)\\b/i],
    ["Podcasts", /\\b(podcast|podcasts|interview show|episode)\\b/i],
    ["Finance", /\\b(finance|investing|investment|stocks|stock market|trading|crypto|mutual fund|banking)\\b/i],
    ["Business", /\\b(business|startup|entrepreneur|marketing|sales|company|founder|small business)\\b/i],
    ["Science", /\\b(science|physics|chemistry|biology|space|astronomy|research|experiment)\\b/i],
    ["Beauty", /\\b(beauty|makeup|skincare|cosmetics|haircare|hair style)\\b/i],
    ["Fashion", /\\b(fashion|outfit|clothing|style|streetwear|fashion haul)\\b/i],
    ["DIY & Home", /\\b(diy|do it yourself|home decor|home improvement|craft|woodworking|interior design|how to)\\b/i],
    ["Technology", /\\b(programming|software|coding|developer|technology|tech|ai|artificial intelligence|machine learning|gadget|smartphone|computer)\\b/i],
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

  const baseRows = [...seen.values()].slice(0, 7500);

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

  const now = new Date();
  const isoNow = now.toISOString();
  const hotLimit = 5000;
  const warmPerPass = 3340;
  const coldPerPass = 4170;

  async function loadTier(tier: "hot" | "warm" | "cold", limit: number, staleHours: number) {
    const cutoff = new Date(now.getTime() - staleHours * 36e5).toISOString();
    const rows: any[] = [];
    let offset = 0;

    while (rows.length < limit) {
      const pageLimit = Math.min(1000, limit - rows.length);
      const filter =
        tier === "hot"
          ? `tier=eq.hot&stats_refreshed_at=lt.${encodeURIComponent(cutoff)}`
          : `tier=eq.${tier}&stats_refreshed_at=lt.${encodeURIComponent(cutoff)}`;

      const response = await sb(
        `youtube_discovery_pool?select=*&${filter}&order=last_observed_at.asc.nullsfirst,updated_at.asc&limit=${pageLimit}&offset=${offset}`,
      );
      if (!response.ok) {
        throw new Error(`Tier pool read failed: ${response.status} ${await response.text()}`);
      }

      const page = (await response.json()) as any[];
      rows.push(...page);
      if (page.length < pageLimit) break;
      offset += page.length;
    }

    return rows;
  }

  const hot = await loadTier("hot", hotLimit, 1);
  const warm = await loadTier("warm", warmPerPass, 6);
  const cold = await loadTier("cold", coldPerPass, 24);
  const pool = [...hot, ...warm, ...cold];

  if (!pool.length) {
    return {
      refreshed: 0,
      youtubeCalls: 0,
      tiers: { hot: 0, warm: 0, cold: 0 },
    };
  }

  const batches = Array.from(
    { length: Math.ceil(pool.length / 50) },
    (_, i) => pool.slice(i * 50, i * 50 + 50),
  );

  await runConcurrent(batches, 12, async (batch, index) => {
    if (!batch.length) return null;

    // videos.batchGetStats is a dedicated 1-unit quota method introduced by
    // YouTube in 2026. It is designed for repeated statistics refreshes and
    // keeps observation quota separate from discovery/acquisition.
    const p = new URLSearchParams({
      part: "statistics",
      id: batch.map((x) => x.id).join(","),
    });
    const data = (await yt(`videos:batchGetStats?${p}`)) as any;
    await usage("videos.batchGetStats", {
      phase: "refresh",
      batch: index,
      videoCount: batch.length,
    });

    const items = data.items ?? [];
    const existingById = new Map(batch.map((x) => [String(x.id), x]));

    const poolRows = items
      .map((v: any) => {
        const existing = existingById.get(String(v.id));
        if (!existing) return null;

        const nextViews = num(v.statistics?.viewCount);
        const previousViews = num(existing.views);
        const growth = previousViews > 0
          ? (nextViews - previousViews) / previousViews
          : nextViews > 0 ? 1 : 0;

        return {
          ...existing,
          views: nextViews,
          likes: num(v.statistics?.likeCount),
          comments: num(v.statistics?.commentCount),
          fetched_at: isoNow,
          last_seen_at: isoNow,
          last_observed_at: isoNow,
          stats_refreshed_at: isoNow,
          verified_at: isoNow,
          last_movement_at:
            growth >= 0.02
              ? isoNow
              : existing.last_movement_at ?? null,
          updated_at: isoNow,
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

    return null;
  });

  return {
    refreshed: pool.length,
    youtubeCalls: batches.length,
    tiers: { hot: hot.length, warm: warm.length, cold: cold.length },
  };
}

export async function signals() {
  config();

  const pool: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const poolResponse = await sb(
      `youtube_discovery_pool?select=id,channel_id,views,likes,comments,published_at,live_broadcast_content,duration,metadata,region,topic,format&order=views.desc&limit=1000&offset=${offset}`,
    );
    if (!poolResponse.ok) {
      throw new Error(`Pool read failed: ${poolResponse.status} ${await poolResponse.text()}`);
    }
    const page = (await poolResponse.json()) as any[];
    pool.push(...page);
    if (page.length < 1000) break;
  }

  if (!pool.length) {
    return { signals: 0, eligibleVideos: 0, suppressedVideos: 0 };
  }

  const snapshotRows: any[] = [];
  const poolIds = pool.map((x) => String(x.id));
  for (let start = 0; start < poolIds.length; start += 200) {
    const batchIds = poolIds.slice(start, start + 200);
    const snapshotResponse = await sb("rpc/get_recent_video_snapshots", {
      method: "POST",
      body: JSON.stringify({ p_video_ids: batchIds }),
    });
    if (!snapshotResponse.ok) {
      throw new Error(
        `Snapshot RPC failed: ${snapshotResponse.status} ${await snapshotResponse.text()}`,
      );
    }
    snapshotRows.push(...((await snapshotResponse.json()) as any[]));
  }

  const grouped = new Map<string, any[]>();
  for (const item of snapshotRows) {
    const list = grouped.get(String(item.video_id)) ?? [];
    if (list.length < 5) list.push(item);
    grouped.set(String(item.video_id), list);
  }

  const parseDurationSeconds = (value: string | null | undefined) => {
    if (!value) return 0;
    const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!match) return 0;
    return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
  };

  const classifyFormat = (video: any) => {
    if (video.live_broadcast_content === "live") return "live";
    if (video.live_broadcast_content === "upcoming") return "upcoming";
    return parseDurationSeconds(video.duration) <= 180 ? "short" : "long";
  };

  const percentileMap = (
    entries: Array<{ id: string; value: number }>,
    descending = true,
  ) => {
    const sorted = [...entries].sort((a, b) => {
      const delta = descending ? b.value - a.value : a.value - b.value;
      return delta || a.id.localeCompare(b.id);
    });
    const out = new Map<string, number>();
    if (sorted.length === 1) {
      out.set(sorted[0].id, 0);
      return out;
    }
    sorted.forEach((entry, index) => out.set(entry.id, index / (sorted.length - 1)));
    return out;
  };

  const now = new Date();
  const nowIso = now.toISOString();
  const prepared = pool
    .map((x) => {
      const observations = [...(grouped.get(String(x.id)) ?? [])].sort(
        (a, b) => Date.parse(a.captured_at) - Date.parse(b.captured_at),
      );
      if (observations.length < 2) return null;

      const current = observations[observations.length - 1];
      const scored = score(
        {
          id: x.id,
          snippet: {
            publishedAt: x.published_at,
            liveBroadcastContent: x.live_broadcast_content,
          },
          statistics: {
            viewCount: current.views,
            likeCount: current.likes,
            commentCount: current.comments,
          },
        },
        observations,
      );

      const recent = observations.slice(-4);
      const velocitySeries = observations.map((observation) => {
        const ageHours = Math.max(
          0.1,
          (Date.parse(observation.captured_at) - Date.parse(x.published_at)) / 36e5,
        );
        return Math.log10(1 + num(observation.views) / ageHours) * 18;
      });
      const recentVelocity = velocitySeries.slice(-4);
      let consecutiveVelocityIncreases = 0;
      for (let i = recentVelocity.length - 1; i > 0; i -= 1) {
        if (recentVelocity[i] > recentVelocity[i - 1]) consecutiveVelocityIncreases += 1;
        else break;
      }

      const subscriberCount = num(x.metadata?.subscriber_count);
      const audienceRelativeScore =
        Math.log10(1 + num(current.views) / Math.max(subscriberCount + 1000, 1000));

      const latestSnapshotAgeHours = Math.max(
        0,
        (now.getTime() - Date.parse(current.captured_at)) / 36e5,
      );

      const format = classifyFormat(x);
      const cell = `${String(x.topic ?? "Other")}::${String(x.region ?? "WORLDWIDE")}::${format}`;

      return {
        x,
        observations,
        current,
        scored,
        consecutiveVelocityIncreases,
        audienceRelativeScore,
        latestSnapshotAgeHours,
        format,
        cell,
      };
    })
    .filter(Boolean) as Array<any>;

  const cells = new Map<string, any[]>();
  for (const item of prepared) {
    const list = cells.get(item.cell) ?? [];
    list.push(item);
    cells.set(item.cell, list);
  }

  for (const cellItems of cells.values()) {
    const velocityPct = percentileMap(cellItems.map((item) => ({
      id: String(item.x.id),
      value: Number(item.scored.evidence.velocity ?? 0),
    })));
    const accelerationPct = percentileMap(cellItems.map((item) => ({
      id: String(item.x.id),
      value: Number(item.scored.evidence.acceleration ?? 0),
    })));
    const audiencePct = percentileMap(cellItems.map((item) => ({
      id: String(item.x.id),
      value: Number(item.audienceRelativeScore),
    })));

    for (const item of cellItems) {
      item.velocityPct = velocityPct.get(String(item.x.id)) ?? 1;
      item.accelerationPct = accelerationPct.get(String(item.x.id)) ?? 1;
      item.audiencePct = audiencePct.get(String(item.x.id)) ?? 1;
    }
  }

  const movementFreshHours = 6;
  const riseFreshHours = 12;
  const radarFreshHours = 12;
  const droppedFreshHours = 48;
  const liveFreshHours = 1;

  const rows = prepared.map((item) => {
    const x = item.x;
    const labels: string[] = [];

    if (item.velocityPct <= 0.25 && item.latestSnapshotAgeHours <= movementFreshHours) {
      labels.push("Now Moving");
    }
    if (item.accelerationPct <= 0.10 && item.latestSnapshotAgeHours <= movementFreshHours) {
      labels.push("Breaking Out");
    }
    if (
      item.consecutiveVelocityIncreases >= 3 &&
      item.latestSnapshotAgeHours <= riseFreshHours
    ) {
      labels.push("On the Rise");
    }
    if (item.audiencePct <= 0.10 && item.latestSnapshotAgeHours <= radarFreshHours) {
      labels.push("Under the Radar");
    }
    if (
      Date.parse(x.published_at) >= now.getTime() - 48 * 36e5 &&
      item.latestSnapshotAgeHours <= droppedFreshHours
    ) {
      labels.push("Just Dropped");
    }
    if (
      x.live_broadcast_content === "live" &&
      item.latestSnapshotAgeHours <= liveFreshHours
    ) {
      labels.push("Live");
    }

    const priority = [
      "Live",
      "Breaking Out",
      "Now Moving",
      "On the Rise",
      "Under the Radar",
      "Just Dropped",
    ];
    const primary = priority.find((label) => labels.includes(label)) ?? "Observed";

    return {
      channel_id: String(x.channel_id),
      video_id: String(x.id),
      signal_type: primary,
      signal_labels: labels,
      momentum_score: item.scored.momentum,
      evidence: {
        ...item.scored.evidence,
        velocity_percentile: Number((1 - item.velocityPct).toFixed(4)),
        acceleration_percentile: Number((1 - item.accelerationPct).toFixed(4)),
        audience_relative_percentile: Number((1 - item.audiencePct).toFixed(4)),
        audience_relative_score: Number(item.audienceRelativeScore.toFixed(4)),
        consecutive_velocity_increases: item.consecutiveVelocityIncreases,
        latest_snapshot_age_hours: Number(item.latestSnapshotAgeHours.toFixed(2)),
        freshness_windows_hours: {
          movement: movementFreshHours,
          rise: riseFreshHours,
          radar: radarFreshHours,
          dropped: droppedFreshHours,
          live: liveFreshHours,
        },
        format: item.format,
      },
      cell_key: `${String(x.topic ?? "Other")}:${String(x.region ?? "WORLDWIDE")}:${item.format}`,
      observed_at: nowIso,
      expires_at: new Date(now.getTime() + 6 * 36e5).toISOString(),
    };
  });

  const publishable = rows.filter((row) => row.signal_labels.length > 0);

  for (let i = 0; i < publishable.length; i += 500) {
    const write = await sb("discovery_signals", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(publishable.slice(i, i + 500)),
    });
    if (!write.ok) {
      throw new Error(`Signal write failed: ${write.status} ${await write.text()}`);
    }
  }

  const cleanup = await sb(`discovery_signals?observed_at=lt.${encodeURIComponent(nowIso)}`, {
    method: "DELETE",
  });
  if (!cleanup.ok) {
    console.warn("Signal cleanup failed after successful publish", cleanup.status);
  }

  const rebalance = await sb("rpc/rebalance_youtube_observation_tiers", {
    method: "POST",
    body: "{}",
  });
  if (!rebalance.ok) {
    throw new Error(
      `Tier rebalance failed: ${rebalance.status} ${await rebalance.text()}`,
    );
  }

  return {
    signals: publishable.length,
    eligibleVideos: prepared.length,
    suppressedVideos: pool.length - publishable.length,
    labelDistribution: publishable.reduce<Record<string, number>>((acc, row) => {
      for (const label of row.signal_labels) acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
