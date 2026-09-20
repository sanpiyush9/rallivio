"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  siDiscord, siInstagram, siPinterest, siReddit, siSpotify, siTiktok,
  siTwitch, siX, siYoutube,
} from "simple-icons";

const DiscoverGlobe = dynamic(() => import("../components/DiscoverGlobe"), { ssr: false });

type PlatformIcon = { hex: string; path: string };

const LINKEDIN_ICON: PlatformIcon = {
  hex: "0A66C2",
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11-2.063-2.065 2.064 2.064 0 012.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 22.225 24z",
};

type DiscoveryItem = {
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
  url: string;
  embeddable: boolean;
  live_broadcast_content: string | null;
  topic: string;
  region: string;
  metadata?: {
    subscriber_count?: number | null;
    signal?: string;
    momentum_score?: number;
  };
  stats_refreshed_at?: string;
};

const topics = [
  "Trending", "AI & Tech", "Travel", "Food", "Gaming", "Fitness",
  "Podcasts", "Music", "Fashion", "Lifestyle", "Business", "Science",
];

const platformNodes: Array<{ name: string; icon: PlatformIcon; className: string; position: string }> = [
  { name: "YouTube", icon: siYoutube, className: "youtube", position: "p1" },
  { name: "Instagram", icon: siInstagram, className: "instagram", position: "p2" },
  { name: "TikTok", icon: siTiktok, className: "tiktok", position: "p3" },
  { name: "X", icon: siX, className: "x", position: "p4" },
  { name: "LinkedIn", icon: LINKEDIN_ICON, className: "linkedin", position: "p5" },
  { name: "Reddit", icon: siReddit, className: "reddit", position: "p6" },
  { name: "Twitch", icon: siTwitch, className: "twitch", position: "p7" },
  { name: "Spotify", icon: siSpotify, className: "spotify", position: "p8" },
  { name: "Pinterest", icon: siPinterest, className: "pinterest", position: "p9" },
  { name: "Discord", icon: siDiscord, className: "discord", position: "p10" },
];

const signalLabels = ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped", "Live Now"];
const signalIcons: Record<string, string> = {
  "Now Moving": "🔥", "Breaking Out": "⚡", "On the Rise": "↗",
  "Under the Radar": "👀", "Just Dropped": "⭐", "Live Now": "◉",
};

