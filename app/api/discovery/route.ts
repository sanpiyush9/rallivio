import { NextResponse } from "next/server";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    channelId?: string;
    channelTitle?: string;
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
};

type YouTubeVideo = {
  id: string;
  snippet?: {
    channelId?: string;
    channelTitle?: string;
    title?: string;
    description?: string;
    publishedAt?: string;
    categoryId?: string;
    liveBroadcastContent?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  status?: { embeddable?: boolean };
};

type YouTubeChannel = {
  id: string;
  statistics?: { subscriberCount?: string; videoCount?: string };
};

type Snapshot = { video_id: string; captured_at: string; views: number };

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
  expires_at: string;
  metadata: Record<string, unknown>;
  topic_tags: string[];
  acquired_at: string;
  stats_refreshed_at: string;
  relevance_score: number;
  relevance_confidence: number;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const CELL_KEY = "INDIA:Technology:all";
const TOPIC = "Technology";
const REGION = "IN";

function configError() {
  const missing = [
    !SUPABASE_URL && "SUPABASE_URL",
    !SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    !YOUTUBE_API_KEY && "YOUTUBE_API_KEY",
  ].filter(Boolean);
  return NextResponse.json(
    { ok: false, state: "CONFIGURATION_REQUIRED", missing },
    { status: 503 },
  );
}

async function supabase(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server configuration is missing");
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

async function youtube(path: string) {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is missing");
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}${separator}key=${encodeURIComponent(YOUTUBE_API_KEY)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API ${response.status}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

function number(value?: string) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hoursSince(iso: string) {
  return Math.max((Date.now() - new Date(iso).getTime()) / 3_600_000, 0.1);
}

function scoreVideo(video: YouTubeVideo, subscriberCount: number, previous?: Snapshot[]) {
  const views = number(video.statistics?.viewCount);
  const likes = number(video.statistics?.likeCount);
  const comments = number(video.statistics?.commentCount);
  const publishedAt = video.snippet?.publishedAt ?? new Date().toISOString();
  const ageHours = hoursSince(publishedAt);
  const viewsPerHour = views / ageHours;
  const engagementRate = ((likes + comments) / Math.max(views, 1)) * 100;
  const audienceEfficiency = views / Math.max(subscriberCount, 1);
  const freshness = Math.max(0, 100 - ageHours * 4);

  let velocityScore = Math.min(100, Math.log10(1 + viewsPerHour) * 18);
  let accelerationScore = 0;
  let hasHistory = false;

  if (previous && previous.length > 0) {
    const ordered = [...previous].sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
    const last = ordered[ordered.length - 1];
    const previousAgeHours = Math.max((new Date(last.captured_at).getTime() - new Date(publishedAt).getTime()) / 3_600_000, 0.1);
    const previousVelocity = last.views / previousAgeHours;
    velocityScore = Math.min(100, Math.log10(1 + Math.max(viewsPerHour, 0)) * 18);
    accelerationScore = Math.min(100, Math.max(0, viewsPerHour / Math.max(previousVelocity, 1)) * 30);
    hasHistory = true;
  }

  const engagementScore = Math.min(100, engagementRate * 20);
  const efficiencyScore = Math.min(100, Math.log10(1 + Math.max(audienceEfficiency, 0)) * 50);
  const momentumScore = Math.round(
    freshness * 0.2 + velocityScore * 0.35 + engagementScore * 0.15 + efficiencyScore * 0.2 + accelerationScore * 0.1,
  );

  let signal = "Just Dropped";
  if (video.snippet?.liveBroadcastContent === "live") signal = "Live";
  else if (hasHistory && accelerationScore >= 45) signal = "Breaking Out";
  else if (hasHistory && velocityScore >= 35) signal = "Rising";
  else if (subscriberCount > 0 && subscriberCount <= 500_000 && efficiencyScore >= 55) signal = "Under the Radar";
  else if (momentumScore >= 55) signal = "Trending";

  return {
    momentumScore,
    signal,
    evidence: {
      freshness: Math.round(freshness),
      velocity: Math.round(velocityScore),
      acceleration: Math.round(accelerationScore),
      engagement: Math.round(engagementScore),
      audienceEfficiency: Math.round(efficiencyScore),
      historyAvailable: hasHistory,
      subscriberCount,
      observedViews: views,
    },
  };
}

async function refresh() {
  if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Required server configuration is missing");

  const publishedAfter = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: "technology",
    regionCode: REGION,
    relevanceLanguage: "en",
    type: "video",
    order: "viewCount",
    publishedAfter,
    videoEmbeddable: "true",
    maxResults: "25",
  });
  const search = (await youtube(`search?${searchParams.toString()}`)) as { items?: YouTubeSearchItem[] };
  const ids = (search.items ?? []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return { acquired: 0, message: "YouTube returned no matching videos" };

  const videoParams = new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(",") });
  const videos = (await youtube(`videos?${videoParams.toString()}`)) as { items?: YouTubeVideo[] };
  const videoItems = videos.items ?? [];
  const channelIds = [...new Set(videoItems.map((video) => video.snippet?.channelId).filter((id): id is string => Boolean(id)))];
  const channelParams = new URLSearchParams({ part: "statistics", id: channelIds.join(",") });
  const channels = (await youtube(`channels?${channelParams.toString()}`)) as { items?: YouTubeChannel[] };
  const subscriberByChannel = new Map((channels.items ?? []).map((channel) => [channel.id, number(channel.statistics?.subscriberCount)]));

  const snapshotParams = new URLSearchParams({
    select: "video_id,captured_at,views",
    video_id: `in.(${ids.join(",")})`,
    order: "captured_at.desc",
  });
  const snapshotResponse = await supabase(`video_stats_snapshots?${snapshotParams.toString()}`);
  if (!snapshotResponse.ok) throw new Error(`Supabase snapshots read failed: ${snapshotResponse.status}`);
  const snapshots = (await snapshotResponse.json()) as Snapshot[];
  const snapshotsByVideo = new Map<string, Snapshot[]>();
  for (const snapshot of snapshots) {
    const list = snapshotsByVideo.get(snapshot.video_id) ?? [];
    if (list.length < 5) list.push(snapshot);
    snapshotsByVideo.set(snapshot.video_id, list);
  }

  const now = new Date().toISOString();
  const rows: DiscoveryRow[] = videoItems.map((video) => {
    const channelId = video.snippet?.channelId ?? "";
    const thumbnail = video.snippet?.thumbnails?.high?.url ?? video.snippet?.thumbnails?.medium?.url ?? video.snippet?.thumbnails?.default?.url ?? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    const score = scoreVideo(video, subscriberByChannel.get(channelId) ?? 0, snapshotsByVideo.get(video.id));
    return {
      id: video.id,
      title: video.snippet?.title ?? "Untitled video",
      channel_title: video.snippet?.channelTitle ?? "Unknown channel",
      channel_id: channelId,
      published_at: video.snippet?.publishedAt ?? now,
      thumbnail,
      description: video.snippet?.description ?? "",
      views: number(video.statistics?.viewCount),
      likes: number(video.statistics?.likeCount),
      comments: number(video.statistics?.commentCount),
      duration: video.contentDetails?.duration ?? null,
      category_id: video.snippet?.categoryId ?? null,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      embeddable: video.status?.embeddable !== false,
      live_broadcast_content: video.snippet?.liveBroadcastContent ?? null,
      topic: TOPIC,
      format: "all",
      region: REGION,
      source: "youtube",
      verified_at: now,
      fetched_at: now,
      last_seen_at: now,
      expires_at: new Date(Date.now() + 36 * 3_600_000).toISOString(),
      metadata: { subscriber_count: subscriberByChannel.get(channelId) ?? null, signal: score.signal, momentum_score: score.momentumScore },
      topic_tags: [TOPIC],
      acquired_at: now,
      stats_refreshed_at: now,
      relevance_score: 1,
      relevance_confidence: 0.8,
    };
  });

  const poolResponse = await supabase("youtube_discovery_pool?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!poolResponse.ok) throw new Error(`Supabase pool upsert failed: ${poolResponse.status} ${await poolResponse.text()}`);

  const channelRows = [...subscriberByChannel.entries()].map(([channel_id, subscriber_count]) => ({
    channel_id,
    captured_at: now,
    subscriber_count,
    video_count: 0,
    category_bucket: TOPIC,
  }));
  if (channelRows.length) {
    const channelResponse = await supabase("channel_stats?on_conflict=channel_id,captured_at", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(channelRows),
    });
    if (!channelResponse.ok) throw new Error(`Supabase channel stats write failed: ${channelResponse.status}`);
  }

  const snapshotRows = rows.map((row) => ({ video_id: row.id, captured_at: now, views: row.views, likes: row.likes, comments: row.comments }));
  const snapshotResponseWrite = await supabase("video_stats_snapshots", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(snapshotRows),
  });
  if (!snapshotResponseWrite.ok) throw new Error(`Supabase snapshot write failed: ${snapshotResponseWrite.status}`);

  await supabase(`discovery_signals?cell_key=eq.${encodeURIComponent(CELL_KEY)}`, { method: "DELETE" });
  const signalRows = rows.map((row) => {
    const score = scoreVideo(
      {
        id: row.id,
        snippet: { publishedAt: row.published_at, liveBroadcastContent: row.live_broadcast_content ?? undefined },
        statistics: { viewCount: String(row.views), likeCount: String(row.likes), commentCount: String(row.comments) },
      },
      Number(row.metadata.subscriber_count ?? 0),
      snapshotsByVideo.get(row.id),
    );
    return {
      channel_id: row.channel_id,
      video_id: row.id,
      signal_type: score.signal,
      momentum_score: score.momentumScore,
      evidence: score.evidence,
      cell_key: CELL_KEY,
      observed_at: now,
      expires_at: row.expires_at,
    };
  });
  const signalResponse = await supabase("discovery_signals", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(signalRows),
  });
  if (!signalResponse.ok) throw new Error(`Supabase signal write failed: ${signalResponse.status}`);

  return { acquired: rows.length, refreshedAt: now, cellKey: CELL_KEY };
}

