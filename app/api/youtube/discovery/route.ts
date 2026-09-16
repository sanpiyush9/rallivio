import { NextResponse } from "next/server";

type SearchItem = {
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

type Video = {
  id: string;
  snippet?: {
    channelTitle?: string;
    title?: string;
    description?: string;
    publishedAt?: string;
    liveBroadcastContent?: "live" | "upcoming" | "none";
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  status?: { embeddable?: boolean };
};

const key = process.env.YOUTUBE_API_KEY;

async function youtube(path: string) {
  if (!key) throw new Error("YOUTUBE_API_NOT_CONFIGURED");
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}${separator}key=${encodeURIComponent(key)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`YOUTUBE_API_${response.status}`);
  return response.json();
}

const number = (value?: string) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "creator economy").slice(0, 100);
  const mode = searchParams.get("mode") || "all";

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q,
      type: "video",
      maxResults: "12",
      videoEmbeddable: "true",
      relevanceLanguage: "en",
    });
    if (mode === "live") params.set("eventType", "live");

    const search = (await youtube(`search?${params.toString()}`)) as { items?: SearchItem[] };
    const ids = (search.items ?? []).map(x => x.id?.videoId).filter((id): id is string => Boolean(id));
    if (!ids.length) return NextResponse.json({ ok: true, source: "YouTube", persisted: false, items: [] });

    const videoParams = new URLSearchParams({ part: "snippet,statistics,status", id: ids.join(",") });
    const details = (await youtube(`videos?${videoParams.toString()}`)) as { items?: Video[] };
    const byId = new Map((details.items ?? []).map(video => [video.id, video]));

    const items = ids.map(id => {
      const video = byId.get(id);
      const source = search.items?.find(x => x.id?.videoId === id)?.snippet;
      const title = video?.snippet?.title ?? source?.title ?? "Untitled video";
      const published = video?.snippet?.publishedAt ?? source?.publishedAt ?? new Date().toISOString();
      const views = number(video?.statistics?.viewCount);
      const likes = number(video?.statistics?.likeCount);
      const comments = number(video?.statistics?.commentCount);
      const ageHours = Math.max((Date.now() - new Date(published).getTime()) / 3_600_000, 0.1);
      const velocity = views / ageHours;
      const engagement = ((likes + comments) / Math.max(views, 1)) * 100;
      const signal = video?.snippet?.liveBroadcastContent === "live" ? "Live" : velocity > 1000 ? "Moving" : "Observed";
      return {
        id,
        title,
        channel_title: video?.snippet?.channelTitle ?? source?.channelTitle ?? "Unknown creator",
        published_at: published,
        thumbnail: video?.snippet?.thumbnails?.high?.url ?? source?.thumbnails?.high?.url ?? source?.thumbnails?.medium?.url ?? "",
        description: video?.snippet?.description ?? source?.description ?? "",
        views,
        likes,
        comments,
        url: `https://www.youtube.com/watch?v=${id}`,
        embeddable: video?.status?.embeddable !== false,
        live_broadcast_content: video?.snippet?.liveBroadcastContent ?? "none",
        metadata: { signal, observed_velocity: Math.round(velocity), engagement_rate: Number(engagement.toFixed(2)) },
      };
    });

    return NextResponse.json({
      ok: true,
      source: "YouTube",
      persisted: false,
      audiovisual_storage: false,
      query: q,
      mode,
      fetched_at: new Date().toISOString(),
      items,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("youtube discovery adapter failed", error);
    return NextResponse.json({ ok: false, state: error instanceof Error ? error.message : "YOUTUBE_UNAVAILABLE", persisted: false }, { status: 503 });
  }
}
