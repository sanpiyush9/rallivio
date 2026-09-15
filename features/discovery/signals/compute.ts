import { supabaseService } from "@/lib/supabase/rest";

type PoolVideo = {
  id: string;
  channel_id: string;
  title: string;
  url: string;
  thumbnail: string;
  published_at: string;
  views: number;
};

type Snapshot = { video_id: string; captured_at: string; views: number };
type ChannelStat = { channel_id: string; captured_at: string; subscriber_count: number; video_count: number };

type SignalRow = {
  channel_id: string;
  video_id: string;
  signal_type: string;
  momentum_score: number | null;
  evidence: Record<string, unknown>;
  cell_key: string;
  observed_at: string;
  expires_at: string;
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function subscriberBucket(subscribers: number) {
  if (subscribers <= 0) return 0;
  return Math.floor(Math.log10(Math.max(1, subscribers)));
}

function weekStartIndia(now = new Date()) {
  const india = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = india.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  india.setDate(india.getDate() + diff);
  india.setHours(0, 0, 0, 0);
  const y = india.getFullYear();
  const m = String(india.getMonth() + 1).padStart(2, "0");
  const d = String(india.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function inDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 86_400_000;
}

async function fetchPool() {
  return supabaseService<PoolVideo[]>(
    "youtube_discovery_pool?select=id,channel_id,title,url,thumbnail,published_at,views&topic=eq.Technology&region=eq.IN&order=published_at.desc&limit=100",
    { method: "GET" },
  );
}

async function fetchSnapshots(videoIds: string[]) {
  if (!videoIds.length) return [] as Snapshot[];
  const ids = videoIds.map((id) => encodeURIComponent(id)).join(",");
  return supabaseService<Snapshot[]>(
    `video_stats_snapshots?select=video_id,captured_at,views&video_id=in.(${ids})&order=captured_at.desc&limit=500`,
    { method: "GET" },
  );
}

async function fetchChannelStats(channelIds: string[]) {
  if (!channelIds.length) return [] as ChannelStat[];
  const ids = channelIds.map((id) => encodeURIComponent(id)).join(",");
  return supabaseService<ChannelStat[]>(
    `channel_stats?select=channel_id,captured_at,subscriber_count,video_count&channel_id=in.(${ids})&order=captured_at.desc&limit=500`,
    { method: "GET" },
  );
}

export async function computePhase0Signals() {
  const pool = await fetchPool();
  if (!pool.length) return { channels: 0, signals: 0, rankings: 0 };

  const snapshots = await fetchSnapshots(pool.map((v) => v.id));
  const channelStats = await fetchChannelStats([...new Set(pool.map((v) => v.channel_id))]);
  const byVideo = new Map<string, Snapshot[]>();
  for (const snapshot of snapshots) {
    const list = byVideo.get(snapshot.video_id) ?? [];
    list.push(snapshot);
    byVideo.set(snapshot.video_id, list);
  }
  const byChannel = new Map<string, PoolVideo[]>();
  for (const video of pool) {
    const list = byChannel.get(video.channel_id) ?? [];
    list.push(video);
    byChannel.set(video.channel_id, list);
  }

  const latestChannel = new Map<string, ChannelStat>();
  for (const stat of channelStats) if (!latestChannel.has(stat.channel_id)) latestChannel.set(stat.channel_id, stat);

  const channelScores: Array<{ channelId: string; score: number; evidence: Record<string, unknown>; videoId: string }> = [];
  const allChannelBaselines = new Map<string, number[]>();
  const channelMedians = new Map<string, number>();

  for (const [channelId, videos] of byChannel) {
    const recent = videos.filter((video) => inDays(video.published_at, 30)).slice(0, 10);
    if (recent.length < 3) continue;
    const medianViews = median(recent.map((video) => Number(video.views) || 0));
    const stat = latestChannel.get(channelId);
    if (!stat || stat.subscriber_count <= 0 || medianViews < 100) continue;
    channelMedians.set(channelId, medianViews);
    const bucket = subscriberBucket(stat.subscriber_count);
    const key = `Technology:${bucket}`;
    const baseline = allChannelBaselines.get(key) ?? [];
    baseline.push(medianViews);
    allChannelBaselines.set(key, baseline);
  }

  for (const [channelId, medianViews] of channelMedians) {
    const stat = latestChannel.get(channelId)!;
    const bucket = subscriberBucket(stat.subscriber_count);
    const expected = median(allChannelBaselines.get(`Technology:${bucket}`) ?? []);
    if (!expected) continue;
    const residual = Math.log(Math.max(1, medianViews) / expected);
    const n = Math.min(10, byChannel.get(channelId)?.filter((v) => inDays(v.published_at, 30)).length ?? 0);
    const shrunk = residual * (n / (n + 5));
    const notable = byChannel.get(channelId)![0];
    channelScores.push({
      channelId,
      score: shrunk,
      videoId: notable.id,
      evidence: {
        median_views: medianViews,
        peer_expected_views: expected,
        subscriber_count: stat.subscriber_count,
        subscriber_bucket: bucket,
        recent_video_count: n,
        residual,
        shrinkage_k: 5,
      },
    });
  }

  channelScores.sort((a, b) => b.score - a.score);
  const observedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const top = channelScores.slice(0, 20);
  const signalRows: SignalRow[] = top.map((item) => ({
    channel_id: item.channelId,
    video_id: item.videoId,
    signal_type: "Under the Radar",
    momentum_score: item.score,
    evidence: { ...item.evidence, metric: "RALLIVIO Momentum Score" },
    cell_key: "Technology|IN|all|en",
    observed_at: observedAt,
    expires_at: expiresAt,
  }));

  if (signalRows.length) {
    await supabaseService("discovery_signals", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(signalRows),
    });
  }

  const week = weekStartIndia();
  if (top.length) {
    await supabaseService("weekly_creator_rankings", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(top.map((item, index) => ({
        week_start: week,
        channel_id: item.channelId,
        rank: index + 1,
        momentum_score: item.score,
        evidence: { ...item.evidence, metric: "RALLIVIO Momentum Score" },
        notable_video_id: item.videoId,
        computed_at: observedAt,
      }))),
    });
  }

  return { channels: channelScores.length, signals: signalRows.length, rankings: top.length, week };
}
