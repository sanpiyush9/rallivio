import { NextResponse } from "next/server";

type ChannelSearchItem = { id?: { channelId?: string }; snippet?: { channelId?: string; title?: string; description?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } } };
type Channel = { id: string; snippet?: { title?: string; description?: string; customUrl?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } }; statistics?: { viewCount?: string; subscriberCount?: string; videoCount?: string } };
type Video = { id: string; snippet?: { title?: string; publishedAt?: string; description?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } }; statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }; status?: { embeddable?: boolean } };

const key = process.env.YOUTUBE_API_KEY;
async function youtube(path: string) {
  if (!key) throw new Error("YOUTUBE_API_NOT_CONFIGURED");
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`YOUTUBE_API_${response.status}`);
  return response.json();
}
const num = (v?: string) => Number.isFinite(Number(v)) ? Number(v) : 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "Travel with Alex").slice(0, 100);
  const channelIdParam = searchParams.get("channelId") || "";
  try {
    let channelId = channelIdParam;
    let channel: Channel | undefined;
    if (channelId) {
      const data = await youtube(`channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`) as { items?: Channel[] };
      channel = data.items?.[0];
    } else {
      const search = await youtube(`search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(q)}`) as { items?: ChannelSearchItem[] };
      channelId = search.items?.[0]?.id?.channelId || "";
      if (channelId) {
        const data = await youtube(`channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`) as { items?: Channel[] };
        channel = data.items?.[0];
      }
    }
    if (!channelId || !channel) return NextResponse.json({ ok: true, source: "YouTube", state: "CREATOR_NOT_FOUND", query: q, items: [] });

    const videosSearch = await youtube(`search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=20`) as { items?: { id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } } }[] };
    const ids = (videosSearch.items || []).map(x => x.id?.videoId).filter((x): x is string => Boolean(x));
    const details = ids.length ? await youtube(`videos?part=snippet,statistics,status&id=${ids.join(",")}`) as { items?: Video[] } : { items: [] };
    const byId = new Map((details.items || []).map(v => [v.id, v]));
    const items = ids.map(id => {
      const v = byId.get(id); const s = videosSearch.items?.find(x => x.id?.videoId === id)?.snippet;
      const views = num(v?.statistics?.viewCount), likes = num(v?.statistics?.likeCount), comments = num(v?.statistics?.commentCount);
      const publishedAt = v?.snippet?.publishedAt || s?.publishedAt || new Date().toISOString();
      const ageHours = Math.max((Date.now() - new Date(publishedAt).getTime()) / 3600000, 0.1);
      const engagement = ((likes + comments) / Math.max(views, 1)) * 100;
      return { id, title: v?.snippet?.title || s?.title || "Untitled video", publishedAt, thumbnail: v?.snippet?.thumbnails?.high?.url || s?.thumbnails?.high?.url || s?.thumbnails?.medium?.url || "", views, likes, comments, engagement: Number(engagement.toFixed(2)), velocity: Math.round(views / ageHours), url: `https://www.youtube.com/watch?v=${id}`, embeddable: v?.status?.embeddable !== false };
    });
    const totalViews = num(channel.statistics?.viewCount), subscribers = num(channel.statistics?.subscriberCount), videos = num(channel.statistics?.videoCount);
    return NextResponse.json({ ok: true, source: "YouTube", query: q, channel: { id: channelId, title: channel.snippet?.title || q, handle: channel.snippet?.customUrl || "", description: channel.snippet?.description || "", avatar: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.medium?.url || "", subscribers, totalViews, videos }, items, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("youtube creator adapter failed", error);
    return NextResponse.json({ ok: false, source: "YouTube", state: error instanceof Error ? error.message : "YOUTUBE_UNAVAILABLE" }, { status: 503 });
  }
}