async function readPool() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return configError();
  const params = new URLSearchParams({
    select: "id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,duration,url,embeddable,live_broadcast_content,topic,format,region,metadata,acquired_at,stats_refreshed_at",
    order: "views.desc",
    limit: "100",
  });
  const response = await supabase(`youtube_discovery_pool?${params.toString()}`);
  if (!response.ok) return NextResponse.json({ ok: false, state: "DATA_UNAVAILABLE" }, { status: 503 });
  const items = await response.json() as DiscoveryRow[];
  const usageResponse = await supabase("api_usage?select=created_at&service=eq.youtube&order=created_at.desc&limit=1");
  const usageRows = usageResponse.ok ? await usageResponse.json() as { created_at: string }[] : [];
  const signalResponse = await supabase("discovery_signals?select=video_id,signal_type,momentum_score&order=momentum_score.desc&limit=2500");
  const signals = signalResponse.ok ? await signalResponse.json() as { video_id: string; signal_type: string; momentum_score: number }[] : [];
  const signalByVideo = new Map(signals.map(x => [x.video_id, x]));
  const enriched = items.map(item => {
    const signal = signalByVideo.get(item.id);
    return signal ? { ...item, metadata: { ...item.metadata, signal: signal.signal_type, momentum_score: signal.momentum_score } } : item;
  });
  return NextResponse.json({
    ok: true,
    source: "RALLIVIO_DISCOVERY_POOL",
    refreshedAt: enriched[0]?.stats_refreshed_at ?? enriched[0]?.fetched_at ?? null,
    apiUsageLatestAt: usageRows[0]?.created_at ?? null,
    items: enriched,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") === `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    try {
      const result = await refresh();
      return NextResponse.json({ ok: true, job: "youtube-discovery-refresh", ...result });
    } catch (error) {
      console.error("youtube-discovery-refresh failed", error);
      return NextResponse.json({ ok: false, state: "ACQUISITION_FAILED" }, { status: 502 });
    }
  }
  return readPool();
}
