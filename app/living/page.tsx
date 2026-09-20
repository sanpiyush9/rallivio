"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type YouTubeDiscoveryItem = {
  id: string; title: string; channelTitle: string; publishedAt: string; thumbnail: string;
  description?: string; views?: number; likes?: number; comments?: number; engagement?: number;
  velocity?: number; url: string; embeddable?: boolean; categoryId?: string; live?: boolean;
  channelSubscribers?: number; signal?: string; momentumScore?: number;
};
type Item = {
  id: string; title: string; channel_title: string; published_at: string; thumbnail: string;
  description: string; views: number; likes: number; comments: number; engagement: number; velocity: number;
  live: boolean; url: string; embeddable: boolean; topic: string; region?: string;
  metadata?: { subscriber_count?: number | null; signal?: string; signals?: string[]; momentum_score?: number; signal_evidence?: Record<string, unknown> | null; promoted?: boolean; promotion_campaign_id?: string; promotion_label?: string };
  stats_refreshed_at?: string;
};
type DiscoveryPoolItem = {
  id: string;
  title: string;
  channel_title: string;
  published_at: string;
  thumbnail: string;
  description?: string;
  views?: number;
  likes?: number;
  comments?: number;
  url: string;
  embeddable?: boolean;
  live_broadcast_content?: string | null;
  topic?: string;
  region?: string;
  metadata?: { subscriber_count?: number | null; signal?: string; signals?: string[]; momentum_score?: number; signal_evidence?: Record<string, unknown> | null; promoted?: boolean; promotion_campaign_id?: string; promotion_label?: string };
  stats_refreshed_at?: string | null;
};

type Category = { name: string; icon: string; keywords: string[] };
type Platform = { id: string; name: string; kind: string; connected: boolean; x: number; y: number };

const DiscoverGlobe = dynamic(() => import("../../components/DiscoverGlobe"), { ssr: false });

const platforms: Platform[] = [
  { id: "youtube", name: "YouTube", kind: "youtube", x: 50.0, y: 8.5, connected: true },
  { id: "tiktok", name: "TikTok", kind: "tiktok", x: 71.5, y: 14.5, connected: false },
  { id: "linkedin", name: "LinkedIn", kind: "linkedin", x: 86.0, y: 32.0, connected: false },
  { id: "reddit", name: "Reddit", kind: "reddit", x: 89.0, y: 53.0, connected: false },
  { id: "discord", name: "Discord", kind: "discord", x: 82.0, y: 72.5, connected: false },
  { id: "pinterest", name: "Pinterest", kind: "pinterest", x: 50.0, y: 87.0, connected: false },
  { id: "spotify", name: "Spotify", kind: "spotify", x: 29.0, y: 82.0, connected: false },
  { id: "twitch", name: "Twitch", kind: "twitch", x: 17.0, y: 68.0, connected: false },
  { id: "x", name: "X", kind: "x", x: 15.0, y: 31.0, connected: false },
  { id: "instagram", name: "Instagram", kind: "instagram", x: 29.0, y: 14.0, connected: false },
];

const categories: Category[] = [
  { name: "Trending", icon: "✦", keywords: [] },
  { name: "AI & Tech", icon: "⌘", keywords: ["ai", "tech", "technology", "chatgpt", "robot", "phone", "chip"] },
  { name: "Travel", icon: "✈", keywords: ["travel", "trip", "flight", "hotel", "tour"] },
  { name: "Food", icon: "◒", keywords: ["food", "recipe", "cooking", "chef", "restaurant"] },
  { name: "Gaming", icon: "⌖", keywords: ["gaming", "game", "xbox", "playstation", "minecraft"] },
  { name: "Fitness", icon: "♧", keywords: ["fitness", "workout", "gym", "training"] },
  { name: "Podcasts", icon: "◉", keywords: ["podcast", "episode", "interview"] },
  { name: "Lifestyle", icon: "◇", keywords: ["lifestyle", "daily", "routine", "home", "life"] },
  { name: "Music", icon: "♫", keywords: ["music", "song", "singer", "album", "concert"] },
  { name: "Fashion", icon: "◈", keywords: ["fashion", "style", "outfit", "beauty"] },
  { name: "Education", icon: "∑", keywords: ["education", "learn", "tutorial", "course", "study"] },
  { name: "Business", icon: "▣", keywords: ["business", "startup", "entrepreneur", "company"] },
  { name: "Finance", icon: "₹", keywords: ["finance", "stock", "money", "invest", "crypto"] },
  { name: "Sports", icon: "◈", keywords: ["sports", "football", "cricket", "basketball", "tennis"] },
  { name: "Comedy", icon: "☺", keywords: ["comedy", "funny", "joke", "humor"] },
  { name: "Science", icon: "⚗", keywords: ["science", "space", "physics", "research"] },
  { name: "Automotive", icon: "⌁", keywords: ["car", "auto", "motorcycle", "bike", "vehicle"] },
  { name: "Beauty", icon: "✧", keywords: ["beauty", "makeup", "skincare", "hair"] },
  { name: "Entertainment", icon: "▸", keywords: ["movie", "film", "actor", "entertainment", "show"] },
  { name: "DIY & Home", icon: "⌂", keywords: ["diy", "home", "garden", "construction", "craft"] },
  { name: "News", icon: "≡", keywords: ["news", "breaking", "update"] },
  { name: "Pets", icon: "♡", keywords: ["pet", "dog", "cat", "animal"] },
];

