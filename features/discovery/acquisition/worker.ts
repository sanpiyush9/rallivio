import { reserveYouTubeQuota } from "@/features/discovery/acquisition/budget";
import { computePhase0Signals } from "@/features/discovery/signals/compute";
import { supabaseService } from "@/lib/supabase/rest";
import { getChannels, getVideos, searchRecentTechnologyIndia } from "@/lib/youtube/client";

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export async function runYouTubeAcquisition() {
  const startedAt = new Date().toISOString();
  await supabaseService("system_health", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      check_name: "youtube_acquisition",
      status: "running",
      value: { started_at: startedAt },
      threshold: { daily_search_calls: 60, daily_units: 10000 },
      checked_at: startedAt,
    }),
  });

  try {
    await reserveYouTubeQuota(100, 1);
    const search = await searchRecentTechnologyIndia(isoDaysAgo(7));
    const ids = [...new Set(search.items.map((item) => item.id.videoId).filter(Boolean) as string[])];
    await reserveYouTubeQuota(Math.ceil(ids.length / 50));
    const videos = await getVideos(ids);
    const channelIds = [...new Set(videos.map((video) => video.snippet?.channelId).filter(Boolean) as string[])];
    await reserveYouTubeQuota(Math.ceil(channelIds.length / 50));
    const channels = await getChannels(channelIds);

    const now = new Date().toISOString();
    const poolRows = videos.map((video) => {
      const snippet = video.snippet;
      const stats = video.statistics;
      if (!snippet) return null;
      return {
        id: video.id,
        title: snippet.title,
        channel_title: snippet.channelTitle,
        channel_id: snippet.channelId,
        published_at: snippet.publishedAt,
        thumbnail: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? "",
        description: snippet.description ?? "",
        views: Number(stats?.viewCount ?? 0),
        likes: Number(stats?.likeCount ?? 0),
        comments: Number(stats?.commentCount ?? 0),
        duration: video.contentDetails?.duration ?? null,
        category_id: snippet.categoryId ?? null,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        embeddable: video.status?.embeddable ?? false,
        live_broadcast_content: snippet.liveBroadcastContent ?? null,
        topic: "Technology",
        format: "video",
        region: "IN",
        source: "youtube",
        verified_at: now,
        fetched_at: now,
        last_seen_at: now,
        expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
        metadata: { acquisition: "scheduled_worker", search_query: "technology", region_code: "IN" },
        topic_tags: ["Technology"],
        acquired_at: now,
        stats_refreshed_at: now,
        language: "en",
        language_confidence: 0.7,
        relevance_score: null,
        relevance_confidence: null,
      };
    }).filter(Boolean);

    if (poolRows.length) {
      await supabaseService("youtube_discovery_pool", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(poolRows),
      });
    }

    if (videos.length) {
      const snapshots = videos.map((video) => ({
        video_id: video.id,
        captured_at: now,
        views: Number(video.statistics?.viewCount ?? 0),
        likes: Number(video.statistics?.likeCount ?? 0),
        comments: Number(video.statistics?.commentCount ?? 0),
      }));
      await supabaseService("video_stats_snapshots", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify(snapshots),
      });
    }

    if (channels.length) {
      const channelRows = channels.map((channel) => ({
        channel_id: channel.id,
        captured_at: now,
        subscriber_count: Number(channel.statistics?.subscriberCount ?? 0),
        video_count: Number(channel.statistics?.videoCount ?? 0),
        category_bucket: "Technology",
      }));
      await supabaseService("channel_stats", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify(channelRows),
      });
    }

    await supabaseService("discovery_pool_health", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        cell_key: "Technology|IN|all|en",
        topic: "Technology",
        format: "all",
        region: "IN",
        language: "en",
        candidate_count: poolRows.length,
        signal_ready_count: 0,
        last_acquired_at: now,
        last_stats_refresh_at: now,
        last_error_at: null,
        last_error: null,
        updated_at: now,
      }),
    });

    const signals = await computePhase0Signals();
    const result = {
      ok: true,
      searched: search.items.length,
      videos: videos.length,
      channels: channels.length,
      scoredChannels: signals.channels,
      signals: signals.signals,
      rankings: signals.rankings,
      week: signals.week,
    };
    await supabaseService("system_health", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        check_name: "youtube_acquisition",
        status: "healthy",
        value: { ...result, completed_at: new Date().toISOString() },
        threshold: { daily_search_calls: 60, daily_units: 10000 },
        checked_at: new Date().toISOString(),
      }),
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabaseService("system_health", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        check_name: "youtube_acquisition",
        status: message.includes("quota") ? "degraded" : "failed",
        value: { error: message },
        threshold: { daily_search_calls: 60, daily_units: 10000 },
        checked_at: new Date().toISOString(),
      }),
    });
    throw error;
  }
}
