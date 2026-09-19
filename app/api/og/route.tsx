import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchJson(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("video");
  const creator = request.nextUrl.searchParams.get("creator");
  const topic = request.nextUrl.searchParams.get("topic");
  const query = videoId
    ? `youtube_discovery_pool?select=title,channel_title,views&id=eq.${encodeURIComponent(videoId)}&limit=1`
    : creator
      ? `youtube_discovery_pool?select=title,channel_title,views&channel_title=eq.${encodeURIComponent(creator)}&order=views.desc&limit=1`
      : topic
        ? `youtube_discovery_pool?select=title,channel_title,views&topic=eq.${encodeURIComponent(topic)}&order=views.desc&limit=1`
        : "youtube_discovery_pool?select=title,channel_title,views&order=views.desc&limit=1";

  const rows = await fetchJson(query);
  const item = Array.isArray(rows) ? rows[0] : null;
  const title = item?.title || "See what's moving.";
  const creatorName = item?.channel_title || creator || "RALLIVIO";
  const views = Number(item?.views || 0);
  const compactViews =
    views >= 1e9 ? `${(views / 1e9).toFixed(1)}B views` :
    views >= 1e6 ? `${(views / 1e6).toFixed(1)}M views` :
    views >= 1e3 ? `${(views / 1e3).toFixed(1)}K views` :
    views ? `${views.toLocaleString()} views` : "Verified creator discovery";

  return new ImageResponse(
    (
      <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px", background: "linear-gradient(135deg,#07071a 0%,#111034 55%,#21114b 100%)", color: "white", fontFamily: "Arial" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: "34px", fontWeight: 900 }}>RALL<span style={{ color: "#a45cff" }}>IVIO</span></div>
          <div style={{ fontSize: "22px", color: "#9fa2bd" }}>Verified creator discovery</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1000px" }}>
          <div style={{ fontSize: "54px", fontWeight: 800, lineHeight: 1.08 }}>{title.slice(0, 90)}</div>
          <div style={{ fontSize: "28px", color: "#c8cae0" }}>{creatorName} · {compactViews}</div>
        </div>
        <div style={{ display: "flex", fontSize: "20px", color: "#77e6b0" }}>See what's moving · RALLIVIO</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