const themeDefinitions = [
  { id: "nebula", name: "Nebula Pulse", short: "Nebula", desc: "blue / cyan", mode: "explore", accent: "violet" },
  { id: "aurora", name: "Aurora Matrix", short: "Aurora", desc: "cyan / emerald", mode: "flow", accent: "cyan" },
  { id: "neon", name: "Neon Reactor", short: "Neon", desc: "magenta / ember", mode: "reactor", accent: "magenta" },
  { id: "lunar", name: "Lunar Glass", short: "Lunar", desc: "ice / silver", mode: "calm", accent: "ice" },
] as const;
const nav = [["Discover", "/"], ["Creators", "/creators"], ["Brands & Opportunities", "/opportunities"], ["Community", "/community"], ["About", "/about"]] as const;
const signalKey = (s?: string) => (s || "").toLowerCase().replace(/[_-]/g, " ").trim();
const signalMatches = (item: Item, signal: string) => signalKey(item.metadata?.signal) === signalKey(signal);
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`; };
const youtubeCategoryMap: Record<string, string> = {
  "1": "Entertainment", "2": "Automotive", "10": "Music", "15": "Pets", "17": "Sports",
  "18": "Entertainment", "19": "Travel", "20": "Gaming", "21": "Lifestyle", "22": "Lifestyle",
  "23": "Comedy", "24": "Entertainment", "25": "News", "26": "DIY & Home", "27": "Education",
  "28": "AI & Tech", "29": "Business",
};
const categoryFor = (x: Item) => {
  const mapped = youtubeCategoryMap[x.topic];
  if (mapped) return mapped;
  const text = `${x.topic} ${x.title} ${x.description}`.toLowerCase().replace(/[^a-z0-9&+]+/g, " ");
  return categories.find(c => c.name !== "Trending" && c.keywords.some(k => text.includes(k)))?.name || "Other";
};

function PlatformIcon({ kind }: { kind: string }) {
  const common = { width: 30, height: 30, viewBox: "0 0 32 32", fill: "none", "aria-hidden": true as const };
  switch (kind) {
    case "youtube": return <svg {...common}><rect x="3" y="7" width="26" height="18" rx="5" fill="currentColor"/><path d="M13 11.5 22 16l-9 4.5v-9Z" fill="#fff"/></svg>;
    case "instagram": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="3"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="3"/><circle cx="23" cy="9" r="1.7" fill="currentColor"/></svg>;
    case "tiktok": return <svg {...common}><path d="M19 5c.4 3.3 2.1 5.2 5 5.7v4.2c-2.2-.1-4-.8-5.6-2v7.3a6.1 6.1 0 1 1-5.2-6v4.2a2 2 0 1 0 1 1.8V5H19Z" fill="currentColor"/></svg>;
    case "x": return <svg {...common}><path d="M7 6h5.1l4.1 5.8L21.1 6H25l-7 8.1L25.4 26h-5.1l-4.9-6.8L9.4 26H5.5l7.4-8.5L7 6Z" fill="currentColor"/></svg>;
    case "linkedin": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="3" fill="currentColor"/><circle cx="10" cy="11" r="1.7" fill="#fff"/><path d="M8.7 14h2.7v9H8.7v-9Zm4.5 0h2.6v1.2c.8-1 1.8-1.6 3.4-1.6 2.7 0 3.9 1.7 3.9 4.6V23h-2.7v-4.4c0-1.4-.5-2.3-1.7-2.3-1.3 0-1.8 1-1.8 2.4V23h-2.7v-9Z" fill="#fff"/></svg>;
    case "spotify": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M10 13c4.4-1.1 8.2-.7 11.7.9M10.8 17c3.6-.8 6.8-.5 9.7.7M12 20.5c2.5-.5 4.8-.2 6.8.6" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>;
    case "twitch": return <svg {...common}><path d="M5 5h22v16l-5 5h-6l-4 3v-3H5V5Z" fill="currentColor"/><path d="M10 10h3v7h-3v-7Zm7 0h3v7h-3v-7Z" fill="#fff"/></svg>;
    case "facebook": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M18 10h2V6.5c-.7-.1-1.6-.2-2.7-.2-3.1 0-5.2 1.9-5.2 5.4v2.9H9v3.8h3.1V26h3.9v-7.6h3.2l.5-3.8H16v-2.4c0-1.1.3-2.2 2-2.2Z" fill="#fff"/></svg>;
    case "pinterest": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M14 24c.7-2 1-3.1 1.4-4.8-.9-.8-1.4-2-1.4-3.5 0-2.7 1.8-4.9 4.2-4.9 2 0 3.4 1.5 3.4 3.5 0 2.3-1.1 5.1-3.1 5.1-1 0-1.8-.8-1.6-1.9l.6-2.5c.3-1 .1-1.8-.8-1.8-1 0-1.7 1-1.7 2.3 0 .9.3 1.5.3 1.5l-1.1 4.5c-.3 1.2-.1 2.7 0 3.5Z" fill="#fff"/></svg>;
    case "reddit": return <svg {...common}><circle cx="16" cy="17" r="9" fill="currentColor"/><path d="M11.5 16.5h.1m8.8 0h.1M13 20c1.8 1.4 4.2 1.4 6 0M19.5 11l1-3 3 .7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "discord": return <svg {...common}><path d="M6.5 8.5c4.2-2.2 14.8-2.2 19 0l2 13c-3.4 2.5-6.6 3.4-9.5 3.6l-1.5-2.1c1.5-.4 2.7-1 3.7-1.7-4 .9-5.9.9-10 0 1 .7 2.2 1.3 3.7 1.7L12.4 25c-2.9-.2-6.1-1.1-9.5-3.6l2-13Z" fill="currentColor"/><circle cx="12" cy="16" r="1.7" fill="#fff"/><circle cx="20" cy="16" r="1.7" fill="#fff"/></svg>;
    case "snapchat": return <svg {...common}><path d="M16 4.8c-4.2 0-6.7 3-6.7 7.2v2.3c0 .7-.4 1.2-1.2 1.7-.7.4-1.3.7-1.3 1.3 0 .7 1.2 1 2.1 1.2.7.2 1.2.5 1.4 1.1.2.8.5 1.2 1.3 1.2 1.1 0 1.8-.7 2.9-.7.9 0 1.7.8 3.5.8s2.6-.8 3.5-.8c1.1 0 1.8.7 2.9.7.8 0 1.1-.4 1.3-1.2.2-.6.7-.9 1.4-1.1.9-.2 2.1-.5 2.1-1.2 0-.6-.6-.9-1.3-1.3-.8-.5-1.2-1-1.2-1.7V12c0-4.2-2.5-7.2-6.7-7.2Z" fill="currentColor"/></svg>;
    default: return <span className="genericMark">•</span>;
  }
}

export default function LivingDiscover() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [promotedItems, setPromotedItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("Trending");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("YouTube");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [theme, setTheme] = useState("nebula");
  const [showThemes, setShowThemes] = useState(false);
  const [pulseOffset, setPulseOffset] = useState(0);
  const [radarOffset, setRadarOffset] = useState(0);
  const [topicOffset, setTopicOffset] = useState(0);
  const [spotlightOffset, setSpotlightOffset] = useState(0);
  const [selectedPulse, setSelectedPulse] = useState<Item | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [apiUsageLatestAt, setApiUsageLatestAt] = useState<number | null>(null);
  const [verifiedSignalCount, setVerifiedSignalCount] = useState(0);
  const [signalCounts, setSignalCounts] = useState<Record<string, number>>({});
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [poolCount, setPoolCount] = useState(0);
  const [trackedCreators, setTrackedCreators] = useState(0);
  const [risingCreatorCount, setRisingCreatorCount] = useState(0);
  const [activeTopicCount, setActiveTopicCount] = useState(0);
  const [globalRegions, setGlobalRegions] = useState<string[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [topicMomentumWindows, setTopicMomentumWindows] = useState<Record<string, number[]>>({});
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [liveFieldIndex, setLiveFieldIndex] = useState(0);
  const [liveFieldPaused, setLiveFieldPaused] = useState(false);
  const pulseViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("rallivio-theme");
    if (savedTheme && ["nebula", "aurora", "neon", "lunar"].includes(savedTheme)) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rallivio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadDiscovery = async (signal: string | null = null, topic: string | null = null) => {
    try {
      const params = new URLSearchParams({ limit: "60" });
      if (signal) params.set("signal", signal);
      if (topic && topic !== "Trending") params.set("topic", topic);
      const query = `?${params.toString()}`;
      const r = await fetch(`/api/discovery${query}`, { cache: "default" });
        const b = await r.json();
        if (!r.ok || !b.ok) throw new Error(b.state || "YOUTUBE_UNAVAILABLE");
        const mapDiscoveryItem = (x: DiscoveryPoolItem): Item => {
          const views = Number(x.views || 0);
          const likes = Number(x.likes || 0);
          const comments = Number(x.comments || 0);
          return {
            id: x.id,
            title: x.title,
            channel_title: x.channel_title,
            published_at: x.published_at,
            thumbnail: x.thumbnail,
            description: x.description || "",
            views,
            likes,
            comments,
            engagement: ((likes + comments) / Math.max(views, 1)) * 100,
            velocity: 0,
            live: x.live_broadcast_content === "live",
            url: x.url,
            embeddable: x.embeddable !== false,
            topic: x.topic || "Unknown",
            region: x.region || "WORLDWIDE",
            metadata: x.metadata || {},
            stats_refreshed_at: x.stats_refreshed_at || b.refreshedAt || undefined,
          };
        };
        setItems(Array.isArray(b.items) ? b.items.map(mapDiscoveryItem) : []);
        setPromotedItems(Array.isArray(b.promotedItems) ? b.promotedItems.map(mapDiscoveryItem) : []);
        setLastUpdatedAt(b.refreshedAt ? Date.parse(b.refreshedAt) : null);
        setApiUsageLatestAt(b.apiUsageLatestAt ? Date.parse(b.apiUsageLatestAt) : null);
        setVerifiedSignalCount(Number(b.verifiedSignalCount || 0));
        setSignalCounts(b.signalCounts && typeof b.signalCounts === "object" ? b.signalCounts : {});
        setPoolCount(Number(b.poolCount || 0));
        setTrackedCreators(Number(b.trackedCreators || 0));
        setRisingCreatorCount(Number(b.risingCreators || 0));
        setActiveTopicCount(Number(b.activeTopics || 0));
        setGlobalRegions(Array.isArray(b.regions) ? b.regions : []);
        setTopicCounts(b.topicCounts && typeof b.topicCounts === "object" ? b.topicCounts : {});
         setTopicMomentumWindows(b.topicMomentumWindows && typeof b.topicMomentumWindows === "object" ? b.topicMomentumWindows : {});
        setNotice("");
    } catch (e) { setNotice(e instanceof Error ? e.message : "DATA_UNAVAILABLE"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;

    // Render the persisted, verified feed first. A separate open-refresh request
    // then asks the server for one small real YouTube observation batch. The
    // server gate allows this globally only once per five minutes, so multiple
    // visitors cannot multiply YouTube quota usage.
    void loadDiscovery(null);

    void fetch("/api/discovery/open-refresh", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ ok?: boolean; state?: string }>;
      })
      .then((result) => {
        if (!cancelled && result?.ok && result.state === "REFRESHED") {
          return loadDiscovery(activeSignal, filter === "Trending" ? null : filter);
        }
        return null;
      })
      .catch(() => undefined);

    const id = window.setInterval(() => {
      void loadDiscovery(activeSignal, filter);
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeSignal, filter]);

  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 4200); return () => window.clearTimeout(id); }, [notice]);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      setPulseOffset(n => n + 1);
      setRadarOffset(n => n + 1);
      setTopicOffset(n => n + 1);
      setSpotlightOffset(n => n + 1);
      const el = pulseViewportRef.current;
      if (el) {
        const amount = Math.max(260, Math.round(el.clientWidth * 0.62));
        if (el.scrollLeft + el.clientWidth + amount >= el.scrollWidth - 8) {
          el.scrollTo({ left: 0, behavior: "auto" });
        } else {
          el.scrollBy({ left: amount, behavior: "smooth" });
        }
      }
    }, 8000);
    return () => window.clearInterval(id);
  }, [items.length]);

  const sourceLive = Boolean(apiUsageLatestAt && Date.now() - apiUsageLatestAt < 2 * 60 * 60 * 1000);
  const fieldState = !apiUsageLatestAt ? "not started" : sourceLive ? "active" : "idle";

  const ranked = useMemo(
    () => items
      .filter(item => Boolean(item.metadata?.signal))
      .sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)),
    [items],
  );
  const heroCandidates = useMemo(() => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const candidates = ranked.filter(x => x.metadata?.signal && x.stats_refreshed_at && Date.parse(x.stats_refreshed_at) >= cutoff);
    const strongest = new Map<string, Item>();
    for (const item of candidates) {
      const key = (item.topic || "Unknown") + "::" + (item.region || "WORLDWIDE");
      const current = strongest.get(key);
      if (!current || (item.metadata?.momentum_score || 0) > (current.metadata?.momentum_score || 0)) strongest.set(key, item);
    }
    return [...strongest.values()].sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)).slice(0, 8);
  }, [ranked]);

  const liveFieldItems = useMemo(() => {
    const source = ranked.filter(x => x.region);
    const result: Item[] = [];
    const regions = new Set<string>();
    for (let offset = 0; offset < source.length && result.length < 8; offset++) {
      const item = source[(liveFieldIndex + offset) % source.length];
      const region = item.region || "WORLDWIDE";
      if (regions.has(region)) continue;
      regions.add(region);
      result.push(item);
    }
    return result;
  }, [ranked, liveFieldIndex]);

  const regionFlag = (region?: string) => {
    const code = (region || "").toUpperCase();
    const flags: Record<string,string> = { US:"🇺🇸", GB:"🇬🇧", IN:"🇮🇳", CA:"🇨🇦", AU:"🇦🇺", DE:"🇩🇪", FR:"🇫🇷", JP:"🇯🇵", KR:"🇰🇷", SG:"🇸🇬", AE:"🇦🇪", BR:"🇧🇷", MX:"🇲🇽", ID:"🇮🇩", PH:"🇵🇭" };
    return flags[code] || "🌐";
  };

  const evidenceLabel = (item: Item) => {
    const signal = signalKey(item.metadata?.signal);
    if (signal.includes("drop")) return age(item.stats_refreshed_at || item.published_at);
    const velocity = Number(item.metadata?.signal_evidence?.velocity);
    if (Number.isFinite(velocity)) return `Velocity ${Math.round(velocity)}/100`;
    const acceleration = Number(item.metadata?.signal_evidence?.acceleration);
    if (Number.isFinite(acceleration)) return `Acceleration +${Math.round(acceleration)}`;
    return `${fmt(item.views)} views`;
  };

  const heroSignal = heroCandidates.length ? heroCandidates[heroIndex % heroCandidates.length] : null;
  const heroHeadline = useMemo(() => {
    if (!heroSignal) return "Listening for signals…";
    const topic = heroSignal.topic || "Creator activity";
    const region = heroSignal.region && heroSignal.region !== "WORLDWIDE" ? heroSignal.region : "worldwide";
    const signal = signalKey(heroSignal.metadata?.signal);
    const verb = signal.includes("break") ? "breaking out" : signal.includes("rise") || signal.includes("rising") ? "rising" : signal.includes("drop") ? "just dropping" : signal.includes("under") ? "surfacing under the radar" : signal.includes("live") ? "live" : "moving";
    return topic + " is " + verb + " in " + region + ".";
  }, [heroSignal]);

  useEffect(() => {
    if (liveFieldPaused || liveFieldItems.length < 2) return;
    const id = window.setInterval(() => setLiveFieldIndex(index => (index + 1) % Math.max(ranked.length, 1)), 4000);
    return () => window.clearInterval(id);
  }, [liveFieldPaused, liveFieldItems.length, ranked.length]);

  useEffect(() => {
    if (heroPaused || heroCandidates.length < 2) return;
    const id = window.setInterval(() => setHeroIndex(index => index + 1), 5500);
    return () => window.clearInterval(id);
  }, [heroPaused, heroCandidates.length]);
  const shown = useMemo(() => {
    const base = filter === "Trending" ? ranked : ranked.filter(x => categoryFor(x) === filter);
    const s = q.trim().toLowerCase();
    return s ? base.filter(x => `${x.title} ${x.channel_title} ${x.description} ${x.topic}`.toLowerCase().includes(s)) : base;
  }, [ranked, filter, q]);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);
  // Signal categories are database-driven. The UI never owns a fixed list:
  // every label currently emitted by the live signal engine appears here,
  // with its current verified count. A label disappears when the engine no
  // longer has any current verified rows for it.
  const signalGroups = useMemo(() => ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped", "Live Now"]
    .map(name => ({ name, count: Number(signalCounts[name] || 0), items: activeSignal === name ? ranked : [] })),
  [signalCounts, activeSignal, ranked]);
  const categoryPulse = useMemo(() => categories.slice(1).map(c => {
    const matches = ranked.filter(x => categoryFor(x) === c.name);
    const momentum = matches.length ? Math.round(matches.reduce((sum, x) => sum + (x.metadata?.momentum_score || 0), 0) / matches.length) : 0;
    return { ...c, count: Number(topicCounts[c.name] || 0), momentum };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count || b.momentum - a.momentum), [ranked, topicCounts]);

  const radarCategories = useMemo(() => {
    if (!categoryPulse.length) return [];
    const source = categoryPulse.map(topic => {
      const windows = topicMomentumWindows[topic.name] || [];
      const change = windows.length >= 2 && windows[0] > 0
        ? ((windows[windows.length - 1] - windows[0]) / windows[0]) * 100
        : null;
      return { ...topic, change };
    }).sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0) || b.momentum - a.momentum);
    return Array.from({ length: Math.min(8, source.length) }, (_, i) => source[(radarOffset + i) % source.length]);
  }, [categoryPulse, topicMomentumWindows, radarOffset]);

  const topicRows = useMemo(() => {
    if (!categoryPulse.length) return [];
    const source = categoryPulse.map(topic => ({ ...topic, windows: topicMomentumWindows[topic.name] || [] })).filter(topic => topic.windows.length >= 2);
    return Array.from({ length: Math.min(5, source.length) }, (_, i) => source[(topicOffset + i) % source.length]);
  }, [categoryPulse, topicMomentumWindows, topicOffset]);

  const momentumChange = (values: number[]) => {
    if (values.length < 2 || values[0] <= 0) return null;
    return ((values[values.length - 1] - values[0]) / values[0]) * 100;
  };

  const sparkPoints = (values: number[]) => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);
    return values.map((value, index) => {
      const x = values.length === 1 ? 2 : 2 + (index * 96) / (values.length - 1);
      const y = 21 - ((value - min) / range) * 17;
      return x.toFixed(1) + "," + y.toFixed(1);
    }).join(" ");
  };

  const creatorPool = useMemo(() => {
    const seen = new Set<string>();
    return [...ranked]
      .filter(x => {
        if (!x.channel_title || seen.has(x.channel_title)) return false;
        seen.add(x.channel_title);
        return true;
      })
      .sort((a, b) => {
        const aScore = Number(a.metadata?.signal_evidence?.audienceRelativeScore);
        const bScore = Number(b.metadata?.signal_evidence?.audienceRelativeScore);
        return (Number.isFinite(bScore) ? bScore : -Infinity) - (Number.isFinite(aScore) ? aScore : -Infinity);
      });
  }, [ranked]);

  const spotlightCreators = useMemo(() => {
    if (!creatorPool.length) return [];
    return Array.from({ length: Math.min(8, creatorPool.length) }, (_, i) => creatorPool[(spotlightOffset + i) % creatorPool.length]);
  }, [creatorPool, spotlightOffset]);

  const risingCreators = risingCreatorCount;

  const pulseCards = useMemo(() => {
    if (!ranked.length) return [];
    const count = Math.min(120, Math.max(24, ranked.length * 3));
    return Array.from({ length: count }, (_, i) => ranked[(pulseOffset + i) % ranked.length]);
  }, [ranked, pulseOffset]);

  const scrollPulse = (direction: -1 | 1) => {
    const el = pulseViewportRef.current;
    if (!el) return;
    const amount = Math.max(260, Math.round(el.clientWidth * 0.62));
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
    setPulseOffset(n => (n + direction + Math.max(ranked.length, 1)) % Math.max(ranked.length, 1));
  };

  const selectPulse = (item: Item) => {
    setSelectedPulse(item);
    window.requestAnimationFrame(() => document.getElementById("pulse-selected")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const go = (p: string) => { router.push(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pulseField = (message: string) => { setPulse(n => n + 1); setNotice(message); };
  const activatePlatform = (p: Platform) => { setActivePlatform(p.name); setPulse(n => n + 1); setNotice(p.connected ? "YouTube is source-connected. The field is responding to verified observations." : `${p.name} is present in the ecosystem. Its source adapter is not connected yet, so no activity is fabricated.`); };
  const command = (s: string) => {
    const raw = s.trim(); if (!raw) return;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      router.push("/promote?url=" + encodeURIComponent(raw));
      return;
    }
    const l = raw.toLowerCase();
    const c = categories.find(x => x.name.toLowerCase() === l || x.name.toLowerCase().includes(l) || l.includes(x.name.toLowerCase()));
    if (c) { setActiveSignal(null); setFilter(c.name); setQ(""); void loadDiscovery(null, c.name); pulseField(`RALLIVIO tuned the field to ${c.name}.`); return; }
    const p = platforms.find(x => l.includes(x.name.toLowerCase()));
    if (p) { activatePlatform(p); return; }
    if (l.includes("creator") || l.includes("profile")) { go("/creators"); return; }
    if (l.includes("brand")) { go("/opportunities"); return; }
    if (l.includes("opportun")) { go("/opportunities"); return; }
    setFilter("Trending"); setQ(s); pulseField(`Searching the verified discovery pool for “${s}”.`);
  };
  const activateCore = () => { setActivePlatform("YouTube"); setActiveSignal(null); setFilter("Trending"); setQ(""); void loadDiscovery(null, null); pulseField("RALLIVIO re-centered. The living field is listening."); };

  return <main className={`rv theme-${theme}`}>
    <button className="themeScrim" type="button" aria-label="Close theme picker" onClick={() => setShowThemes(false)} style={{ display: showThemes ? "block" : "none" }} />
    <style>{css}</style>
    <header className="topbar">
      <button className="brand" type="button" onClick={() => go("/")}>RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></button>
      <nav>{nav.map(([n, p]) => <button key={p} className={p === "/" ? "active" : ""} type="button" onClick={() => go(p)}>{n}</button>)}</nav>
      <form className="search" onSubmit={e => { e.preventDefault(); command(q); }}><span aria-hidden="true">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="What do you want to discover?" aria-label="What do you want to discover?"/><button type="submit" aria-label={q.trim().startsWith("http://") || q.trim().startsWith("https://") ? "Start promotion" : "Open search"}>{q.trim().startsWith("http://") || q.trim().startsWith("https://") ? "↗" : "⌕"}</button></form>
      <div className="topActions">
        <button className="round plansButton" type="button" onClick={() => router.push("/pricing")}>Plans</button>
      <div className="themePickerWrap">
        <button className="round themeButton" type="button" aria-label="Choose field theme" aria-expanded={showThemes} onClick={() => setShowThemes(v => !v)}>
          <span className={"themeButtonGlyph " + theme} aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span><span className="themeButtonLabel">{themeDefinitions.find(x => x.id === theme)?.short || "Theme"}</span><i className={"themeButtonDot " + theme}/>
        </button>
        {showThemes && <div className="themeMenu" role="menu" aria-label="Field theme selector">
          <div className="themeMenuHead">
            <div><small>FIELD CONTROL</small><b>Choose the field mood</b></div>
            <span><i/> ACTIVE</span>
          </div>
          <div className="themeCurrent">
            <span className={"themeCurrentGlow " + theme}/><div><small>CURRENT FIELD</small><strong>{themeDefinitions.find(x => x.id === theme)?.name}</strong><em>{themeDefinitions.find(x => x.id === theme)?.desc}</em></div>
          </div>
          <div className="themeMenuLabel">FIELD MODES</div>
          <div className="themeOptions">
            {themeDefinitions.map(({ id, name, desc, mode }) => (
              <button key={id} className={theme === id ? "themeOption active" : "themeOption"} type="button" role="menuitem" aria-current={theme === id ? "true" : undefined} onClick={() => { setTheme(id); setShowThemes(false); }}>
                <span className={"themePreview " + id}><i/><b/><em/></span>
                <span className="themeOptionCopy"><b>{name}</b><small>{desc}</small></span>
                <span className="themeMode">{mode}</span>
                <span className="themeCheck">{theme === id ? "✓" : ""}</span>
              </button>
            ))}
          </div>
          <div className="themeMenuFoot"><i/> Theme is saved on this device</div>
        </div>}
      </div>
      <button className="round notificationButton" type="button" aria-label="Notifications" onClick={() => setNotice("Notifications are coming soon.")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></button>
      {userEmail ? (
        <button className="loginButton avatarButton" type="button" aria-label="Account" onClick={() => router.push("/account")}>
          {userEmail.split("@")[0]}
        </button>
      ) : (
        <button className="loginButton avatarButton" type="button" aria-label="Login" onClick={() => router.push("/login")}>S</button>
      )}
      </div>
    </header>

    <section className="hero">
      <div className="heroCopy">
        <div className="pill">LIVE <span>The Creator Economy is Moving Right Now</span></div>
        <div className="heroHeadlineWrap" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}>
          <h1 className="heroDynamicTitle"><span>See what&apos;s</span><em>moving.</em><span>Shape what&apos;s next.</span></h1>
        </div>
        <p>RALLIVIO turns the creator internet into a living field — people, culture, signals and opportunities moving together in one place.</p>
        <form className="heroSearch" onSubmit={e => { e.preventDefault(); command(q); }}><span className="searchMark">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search anything — or paste a link to promote…" aria-label="Search anything or paste a promotion link"/><button type="submit" aria-label={q.trim().startsWith("http://") || q.trim().startsWith("https://") ? "Start promotion" : "Search"}>{q.trim().startsWith("http://") || q.trim().startsWith("https://") ? "↗" : "→"}</button></form>
        <div className="categoryRail" aria-label="Discovery categories">
          {visibleCategories.map(c => <button key={c.name} className={filter === c.name ? "active" : ""} type="button" onClick={() => { setActiveSignal(null); setFilter(c.name); setQ(""); void loadDiscovery(null, c.name); pulseField(`Field tuned to ${c.name}.`); }}>{c.name}</button>)}
          <button className="more" type="button" onClick={() => setShowAllCategories(v => !v)}>{showAllCategories ? "Less ↑" : `+${categories.length - 10} more`}</button>
        </div>
        <div className="liveStrip" aria-label="Live discovery activity" onMouseEnter={() => setLiveFieldPaused(true)} onMouseLeave={() => setLiveFieldPaused(false)}>
          <div className="liveStripHead"><span><i/> LIVE FIELD</span><small>{fieldState}{verifiedSignalCount ? ` · ${verifiedSignalCount} verified signals` : ""}</small></div>
          <div className="liveStripViewport">
            <div className="liveStripItems">
              {liveFieldItems.slice(0, 3).map((x) => (
                <button key={x.id} type="button" onClick={() => setModal(x)}>
                  <img src={x.thumbnail} alt="" />
                  <span className="liveTickerCopy">
                    <b className={"signalTone signal-" + (signalKey(x.metadata?.signal).replace(/ /g, "-") || "observed")}>{x.metadata?.signal || "Verified"}</b>
                    <small>{regionFlag(x.region)} {x.region || "WORLDWIDE"} · {x.channel_title}</small>
                    <em>{evidenceLabel(x)}</em>
                  </span>
                </button>
              ))}
              {!liveFieldItems.length && <div className="liveStripEmpty">{!apiUsageLatestAt ? "No acquisition has run yet." : "No verified signals yet."}</div>}
            </div>
          </div>
        </div>     </div>

      <div className="ecosystem">
        <div className={`field ${pulse ? "responding" : ""}`} aria-label="RALLIVIO living platform field" style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", flexShrink: 0 }}>
          <div className="fieldSpace">
            <div className="fieldGrid"/><div className="nebula n1"/><div className="nebula n2"/>
            <div className="energyRing er1"/><div className="energyRing er2"/><div className="energyRing er3"/>
            <div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/>
            <div className="energyArc arc1"/><div className="energyArc arc2"/><div className="energyArc arc3"/>
            {Array.from({ length: 22 }, (_, i) => <i key={i} className={`particle particle${i + 1}`}/>) }
            {platforms.map(p => <button key={p.id} className={`platform ${activePlatform === p.name ? "selected" : ""}`} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", width: 110, textAlign: "center" }} type="button" aria-label={`${p.name} platform`} onClick={() => activatePlatform(p)} onPointerEnter={() => setActivePlatform(p.name)} onFocus={() => setActivePlatform(p.name)}>
              <span className={`platformMark ${p.kind}`}><PlatformIcon kind={p.kind}/></span><b>{p.name}</b><small>{p.connected ? "Creators · Videos" : "Coming soon"}</small>
            </button>)}
            <button className="core" type="button" aria-label="Activate RALLIVIO living discovery core" onClick={activateCore} onPointerDown={() => setPulse(n => n + 1)}>
              <span className="coreHalo h1"/><span className="coreHalo h2"/><span className="coreHalo h3"/><span className="coreLight"/>
              <DiscoverGlobe />
              <strong>RALL<span>IVIO</span></strong><small>LIVING DISCOVERY SYSTEM</small><i><b>●</b> {loading ? "syncing" : `${verifiedSignalCount} verified signals`} · {activePlatform} focus</i>
            </button>
          </div>
        </div>
        <div className="heroScript">A More Connected Tomorrow<i/></div>
        <div className="fieldHint"><span>✦</span> Touch / hover the core or any platform — the field responds</div>
      </div>
    </section>

    <section className="pulseStrip" aria-label="Global creator pulse">
      <div className="pulseStripLabel">
        <small>GLOBAL CREATOR PULSE</small>
        <strong><i/> {sourceLive ? "Live" : "Idle"}</strong>
      </div>
      <div className="pulseMetric"><span>✦</span><b>{loading ? "—" : fmt(risingCreators)}</b><small>Rising Creators</small></div>
      <div className="pulseMetric"><span>♨</span><b>{loading ? "—" : fmt(verifiedSignalCount)}</b><small>Verified Signals</small></div>
      <div className="pulseMetric"><span>✦</span><b>{loading ? "—" : fmt(activeTopicCount)}</b><small>Active Topics</small></div>
      <div className="pulseMetric"><span>♧</span><b>{loading ? "—" : fmt(trackedCreators)}</b><small>Tracked Creators</small></div>
      <div className="pulseWorld">
        <div className="worldMap" aria-hidden="true">
          <svg viewBox="0 0 180 64">
            <path className="continent na" d="M9 13l15-4 12 6 8 10-5 7-8-2-5 8-8-3-3-9-8-5Z" fill="currentColor"/>
            <path className="continent sa" d="M48 35l8 3 5 9-4 10-6 5-3-9-5-8 3-6Z" fill="currentColor"/>
            <path className="continent eu" d="M79 16l10-4 10 3 6 6-5 5-10-2-7 4-7-5Z" fill="currentColor"/>
            <path className="continent af" d="M92 27l12 1 5 9-3 13-8 7-8-9-2-11Z" fill="currentColor"/>
            <path className="continent asia" d="M108 17l15-5 17 5 10 8-4 8-13-2-7 5-10-5-10 1-4-7Z" fill="currentColor"/>
            <path className="continent au" d="M143 47l12-3 10 5-4 7-13 1-7-5Z" fill="currentColor"/>
            <path className="mapRoad r1" d="M19 24C48 9 65 40 96 29S132 12 169 43"/>
            <path className="mapRoad r2" d="M34 49C64 30 86 22 111 40s38 4 55-3"/>
          </svg>
          <i/><i/><i/><i/><i/><i/>
        </div>
        <div><b>Global Activity</b><small>Verified source coverage · {globalRegions.length ? globalRegions.join(", ") : "—"}<br/>{!apiUsageLatestAt ? "No source observations yet." : `${fmt(poolCount)} videos · ${fmt(trackedCreators)} tracked creators`}{lastUpdatedAt ? ` · ${age(new Date(lastUpdatedAt).toISOString())}` : ""}</small></div>
      </div>
    </section>

    {promotedItems.length > 0 && <section className="pulseSection" style={{ marginBottom: 24 }}>
      <div className="pulseSectionHead">
        <div className="pulseTitle"><span className="pulseWave">✦</span><div><h2>RALLIVIO CAMPAIGN SPOTLIGHT</h2><p>Creator campaigns currently receiving RALLIVIO-owned discovery distribution.</p></div></div>
        <div className="pulseHeadActions"><span className="pulseLive"><i/> LIVE CAMPAIGN</span></div>
      </div>
      <div className="pulseCarousel">
        <div className="pulseViewport">
          <div className="pulseCards">
            {promotedItems.map((x, i) => (
              <article className="pulseCard" key={x.id + "-promoted-" + i} onClick={() => {
                const campaignId = x.metadata?.promotion_campaign_id;
                if (campaignId) window.open("/api/campaigns/click?campaign_id=" + encodeURIComponent(campaignId), "_blank", "noopener,noreferrer");
              }} tabIndex={0}>
                <div className="pulseThumb"><img src={x.thumbnail} alt="" /><span>RALLIVIO CAMPAIGN</span><time>{age(x.published_at)}</time></div>
                <h3 title={x.title}>{x.title}</h3>
                <p className="pulseCreator">◉ {x.channel_title}</p>
                <small>{fmt(x.views)} views · {x.engagement.toFixed(1)}% engagement</small>
                <div className="pulseCardMeta"><span>Campaign distribution</span><strong>Watch on YouTube ↗</strong></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>}

    <section className="pulseSection">
      <div className="pulseSectionHead">
        <div className="pulseTitle"><span className="pulseWave">⌁</span><div><h2>RALLIVIO PULSE</h2><p>Real signals. Real movement. Rotating continuously from the verified discovery pool.</p></div></div>
        <div className="pulseHeadActions"><span className="pulseLive"><i/> {sourceLive ? "Live" : "Idle"}{lastUpdatedAt ? ` · ${age(new Date(lastUpdatedAt).toISOString())}` : ""}</span><button className="viewSignalsButton" type="button" onClick={() => document.getElementById("pulse-stream")?.scrollIntoView({ behavior: "smooth", block: "center" })}>View all signals&nbsp; →</button></div>
      </div>
      <div className="pulseTabs">
        {signalGroups.map((g, i) => (
          <button key={g.name} type="button" className={activeSignal === g.name ? "active" : (g.count ? "hasData" : "empty")} onClick={() => {
            setActiveSignal(g.name);
            setFilter("Trending");
            setQ("");
            void loadDiscovery(g.name);
            window.requestAnimationFrame(() => document.getElementById("pulse-stream")?.scrollIntoView({ behavior: "smooth", block: "center" }));
          }}>
            <span className="pulseTabIcon" aria-hidden="true">{i + 1}</span><b>{g.name}</b><small>{fmt(g.count)}</small>
          </button>
        ))}
      </div>
      <div className="pulseCarousel" id="pulse-stream">
        <button className="pulseArrow left" type="button" aria-label="Scroll signals left" onClick={() => scrollPulse(-1)}>←</button>
        <div className="pulseViewport" ref={pulseViewportRef}>
          <div className="pulseCards">
            {pulseCards.map((x, i) => (
              <article className="pulseCard" key={x.id + "-" + i} onClick={() => selectPulse(x)} tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") selectPulse(x); }}>
                <div className="pulseThumb"><img src={x.thumbnail} alt="" /><span>{x.live ? "LIVE" : (x.metadata?.signal || "Observed")}</span><time>{age(x.published_at)}</time></div>
                <h3 title={x.title}>{x.title}</h3>
                <p className="pulseCreator">◉ {x.channel_title}</p>
                <small>{fmt(x.views)} views · {x.engagement.toFixed(1)}% engagement</small>
                <div className="pulseCardMeta"><span>Likes {fmt(x.likes)}</span><span>Comments {fmt(x.comments)}</span><strong>{x.metadata?.momentum_score != null ? Math.round(x.metadata.momentum_score) + " momentum" : "Verified"}</strong></div>
              </article>
            ))}
            {!loading && !pulseCards.length && <div className="pulseEmpty">No verified observations are available yet.</div>}
          </div>
        </div>
        <button className="pulseArrow right" type="button" aria-label="Scroll signals right" onClick={() => scrollPulse(1)}>→</button>
      </div>
      {selectedPulse && <section className="pulseSelected" id="pulse-selected" aria-label="Selected signal">
        <div className="pulseSelectedPlayer">
          {selectedPulse.embeddable ? <iframe src={`https://www.youtube.com/embed/${selectedPulse.id}?autoplay=1&rel=0`} title={selectedPulse.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <img src={selectedPulse.thumbnail} alt=""/>}
        </div>
        <div className="pulseSelectedInfo">
          <span className="eyebrow">{selectedPulse.metadata?.signal || "Observed"} · VERIFIED OBSERVATION</span>
          <h3>{selectedPulse.title}</h3>
          <p>{selectedPulse.channel_title} · {fmt(selectedPulse.views)} views · {age(selectedPulse.published_at)}</p>
          <div><span>{fmt(selectedPulse.likes)} likes</span><span>{fmt(selectedPulse.comments)} comments</span><span>{selectedPulse.engagement.toFixed(1)}% engagement</span><strong>{selectedPulse.metadata?.momentum_score != null ? `RALLIVIO Momentum Score ${Math.round(selectedPulse.metadata.momentum_score)}` : "RALLIVIO signal verified"}</strong></div>
          <button className="sourceButton" type="button" aria-label="Watch selected video on YouTube" onClick={() => window.open(selectedPulse.url, "_blank", "noopener,noreferrer")}>Watch on YouTube ↗</button>
        </div>
      </section>}
      <div className="pulseTicker"><i/> Continuous verified pool · refreshes from source observations · right arrow keeps the stream moving</div>
    </section>

    <section className="radarSection">
      <div className="radarPanel">
        <div className="radarPanelHead"><div><h3>Discovery Radar</h3><p>{apiUsageLatestAt ? "Continuously scanning verified source observations" : "Awaiting first acquisition"}</p></div><span className="scanState">{apiUsageLatestAt ? <><i/> SCANNING</> : "Awaiting first acquisition"}</span></div>
        <div className={`radarVisual liveRadar ${apiUsageLatestAt ? "" : "radarIdle"}`}>{apiUsageLatestAt ? <><div className="radarSweep"/><div className="radarRings"><i/><i/><i/><i/><b/></div><div className="radarGlow one"/><div className="radarGlow two"/><div className="radarGlow three"/></> : <span className="radarEmpty">No acquisition activity yet.</span>}</div>
        <div className="radarList">
          {radarCategories.length ? radarCategories.map((c, i) => {
            const pct = verifiedSignalCount ? Math.round((c.count / verifiedSignalCount) * 100) : 0;
            return <button key={c.name} type="button" onClick={() => { setActiveSignal(null); setFilter(c.name); setQ(""); void loadDiscovery(null, c.name); pulseField("Field tuned to " + c.name + "."); }}><span className="radarRank" aria-hidden="true">{c.icon}</span><b>{c.name}</b><strong>{c.change == null ? "—" : (c.change >= 0 ? "▲ " : "▼ ") + Math.abs(c.change).toFixed(0) + "%"}</strong></button>;
          }) : <div className="radarEmpty">No data yet.</div>}
        </div>
      </div>
      <div className="topicsPanel">
        <div className="radarPanelHead"><div><h3>Trending Topics</h3><p>{categoryPulse.length ? "Live movement across verified observations" : "No measured topic movement yet"}</p></div><span className="scanState">{categoryPulse.length ? <><i/> ROTATING</> : "No data yet"}</span></div>
        <div className="topicList">
          {topicRows.length ? topicRows.map((c, i) => (
            <button key={c.name} type="button" onClick={() => { setActiveSignal(null); setFilter(c.name); setQ(""); void loadDiscovery(null, c.name); }}>
              <span className="topicRank" aria-hidden="true">{c.icon}</span><b>{c.name}</b>
              <i className={"spark spark-" + (i + 1)} aria-label={`${c.name} momentum over the last ${c.windows.length} measured windows`}>
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><polyline points={sparkPoints(c.windows)} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>
              </i>
              <strong>{(() => { const change = momentumChange(c.windows); return change == null ? "—" : (change >= 0 ? "+" : "") + change.toFixed(0) + "%"; })()}</strong>
</button>
          )) : <div className="radarEmpty">No data yet.</div>}
        </div>
      </div>
      <div className="spotlightPanel">
        <div className="radarPanelHead"><div><h3>Creator Spotlight</h3><p>{spotlightCreators.length ? "Creators to watch from verified observations" : "Waiting for verified creator observations"}</p></div><span className="scanState">{spotlightCreators.length ? <><i/> ROTATING</> : "No data yet"}</span></div>
        <div className="spotlightList">
          {spotlightCreators.map(x => (
            <button key={x.channel_title} type="button" onClick={() => setModal(x)}><img src={x.thumbnail} alt="" /><span><b>@{x.channel_title.replace(/\s+/g, "").slice(0, 22)}</b><small>{categoryFor(x)} · {fmt(x.metadata?.subscriber_count || 0)} subscribers</small></span><em>{Number.isFinite(Number(x.metadata?.signal_evidence?.audienceRelativeScore)) ? `AR ${Number(x.metadata?.signal_evidence?.audienceRelativeScore).toFixed(2)}` : "Follow"}</em></button>
          ))}
          {!spotlightCreators.length && <p className="radarEmpty">Creator spotlight will appear as verified data arrives.</p>}
        </div>
      </div>
    </section>

    <footer><b>RALL<span>IVIO</span></b><small>Discover People. Power What’s Next.</small><p>Source observations drive discovery. Motion responds to state; factual activity is never fabricated.</p></footer>
    {notice && <div className="toast" role="status"><b>RALLIVIO</b><span>{notice}</span></div>}
    {modal && <div className="backdrop" onClick={() => setModal(null)}><div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="close" type="button" onClick={() => setModal(null)}>×</button><div className="player">{modal.embeddable ? <iframe src={`https://www.youtube.com/embed/${modal.id}?autoplay=1&rel=0`} title={modal.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <img src={modal.thumbnail} alt=""/>}</div><span className="eyebrow">{modal.metadata?.signal || "Observed"} · VERIFIED OBSERVATION</span><h2>{modal.title}</h2><p>{modal.channel_title} · {fmt(modal.views)} views · {age(modal.published_at)}</p><div className="detailActions"><button className="primary" type="button" onClick={() => window.open(modal.url, "_blank", "noopener,noreferrer")}>Watch on source ↗</button><button className="promoteButton" type="button" onClick={() => router.push("/promote?url=" + encodeURIComponent(modal.url))}>Start RALLIVIO promotion →</button></div></div></div>}
  </main>;
}