function formatCount(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function ageLabel(iso: string) {
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function topicFor(item: DiscoveryItem) {
  if (item.topic) {
    const raw = item.topic.replace(/_/g, " ");
    return raw === "AI" ? "AI & Tech" : raw.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Unclassified";
}

function signalFor(item: DiscoveryItem) {
  return item.metadata?.signal ?? "";
}

function normalizeSignal(signal: string) {
  if (!signal) return "";
  const found = signalLabels.find((label) => label.toLowerCase() === signal.toLowerCase());
  return found ?? signal;
}

function deltaLabel(score: number | undefined) {
  if (score == null || !Number.isFinite(score)) return "—";
  const value = Math.round(score);
  return `${value >= 0 ? "+" : ""}${value}%`;
}

export default function Home() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [activeTopic, setActiveTopic] = useState("Trending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [liveIndex, setLiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/discovery", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.state ?? "DATA_UNAVAILABLE");
        if (cancelled) return;
        const next = Array.isArray(body.items) ? body.items : [];
        setItems(next);
        setLastSync(body.refreshedAt ?? next[0]?.stats_refreshed_at ?? null);
        setSelectedId((current) =>
          current && next.some((item: DiscoveryItem) => item.id === current)
            ? current
            : next[0]?.id ?? null,
        );
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "DATA_UNAVAILABLE");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLiveIndex((v) => v + 1), 4_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const ranked = useMemo(
    () => [...items].sort((a, b) => {
      const signalOrder = signalLabels.indexOf(normalizeSignal(signalFor(b))) - signalLabels.indexOf(normalizeSignal(signalFor(a)));
      return signalOrder || (b.metadata?.momentum_score ?? 0) - (a.metadata?.momentum_score ?? 0);
    }),
    [items],
  );

  const visible = useMemo(
    () => activeTopic === "Trending"
      ? ranked
      : ranked.filter((item) => topicFor(item) === activeTopic),
    [activeTopic, ranked],
  );

  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? ranked[0] ?? null;

  const signalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const label of signalLabels) counts[label] = 0;
    for (const item of items) {
      const label = normalizeSignal(signalFor(item));
      if (label in counts) counts[label] += 1;
    }
    return counts;
  }, [items]);

  const latestSignals = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.stats_refreshed_at ?? b.published_at).getTime() - new Date(a.stats_refreshed_at ?? a.published_at).getTime());
    const result: DiscoveryItem[] = [];
    const usedRegions = new Set<string>();
    for (const item of sorted) {
      const region = (item.region || "Global").toUpperCase();
      if (usedRegions.has(region) && result.length < 4) continue;
      result.push(item);
      usedRegions.add(region);
      if (result.length === 4) break;
    }
    if (result.length < 4) {
      for (const item of sorted) {
        if (!result.some((x) => x.id === item.id)) result.push(item);
        if (result.length === 4) break;
      }
    }
    return result;
  }, [items]);

  const emerging = useMemo(
    () => ranked.filter((item) => (item.metadata?.subscriber_count ?? 0) > 0 && (item.metadata?.subscriber_count ?? 0) <= 500_000).slice(0, 20),
    [ranked],
  );

  const activeTopics = useMemo(() => new Set(items.map(topicFor).filter(Boolean)).size, [items]);
  const trackedCreators = useMemo(() => new Set(items.map((item) => item.channel_id).filter(Boolean)).size, [items]);

  const topicRows = useMemo(() => {
    const rows = new Map<string, { count: number; score: number }>();
    for (const item of items) {
      const topic = topicFor(item);
      const current = rows.get(topic) ?? { count: 0, score: 0 };
      current.count += 1;
      current.score += item.metadata?.momentum_score ?? 0;
      rows.set(topic, current);
    }
    return [...rows.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 20);
  }, [items]);

  const liveCards = useMemo(() => {
    if (!latestSignals.length) return [];
    return Array.from({ length: Math.min(8, Math.max(4, latestSignals.length)) }, (_, index) => latestSignals[(index + liveIndex) % latestSignals.length]);
  }, [latestSignals, liveIndex]);

  const selectItem = (item: DiscoveryItem) => setSelectedId(item.id);

  const openVideo = (item: DiscoveryItem) => {
    if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
  };

  const showNotice = (message: string) => setNotice(message);

  return (
    <main className="rallivioDiscover">
      <style jsx global>{`
        :root {
          --bg:#040914; --panel:rgba(10,18,32,.88); --panel2:rgba(16,28,48,.78);
          --line:rgba(120,170,220,.18); --text:#f6fbff; --muted:#8ea1b9;
          --cyan:#42d9ff; --blue:#2563eb; --green:#45e0a0; --red:#ff5267; --amber:#ffc857;
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth;background:var(--bg)}
        body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button,input{font:inherit}
        button{cursor:pointer}
        .rallivioDiscover{min-height:100vh;overflow:hidden;background:
          radial-gradient(circle at 55% 18%,rgba(37,99,235,.16),transparent 30%),
          radial-gradient(circle at 85% 36%,rgba(66,217,255,.07),transparent 25%),var(--bg)}
        .topbar{height:64px;display:flex;align-items:center;gap:20px;padding:0 22px;border-bottom:1px solid var(--line);background:rgba(4,9,20,.9);backdrop-filter:blur(18px);position:sticky;top:0;z-index:40}
        .brand{font-size:24px;font-weight:950;letter-spacing:-1.5px;line-height:.8;white-space:nowrap}
        .brand span,.footerLogo span{color:var(--cyan)}
        .brand small{display:block;margin-top:5px;font-size:5.5px;letter-spacing:1px;color:#8292a8}
        .nav{display:flex;align-items:center;gap:6px;flex:1;min-width:0}
        .nav button{border:0;background:transparent;color:#aebbd0;padding:10px 13px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
        .nav button:hover,.nav button.active{color:#fff;background:var(--blue);box-shadow:0 7px 22px rgba(37,99,235,.3)}
        .headerSearchWrap{position:relative;width:260px;flex:0 0 260px}
        .headerSearchWrap>span{position:absolute;left:12px;top:8px;color:#8192aa;font-size:16px;z-index:1}
        .topSearch{width:100%;height:34px;border:1px solid var(--line);border-radius:20px;background:#07101f;color:#e8f1ff;padding:0 12px 0 32px;font-size:10px;outline:0}
        .topSearch:focus{border-color:#2c91ff;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
        .topActions{display:flex;align-items:center;gap:8px}
        .plans{border:0;background:var(--blue);color:#fff;border-radius:17px;padding:8px 14px;font-size:10px;font-weight:800}
        .circleButton{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:#0a1424;color:#dceaff}
        .avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#58d8ff,#245be8);font-weight:900;font-size:11px}
        .hero{position:relative;display:grid;grid-template-columns:minmax(320px,.95fr) minmax(500px,1.45fr) minmax(220px,.55fr);gap:18px;align-items:center;min-height:535px;padding:30px 28px 22px}
        .hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 55% 50%,rgba(37,99,235,.16),transparent 30%),linear-gradient(180deg,rgba(7,16,31,.1),rgba(4,9,20,.72));z-index:-1}
        .heroCopy{max-width:520px}
        .liveBadge{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;background:rgba(112,15,31,.38);border:1px solid rgba(255,82,103,.25);font-size:9px;color:#f8dce1}
        .liveBadge i{width:7px;height:7px;border-radius:50%;background:#ff4c64;box-shadow:0 0 12px #ff4c64}
        .hero h1{margin:18px 0 12px;font-size:clamp(45px,4.8vw,72px);line-height:.91;letter-spacing:-4px}
        .hero h1 em{font-style:normal;background:linear-gradient(90deg,#63e5ff,#2b78ff);-webkit-background-clip:text;background-clip:text;color:transparent}
        .heroLead{max-width:500px;color:#9fb0c7;font-size:13px;line-height:1.55}
        .heroSearch{display:flex;align-items:center;margin-top:19px;height:47px;border-radius:26px;background:#f7fbff;padding:4px 5px 4px 16px;box-shadow:0 15px 45px rgba(37,99,235,.18)}
        .heroSearch input{flex:1;border:0;outline:0;background:transparent;color:#162238;font-size:12px}
        .heroSearch button{width:37px;height:37px;border:0;border-radius:50%;background:var(--blue);color:#fff;font-size:19px}
        .topicPills{display:flex;flex-wrap:wrap;gap:6px;max-height:62px;overflow:hidden;margin-top:12px}
        .topicPills button{border:1px solid var(--line);background:rgba(255,255,255,.035);color:#b9c6d9;border-radius:16px;padding:6px 9px;font-size:8px;white-space:nowrap}
        .topicPills button.active{background:#164ba8;border-color:#2f80ff;color:#fff}
        .heroStats{display:flex;gap:7px;margin-top:14px}
        .heroStat{min-width:82px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:rgba(10,20,36,.62)}
        .heroStat strong{display:block;font-size:15px}.heroStat span{font-size:7px;color:#8092aa}
        .ecosystem{height:500px;position:relative;display:grid;place-items:center}
        .ecosystemGlow{position:absolute;width:430px;height:430px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.27),rgba(66,217,255,.08) 42%,transparent 72%);filter:blur(10px)}
        .core{position:relative;width:255px;height:255px;border-radius:50%;display:grid;place-items:center;z-index:5}
        .globeStage{position:absolute!important;inset:0!important;border-radius:50%;z-index:1;filter:drop-shadow(0 0 32px rgba(54,184,255,.42))}
        .globeFallback{background:radial-gradient(circle at 30% 25%,#5ce5ff,#1660c7 35%,#071c48 66%,#020713 100%)!important}
        .coreContent{position:relative;z-index:10;text-align:center;text-shadow:0 3px 16px #000}
        .coreLogo{font-size:28px;font-weight:950;letter-spacing:-1.7px}.coreSub{font-size:6px;letter-spacing:1.2px;color:#d8ebff}.corePulse{margin-top:8px;font-size:7px;color:#72e6b5}
        .orbitLine{position:absolute;border:1px solid rgba(66,217,255,.35);border-radius:50%;width:380px;height:180px;transform:rotate(-18deg);z-index:7}.orbitLine.two{width:330px;height:235px;transform:rotate(31deg);border-color:rgba(66,217,255,.2)}.orbitLine.three{width:430px;height:300px;transform:rotate(-10deg);border-color:rgba(37,99,235,.16)}
        .platformNode{position:absolute;display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;color:#fff;z-index:12;min-width:70px}
        .platformIcon{width:45px;height:45px;border-radius:50%;display:grid;place-items:center;background:#0b1324;border:1px solid rgba(255,255,255,.16);box-shadow:0 12px 25px #0008}
        .platformGlyph{width:20px;height:20px;fill:var(--brand,#fff)}
        .platformNode strong{font-size:8px}.platformNode small{font-size:6px;color:#6f839e}
        .platformNode:hover{transform:translateY(-3px)} .youtube .platformIcon{background:#f02b43}.instagram .platformIcon{background:#b83d92}.tiktok .platformIcon{background:#050505}.x .platformIcon{background:#050505}.linkedin .platformIcon{background:#0a66c2}
        .p1{top:2%;left:45%}.p2{top:14%;right:5%}.p3{top:45%;right:0}.p4{top:46%;left:3%}.p5{bottom:1%;left:44%}.p6{top:5%;left:4%}.p7{top:7%;right:28%}.p8{bottom:5%;right:4%}.p9{bottom:8%;left:13%}.p10{bottom:1%;right:30%}
        .activity{margin-top:12px;border:1px solid var(--line);border-radius:14px;background:rgba(8,16,30,.78);overflow:hidden}
        .activityHead{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;border-bottom:1px solid var(--line);font-size:10px}.liveStatus{font-size:7px;color:var(--green)}
        .activityList{max-height:270px;overflow:hidden}.activityItem{width:100%;display:grid;grid-template-columns:24px 1fr auto;gap:7px;align-items:center;padding:9px 11px;border:0;border-bottom:1px solid rgba(120,170,220,.08);background:transparent;color:#dce7f7;text-align:left}.activityItem:hover{background:rgba(37,99,235,.1)}.activityIcon{color:#ff4d63}.activityText{font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.activityTime{font-size:7px;color:#71839c}
        .section{padding:0 28px 22px}.sectionHead{display:flex;justify-content:space-between;align-items:end;margin:4px 0 10px}.sectionHead h2{margin:0;font-size:17px}.sectionHead p{margin:3px 0 0;color:#71849e;font-size:8px}.viewAll{border:0;background:transparent;color:#63dfff;font-size:8px}
        .liveField{border:1px solid var(--line);border-radius:14px;background:rgba(8,17,31,.82);overflow:hidden}.liveFieldHead{display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--line)}.liveFieldHead strong{font-size:11px}.liveFieldHead span{font-size:7px;color:#69e8b2}.liveFieldTrack{display:flex;gap:9px;padding:10px;overflow:hidden}.liveCard{min-width:220px;display:grid;grid-template-columns:76px 1fr;gap:8px;border:1px solid rgba(120,170,220,.13);border-radius:10px;background:rgba(255,255,255,.025);padding:6px}.liveCard img{width:76px;height:54px;object-fit:cover;border-radius:7px}.liveCard strong{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.liveCard small{display:block;font-size:7px;color:#71849d;margin-top:4px}.liveSignal{font-size:7px;font-weight:800;color:#42d9ff}.liveRegion{font-size:7px;color:#b7c8dc}
        .pulse{padding:0 28px 22px}.pulseStrip{display:grid;grid-template-columns:180px repeat(4,1fr) 220px;gap:7px;align-items:stretch}.pulseLabel,.pulseMetric,.mapCard{border:1px solid var(--line);background:rgba(8,17,31,.8);border-radius:10px}.pulseLabel{padding:12px}.pulseLabel b{display:block;font-size:8px;letter-spacing:1px}.pulseLabel span{font-size:7px;color:var(--green)}.pulseMetric{padding:11px 12px}.pulseMetric strong{display:block;font-size:18px}.pulseMetric span{font-size:7px;color:#8497b0}.mapCard{padding:10px;background:radial-gradient(circle at 50% 50%,rgba(37,99,235,.2),rgba(8,17,31,.85) 70%)}.mapCard b{font-size:8px}.mapCard span{display:block;color:#7489a5;font-size:7px;margin-top:3px}
        .pulseSection{padding:0 28px 22px}.signalTabs{display:flex;gap:6px;overflow:auto;padding-bottom:8px}.signalTab{border:1px solid var(--line);background:#091426;color:#9eb0c8;border-radius:17px;padding:7px 10px;font-size:8px;white-space:nowrap}.signalTab.active{background:#1555c6;border-color:#2f84ff;color:#fff}.signalCount{margin-left:6px;padding:2px 5px;border-radius:8px;background:#071020;color:#7890ad}.signalTab.zero{opacity:.45}
        .cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.signalCard{border:1px solid var(--line);border-radius:11px;background:rgba(9,18,32,.88);overflow:hidden;cursor:pointer}.signalCard:hover{border-color:#2e7fff;transform:translateY(-2px)}.signalThumb{position:relative;aspect-ratio:16/9;background:#07101c}.signalThumb img{width:100%;height:100%;object-fit:cover;display:block}.signalBadge{position:absolute;left:6px;top:6px;border-radius:8px;padding:3px 6px;background:#0d64ce;color:#fff;font-size:6px;font-weight:900}.duration{position:absolute;right:5px;bottom:5px;background:#000b;color:#fff;padding:2px 4px;border-radius:4px;font-size:6px}.signalBody{padding:8px}.signalBody strong{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:9px;line-height:1.3}.channel{display:block;margin-top:5px;font-size:7px;color:#91a4bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.meta{display:flex;justify-content:space-between;gap:4px;margin-top:7px;font-size:6.5px;color:#71849c}.delta{color:var(--green);font-weight:800}
        .bottomGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:0 28px 30px}.bottomPanel{border:1px solid var(--line);border-radius:12px;background:rgba(8,17,31,.86);min-height:360px;overflow:hidden}.bottomPanelHead{padding:12px 13px;border-bottom:1px solid var(--line)}.bottomPanelHead h3{margin:0;font-size:11px}.bottomPanelHead p{margin:3px 0 0;font-size:7px;color:#71849e}.radar{height:120px;margin:10px;border:1px solid rgba(66,217,255,.12);border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.18),transparent 56%),repeating-radial-gradient(circle,transparent 0 23px,rgba(66,217,255,.12) 24px);position:relative}.radar:after{content:"";position:absolute;left:50%;top:50%;width:2px;height:48%;background:linear-gradient(transparent,#42d9ff);transform-origin:bottom;animation:sweep 3.2s linear infinite}@keyframes sweep{to{transform:rotate(360deg)}}.topicRow,.creatorRow{display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;padding:8px 12px;border-top:1px solid rgba(120,170,220,.07)}.topicIcon{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;background:#10213a;color:#63dfff;font-size:10px}.topicName{font-size:8px;color:#d4dfed}.topicChange{font-size:8px;color:#6e879f}.topicChange.rising{color:var(--green)}.topicChange.falling{color:var(--red)}.creatorRow{grid-template-columns:42px 1fr auto}.creatorRow img{width:38px;height:38px;border-radius:50%;object-fit:cover}.creatorRow strong{display:block;font-size:8px}.creatorRow span{display:block;margin-top:3px;font-size:7px;color:#71849c}.follow{border:0;background:var(--blue);color:#fff;border-radius:13px;padding:6px 9px;font-size:7px;font-weight:800}
        .empty{padding:25px 13px;color:#71849c;font-size:8px}.notice{position:fixed;right:18px;bottom:18px;z-index:80;background:#10203a;border:1px solid #2b78ff;color:#dff4ff;border-radius:10px;padding:10px 13px;font-size:9px;box-shadow:0 15px 35px #0008}
        @media(max-width:1200px){.hero{grid-template-columns:1fr 1.3fr}.activity{display:none}.pulseStrip{grid-template-columns:170px repeat(2,1fr)}.mapCard{display:none}.cards{grid-template-columns:repeat(3,1fr)}.bottomGrid{grid-template-columns:1fr 1fr}.bottomPanel:last-child{grid-column:1/-1}}
        @media(max-width:820px){.topbar{flex-wrap:wrap;height:auto;padding:10px 14px}.nav{order:3;overflow:auto;flex-basis:100%}.nav button{padding:7px 9px}.headerSearchWrap{width:150px;flex:1}.hero{display:block;padding:24px 16px}.ecosystem{height:430px;margin-top:10px}.heroStats{flex-wrap:wrap}.section,.pulse,.pulseSection,.bottomGrid{padding-left:16px;padding-right:16px}.liveCard{min-width:190px}.cards{grid-template-columns:repeat(2,1fr)}.bottomGrid{grid-template-columns:1fr}.bottomPanel:last-child{grid-column:auto}}
        @media(max-width:520px){.brand small{display:none}.nav button:nth-child(n+4){display:none}.topSearch{font-size:8px}.hero h1{font-size:43px;letter-spacing:-2.5px}.ecosystem{height:360px}.core{width:190px;height:190px}.orbitLine{width:290px;height:140px}.orbitLine.two{width:250px;height:175px}.platformNode{min-width:55px}.platformIcon{width:37px;height:37px}.platformNode strong{font-size:7px}.platformNode small{font-size:5px}.p1{top:0}.p6{left:0}.p7{right:16%}.cards{grid-template-columns:1fr}.pulseStrip{grid-template-columns:1fr 1fr}.pulseLabel{grid-column:1/-1}}
      `}</style>

      <header className="topbar">
        <div className="brand">RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></div>
        <nav className="nav" aria-label="Primary navigation">
          <button className="active" type="button">Discover</button>
          <button type="button" onClick={() => document.getElementById("creators")?.scrollIntoView({ behavior: "smooth" })}>Creators</button>
          <button type="button" onClick={() => document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" })}>Brands &amp; Opportunities</button>
          <button type="button" onClick={() => showNotice("Community is coming soon.")}>Community</button>
          <button type="button" onClick={() => showNotice("RALLIVIO connects creators, culture and opportunities.")}>About</button>
        </nav>
        <div className="headerSearchWrap"><span>⌕</span><input className="topSearch" aria-label="Search RALLIVIO" placeholder="Search creators, topics, trends…" /></div>
        <div className="topActions">
          <button className="plans" type="button" onClick={() => window.location.assign("/pricing")}>Plans</button>
          <button className="circleButton" type="button" aria-label="Theme" onClick={() => showNotice("Theme controls are being refined.")}>☼</button>
          <button className="circleButton" type="button" aria-label="Notifications" onClick={() => showNotice("No new notifications.")}>◌</button>
          <button className="avatar" type="button" aria-label="Account" onClick={() => window.location.assign("/login")}>S</button>
        </div>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <div className="liveBadge"><i/> <b>LIVE</b><span>The Creator Economy is Moving Right Now</span></div>
          <h1>See what&apos;s<br/><em>moving.</em><br/>Shape what&apos;s next.</h1>
          <p className="heroLead">RALLIVIO turns the creator internet into a living field — people, culture, signals and opportunities moving together in one place.</p>
          <div className="heroSearch">
            <input placeholder="What do you want to discover?" aria-label="What do you want to discover?" />
            <button type="button" onClick={() => showNotice("Discovery search will use the connected search index.")}>→</button>
          </div>
          <div className="topicPills">
            {topics.slice(0, 10).map((topic) => (
              <button key={topic} className={activeTopic === topic ? "active" : ""} onClick={() => setActiveTopic(topic)}>{topic}</button>
            ))}
            <button onClick={() => showNotice(`${topics.length} topic categories are available as the discovery index grows.`)}>+12 more</button>
          </div>
          <div className="heroStats">
            <div className="heroStat"><strong>1</strong><span>Connected platform</span></div>
            <div className="heroStat"><strong>{formatCount(items.length)}</strong><span>Signals in current feed</span></div>
            <div className="heroStat"><strong>{formatCount(activeTopics)}</strong><span>Active topics</span></div>
          </div>
        </div>

        <div className="ecosystem">
          <div className="ecosystemGlow"/>
          <div className="orbitLine"/>
          <div className="orbitLine two"/>
          <div className="orbitLine three"/>
          <div className="core">
            <DiscoverGlobe/>
            <div className="coreContent">
              <div className="coreLogo">RALL<span>IVIO</span></div>
              <div className="coreSub">A MORE CONNECTED TOMORROW</div>
              <div className="corePulse">● {loading ? "Syncing verified signals" : "YouTube · verified"}</div>
            </div>
          </div>
          {platformNodes.map((platform) => (
            <button key={platform.name} className={`platformNode ${platform.className} ${platform.position}`} style={{ "--brand": `#${platform.icon.hex}` } as CSSProperties} onClick={() => platform.name === "YouTube" ? showNotice("YouTube is the connected source.") : showNotice(`${platform.name}: Coming soon`)}>
              <span className="platformIcon"><svg className="platformGlyph" viewBox="0 0 24 24" aria-hidden="true"><path d={platform.icon.path}/></svg></span>
              <strong>{platform.name}</strong>
              <small>{platform.name === "YouTube" ? "● LIVE" : "Coming soon"}</small>
            </button>
          ))}
        </div>

        <aside className="activity">
          <div className="activityHead"><strong>Global Activity</strong><span className="liveStatus">● LIVE</span></div>
          <div className="activityList">
            {ranked.slice(0, 6).map((item) => (
              <button className="activityItem" key={item.id} onClick={() => openVideo(item)}>
                <span className="activityIcon">●</span>
                <span className="activityText">{topicFor(item)} · {item.title}</span>
                <span className="activityTime">{ageLabel(item.stats_refreshed_at ?? item.published_at)}</span>
              </button>
            ))}
            {!ranked.length && <div className="empty">{error ? "Waiting for the verified discovery source." : "Syncing real activity…"}</div>}
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div><h2>LIVE FIELD</h2><p>Recent verified movement across 25 regions · YouTube</p></div>
          <span className="liveStatus">● {items.length ? `${items.length} verified signals` : "syncing"}</span>
        </div>
        <div className="liveField">
          <div className="liveFieldHead"><strong>What is moving worldwide right now</strong><span>updates every 60s</span></div>
          <div className="liveFieldTrack">
            {liveCards.map((item, index) => (
              <button className="liveCard" key={`${item.id}-${index}`} onClick={() => openVideo(item)}>
                <img src={item.thumbnail} alt="" />
                <div>
                  <span className="liveRegion">{(item.region || "GLOBAL").toUpperCase()}</span>
                  <span className="liveSignal">{normalizeSignal(signalFor(item)) || "Verified"}</span>
                  <strong>{item.channel_title}</strong>
                  <small>{item.metadata?.momentum_score != null ? deltaLabel(item.metadata.momentum_score) : ageLabel(item.stats_refreshed_at ?? item.published_at)}</small>
                </div>
              </button>
            ))}
            {!liveCards.length && <div className="empty">No verified signal has been returned yet.</div>}
          </div>
        </div>
      </section>

      <section className="pulse">
        <div className="pulseStrip">
          <div className="pulseLabel"><b>GLOBAL CREATOR PULSE</b><span>● Live</span></div>
          <div className="pulseMetric"><strong>{formatCount(emerging.length)}</strong><span>Rising Creators</span></div>
          <div className="pulseMetric"><strong>{formatCount(items.length)}</strong><span>Verified Signals</span></div>
          <div className="pulseMetric"><strong>{formatCount(activeTopics)}</strong><span>Active Topics</span></div>
          <div className="pulseMetric"><strong>{formatCount(trackedCreators)}</strong><span>Tracked Creators</span></div>
          <div className="mapCard"><b>Global Activity</b><span>Real-time signals from the connected YouTube discovery pool.</span></div>
        </div>
      </section>

      <section className="pulseSection" id="moving">
        <div className="sectionHead">
          <div><h2>RALLIVIO PULSE</h2><p>Real signals. Real movement. Updated in real-time from our discovery pool.</p></div>
          <button className="viewAll" onClick={() => setActiveTopic("Trending")}>View all signals →</button>
        </div>
        <div className="signalTabs">
          {signalLabels.map((label) => (
            <button key={label} className={`signalTab ${label === "Now Moving" ? "active" : ""} ${signalCounts[label] === 0 ? "zero" : ""}`} onClick={() => showNotice(`${label}: ${signalCounts[label]} current signals`)}>
              {signalIcons[label]} {label}<span className="signalCount">{signalCounts[label]}</span>
            </button>
          ))}
        </div>
        <div className="cards">
          {visible.slice(0, 10).map((item) => (
            <article className="signalCard" key={item.id} onClick={() => openVideo(item)}>
              <div className="signalThumb">
                <img src={item.thumbnail} alt="" />
                <span className="signalBadge">{normalizeSignal(signalFor(item)) || "Verified"}</span>
                {item.duration && <span className="duration">{item.duration}</span>}
              </div>
              <div className="signalBody">
                <strong>{item.title}</strong>
                <span className="channel">{item.channel_title}</span>
                <div className="meta"><span>{formatCount(item.views)} views · {ageLabel(item.stats_refreshed_at ?? item.published_at)}</span><span className="delta">{deltaLabel(item.metadata?.momentum_score)}</span></div>
              </div>
            </article>
          ))}
          {!visible.length && <div className="empty">No verified records match this topic yet.</div>}
        </div>
      </section>

      <section className="bottomGrid" id="creators">
        <div className="bottomPanel">
          <div className="bottomPanelHead"><h3>Discovery Radar</h3><p>Where attention is building right now</p></div>
          <div className="radar"/>
          {topicRows.map(([topic, data], index) => (
            <div className="topicRow" key={topic}>
              <div className="topicIcon">{index + 1}</div>
              <span className="topicName">{topic}</span>
              <span className="topicChange">{data.count ? `${formatCount(data.count)} signals` : "—"}</span>
            </div>
          ))}
          {!topicRows.length && <div className="empty">Movement will appear after verified observations accumulate.</div>}
        </div>

        <div className="bottomPanel">
          <div className="bottomPanelHead"><h3>Trending Topics</h3><p>Fastest growing topics across observed platforms</p></div>
          {topicRows.map(([topic, data]) => (
            <div className="topicRow" key={topic}>
              <div className="topicIcon">↗</div>
              <span className="topicName">{topic}</span>
              <span className="topicChange">{data.score ? `${Math.round(data.score)} momentum` : "—"}</span>
            </div>
          ))}
          {!topicRows.length && <div className="empty">No measurable topic movement yet.</div>}
        </div>

        <div className="bottomPanel" id="opportunities">
          <div className="bottomPanelHead"><h3>Creator Spotlight</h3><p>Emerging creators to watch</p></div>
          {emerging.slice(0, 8).map((item) => (
            <div className="creatorRow" key={item.id}>
              <img src={item.thumbnail} alt="" />
              <div><strong>@{item.channel_title.replace(/\s+/g, "").toLowerCase()}</strong><span>{topicFor(item)} · {formatCount(item.metadata?.subscriber_count ?? 0)} followers</span></div>
              <button className="follow" onClick={() => selectItem(item)}>Follow</button>
            </div>
          ))}
          {!emerging.length && <div className="empty">Emerging-creator signals will appear after enough verified observations are available.</div>}
        </div>
      </section>

      <footer className="footerNote"><div className="footerLogo">RALL<span>IVIO</span><small>Discover People. Power What&apos;s Next.</small></div><span>{lastSync ? "Verified source observations drive the discovery surface. No presentation metric is fabricated." : "Waiting for the first verified refresh."}</span></footer>
      {notice && <div className="notice" role="status">{notice}</div>}
    </main>
  );
}
