import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase/rest";

type Ranking = {
  week_start: string;
  channel_id: string;
  rank: number;
  momentum_score: number;
  evidence: Record<string, unknown>;
  notable_video_id: string | null;
  computed_at: string;
};

type Video = {
  id: string;
  channel_id: string;
  channel_title: string;
  title: string;
  url: string;
  thumbnail: string;
  published_at: string;
  views: number;
};

function currentIndiaWeekStart() {
  const india = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = india.getDay();
  india.setDate(india.getDate() + (day === 0 ? -6 : 1 - day));
  const y = india.getFullYear();
  const m = String(india.getMonth() + 1).padStart(2, "0");
  const d = String(india.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET() {
  try {
    const week = currentIndiaWeekStart();
    const rankings = await supabasePublic<Ranking[]>(
      `weekly_creator_rankings?select=week_start,channel_id,rank,momentum_score,evidence,notable_video_id,computed_at&week_start=eq.${week}&order=rank.asc&limit=20`,
    );

    if (!rankings.length) {
      const pool = await supabasePublic<Video[]>(
        "youtube_discovery_pool?select=id,channel_id,channel_title,title,url,thumbnail,published_at,views&topic=eq.Technology&region=eq.IN&order=published_at.desc&limit=20",
      );
      return NextResponse.json({ ready: false, week, collectedVideos: pool.length, items: [], latest: pool });
    }

    const channelIds = rankings.map((row) => encodeURIComponent(row.channel_id)).join(",");
    const videos = await supabasePublic<Video[]>(
      `youtube_discovery_pool?select=id,channel_id,channel_title,title,url,thumbnail,published_at,views&channel_id=in.(${channelIds})&order=published_at.desc&limit=100`,
    );
    const byVideo = new Map(videos.map((video) => [video.id, video]));

    return NextResponse.json({
      ready: true,
      week,
      updatedAt: rankings[0]?.computed_at ?? null,
      items: rankings.map((row) => ({
        ...row,
        creator: videos.find((video) => video.channel_id === row.channel_id)?.channel_title ?? row.channel_id,
        video: row.notable_video_id ? byVideo.get(row.notable_video_id) ?? null : null,
      })),
    });
  } catch (error) {
    return NextResponse.json({ ready: false, error: error instanceof Error ? error.message : "Unknown data error" }, { status: 503 });
  }
}