const css = `
/* Living Field v2 — interaction, depth and product energy */
/* Living Field v3 — unify the surface and make controls feel intentional */
.signalButton{min-width:64px;display:flex;align-items:center;justify-content:center;gap:7px;text-transform:uppercase;letter-spacing:.7px}
.signalButton i{width:6px;height:6px;border-radius:50%;background:#61e4ad;box-shadow:0 0 11px #61e4ad;animation:livePulse 1.2s infinite}
.discoverySurface{color:#f3f2fa;background:linear-gradient(135deg,rgba(17,21,45,.96),rgba(9,12,28,.98));border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 90px rgba(0,0,0,.22)}
.discoverySurface h2{color:#f7f6ff}.surfaceHead p{color:#8f92aa}.surfaceHead>button{color:var(--accent)}
.card{background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border-color:rgba(255,255,255,.09);color:#f2f0f8;box-shadow:0 14px 35px rgba(0,0,0,.2)}
.card:hover{border-color:color-mix(in srgb,var(--accent) 50%,transparent);box-shadow:0 24px 50px rgba(0,0,0,.3)}
.card h3{color:#f4f2fa}.card p{color:#9da0b6}.card>small{color:#7f829c}.thumb>span{background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 5px 18px color-mix(in srgb,var(--accent) 22%,transparent)}
.thumb button{background:#f7f6fb;color:#35205e;box-shadow:0 8px 20px rgba(0,0,0,.25)}

.rv{--surface:rgba(255,255,255,.055);--surfaceStrong:rgba(255,255,255,.09);--glassBorder:rgba(255,255,255,.14);position:relative}
.rv:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:linear-gradient(115deg,transparent 0 42%,rgba(160,100,255,.045) 49%,transparent 57%),radial-gradient(circle at 72% 22%,rgba(90,190,255,.06),transparent 24%);mix-blend-mode:screen}
.topbar,.hero,.signals,.discoverySurface,footer{position:relative;z-index:2}
.topbar{padding:13px 38px;background:rgba(6,8,20,.72);border-bottom-color:rgba(255,255,255,.1);box-shadow:0 8px 40px rgba(0,0,0,.18)}
.brand{font-size:30px;transition:transform .2s ease}.brand:hover{transform:translateY(-1px)}
.topbar nav button{position:relative;color:#b9b8ca;transition:color .2s,background .2s}.topbar nav button:after{content:"";position:absolute;left:14px;right:14px;bottom:4px;height:2px;border-radius:3px;background:var(--accent);transform:scaleX(0);transition:transform .2s}.topbar nav button:hover:after,.topbar nav button.active:after{transform:scaleX(1)}
.search{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.round,.loginButton{box-shadow:0 8px 24px rgba(120,70,255,.22);transition:transform .2s,box-shadow .2s}.round:hover,.loginButton:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(120,70,255,.34)}
.hero{min-height:calc(100vh - 72px);padding:48px 5vw 58px;grid-template-columns:minmax(470px,.9fr) minmax(620px,1.25fr);gap:2vw;align-items:center}
.heroCopy{max-width:650px;padding-top:4px}
.pill{letter-spacing:.3px;box-shadow:0 0 28px rgba(255,66,101,.1)}
.heroCopy h1{font-size:clamp(62px,6.2vw,100px);line-height:.9;letter-spacing:-5.5px;margin:24px 0 18px;text-wrap:balance}
.heroCopy h1 em{background:linear-gradient(100deg,#fff 5%,var(--accent) 56%,var(--accent2));filter:drop-shadow(0 0 20px color-mix(in srgb,var(--accent) 25%,transparent))}
.heroCopy>p{font-size:18px;line-height:1.6;color:#c6c5d8;max-width:570px}
.heroSearch{height:66px;margin-top:26px;border:1px solid rgba(255,255,255,.45);box-shadow:0 18px 55px rgba(0,0,0,.28),0 0 45px color-mix(in srgb,var(--accent) 13%,transparent);transition:transform .2s,box-shadow .2s}
.heroSearch:focus-within{transform:translateY(-2px);box-shadow:0 22px 65px rgba(0,0,0,.35),0 0 65px color-mix(in srgb,var(--accent) 24%,transparent)}
.heroSearch button{background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 0 22px color-mix(in srgb,var(--accent) 35%,transparent)}
.categoryRail{margin-top:17px;gap:8px}
.categoryRail button{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.1);backdrop-filter:blur(8px);transition:transform .18s,border-color .18s,background .18s}
.categoryRail button:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 60%,transparent);background:rgba(255,255,255,.07)}
.categoryRail button.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 15%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--accent) 12%,transparent)}
.liveStrip{margin-top:21px;width:min(620px,100%);padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:linear-gradient(120deg,rgba(255,255,255,.065),rgba(255,255,255,.025));box-shadow:0 16px 45px rgba(0,0,0,.2);backdrop-filter:blur(18px)}
.liveStripHead{display:flex;align-items:center;justify-content:space-between;padding:2px 5px 8px;font-size:8px;letter-spacing:1.2px;font-weight:900}.liveStripHead span{display:flex;gap:7px;align-items:center;color:#f1f0f8}.liveStripHead i{width:6px;height:6px;border-radius:50%;background:#62e6ad;box-shadow:0 0 12px #62e6ad;animation:livePulse 1.2s infinite}.liveStripHead small{color:#74768f;font-size:7px;letter-spacing:.4px;font-weight:700}
.liveStripItems{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.liveStripItems>button{min-width:0;display:grid;grid-template-columns:34px 1fr 12px;align-items:center;gap:7px;padding:7px;border:1px solid transparent;border-radius:12px;background:rgba(255,255,255,.035);text-align:left;transition:transform .18s,border-color .18s,background .18s}.liveStripItems>button:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.075)}.liveStripItems img{width:34px;height:34px;object-fit:cover;border-radius:8px}.liveStripItems span{min-width:0;display:grid;gap:2px}.liveStripItems b{font-size:7px;color:var(--accent);text-transform:uppercase;letter-spacing:.7px}.liveStripItems small{font-size:7px;color:#aaa9bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.liveStripItems em{font-style:normal;color:#71e3b3;font-size:9px}.liveStripEmpty{padding:10px;color:#74768f;font-size:8px}
.ecosystem{min-height:690px;display:grid;place-items:center;filter:drop-shadow(0 25px 60px rgba(0,0,0,.22))}
.field{width:min(720px,100%);overflow:visible}
.fieldSpace{overflow:visible}
.fieldBadge{position:absolute;left:50%;top:3%;transform:translateX(-50%);z-index:35;display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(7,9,22,.62);box-shadow:0 10px 30px rgba(0,0,0,.22);backdrop-filter:blur(12px);white-space:nowrap;font-size:8px;font-weight:900;letter-spacing:1.2px;color:#e7e5f2}.fieldBadge i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent);animation:livePulse 1.5s infinite}.fieldBadge span{color:#777a92;font-size:7px;letter-spacing:.3px;font-weight:700}
.fieldGrid{opacity:.9;background:repeating-radial-gradient(circle at 50% 50%,transparent 0 62px,rgba(255,255,255,.045) 63px 64px),radial-gradient(circle,color-mix(in srgb,var(--accent) 8%,transparent),transparent 62%);mask-image:radial-gradient(circle,#000 18%,transparent 78%)}
.field:after{content:"";position:absolute;inset:14% 7%;border:1px solid color-mix(in srgb,var(--accent) 14%,transparent);border-radius:50%;pointer-events:none;animation:fieldBreathe 5s ease-in-out infinite}@keyframes fieldBreathe{50%{transform:scale(1.015);opacity:.45}}
.platform{padding:7px;border-radius:18px;transition:transform .2s,filter .2s}.platformMark{width:64px;height:64px;border-radius:20px;background:linear-gradient(145deg,rgba(28,31,60,.9),rgba(8,11,28,.92));border-color:rgba(255,255,255,.13);box-shadow:0 14px 35px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08);position:relative}.platformMark:after{content:"";position:absolute;inset:4px;border-radius:16px;border:1px solid rgba(255,255,255,.05);pointer-events:none}.platform b{font-size:10px;color:#f1eff8}.platform small{color:#74778e}.platform:hover .platformMark,.platform:focus-visible .platformMark,.platform.selected .platformMark{border-color:var(--accent);box-shadow:0 0 38px color-mix(in srgb,var(--accent) 45%,transparent),0 0 0 6px color-mix(in srgb,var(--accent) 9%,transparent),inset 0 0 25px color-mix(in srgb,var(--accent) 10%,transparent)}
.core{width:238px;height:238px;border-color:color-mix(in srgb,var(--accent) 78%,white);background:radial-gradient(circle at 34% 22%,color-mix(in srgb,var(--accent) 40%,#39458c) 0,color-mix(in srgb,var(--accent) 20%,#171c3d) 30%,#090c1d 75%);box-shadow:0 0 75px color-mix(in srgb,var(--accent) 48%,transparent),0 0 150px color-mix(in srgb,var(--accent) 18%,transparent),0 0 0 20px color-mix(in srgb,var(--accent) 5%,transparent);transition:transform .25s,box-shadow .25s}.core strong{font-size:39px}.core:hover,.core:focus-visible{box-shadow:0 0 120px color-mix(in srgb,var(--accent) 68%,transparent),0 0 210px color-mix(in srgb,var(--accent) 24%,transparent),0 0 0 34px color-mix(in srgb,var(--accent) 9%,transparent)}
.core i{color:#70e4b2}
.particle{opacity:.5;box-shadow:0 0 15px var(--accent);background:#e4dcff}
.energyArc{border-top-color:color-mix(in srgb,var(--accent) 50%,transparent);border-right-color:color-mix(in srgb,var(--accent2) 28%,transparent)}
.er1,.er2,.er3{border-color:color-mix(in srgb,var(--accent) 25%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--accent) 10%,transparent)}
.fieldHint{bottom:-10px;background:rgba(7,9,22,.72);border-color:rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.25);backdrop-filter:blur(12px);color:#9698ae}
.signals{margin:8px 5vw 0;padding:31px 28px;border-radius:28px;background:linear-gradient(135deg,rgba(14,18,42,.94),rgba(8,11,26,.92));border-color:rgba(255,255,255,.1);box-shadow:0 30px 90px rgba(0,0,0,.2)}
.signalType{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);transition:transform .18s,border-color .18s,background .18s}.signalType:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--accent) 60%,transparent)}.signalType.hasData{border-color:color-mix(in srgb,var(--accent) 28%,transparent);background:color-mix(in srgb,var(--accent) 7%,transparent)}
.signalCard{background:rgba(255,255,255,.035);border-color:rgba(255,255,255,.08);transition:transform .18s,border-color .18s,background .18s}.signalCard:hover{border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:rgba(255,255,255,.07);box-shadow:0 12px 35px rgba(0,0,0,.18)}
.discoverySurface{margin:20px 5vw 35px;padding:32px 28px;background:linear-gradient(135deg,#f7f6fb,#ecebf5);border-radius:28px;box-shadow:0 25px 80px rgba(0,0,0,.12)}
.card{border-radius:19px;box-shadow:0 10px 25px rgba(38,35,77,.08);transition:transform .22s,box-shadow .22s}.card:hover{transform:translateY(-6px) scale(1.01);box-shadow:0 22px 45px rgba(38,35,77,.16)}
footer{padding:55px 5vw 65px}
@media(max-width:1250px){.hero{grid-template-columns:1fr 1fr}.ecosystem{min-height:600px}}
@media(max-width:950px){.hero{grid-template-columns:1fr;padding-top:35px}.ecosystem{min-height:560px}.liveStrip{max-width:none}.topbar{gap:10px}}
@media(max-width:600px){.hero{min-height:auto;padding:32px 18px 48px}.heroCopy h1{font-size:55px;letter-spacing:-4px}.heroCopy>p{font-size:15px}.liveStripItems{grid-template-columns:1fr}.liveStripItems>button:nth-child(n+3){display:none}.ecosystem{min-height:510px;margin-top:18px}.fieldBadge{top:1%;font-size:7px}.fieldBadge span{display:none}.field{width:112vw;max-width:680px}.core{width:180px;height:180px}.core strong{font-size:30px}.platformMark{width:48px;height:48px;border-radius:15px}.platformMark:after{border-radius:11px}.platform b{font-size:8px}.fieldHint{font-size:7px;max-width:88%}.signals,.discoverySurface{margin-left:16px;margin-right:16px}}

.themeScrim{display:none}.themePickerWrap{position:relative;z-index:80}.themeButton{min-width:auto;height:38px;display:flex;align-items:center;gap:7px;padding:0 12px 0 10px;background:linear-gradient(135deg,#18142f,#221a3e);border-color:#ffffff22;box-shadow:inset 0 0 18px #ffffff05,0 8px 25px #0003}.themeButton:hover,.themeButton[aria-expanded="true"]{border-color:var(--accent)88;box-shadow:0 0 22px var(--glow)33,inset 0 0 18px #ffffff07}.themeButton>span:not(.themeButtonGlyph){font-size:10px;letter-spacing:.15px}.themeButtonGlyph{font-size:13px!important;color:var(--accent);text-shadow:0 0 12px var(--glow)}.themeButtonDot{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--glow);margin-left:1px}.themeMenu{position:absolute;right:0;top:48px;width:318px;padding:12px;border:1px solid #ffffff18;border-radius:20px;background:linear-gradient(145deg,#0c0f22f5,#080a17f8);box-shadow:0 28px 80px #000b,0 0 0 1px #0008;backdrop-filter:blur(26px) saturate(145%);-webkit-backdrop-filter:blur(26px) saturate(145%);z-index:90;overflow:hidden}.themeMenu:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 12% 0%,var(--glow)18,transparent 34%),linear-gradient(120deg,#ffffff08,transparent 42%)}.themeMenu>*{position:relative}.themeMenuHead{display:flex;align-items:center;justify-content:space-between;padding:3px 3px 11px;border-bottom:1px solid #ffffff0c}.themeMenuHead div{display:grid;gap:3px}.themeMenuHead small,.themeMenuLabel{color:#6f748f;font-size:7px;font-weight:900;letter-spacing:1.5px}.themeMenuHead b{font-size:12px;letter-spacing:-.1px}.themeMenuHead>span{display:flex;align-items:center;gap:5px;color:#6fe0ae;font-size:7px;font-weight:900;letter-spacing:.8px}.themeMenuHead>span i,.themeMenuFoot i{width:5px;height:5px;border-radius:50%;background:#6fe0ae;box-shadow:0 0 9px #6fe0ae;display:inline-block}.themeCurrent{display:flex;align-items:center;gap:10px;margin:11px 0 13px;padding:10px;border:1px solid var(--accent)35;border-radius:14px;background:linear-gradient(135deg,var(--accent)0d,#ffffff03)}.themeCurrentGlow{width:34px;height:34px;flex:0 0 34px;border-radius:11px;border:1px solid var(--accent)55;box-shadow:0 0 24px var(--glow)55;position:relative;overflow:hidden;background:radial-gradient(circle at 28% 25%,#fff8,transparent 22%),linear-gradient(135deg,var(--accent),var(--accent2))}.themeCurrentGlow:after{content:"";position:absolute;inset:8px;border:1px solid #fff7;border-radius:50%;opacity:.7}.themeCurrent div{display:grid;gap:2px}.themeCurrent small{color:#777b99;font-size:6px;letter-spacing:1.1px;font-weight:900}.themeCurrent strong{font-size:10px}.themeCurrent em{font-style:normal;color:#8b90aa;font-size:7px}.themeMenuLabel{padding:0 2px 7px}.themeOptions{display:grid;gap:6px}.themeOption{position:relative;width:100%;display:grid;grid-template-columns:54px 1fr auto 15px;gap:10px;align-items:center;text-align:left;border:1px solid transparent;border-radius:14px;background:#ffffff02;padding:8px}.themeOption:hover,.themeOption.active{background:#ffffff08;border-color:#ffffff14}.themeOption.active{box-shadow:inset 2px 0 0 var(--accent),0 0 24px var(--glow)0d}.themePreview{position:relative;width:54px;height:38px;border-radius:10px;overflow:hidden;border:1px solid #ffffff1f;box-shadow:inset 0 0 14px #ffffff09,0 0 16px #0005}.themePreview:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 25%,#fff8 0 3%,transparent 4%),linear-gradient(135deg,var(--preview-a),var(--preview-b) 55%,#080b18)}.themePreview:after{content:"";position:absolute;width:24px;height:24px;left:15px;top:7px;border:1px solid #fff8;border-radius:50%;box-shadow:0 0 15px var(--preview-glow)}.themePreview i,.themePreview b,.themePreview em{position:absolute;border-radius:50%;display:block}.themePreview i{width:3px;height:3px;left:8px;top:10px;background:#fff;box-shadow:36px 4px #fff8,12px 20px #fff7}.themePreview b{width:6px;height:6px;right:7px;bottom:7px;background:var(--preview-glow);box-shadow:0 0 10px var(--preview-glow)}.themePreview em{width:14px;height:14px;left:20px;top:12px;border:1px solid #fff9}.themePreview.nebula{--preview-a:#5630e8;--preview-b:#c869ff;--preview-glow:#9b62ff}.themePreview.aurora{--preview-a:#087fa6;--preview-b:#52d89d;--preview-glow:#42e6c0}.themePreview.neon{--preview-a:#c51b71;--preview-b:#ff9b4a;--preview-glow:#ff62c6}.themePreview.lunar{--preview-a:#536987;--preview-b:#e5f5ff;--preview-glow:#a9dcff}.themeOptionCopy{display:grid;gap:3px;min-width:0}.themeOptionCopy b{font-size:10px}.themeOptionCopy small{font-size:7px;color:#777b99;white-space:nowrap}.themeMode{padding:4px 6px;border:1px solid #ffffff10;border-radius:6px;color:#717690;font-size:6px;text-transform:uppercase;letter-spacing:.7px}.themeCheck{font-size:11px;font-weight:900;color:var(--accent);text-align:center}.themeMenuFoot{display:flex;align-items:center;gap:6px;margin-top:10px;padding:8px 3px 1px;border-top:1px solid #ffffff0b;color:#646983;font-size:7px}@media(max-width:800px){.themeScrim{position:fixed;inset:0;z-index:70;background:transparent}.themeMenu{right:-4px;width:min(318px,calc(100vw - 24px))}.themeButton>span:not(.themeButtonGlyph){display:none}.themeOption{grid-template-columns:50px 1fr 15px}.themeMode{display:none}}
.theme-nebula{--accent:#a868ff;--accent2:#c16bff;--bg1:#090b21;--bg2:#07081a;--glow:#7440ff}.theme-aurora{--accent:#42e6c0;--accent2:#6de9ff;--bg1:#061a20;--bg2:#061316;--glow:#12cfae}.theme-neon{--accent:#ff62c6;--accent2:#ff9b5e;--bg1:#1b0717;--bg2:#10070d;--glow:#ff3b9d}.theme-lunar{--accent:#a9dcff;--accent2:#e8f5ff;--bg1:#101725;--bg2:#070b12;--glow:#7dbfff}
.theme-aurora.rv{background:radial-gradient(circle at 63% 28%,#12cfae26,transparent 31%),radial-gradient(circle at 18% 42%,#38e4c018,transparent 32%),linear-gradient(135deg,var(--bg1),var(--bg2) 58%,var(--bg1))}.theme-neon.rv{background:radial-gradient(circle at 63% 28%,#ff3b9d26,transparent 31%),radial-gradient(circle at 18% 42%,#ff9b4a16,transparent 32%),linear-gradient(135deg,var(--bg1),var(--bg2) 58%,var(--bg1))}.theme-lunar.rv{background:radial-gradient(circle at 63% 28%,#7dbfff24,transparent 31%),radial-gradient(circle at 18% 42%,#d9efff14,transparent 32%),linear-gradient(135deg,var(--bg1),var(--bg2) 58%,var(--bg1))}
.theme-aurora .brand span,.theme-aurora .core span,.theme-aurora footer span,.theme-aurora .eyebrow,.theme-aurora .fieldHint span,.theme-aurora .signalTop span,.theme-aurora .more{color:var(--accent)}.theme-neon .brand span,.theme-neon .core span,.theme-neon footer span,.theme-neon .eyebrow,.theme-neon .fieldHint span,.theme-neon .signalTop span,.theme-neon .more{color:var(--accent)}.theme-lunar .brand span,.theme-lunar .core span,.theme-lunar footer span,.theme-lunar .eyebrow,.theme-lunar .fieldHint span,.theme-lunar .signalTop span,.theme-lunar .more{color:var(--accent)}
.theme-aurora .topbar nav button.active,.theme-aurora .topbar nav button:hover,.theme-aurora .loginButton,.theme-aurora .round,.theme-aurora .heroSearch button,.theme-aurora .primary{background:linear-gradient(135deg,#08b9cf,#38dfac)}.theme-neon .topbar nav button.active,.theme-neon .topbar nav button:hover,.theme-neon .loginButton,.theme-neon .round,.theme-neon .heroSearch button,.theme-neon .primary{background:linear-gradient(135deg,#ff287f,#ff9b4a)}.theme-lunar .topbar nav button.active,.theme-lunar .topbar nav button:hover,.theme-lunar .loginButton,.theme-lunar .round,.theme-lunar .heroSearch button,.theme-lunar .primary{background:linear-gradient(135deg,#5c8cff,#bde9ff);color:#07101b}
.theme-aurora .core{background:radial-gradient(circle at 34% 24%,#2e8e9c 0,#173e45 25%,#0c292e 54%,#061316 79%);box-shadow:0 0 70px #12cfae73,0 0 125px #12cfae27,0 0 0 18px #12cfae09;border-color:#7af5dfcc}.theme-neon .core{background:radial-gradient(circle at 34% 24%,#9d356f 0,#4c163b 25%,#260c23 54%,#10070d 79%);box-shadow:0 0 70px #ff3b9d73,0 0 125px #ff3b9d27,0 0 0 18px #ff3b9d09;border-color:#ff9bcfcc}.theme-lunar .core{background:radial-gradient(circle at 34% 24%,#8299bd 0,#34445e 25%,#182235 54%,#070b12 79%);box-shadow:0 0 70px #7dbfff73,0 0 125px #7dbfff27,0 0 0 18px #7dbfff09;border-color:#d6f2ffcc}
.theme-aurora .platform:hover .platformMark,.theme-aurora .platform:focus-visible .platformMark,.theme-aurora .platform.selected .platformMark{border-color:var(--accent);box-shadow:0 0 36px #12cfae77,0 0 0 5px #12cfae0e,inset 0 0 20px #12cfae12;background:#102b2d}.theme-neon .platform:hover .platformMark,.theme-neon .platform:focus-visible .platformMark,.theme-neon .platform.selected .platformMark{border-color:var(--accent);box-shadow:0 0 36px #ff3b9d77,0 0 0 5px #ff3b9d0e,inset 0 0 20px #ff3b9d12;background:#2b1227}.theme-lunar .platform:hover .platformMark,.theme-lunar .platform:focus-visible .platformMark,.theme-lunar .platform.selected .platformMark{border-color:var(--accent);box-shadow:0 0 36px #7dbfff77,0 0 0 5px #7dbfff0e,inset 0 0 20px #7dbfff12;background:#182437}
.theme-aurora .n1{background:radial-gradient(circle,#12cfae2e,transparent 64%)}.theme-aurora .n2{background:radial-gradient(circle,#25d9ff26,transparent 62%)}.theme-neon .n1{background:radial-gradient(circle,#ff3b9d30,transparent 64%)}.theme-neon .n2{background:radial-gradient(circle,#ff8b4a24,transparent 62%)}.theme-lunar .n1{background:radial-gradient(circle,#7dbfff2c,transparent 64%)}.theme-lunar .n2{background:radial-gradient(circle,#d9efff20,transparent 62%)}
.theme-aurora .energyArc{border-top-color:#55f2d55e;border-right-color:#4acbff2c}.theme-aurora .arc2{border-top-color:#6ce7c48d;border-left-color:#50dfff72}.theme-neon .energyArc{border-top-color:#ff62c65e;border-right-color:#ff9b4a55}.theme-neon .arc2{border-top-color:#ff8b4a70;border-left-color:#ff62c672}.theme-lunar .energyArc{border-top-color:#c9eaff70;border-right-color:#7dbfff55}.theme-lunar .arc2{border-top-color:#b9efff70;border-left-color:#a9dcff72}
.theme-aurora .categoryRail button.active,.theme-neon .categoryRail button.active,.theme-lunar .categoryRail button.active{border-color:var(--accent);background:#ffffff0d}.theme-aurora .signals{border-color:#42e6c033;background:linear-gradient(135deg,#0a2528,#07181c)}.theme-neon .signals{border-color:#ff62c633;background:linear-gradient(135deg,#261021,#130a13)}.theme-lunar .signals{border-color:#a9dcff33;background:linear-gradient(135deg,#172235,#0b101a)}.theme-aurora .signalType:hover,.theme-aurora .signalType.hasData,.theme-neon .signalType:hover,.theme-neon .signalType.hasData,.theme-lunar .signalType:hover,.theme-lunar .signalType.hasData{border-color:var(--accent)55;background:#ffffff09}
@media(max-width:800px){.themeScrim{position:fixed;inset:0;z-index:70;background:transparent}.themeMenu{right:-4px}.themeButton span{display:none}}
:root{--bg:#07091a;--text:#f7f6ff;--muted:#aaa9c2;--line:#ffffff1b;--purple:#8c4dff;--purple2:#c16bff}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}button,input{font:inherit}button{cursor:pointer;color:inherit}.rv{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 63% 28%,#713cff22,transparent 31%),radial-gradient(circle at 18% 42%,#3d48aa16,transparent 32%),linear-gradient(135deg,#090b21,#07081a 58%,#0d1028)}.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:18px;padding:12px 34px;border-bottom:1px solid var(--line);background:#080919df;backdrop-filter:blur(18px)}.brand{border:0;background:transparent;text-align:left;font-size:28px;font-weight:950;letter-spacing:-1.7px;line-height:.85;white-space:nowrap}.brand span,.core span,footer span{color:#a868ff}.brand small{display:block;font-size:6px;letter-spacing:1px;color:#aaa9c1;margin-top:6px}.topbar nav{display:flex;gap:3px;flex:1}.topbar nav button{border:0;background:transparent;padding:10px 13px;border-radius:999px;color:#deddef;font-weight:650}.topbar nav button.active,.topbar nav button:hover{background:linear-gradient(135deg,#8544ff,#bd61ff);color:#fff}.search{display:flex;align-items:center;width:min(390px,29vw);height:42px;border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#050611aa}.search>span{padding-left:14px;color:#7e7d96}.search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;padding:0 9px;font-size:12px}.search button{width:45px;border:0;background:transparent;font-size:17px}.round,.loginButton{min-width:72px;height:38px;border:1px solid rgba(255,255,255,.2);border-radius:20px;background:linear-gradient(135deg,#7b4aff,#b45eff);color:#fff;font-size:12px;font-weight:800;cursor:pointer;padding:0 16px}.avatar{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#ffffff0d}.avatar{background:linear-gradient(135deg,#ffbd6a,#8c4eff);font-weight:850}.hero{min-height:650px;padding:42px 55px 28px;display:grid;grid-template-columns:minmax(390px,.88fr) minmax(640px,1.55fr);gap:10px;align-items:center}.heroCopy{max-width:560px;z-index:3}.pill{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border:1px solid #ff4a6666;border-radius:999px;background:#ff36591f;font-size:10px;font-weight:850}.pill i{width:8px;height:8px;border-radius:50%;background:#ff4265;animation:livePulse 1.4s infinite}@keyframes livePulse{50%{opacity:.25;box-shadow:0 0 14px #ff4265}}h1{font-size:clamp(54px,5vw,78px);line-height:.94;letter-spacing:-4px;margin:20px 0}.heroCopy h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c269ff 58%,#7f6bff);-webkit-background-clip:text;color:transparent}.heroCopy>p{font-size:17px;line-height:1.55;color:#d0cfe0;max-width:520px}.heroSearch{display:flex;align-items:center;height:60px;margin-top:24px;padding:5px 6px 5px 17px;border-radius:31px;background:#f7f6fb;box-shadow:0 12px 45px #0005}.heroSearch .searchMark{font-size:19px;color:#67657c}.heroSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#252239;padding:0 10px}.heroSearch button{width:47px;height:47px;border:0;border-radius:50%;background:linear-gradient(135deg,#6244ff,#b45eff);color:#fff;font-size:19px}.categoryRail{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px;max-width:640px}.categoryRail button{display:flex;align-items:center;gap:6px;border:1px solid #fff2;background:#ffffff09;padding:8px 11px;border-radius:18px;color:#dddbea;font-size:11px}.categoryRail button span{color:#c18bff}.categoryRail button.active{border-color:#b66cff;background:#713cff35;color:#fff}.categoryRail .more{color:#c69bff}.ecosystem{position:relative;min-width:0}.field{position:relative;flex-shrink:0}.fieldSpace{height:100%;position:relative;transition:transform .18s ease;transform-style:preserve-3d}.fieldGrid{position:absolute;inset:12% 7%;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,transparent 0 67px,#ffffff05 68px 69px),radial-gradient(circle,#7653ff0b,transparent 61%);mask-image:radial-gradient(circle,#000 20%,transparent 76%);pointer-events:none}.nebula{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;filter:blur(2px)}.n1{width:470px;height:470px;background:radial-gradient(circle,#814cff2e,transparent 64%);animation:nebula 5.5s ease-in-out infinite}.n2{width:330px;height:330px;background:radial-gradient(circle,#456eff26,transparent 62%);animation:nebula 4.2s ease-in-out infinite reverse}@keyframes nebula{50%{transform:translate(-50%,-50%) scale(1.1);opacity:.7}}.orbit,.energyRing{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.orbit{border:1px solid #7565ff28}.o1{width:300px;height:300px}.o2{width:430px;height:430px;border-style:dashed;animation:spin 26s linear infinite}.o3{width:555px;height:555px;border-color:#3c9dff1d;animation:spin 38s linear infinite reverse}@keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}.energyRing{border:1px solid #a269ff25;box-shadow:0 0 18px #8d54ff10}.er1{width:250px;height:250px;animation:ring 2.8s ease-in-out infinite}.er2{width:365px;height:365px;animation:ring 3.8s ease-in-out infinite .6s}.er3{width:505px;height:505px;animation:ring 5s ease-in-out infinite 1.2s}@keyframes ring{50%{opacity:.25;transform:translate(-50%,-50%) scale(1.035)}}.energyArc{position:absolute;left:50%;top:50%;width:470px;height:470px;border:2px solid transparent;border-top-color:#b76aff5e;border-right-color:#5e8bff2c;border-radius:50%;transform:translate(-50%,-50%);animation:spin 9s linear infinite}.arc2{width:385px;height:385px;border-top-color:#6ce7c44d;border-left-color:#a566ff42;animation-duration:6s;animation-direction:reverse}.arc3{width:570px;height:570px;border-bottom-color:#9b6cff38;border-right-color:#5e83ff38;animation-duration:14s}.particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#cdbbff;box-shadow:0 0 12px #a26aff;opacity:.35;pointer-events:none;animation:particle 3.5s ease-in-out infinite}.particle:nth-child(3n){width:2px;height:2px;animation-duration:4.5s}.particle1{left:18%;top:25%}.particle2{left:29%;top:17%;animation-delay:-1s}.particle3{left:78%;top:20%;animation-delay:-2s}.particle4{left:88%;top:37%;animation-delay:-.4s}.particle5{left:82%;top:63%;animation-delay:-1.8s}.particle6{left:72%;top:78%;animation-delay:-2.4s}.particle7{left:49%;top:90%;animation-delay:-1.3s}.particle8{left:28%;top:80%;animation-delay:-2.7s}.particle9{left:13%;top:61%;animation-delay:-.8s}.particle10{left:8%;top:42%;animation-delay:-1.6s}.particle11{left:38%;top:29%;animation-delay:-2.1s}.particle12{left:66%;top:34%;animation-delay:-.7s}.particle13{left:64%;top:61%;animation-delay:-2.9s}.particle14{left:38%;top:66%;animation-delay:-1.1s}.particle15{left:56%;top:13%;animation-delay:-1.9s}.particle16{left:92%;top:51%;animation-delay:-2.2s}.particle17{left:22%;top:70%;animation-delay:-.2s}.particle18{left:57%;top:84%;animation-delay:-1.5s}.particle19{left:44%;top:8%;animation-delay:-2.6s}.particle20{left:35%;top:92%;animation-delay:-.9s}.particle21{left:74%;top:46%;animation-delay:-3s}.particle22{left:17%;top:48%;animation-delay:-1.2s}@keyframes particle{50%{transform:translate3d(0,-12px,0) scale(1.7);opacity:1}}.platform{border:0;background:transparent;text-align:center;z-index:25;padding:5px;border-radius:17px;transition:filter .2s,scale .2s}.platform:hover,.platform:focus-visible,.platform.selected{scale:1.12;filter:brightness(1.3)}.platformMark{display:grid;place-items:center;width:58px;height:58px;margin:auto;border-radius:18px;background:linear-gradient(145deg,#151934,#0d1023);border:1px solid #ffffff20;box-shadow:0 12px 30px #0006,inset 0 0 20px #ffffff04;color:#f5f3ff;transition:box-shadow .2s,border-color .2s,background .2s}.platform:hover .platformMark,.platform:focus-visible .platformMark,.platform.selected .platformMark{border-color:#b16cff;box-shadow:0 0 36px #8b4fff77,0 0 0 5px #8b4fff0e,inset 0 0 20px #9b62ff12;background:#191533}.platform b{display:block;font-size:10px;margin-top:6px}.platform small{display:block;color:#85859e;font-size:7px;margin-top:3px}.core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:222px;height:222px;border-radius:50%;display:grid;place-items:center;align-content:center;border:1px solid #c097ffcc;background:radial-gradient(circle at 34% 24%,#4854c7 0,#202458 23%,#11152f 52%,#070a18 79%);box-shadow:0 0 70px #7440ff73,0 0 125px #7440ff27,0 0 0 18px #7e4aff09;z-index:30;overflow:visible;transition:transform .22s,box-shadow .22s}.core:hover,.core:focus-visible,.core:active{transform:translate(-50%,-50%) scale(1.045);box-shadow:0 0 105px #9b62ff9b,0 0 175px #7440ff3d,0 0 0 30px #7e4aff10}.core strong{font-size:36px;letter-spacing:-2px;z-index:2}.core small{font-size:8px;color:#aaa9bf;letter-spacing:.8px;z-index:2}.core i{font-style:normal;color:#72e4b3;font-size:8px;margin-top:10px;z-index:2}.core i b{font-size:7px}.coreLight{position:absolute;inset:12px;border-radius:50%;background:radial-gradient(circle at 45% 25%,#7f87ff34,transparent 48%);animation:coreLight 3s ease-in-out infinite}.coreHalo{position:absolute;border-radius:50%;border:1px solid #a46cff45;pointer-events:none}.h1{inset:-14px;animation:halo 2.6s ease-out infinite}.h2{inset:-29px;border-color:#7b68ff2e;animation:halo 3.6s ease-out infinite .8s}.h3{inset:-46px;border-color:#668cff1d;animation:halo 4.8s ease-out infinite 1.5s}@keyframes halo{0%{transform:scale(.9);opacity:.75}100%{transform:scale(1.08);opacity:0}}@keyframes coreLight{50%{transform:scale(1.12);opacity:.55}}.field.responding .energyRing,.field.responding .energyArc{animation-duration:1.1s}.field.responding .particle{animation-duration:1.1s}.fieldHint{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);white-space:nowrap;padding:8px 13px;border:1px solid #ffffff14;border-radius:999px;background:#080a1a99;color:#a8a7bf;font-size:9px}.fieldHint span{color:#b16aff;margin-right:5px}.signals{margin:0 55px;padding:27px 24px 25px;border:1px solid #5879c533;border-radius:25px;background:linear-gradient(135deg,#0d132b,#0a0d20);box-shadow:0 25px 70px #0002}.signalsHead{display:flex;justify-content:space-between;align-items:flex-end;gap:25px}.eyebrow{display:inline-block;color:#a66aff;font-size:9px;font-weight:900;letter-spacing:1.4px}.signals h2,.discoverySurface h2{margin:5px 0 6px;font-size:29px;letter-spacing:-.8px}.signalsHead p,.surfaceHead p{margin:0;color:#888ba8;font-size:11px}.sourceState{display:grid;grid-template-columns:auto auto;gap:3px 7px;text-align:right;font-size:8px;color:#6fe0ae;letter-spacing:.6px}.sourceState i{width:7px;height:7px;background:#61e0ad;border-radius:50%;align-self:center;justify-self:end}.sourceState b{color:#fff;font-size:9px}.sourceState small{grid-column:1/-1;color:#747791}.signalTypes{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:19px}.signalType{min-width:0;text-align:left;border:1px solid #ffffff10;background:#ffffff05;border-radius:14px;padding:12px;display:grid;grid-template-columns:8px 1fr;gap:3px 8px}.signalType:hover,.signalType.hasData{border-color:#9863ff55;background:#8a4fff0c}.signalType.empty{opacity:.62}.signalDot{width:7px;height:7px;border-radius:50%;background:#777b95;grid-row:1/3;margin-top:3px}.hasData .signalDot{background:#6fe0ae;box-shadow:0 0 10px #6fe0ae66}.signalType strong{font-size:9px}.signalType small{font-size:7px;color:#777b98}.pulseIntro{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-top:22px;padding:13px 15px;border:1px solid rgba(255,255,255,.07);border-radius:15px;background:linear-gradient(90deg,rgba(255,255,255,.045),rgba(120,80,255,.06))}.pulseIntro div{display:flex;align-items:center;gap:12px;min-width:0}.pulseIntro strong{font-size:10px;color:#d9d7e7}.pulseCount{font-size:8px;font-weight:900;letter-spacing:1px;color:var(--accent);white-space:nowrap}.signalGridWide{grid-template-columns:repeat(3,1fr)}.radarStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.radarStat{padding:16px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));min-width:0}.radarStat small{display:block;font-size:7px;letter-spacing:1.2px;color:#8589a3;font-weight:900}.radarStat strong{display:block;margin-top:7px;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f5f3fa}.radarStat span{display:block;margin-top:4px;font-size:8px;color:#777b96;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.radarLayout{display:grid;grid-template-columns:minmax(0,1fr) 235px;gap:16px;margin-top:16px}.cardsRadar{grid-template-columns:repeat(2,1fr);margin-top:0}.categoryPulse{padding:17px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(255,255,255,.018));align-self:start}.categoryPulse>div strong{display:block;margin-top:6px;font-size:12px}.categoryPulse>div small{display:block;margin-top:5px;color:#777b96;font-size:8px;line-height:1.45}.categoryPulse>button{position:relative;width:100%;display:grid;grid-template-columns:1fr auto;gap:5px;margin-top:10px;padding:10px 0;border:0;border-top:1px solid rgba(255,255,255,.06);background:transparent;text-align:left}.categoryPulse>button span{font-size:9px;color:#c5c4d5}.categoryPulse>button span b{display:inline-grid;place-items:center;width:22px;margin-right:7px;color:var(--accent)}.categoryPulse>button>strong{font-size:9px;color:#fff}.categoryPulse>button i{grid-column:1/-1;height:3px;border-radius:4px;background:linear-gradient(90deg,var(--accent) 0 var(--w),rgba(255,255,255,.06) var(--w) 100%);display:block}.categoryEmpty{font-size:9px;color:#777b96;line-height:1.5;margin:15px 0 0}.discoverySurface{background:linear-gradient(145deg,rgba(16,21,43,.97),rgba(7,10,24,.99));border:1px solid rgba(255,255,255,.1);color:#f2f0f8;box-shadow:0 30px 90px rgba(0,0,0,.24)}.discoverySurface h2{color:#f7f6ff}.surfaceHead p{color:#8d91aa}.surfaceHead>button{color:var(--accent)}.card{background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));border-color:rgba(255,255,255,.09);color:#f2f0f8}.card h3{color:#f4f2fa}.card p{color:#9da0b6}.card>small{color:#7f829c}.card:hover{border-color:color-mix(in srgb,var(--accent) 50%,transparent);box-shadow:0 24px 50px rgba(0,0,0,.3)}.thumb>span{background:linear-gradient(135deg,var(--accent),var(--accent2));}.thumb button{background:#f7f6fb;color:#35205e}.signalGridWide .signalCard:nth-child(n+7){background:rgba(255,255,255,.035)}{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:13px}.signalCard{display:grid;grid-template-columns:48px 1fr 18px;gap:11px;align-items:center;text-align:left;border:1px solid #ffffff0e;background:#ffffff05;border-radius:15px;padding:10px 12px;min-width:0;transition:transform .18s,border-color .18s,background .18s}.signalCard:hover{transform:translateY(-2px);border-color:#9b66ff66;background:#ffffff0a}.signalIcon img{width:48px;height:48px;object-fit:cover;border-radius:11px}.signalBody{min-width:0}.signalTop{display:flex;justify-content:space-between;gap:10px}.signalTop span{font-size:7px;color:#b67aff;font-weight:850;text-transform:uppercase;letter-spacing:.8px}.signalTop time{font-size:7px;color:#70738d}.signalBody strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.signalBody>small{display:block;color:#9295ad;font-size:8px;margin-top:3px}.signalMeta{display:flex;gap:10px;margin-top:5px;color:#777b99;font-size:7px}.signalCard>em{font-style:normal;color:#a96cff;font-size:17px}.signalEmpty{grid-column:1/-1;padding:28px;text-align:center;color:#777b98;font-size:10px;border:1px dashed #ffffff14;border-radius:14px}.discoverySurface{margin:18px 55px 35px;padding:28px 24px;background:#f2f1f8;color:#1d2243;border-radius:26px}.surfaceHead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.surfaceHead>button{border:0;background:transparent;color:#7040e9;font-weight:800}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:13px;margin-top:18px}.card{background:#fff;border:1px solid #ddddec;border-radius:17px;overflow:hidden;cursor:pointer;transition:transform .18s,box-shadow .18s}.card:hover{transform:translateY(-3px);box-shadow:0 12px 30px #27234d14}.thumb{height:135px;position:relative}.thumb img{width:100%;height:100%;object-fit:cover}.thumb>span{position:absolute;top:9px;left:9px;padding:5px 7px;border-radius:7px;background:#713cff;color:#fff;font-size:7px;font-weight:800}.thumb button{position:absolute;right:8px;bottom:8px;width:33px;height:33px;border:0;border-radius:50%;background:#fff;color:#6e3fff}.card h3{font-size:11px;margin:11px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.card p{margin:0 11px 6px;color:#6e7391;font-size:8px}.card>small{display:block;padding:0 11px 12px;color:#4e5474;font-size:7px}footer{display:grid;grid-template-columns:auto auto 1fr;gap:12px 22px;align-items:center;padding:45px 55px 55px;color:#b5b5c9}footer b{font-size:24px}footer small{font-size:10px}footer p{grid-column:1/-1;margin:0;color:#686b86;font-size:9px}.toast{position:fixed;right:25px;bottom:25px;z-index:100;padding:12px 15px;border:1px solid #c466ff73;border-radius:14px;background:#15132a;box-shadow:0 15px 40px #0008;font-size:10px;max-width:390px}.toast b{display:block;color:#c58bff;font-size:8px;letter-spacing:1px;margin-bottom:4px}.toast span{display:block}.backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:25px;background:#03040dcc;backdrop-filter:blur(12px)}.modal{position:relative;width:min(860px,94vw);max-height:92vh;overflow:auto;padding:18px;border:1px solid var(--line);border-radius:22px;background:#0e1126}.close{position:absolute;right:15px;top:12px;width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#0008;z-index:2}.player{aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:#05060d;margin-bottom:18px}.player iframe,.player img{width:100%;height:100%;border:0;object-fit:cover}.modal h2{font-size:22px}.modal p{color:var(--muted);font-size:11px}.primary{border:0;border-radius:20px;padding:11px 15px;background:linear-gradient(135deg,#7544ff,#b45eff);color:#fff;font-size:11px;font-weight:800}.genericMark{font-size:30px}@media(max-width:1250px){.hero{grid-template-columns:1fr 1.25fr}.cards{grid-template-columns:repeat(3,1fr)}.signalGridWide{grid-template-columns:repeat(2,1fr)}.radarLayout{grid-template-columns:1fr}.categoryPulse{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}.categoryPulse>div,.categoryEmpty{grid-column:1/-1}}@media(max-width:950px){.topbar{flex-wrap:wrap;padding:10px 16px}.topbar nav{order:3;width:100%;overflow:auto}.search{flex:1;width:auto}.hero{grid-template-columns:1fr;padding:35px 20px}.signals,.discoverySurface{margin-left:16px;margin-right:16px}.cards{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.hero h1{font-size:51px}.core{width:172px;height:172px}.orbit.o3{width:470px;height:470px}.platformMark{width:46px;height:46px;border-radius:14px}.platformMark svg{width:24px;height:24px}.platform b{font-size:8px}.platform small{font-size:6px}.fieldHint{font-size:7px;max-width:90%;overflow:hidden;text-overflow:ellipsis}.categoryRail{max-height:96px;overflow:hidden}.categoryRail button:nth-child(n+7){display:none}.categoryRail .more{display:flex}.signalGrid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.signalGridWide,.cardsRadar{grid-template-columns:1fr}.radarStats{grid-template-columns:1fr}.signalsHead,.surfaceHead{display:block}.pulseIntro{align-items:flex-start;flex-direction:column}.categoryPulse{display:block}.sourceState{margin-top:12px;text-align:left;justify-content:start}.sourceState i{justify-self:start}.sourceState small{grid-column:2}.discoverySurface{padding:23px 15px}footer{padding:35px 20px;grid-template-columns:1fr}footer p{grid-column:auto}}
/* Discover lower section reference layout */
.pulseStrip{position:relative;z-index:2;display:grid;grid-template-columns:1.25fr repeat(4,.85fr) 1.55fr;gap:10px;align-items:stretch;margin:0;padding:14px 5vw;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.08);background:rgba(5,10,25,.78)}
.pulseStripLabel,.pulseMetric,.pulseWorld{min-width:0;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));padding:12px 14px}
.pulseStripLabel{display:flex;flex-direction:column;justify-content:center}.pulseStripLabel small{font-size:8px;letter-spacing:1.2px;color:#8b8fa8}.pulseStripLabel strong{font-size:11px;margin-top:5px;color:#67e5ad}.pulseStripLabel i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#67e5ad;box-shadow:0 0 10px #67e5ad;margin-right:6px}
.pulseMetric{display:grid;grid-template-columns:20px 1fr;grid-template-rows:1fr 1fr;align-items:center}.pulseMetric>span{grid-row:1/3;color:#ff557b;font-size:17px;text-align:center}.pulseMetric:nth-child(3)>span{color:#ff4b61}.pulseMetric:nth-child(4)>span{color:#f5a63b}.pulseMetric:nth-child(5)>span{color:#bc62ff}.pulseMetric b{font-size:16px;line-height:1;color:#e9e7f4}.pulseMetric small{font-size:7px;color:#777c98;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pulseWorld{display:flex;align-items:center;justify-content:space-between;gap:14px;padding-right:18px}.pulseWorld b{display:block;font-size:8px;color:#c8c7d8}.pulseWorld small{display:block;font-size:7px;line-height:1.35;color:#73778f;margin-top:4px}.worldDots{position:relative;width:150px;height:48px;opacity:.7;background:radial-gradient(ellipse at 28% 50%,#2e7ab055 0 12%,transparent 13%),radial-gradient(ellipse at 53% 42%,#2e7ab055 0 13%,transparent 14%),radial-gradient(ellipse at 75% 58%,#2e7ab055 0 10%,transparent 11%),radial-gradient(ellipse at 45% 70%,#2e7ab055 0 9%,transparent 10%)}.worldDots i{position:absolute;width:3px;height:3px;border-radius:50%;background:#3a96ff;box-shadow:0 0 8px #3a96ff}.worldDots i:nth-child(1){left:20%;top:40%}.worldDots i:nth-child(2){left:27%;top:30%}.worldDots i:nth-child(3){left:35%;top:58%}.worldDots i:nth-child(4){left:45%;top:22%}.worldDots i:nth-child(5){left:52%;top:52%}.worldDots i:nth-child(6){left:62%;top:34%}.worldDots i:nth-child(7){left:69%;top:63%}.worldDots i:nth-child(8){left:76%;top:28%}.worldDots i:nth-child(9){left:83%;top:48%}.worldDots i:nth-child(10){left:42%;top:75%}.worldDots i:nth-child(11){left:58%;top:78%}.worldDots i:nth-child(12){left:12%;top:55%}
.detailActions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}.promoteButton{border:1px solid #8e65ff88;border-radius:10px;background:linear-gradient(135deg,#6f42d8,#315da8);color:#fff;padding:9px 12px;font-size:9px;font-weight:850;cursor:pointer}.promoteButton:hover{filter:brightness(1.12);transform:translateY(-1px)}
.pulseSection{position:relative;z-index:2;margin:0 5vw;padding:20px 22px 18px;border:1px solid rgba(85,125,205,.38);border-top:0;border-radius:0 0 20px 20px;background:linear-gradient(145deg,#0c1834,#071022);box-shadow:0 25px 70px rgba(0,0,0,.25)}
.pulseSectionHead{display:flex;align-items:center;justify-content:space-between;gap:20px}.pulseTitle{display:flex;align-items:center;gap:12px}.pulseWave{font-size:38px;line-height:1;color:#54cfff;text-shadow:0 0 18px #3b9fff}.pulseTitle h2{margin:0;font-size:24px;color:#42a8ff;letter-spacing:.3px}.pulseTitle p{margin:3px 0 0;font-size:9px;color:#858ba6}.pulseSectionHead>button,.radarPanelHead>button{border:0;background:transparent;color:#55aaff;font-size:9px;font-weight:800;cursor:pointer}
.pulseTabs{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:16px}.pulseTabs button{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:6px;min-width:0;padding:10px 12px;border:1px solid rgba(255,255,255,.1);border-radius:20px;background:rgba(255,255,255,.045);color:#d8d7e6;text-align:left;cursor:pointer}.pulseTabs button.active{border-color:#4c9fff;background:linear-gradient(90deg,#145dc8aa,#182c54aa);box-shadow:0 0 20px #338cff18}.pulseTabs button.empty{opacity:.65}.pulseTabIcon{font-size:13px}.pulseTabs b{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pulseTabs small{font-size:8px;color:#8c92ad}
.pulseCards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-top:13px}.pulseCard{min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:15px;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.025));cursor:pointer;transition:transform .18s,border-color .18s,box-shadow .18s}.pulseCard:hover{transform:translateY(-4px);border-color:#5aaaff66;box-shadow:0 18px 35px rgba(0,0,0,.28)}.pulseThumb{height:112px;position:relative;background:#0a0e1f}.pulseThumb img{width:100%;height:100%;object-fit:cover}.pulseThumb>span{position:absolute;left:7px;top:7px;padding:5px 7px;border-radius:8px;background:rgba(5,15,30,.84);border:1px solid rgba(255,255,255,.18);font-size:7px;font-weight:850;color:#fff}.pulseThumb time{position:absolute;right:7px;bottom:7px;padding:3px 5px;border-radius:5px;background:#050713dd;color:#fff;font-size:7px}.pulseCard h3{font-size:10px;line-height:1.35;margin:9px 9px 5px;color:#f4f2fa;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pulseCreator{margin:0 9px 3px;color:#a6a8bc;font-size:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pulseCard>small{display:block;margin:0 9px;color:#707691;font-size:7px}.pulseCardMeta{display:flex;gap:8px;align-items:center;padding:9px;color:#8a8fa7;font-size:7px}.pulseCardMeta strong{margin-left:auto;color:#42e5a6;font-size:8px}.pulseEmpty{grid-column:1/-1;padding:35px;text-align:center;color:#7f849f;font-size:10px}
.radarSection{position:relative;z-index:2;display:grid;grid-template-columns:1.05fr 1fr .92fr;gap:14px;margin:14px 5vw 35px}.radarPanel,.topicsPanel,.spotlightPanel{min-width:0;padding:17px 18px;border:1px solid rgba(85,125,205,.25);border-radius:16px;background:linear-gradient(145deg,#0b1730,#071022);box-shadow:0 18px 50px rgba(0,0,0,.2)}.radarPanelHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.radarPanelHead h3{margin:0;font-size:15px;color:#edf0fb}.radarPanelHead p{margin:4px 0 0;color:#7e849e;font-size:8px}.radarVisual{position:relative;height:130px;margin:10px 0 2px;overflow:hidden}.radarRings{position:absolute;left:22px;top:4px;width:125px;height:125px;border-radius:50%;background:repeating-radial-gradient(circle,#ffffff08 0 1px,transparent 1px 31px)}.radarRings i{position:absolute;width:7px;height:7px;border-radius:50%;background:#4fc9ff;box-shadow:0 0 14px #4fc9ff;left:54px;top:54px}.radarRings i:nth-child(2){left:91px;top:27px;background:#ff5b70;box-shadow:0 0 14px #ff5b70}.radarRings i:nth-child(3){left:23px;top:78px;background:#42baff;box-shadow:0 0 14px #42baff}.radarRings i:nth-child(4){left:72px;top:94px;background:#49e7a8;box-shadow:0 0 14px #49e7a8}.radarRings b{position:absolute;inset:0;border:1px solid #4d9fff25;border-radius:50%;box-shadow:0 0 0 18px #4d9fff09,0 0 0 38px #4d9fff06}.radarGlow{position:absolute;border-radius:50%;filter:blur(12px);opacity:.45}.radarGlow.one{width:35px;height:35px;background:#ff5a5a;left:90px;top:28px}.radarGlow.two{width:25px;height:25px;background:#46c7ff;left:44px;top:73px}.radarGlow.three{width:24px;height:24px;background:#5ce9ae;left:75px;top:89px}
.radarList{display:grid;gap:4px}.radarList button,.topicList button{display:grid;grid-template-columns:22px 1fr auto;align-items:center;gap:8px;border:0;border-top:1px solid rgba(255,255,255,.055);background:transparent;padding:7px 0;color:#d8d8e7;text-align:left;cursor:pointer}.radarRank,.topicRank{display:grid;place-items:center;width:20px;height:20px;border:1px solid #ffffff1a;border-radius:6px;color:#a9adbf;font-size:8px}.radarList b,.topicList b{font-size:8px;font-weight:700}.radarList strong,.topicList strong{font-size:8px;color:#ff536e}.radarList button:nth-child(2) strong{color:#35aaff}.radarList button:nth-child(3) strong{color:#38e4a7}.radarList button:nth-child(4) strong{color:#bd67ff}.radarList button:nth-child(5) strong{color:#ff5c65}
.topicList{display:grid;margin-top:12px}.topicList button{grid-template-columns:22px 1fr 105px auto}.topicList b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.topicList strong{color:#43e6a5}.spark{height:18px;display:flex;align-items:center;gap:4px;padding:0 4px}.spark em{display:block;width:15px;border-top:2px solid #bc4dff;transform:skewY(-7deg)}.spark-1 em:nth-child(2){transform:skewY(10deg)}.spark-2 em{border-color:#35c8ad}.spark-3 em{border-color:#e0a135}.spark-4 em{border-color:#a955ff}.spark-5 em{border-color:#8f9a55}.topicList button strong{min-width:38px;text-align:right}
.spotlightList{display:grid;margin-top:12px}.spotlightList button{display:grid;grid-template-columns:34px 1fr auto;align-items:center;gap:9px;padding:8px 0;border:0;border-top:1px solid rgba(255,255,255,.055);background:transparent;color:#eee;text-align:left;cursor:pointer}.spotlightList img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.12)}.spotlightList span{min-width:0}.spotlightList b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spotlightList small{display:block;margin-top:3px;color:#7f849c;font-size:7px}.spotlightList em{font-style:normal;padding:6px 10px;border:1px solid #72a8ff66;border-radius:15px;color:#b9d4ff;font-size:7px}
@media(max-width:1250px){.pulseStrip{grid-template-columns:1.2fr repeat(4,1fr)}.pulseWorld{display:none}.pulseCards{grid-template-columns:repeat(3,1fr)}.radarSection{grid-template-columns:1fr 1fr}.spotlightPanel{grid-column:1/-1}.spotlightList{grid-template-columns:repeat(3,1fr);gap:12px}.spotlightList button{border:1px solid rgba(255,255,255,.055);padding:9px;border-radius:10px}}
@media(max-width:800px){.pulseStrip{grid-template-columns:repeat(2,1fr);padding:10px 16px}.pulseStripLabel{grid-column:1/-1}.pulseSection,.radarSection{margin-left:16px;margin-right:16px}.pulseTabs{grid-template-columns:repeat(3,1fr)}.pulseCards{grid-template-columns:repeat(2,1fr)}.radarSection{grid-template-columns:1fr}.spotlightPanel{grid-column:auto}.spotlightList{grid-template-columns:1fr}.pulseSectionHead{align-items:flex-start}.pulseSectionHead>button{display:none}}
@media(max-width:520px){.pulseTabs{grid-template-columns:repeat(2,1fr)}.pulseCards{grid-template-columns:1fr}.pulseSection{padding:16px 12px}.pulseTitle h2{font-size:20px}.pulseMetric b{font-size:14px}}


/* Live immersive field + continuous discovery motion */
.fieldBadge{top:-1.5%!important;z-index:60!important}
.fieldSpace{padding-top:2%!important}
.platformMark.youtube{box-shadow:0 8px 18px rgba(0,0,0,.28)!important}
.earthVisual{position:absolute;left:50%;top:50%;width:78%;height:78%;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;z-index:0;pointer-events:none;background:radial-gradient(circle at 35% 27%,#5edbff 0,#166bc8 19%,#0c2e73 45%,#07142e 72%,#020611 100%);box-shadow:inset -22px -20px 50px #000b,inset 14px 12px 34px #b7f1ff66,0 0 45px #3f91ff44}
.earthAtmosphere{position:absolute;inset:-5%;border-radius:50%;border:2px solid #65d8ff88;box-shadow:0 0 25px #5bc9ff66,0 0 55px #6a5cff33;animation:earthBreathe 4s ease-in-out infinite}
.earthGrid{position:absolute;inset:-9%;border-radius:50%;background:repeating-radial-gradient(ellipse at center,transparent 0 18px,#6edcff16 19px 20px),repeating-linear-gradient(90deg,transparent 0 21px,#66cfff16 22px 23px);animation:earthSpin 18s linear infinite;mix-blend-mode:screen}
.earthLand{position:absolute;background:linear-gradient(135deg,#45e4a0,#1aa876 65%,#0c654f);filter:drop-shadow(0 0 7px #42dca066);border-radius:48% 52% 44% 56%;opacity:.9}
.land1{width:27%;height:20%;left:18%;top:24%;transform:rotate(-18deg);animation:landDrift 12s ease-in-out infinite}.land2{width:22%;height:32%;left:43%;top:18%;transform:rotate(24deg);animation:landDrift 15s ease-in-out infinite reverse}.land3{width:16%;height:26%;left:58%;top:49%;transform:rotate(-8deg);animation:landDrift 13s ease-in-out infinite}.land4{width:23%;height:13%;left:22%;top:60%;transform:rotate(12deg);animation:landDrift 17s ease-in-out infinite reverse}
.earthShine{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 28% 23%,#fff7 0 3%,transparent 16%),linear-gradient(120deg,transparent 34%,#73e6ff0c 48%,transparent 58%);animation:earthShimmer 5s ease-in-out infinite}
.core>strong,.core>small,.core>i{position:relative;z-index:5;text-shadow:0 2px 16px #000c}.core>strong{background:linear-gradient(90deg,#fff,#a8d8ff,#b975ff);-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes earthSpin{to{transform:rotate(360deg)}}@keyframes earthBreathe{50%{transform:scale(1.025);opacity:.8}}@keyframes earthShimmer{50%{transform:translateX(3%);opacity:.75}}@keyframes landDrift{50%{translate:8px -3px;filter:drop-shadow(0 0 13px #42dca099)}}
.worldMap{position:relative;width:155px;height:52px;color:#2f86e9;filter:drop-shadow(0 0 8px #2f86e966)}.worldMap svg{width:100%;height:100%;opacity:.5}.mapRoad{fill:none;stroke:#63b8ff;stroke-width:1;stroke-dasharray:4 5;animation:roadMove 3s linear infinite}.mapRoad.r2{animation-duration:4.2s;animation-direction:reverse}.worldMap i{position:absolute;width:4px;height:4px;border-radius:50%;background:#66d6ff;box-shadow:0 0 10px #66d6ff;animation:mapBlink 1.4s infinite}.worldMap i:nth-of-type(1){left:25%;top:36%}.worldMap i:nth-of-type(2){left:39%;top:54%;animation-delay:.3s}.worldMap i:nth-of-type(3){left:56%;top:35%;animation-delay:.7s}.worldMap i:nth-of-type(4){left:72%;top:47%;animation-delay:1s}.worldMap i:nth-of-type(5){left:84%;top:34%;animation-delay:.5s}@keyframes roadMove{to{stroke-dashoffset:-36}}@keyframes mapBlink{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.5)}}
.pulseHeadActions{display:flex;align-items:center;gap:14px}.pulseLive,.scanState{display:flex;align-items:center;gap:6px;color:#66e6ae;font-size:7px;font-weight:900;letter-spacing:.8px;white-space:nowrap}.pulseLive i,.scanState i{width:6px;height:6px;border-radius:50%;background:#61e0aa;box-shadow:0 0 10px #61e0aa;animation:livePulse 1s infinite}
.pulseCarousel{position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:7px;margin-top:13px}.pulseCarousel .pulseCards{margin-top:0}.pulseArrow{width:32px;height:32px;border:1px solid #5ba8ff88;border-radius:50%;background:linear-gradient(145deg,#103d86,#0b1c43);color:#fff;font-size:17px;cursor:pointer;box-shadow:0 0 18px #287fff22}.pulseArrow:hover{transform:scale(1.08);box-shadow:0 0 25px #287fff55}.pulseTicker{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:10px;color:#69708d;font-size:7px}.pulseTicker i{width:5px;height:5px;border-radius:50%;background:#58e6a9;box-shadow:0 0 8px #58e6a9;animation:livePulse 1.1s infinite}
.liveRadar .radarSweep{position:absolute;left:50%;top:50%;width:50%;height:50%;transform-origin:0 0;border-left:2px solid #5fc9ff88;border-top:2px solid transparent;border-radius:100% 0 0 0;animation:radarSweep 2.2s linear infinite;filter:drop-shadow(0 0 7px #5fc9ff)}.liveRadar .radarRings{animation:radarPulse 2.2s ease-in-out infinite}.scanState{color:#6dc8ff}.scanState i{background:#5cc9ff;box-shadow:0 0 10px #5cc9ff}
@keyframes radarSweep{to{transform:rotate(360deg)}}@keyframes radarPulse{50%{transform:scale(1.035);opacity:.95}}
.radarPanelHead{align-items:center!important}
@media(max-width:1250px){.pulseCarousel{grid-template-columns:30px minmax(0,1fr) 30px}.pulseCards{grid-template-columns:repeat(3,1fr)}.worldMap{width:120px}.pulseHeadActions{gap:8px}}
@media(max-width:800px){.pulseHeadActions .pulseLive{display:none}.pulseCarousel{grid-template-columns:26px minmax(0,1fr) 26px}.pulseArrow{width:27px;height:27px}.pulseCards{grid-template-columns:repeat(2,1fr)}.worldMap{width:120px}.earthVisual{width:74%;height:74%}}
@media(max-width:520px){.pulseCarousel{grid-template-columns:24px minmax(0,1fr) 24px}.pulseCards{grid-template-columns:1fr}.pulseArrow{width:24px;height:24px;font-size:13px}.pulseTicker{font-size:6px}.worldMap{width:110px}.pulseHeadActions button{display:none}}
/* 2026-09-18 Living Field precision pass */
.fieldBadge{top:1%!important;z-index:80!important}
.core{overflow:hidden!important}
.earthVisual{z-index:1!important;width:86%!important;height:86%!important;border-radius:50%;overflow:hidden!important;background:transparent!important;box-shadow:none!important}
.earthGlobe{position:absolute;inset:0;width:100%;height:100%;display:block;filter:drop-shadow(0 0 18px #4fcfff55)}
.earthGlobe .earthLongitude ellipse{fill:none;stroke:#8de4ff22;stroke-width:1.2;animation:earthGridShift 7s ease-in-out infinite}
.earthGlobe .earthContinents path{fill:#2fd59a;opacity:.78;filter:drop-shadow(0 0 5px #45f0b088)}
.earthGlobe .earthLights circle{fill:#8be7ff;filter:drop-shadow(0 0 5px #69dfff);animation:earthLightBlink 1.8s ease-in-out infinite}
.earthGlobe .earthLights circle:nth-child(2){animation-delay:.25s}.earthGlobe .earthLights circle:nth-child(3){animation-delay:.55s}.earthGlobe .earthLights circle:nth-child(4){animation-delay:.8s}.earthGlobe .earthLights circle:nth-child(5){animation-delay:1.1s}
.earthEdge{fill:none;stroke:#8ae7ff88;stroke-width:2}.earthHighlight{fill:#fff;opacity:.07;transform-origin:92px 71px;animation:earthHighlight 5s ease-in-out infinite}
.earthAtmosphere{inset:-2%!important;border-color:#6ee6ff77!important;box-shadow:0 0 25px #5bc9ff66,0 0 55px #6a5cff33!important;z-index:2}
.core>strong,.core>small,.core>i{z-index:10!important}
@keyframes earthGridShift{50%{transform:translateX(6px);opacity:.7}100%{transform:translateX(0)}}
@keyframes earthLightBlink{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.6)}}
@keyframes earthHighlight{50%{transform:translate(7px,2px);opacity:.12}}
.pulseHeadActions>button.viewSignalsButton{display:inline-flex!important;align-items:center;justify-content:center;border:1px solid #4d8fff88!important;border-radius:10px!important;background:linear-gradient(135deg,#163b78,#11264d)!important;color:#dbeaff!important;padding:10px 14px!important;font-size:9px!important;font-weight:850!important;white-space:nowrap!important;box-shadow:0 0 18px #2d83ff22!important}
.pulseHeadActions>button.viewSignalsButton:hover{border-color:#75b8ff!important;box-shadow:0 0 25px #2d83ff55!important;transform:translateY(-1px)}
.pulseCarousel{grid-template-columns:36px minmax(0,1fr) 36px!important}
.pulseViewport{min-width:0;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scrollbar-width:none;padding:1px 0 7px}
.pulseViewport::-webkit-scrollbar{display:none}
.pulseViewport .pulseCards{display:flex!important;gap:10px!important;margin-top:0!important;width:max-content;min-width:100%}
.pulseViewport .pulseCard{flex:0 0 244px!important;width:244px!important}
.pulseCard h3{font-size:10.5px!important;line-height:1.35!important;min-height:29px!important}
.pulseCard:focus-visible{outline:2px solid #5aaaff;border-color:#5aaaff}
.pulseSelected{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:16px;margin-top:14px;padding:14px;border:1px solid #4b7fc966;border-radius:16px;background:linear-gradient(145deg,#0a1630,#071020);box-shadow:0 20px 50px #0005}
.pulseSelectedPlayer{min-height:270px;border-radius:11px;overflow:hidden;background:#030711}
.pulseSelectedPlayer iframe,.pulseSelectedPlayer img{display:block;width:100%;height:100%;min-height:270px;border:0;object-fit:cover}
.pulseSelectedInfo{display:flex;flex-direction:column;justify-content:center;gap:9px;min-width:0}
.pulseSelectedInfo .eyebrow{color:#68c6ff;font-size:8px;letter-spacing:.8px;font-weight:850}
.pulseSelectedInfo h3{margin:0;color:#f6f4ff;font-size:18px;line-height:1.35}
.pulseSelectedInfo p{margin:0;color:#858da5;font-size:9px}
.pulseSelectedInfo>div{display:flex;flex-wrap:wrap;gap:8px}.pulseSelectedInfo>div span,.pulseSelectedInfo>div strong{padding:6px 8px;border-radius:8px;background:#ffffff08;border:1px solid #ffffff10;color:#aeb5c7;font-size:8px}.pulseSelectedInfo>div strong{color:#5ce6ad}
.sourceButton{align-self:flex-start;border:1px solid #5ea8ff77;border-radius:10px;background:#102e5c;color:#d9ebff;padding:9px 12px;font-size:9px;font-weight:850;cursor:pointer}
.pulseTicker{font-size:8px!important}
.worldMap{width:180px!important;height:58px!important}
.worldMap svg{opacity:.72!important}
.worldMap .continent{fill:#2675c5!important;filter:drop-shadow(0 0 4px #2d9aff66)}
.worldMap .mapRoad{stroke:#6fd6ff!important;stroke-width:1.25!important;stroke-dasharray:3 5!important}
.worldMap i{width:5px!important;height:5px!important}
.worldMap i:nth-of-type(6){left:58%!important;top:58%!important;animation-delay:1.25s!important}
.pulseWorld small{line-height:1.5!important}
.radarVisual{height:150px!important;display:grid!important;place-items:center!important}
.liveRadar .radarRings{left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:130px!important;height:130px!important}
.liveRadar .radarSweep{left:50%!important;top:50%!important;width:65px!important;height:65px!important;transform-origin:0 0!important;border-left:2px solid #5fc9ff99!important;border-top:2px solid #5fc9ff55!important;border-radius:100% 0 0 0!important}
.liveRadar .radarGlow.one{left:calc(50% + 27px)!important;top:calc(50% - 40px)!important}.liveRadar .radarGlow.two{left:calc(50% - 45px)!important;top:calc(50% + 2px)!important}.liveRadar .radarGlow.three{left:calc(50% - 8px)!important;top:calc(50% + 38px)!important}
.spark{height:24px!important;gap:3px!important;align-items:flex-end!important}
.spark em{width:7px!important;min-height:4px!important;border:0!important;border-radius:2px 2px 0 0!important;background:linear-gradient(180deg,#c55cff,#5d9dff)!important;transform:none!important;animation:sparkDance 1.7s ease-in-out infinite alternate!important}
.spark em:nth-child(2){animation-delay:.12s!important}.spark em:nth-child(3){animation-delay:.24s!important}.spark em:nth-child(4){animation-delay:.36s!important}.spark em:nth-child(5){animation-delay:.48s!important}.spark em:nth-child(6){animation-delay:.6s!important}.spark em:nth-child(7){animation-delay:.72s!important}
@keyframes sparkDance{to{transform:scaleY(.55);opacity:.65}}
.spotlightList{max-height:310px;overflow:auto;scrollbar-width:thin;padding-right:3px}
.spotlightList button{min-height:54px!important}
.spotlightList button:hover{background:#ffffff05;border-radius:10px}
@media(max-width:800px){.pulseSelected{grid-template-columns:1fr}.pulseSelectedInfo h3{font-size:15px}.pulseSelectedPlayer,.pulseSelectedPlayer iframe,.pulseSelectedPlayer img{min-height:220px}.pulseHeadActions>button.viewSignalsButton{padding:8px 10px}.worldMap{width:145px!important}.radarVisual{height:145px!important}}
@media(max-width:520px){.pulseHeadActions>button.viewSignalsButton{font-size:8px;padding:7px 9px}.pulseCarousel{grid-template-columns:28px minmax(0,1fr) 28px!important}.pulseViewport .pulseCard{flex-basis:220px!important;width:220px!important}.worldMap{width:125px!important}.pulseSelectedInfo h3{font-size:14px}}


/* 2026-09-19 Discover precision pass: / is rewritten to /living, so these rules apply to the actual served Discover page. */
.topbar{height:72px!important;min-height:72px!important;flex-wrap:nowrap!important;align-items:center!important;gap:24px!important;padding:0 34px!important}
.topbar nav{display:flex!important;align-items:center!important;gap:32px!important;flex:1 1 auto!important;min-width:0!important;white-space:nowrap!important}
.topbar nav button{font-size:15px!important;font-weight:500!important;line-height:1!important;white-space:nowrap!important;padding:9px 0!important;margin:0!important;flex:0 0 auto!important}
.headerSearchWrap{display:contents}
.topbar .search{flex:0 1 300px!important;width:min(300px,24vw)!important;min-width:220px!important;margin-right:24px!important}
.topActions{display:flex!important;align-items:center!important;gap:12px!important;flex:0 0 auto!important;min-width:max-content!important}
.topActions .round,.topActions .loginButton{height:38px!important;min-height:38px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;white-space:nowrap!important;overflow:visible!important;padding:0 14px!important}
.topActions .themePickerWrap{flex:0 0 auto!important}
.themeButton{max-width:120px!important;overflow:visible!important;white-space:nowrap!important}
.loginButton{min-width:72px!important}

.heroHeadlineWrap{min-height:180px!important;display:block!important}
.heroDynamicTitle{margin:18px 0!important;min-height:180px!important}
.heroDynamicTitle>span{display:inline-block!important;white-space:nowrap!important}
.heroDynamicTitle>strong{display:block!important;max-width:560px!important;min-height:1.12em!important;font-size:clamp(34px,3.7vw,58px)!important;line-height:1.02!important;letter-spacing:-2.8px!important;color:#dfe2ff!important;animation:heroTitleIn .4s cubic-bezier(.4,0,.2,1) both!important}
@keyframes heroTitleIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Actual 3D globe layer mounted by DiscoverGlobe.tsx. */
.globeStage{position:absolute!important;inset:-7%!important;z-index:1!important;border-radius:50%!important;overflow:visible!important;pointer-events:none!important;filter:drop-shadow(0 0 34px rgba(63,156,255,.45))!important}
.discoverGlobeCanvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;opacity:0!important;transition:opacity .18s ease!important}
.globeFallback{position:absolute!important;inset:0!important;border-radius:50%!important;overflow:hidden!important;background:#07101d!important;box-shadow:inset -28px -20px 45px #0008,0 0 0 1px rgba(117,220,255,.48),0 0 35px rgba(60,157,255,.32)!important;transition:opacity .18s ease!important}
.globeFallback img{position:absolute!important;width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;border-radius:50%!important;filter:saturate(1.08) brightness(1.08)!important}
.globeFallback::after{content:"";position:absolute;inset:-2%;border-radius:50%;border:1px solid rgba(110,223,255,.32);box-shadow:0 0 18px rgba(95,217,255,.28),0 0 45px rgba(106,85,255,.12)}
.globeStage.globeReady .globeFallback{opacity:0!important}.globeStage.globeReady .discoverGlobeCanvas{opacity:1!important}
/* Spherical platform badges: one shared light direction with the globe. */
.platformMark{position:relative!important;border-radius:50%!important;overflow:hidden!important;transition:transform .2s ease,box-shadow .2s ease!important;box-shadow:0 8px 18px rgba(0,0,0,.28)!important}.platformMark:before,.platformMark:after{content:none!important;display:none!important}.platform:hover .platformMark,.platform:focus-visible .platformMark,.platform.selected .platformMark{transform:scale(1.05)!important}.platform.youtube .platformMark{background:#FF0000!important}.platform.instagram .platformMark{background:#E1306C!important}.platform.tiktok .platformMark,.platform.x .platformMark{background:#000!important}.platform.linkedin .platformMark{background:#0A66C2!important}.platform.facebook .platformMark{background:#1877F2!important}.platform.reddit .platformMark{background:#FF4500!important}.platform.discord .platformMark{background:#5865F2!important}.platform.snapchat .platformMark{background:#FFFC00!important;color:#000!important}.platform.pinterest .platformMark{background:#E60023!important}.platform.spotify .platformMark{background:#1DB954!important;color:#000!important}.platform.twitch .platformMark{background:#9146FF!important}
.field.responding .orbit{animation-duration:1.2s!important}.energyArc{display:none!important}.field.responding .energyRing{animation-duration:1.1s!important}.field.responding .core{animation:coreResponse .55s ease-out!important}
@keyframes coreResponse{50%{transform:translate(-50%,-50%) scale(1.08);box-shadow:0 0 120px #58dfff99,0 0 190px #2d82ff55,0 0 0 34px #42cfff18}}

@media(max-width:1250px){.topbar{gap:18px!important;padding:0 24px!important}.topbar nav{gap:24px!important}.topbar .search{width:250px!important;min-width:190px!important;margin-right:18px!important}.topbar nav button{font-size:14px!important}}
@media(max-width:950px){.topbar{height:auto!important;min-height:72px!important;flex-wrap:wrap!important;padding:10px 16px!important}.topbar nav{order:3;width:100%;overflow:auto;gap:20px!important}.topbar .search{flex:1 1 220px!important;width:auto!important;margin-right:0!important}.topActions{margin-left:auto!important}}


/* Approved Discover UI finishing pass */
.topbar{height:64px!important;padding:0 22px!important;gap:18px!important}
.topbar nav button{white-space:nowrap!important}
.topbar nav button:nth-child(3){max-width:none!important}
.plansButton{min-width:58px!important;height:32px!important;padding:0 13px!important;border:0!important;border-radius:18px!important;background:#2563eb!important;color:#fff!important;font-size:10px!important;font-weight:900!important;box-shadow:0 7px 22px rgba(37,99,235,.28)!important}
.notificationButton{width:32px!important;height:32px!important;padding:0!important}
.avatarButton{width:32px!important;height:32px!important;padding:0!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:linear-gradient(135deg,#55d9ff,#2563eb)!important;color:#fff!important;border:0!important;font-weight:900!important;font-size:10px!important}
.themeButton{min-width:32px!important;width:32px!important;height:32px!important;padding:0!important;justify-content:center!important}
.themeButtonLabel,.themeButtonDot{display:none!important}
.themeButtonGlyph{font-size:17px!important;line-height:1!important}
.hero{min-height:540px!important;padding:30px 28px 22px!important}
.heroDynamicTitle{display:flex!important;flex-direction:column!important;align-items:flex-start!important;min-height:0!important}
.heroDynamicTitle span,.heroDynamicTitle em{display:block!important}
.heroDynamicTitle em{font-style:normal!important;background:linear-gradient(90deg,#63e5ff,#2b78ff)!important;-webkit-background-clip:text!important;background-clip:text!important;color:transparent!important}
.heroDynamicTitle strong{display:none!important}
.heroSearch input::placeholder{color:#566b83!important}
.categoryRail{max-height:60px!important;overflow:hidden!important}
.categoryRail button{padding:6px 9px!important;font-size:8px!important}
.liveStrip{margin-top:15px!important}
.ecosystem{min-height:500px!important}
.platform small{color:#7188a3!important}
.platform:first-of-type small{color:#ff6a76!important}
.pulseStrip{margin-top:0!important}
.pulseMetric{min-height:66px!important}
.pulseSection{padding-top:0!important}
.pulseTabs{display:flex!important;gap:7px!important;overflow:auto!important}
.pulseTab{flex:0 0 auto!important}
.pulseTab.empty{opacity:.42!important}
.pulseCards{scroll-snap-type:x proximity!important}
.pulseCard{scroll-snap-align:start!important}
.radarSection{align-items:stretch!important}
.radarPanel,.topicsPanel,.spotlightPanel{min-height:390px!important}
.radarList,.topicList,.spotlightList{max-height:310px!important;overflow-y:auto!important}
.radarList::-webkit-scrollbar,.topicList::-webkit-scrollbar,.spotlightList::-webkit-scrollbar{width:4px}
.radarList::-webkit-scrollbar-thumb,.topicList::-webkit-scrollbar-thumb,.spotlightList::-webkit-scrollbar-thumb{background:rgba(66,217,255,.25);border-radius:4px}
.spark{opacity:.72!important}
footer{margin-top:8px!important}
@media(max-width:950px){.topbar nav button:nth-child(3){display:none}.hero{min-height:auto!important}}
@media(max-width:600px){.topbar{height:auto!important;padding:9px 14px!important}.plansButton{height:30px!important}.heroDynamicTitle{font-size:clamp(50px,14vw,70px)!important}}

/* Final correction pass */
.topActions .round:not(.plansButton){background:transparent!important;border:0!important;box-shadow:none!important;color:#d9f5ff!important;padding:0!important;width:32px!important;min-width:32px!important}
.topActions .round:not(.plansButton):hover{background:transparent!important;color:#7ee7ff!important}
.notificationButton{font-size:20px!important;line-height:1!important}
.heroHeadlineWrap{overflow:visible!important}
.heroDynamicTitle{overflow:visible!important;line-height:1.15!important}
.heroDynamicTitle>em{line-height:1.15!important;overflow:visible!important;display:block!important;padding-bottom:.08em!important}
.heroDynamicTitle>span{line-height:1!important}
.liveStripViewport{overflow:hidden!important;width:100%!important}
.liveStripItems{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.liveStripItems>button{min-height:72px!important}
.liveTickerCopy{min-width:0!important;display:grid!important;gap:3px!important}
.liveTickerCopy small{display:block!important}
.liveTickerCopy em{font-size:7px!important;color:#d9ecff!important;font-style:normal!important;font-weight:800!important}
.signalTone{color:#69e5ff!important}
.signal-breaking-out{color:#ffd166!important}.signal-now-moving{color:#62e6ad!important}.signal-on-the-rise{color:#6ed8ff!important}.signal-under-the-radar{color:#72dfff!important}.signal-just-dropped{color:#ffca65!important}.signal-live-now{color:#ff667b!important}
.heroStatsPanel{position:absolute!important;top:5%!important;right:1%!important;width:210px!important;padding:18px!important;border:1px solid rgba(100,210,255,.2)!important;border-radius:18px!important;background:linear-gradient(145deg,rgba(7,19,35,.92),rgba(7,13,26,.72))!important;box-shadow:0 20px 55px rgba(0,0,0,.3),0 0 35px rgba(45,166,255,.08)!important;backdrop-filter:blur(14px)!important;z-index:45!important}
.heroStatsTop{display:flex!important;align-items:end!important;gap:8px!important;border-bottom:1px solid rgba(120,190,220,.12)!important;padding-bottom:12px!important}
.heroStatsTop strong{font-size:28px!important;line-height:1!important;color:#f5fcff!important}
.heroStatsTop span,.heroStatsMetric span{font-size:8px!important;color:#819ab2!important;text-transform:uppercase!important;letter-spacing:.8px!important}
.heroStatsMetric{padding:13px 0!important;border-bottom:1px solid rgba(120,190,220,.12)!important}
.heroStatsMetric strong{display:block!important;font-size:22px!important;color:#65ddff!important}
.heroStatsLines{display:grid!important;gap:7px!important;padding-top:13px!important}
.heroStatsLines span{font-size:8px!important;color:#b8cde0!important}
.heroStatsLines span:before{content:"✓"!important;color:#5ee7b4!important;margin-right:7px!important}
.heroScript{position:absolute!important;right:2%!important;bottom:4%!important;color:#62ddff!important;font-family:"Segoe Script","Brush Script MT",cursive!important;font-size:18px!important;font-style:italic!important;transform:rotate(-6deg)!important;z-index:45!important;text-shadow:0 0 18px rgba(72,218,255,.35)!important}
.heroScript i{display:block!important;width:185px!important;height:2px!important;margin:5px 0 0 8px!important;background:linear-gradient(90deg,transparent,#5ee4ff 25%,#5ee4ff 75%,transparent)!important;transform:rotate(-2deg)!important;border-radius:50%!important}
.search button,.heroSearch button{background:linear-gradient(135deg,#1f78ff,#46dfff)!important;box-shadow:0 0 22px rgba(45,174,255,.3)!important}
.categoryRail button.active{border-color:#42cfff!important;background:rgba(37,139,255,.16)!important;box-shadow:0 0 22px rgba(37,139,255,.12)!important}
.pulseTab.active,.viewSignalsButton{background:linear-gradient(135deg,#145dce,#1a9fe0)!important;border-color:#4bbfff!important}
.core{border-color:#67ddff!important;box-shadow:0 0 70px rgba(38,183,255,.45),0 0 125px rgba(38,183,255,.2),0 0 0 18px rgba(38,183,255,.05)!important}
.core:hover,.core:focus-visible,.core:active{box-shadow:0 0 105px rgba(38,210,255,.62),0 0 175px rgba(38,183,255,.28),0 0 0 30px rgba(38,183,255,.08)!important}
.coreHalo{border-color:rgba(76,211,255,.45)!important}.h2{border-color:rgba(76,211,255,.28)!important}.h3{border-color:rgba(76,211,255,.18)!important}
.spark em{background:linear-gradient(180deg,#62dfff,#2d82ff)!important}
.theme-nebula{--accent:#4fcfff!important;--accent2:#2d7dff!important;--glow:#2d7dff!important}.theme-neon{--accent:#4fcfff!important;--accent2:#2d7dff!important;--glow:#2d7dff!important}.theme-aurora{--accent:#42dfff!important;--accent2:#2d8fff!important;--glow:#12bfe8!important}
@media(max-width:1100px){.heroStatsPanel{right:0!important;width:190px!important}.heroScript{right:0!important}}
@media(max-width:950px){.heroStatsPanel{position:relative!important;top:auto!important;right:auto!important;width:min(100%,360px)!important;margin:18px auto 0!important}.heroScript{position:relative!important;right:auto!important;bottom:auto!important;margin:22px auto 0!important;width:max-content!important;max-width:100%!important}.heroScript i{width:150px!important}.liveStripItems{grid-template-columns:1fr!important}.liveStripItems>button:nth-child(n+3){display:none!important}}

.themeButtonGlyph svg,.notificationButton svg{width:19px!important;height:19px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
.themeButtonGlyph svg circle{fill:none!important}
.radarRank{width:40px!important;height:40px!important;border-radius:12px!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,rgba(38,128,220,.22),rgba(20,52,88,.7))!important;border:1px solid rgba(85,196,255,.16)!important;color:#68dfff!important;font-size:15px!important}
.radarList button{grid-template-columns:40px 1fr auto!important;min-height:58px!important}
.topicRank{width:48px!important;height:48px!important;border-radius:13px!important;display:grid!important;place-items:center!important;background:rgba(40,124,210,.14)!important;border:1px solid rgba(91,204,255,.14)!important;color:#6fe3ff!important;font-size:17px!important}
.topicList button{grid-template-columns:48px minmax(80px,1fr) 90px auto!important;min-height:66px!important}
.spotlightList button img{width:56px!important;height:56px!important;border-radius:50%!important}
.spotlightList button{min-height:68px!important}

 .spark{height:24px!important;display:block!important;min-width:76px!important;color:#62dfff!important;opacity:1!important}.spark svg{display:block!important;width:100%!important;height:24px!important;overflow:visible!important}.spark em{display:none!important}
/* Layout correction: keep field stats card outside the RALLIVIO core/orbit. */
.ecosystem{position:relative!important;}
@media(min-width:1251px){.ecosystem>.field{width:72%!important;justify-self:start!important;}.heroStatsPanel{right:0!important;top:4%!important;}}
@media(min-width:951px) and (max-width:1250px){.ecosystem>.field{width:68%!important;justify-self:start!important;}.heroStatsPanel{right:0!important;top:2%!important;width:190px!important;}}
@media(max-width:950px){.ecosystem>.field{width:100%!important;justify-self:center!important;}.heroStatsPanel{position:relative!important;top:auto!important;right:auto!important;}}
/* Final spatial separation: stats card must clear the orbital field. */
.ecosystem{overflow:visible!important;}
@media(min-width:1251px){.ecosystem>.field{width:66%!important;justify-self:start!important;transform:translateX(-4%)!important;}.heroStatsPanel{right:-9%!important;top:4%!important;width:210px!important;}}
@media(min-width:951px) and (max-width:1250px){.ecosystem>.field{width:62%!important;justify-self:start!important;transform:translateX(-3%)!important;}.heroStatsPanel{right:-6%!important;top:2%!important;width:190px!important;}}
/* Approved layout: no floating stats card over the living field. */
.heroStatsPanel{display:none!important}
`;
