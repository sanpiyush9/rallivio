import { notFound } from "next/navigation";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type DiscoveryPageItem = {
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
  url: string;
  embeddable: boolean;
  live_broadcast_content: string | null;
  topic: string;
  region: string;
  metadata: Record<string, unknown>;
  acquired_at: string;
  stats_refreshed_at: string | null;
};

export type DiscoverySignal = {
  video_id: string;
  signal_type: string;
  momentum_score: number;
  evidence: Record<string, unknown>;
  observed_at: string;
};

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function supabase(path: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server configuration is missing");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Discovery read failed: ${response.status}`);
  return response.json();
}

export async function getVideo(id: string) {
  const rows = await supabase(
    `youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,url,embeddable,live_broadcast_content,topic,region,metadata,acquired_at,stats_refreshed_at&id=eq.${encodeURIComponent(id)}&limit=1`,
  ) as DiscoveryPageItem[];
  if (!rows[0]) notFound();
  const signals = await supabase(
    `discovery_signals?select=video_id,signal_type,momentum_score,evidence,observed_at&video_id=eq.${encodeURIComponent(id)}&order=observed_at.desc&limit=1`,
  ) as DiscoverySignal[];
  return { item: rows[0], signal: signals[0] ?? null };
}

export async function getCreator(handle: string) {
  const rows = await supabase(
    "youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,url,embeddable,live_broadcast_content,topic,region,metadata,acquired_at,stats_refreshed_at&order=views.desc&limit=1000",
  ) as DiscoveryPageItem[];
  const creator = rows.find((row) => slugify(row.channel_title) === handle);
  if (!creator) notFound();
  const videos = rows.filter((row) => row.channel_id === creator.channel_id).slice(0, 24);
  const ids = videos.map((row) => row.id);
  const signals = ids.length
    ? await supabase(`discovery_signals?select=video_id,signal_type,momentum_score,evidence,observed_at&video_id=in.(${ids.join(",")})&order=momentum_score.desc&limit=1000`) as DiscoverySignal[]
    : [];
  const signalByVideo = new Map(signals.map((signal) => [signal.video_id, signal]));
  return { creator, videos, signalByVideo };
}

export const topicMap: Record<string, { label: string; topic: string }> = {
  "film-animation": { label: "Film & Animation", topic: "1" },
  automotive: { label: "Automotive", topic: "2" },
  music: { label: "Music", topic: "10" },
  pets: { label: "Pets & Animals", topic: "15" },
  sports: { label: "Sports", topic: "17" },
  travel: { label: "Travel & Events", topic: "19" },
  gaming: { label: "Gaming", topic: "20" },
  "people-blogs": { label: "People & Blogs", topic: "22" },
  comedy: { label: "Comedy", topic: "23" },
  entertainment: { label: "Entertainment", topic: "24" },
  news: { label: "News & Politics", topic: "25" },
  "diy-style": { label: "Howto & Style", topic: "26" },
  education: { label: "Education", topic: "27" },
  "ai-tech": { label: "AI & Tech", topic: "28" },
  "nonprofits-activism": { label: "Nonprofits & Activism", topic: "29" },
};

export async function getTopic(slug: string) {
  const topic = topicMap[slug];
  if (!topic) notFound();
  const rows = await supabase(
    `youtube_discovery_pool?select=id,title,channel_title,channel_id,published_at,thumbnail,description,views,likes,comments,url,embeddable,live_broadcast_content,topic,region,metadata,acquired_at,stats_refreshed_at&topic=eq.${topic.topic}&order=views.desc&limit=500`,
  ) as DiscoveryPageItem[];
  const ids = rows.map((row) => row.id);
  const signals = ids.length
    ? await supabase(`discovery_signals?select=video_id,signal_type,momentum_score,evidence,observed_at&video_id=in.(${ids.join(",")})&order=momentum_score.desc&limit=1000`) as DiscoverySignal[]
    : [];
  const signalByVideo = new Map(signals.map((signal) => [signal.video_id, signal]));
  return { topic, rows, signalByVideo };
}
