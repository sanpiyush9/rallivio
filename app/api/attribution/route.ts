import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/rest";

function safeYouTubeId(value: string | null) {
  return value && /^[A-Za-z0-9_-]{6,64}$/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const channelId = safeYouTubeId(request.nextUrl.searchParams.get("channel_id"));
  const videoId = safeYouTubeId(request.nextUrl.searchParams.get("video_id"));
  const sourcePage = request.nextUrl.searchParams.get("source_page") || "/";
  const destination = videoId ? `https://www.youtube.com/watch?v=${videoId}` : channelId ? `https://www.youtube.com/channel/${channelId}` : null;

  if (!channelId || !destination) return NextResponse.json({ error: "Invalid attribution target" }, { status: 400 });

  try {
    await supabaseService("click_attribution", {
      method: "POST",
      body: JSON.stringify({ video_id: videoId, channel_id: channelId, source_page: sourcePage.slice(0, 200) }),
    });
  } catch (error) {
    console.error("click_attribution_failed", error);
  }

  return NextResponse.redirect(destination, 307);
}
