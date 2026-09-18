"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type PointerEvent, type CSSProperties } from "react";
import { siDiscord, siFacebook, siInstagram, siLinkedin, siPinterest, siReddit, siSnapchat, siSpotify, siTiktok, siTwitch, siX, siYoutube, type SimpleIcon } from "simple-icons";

const DiscoverGlobe = dynamic(() => import("../components/DiscoverGlobe"), { ssr: false });

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
  metadata?: { subscriber_count?: number | null; signal?: string; momentum_score?: number };
  stats_refreshed_at?: string;
};

const topics = ["Trending", "AI", "Travel", "Food", "Gaming", "Fitness"];
const platformNodes: Array<{ name: string; icon: SimpleIcon; className: string; state: string; position: string }> = [
  { name: "YouTube", icon: siYoutube, className: "youtube", state: "Connected", position: "p1" },
  { name: "Instagram", icon: siInstagram, className: "instagram", state: "Coming next", position: "p2" },
  { name: "TikTok", icon: siTiktok, className: "tiktok", state: "Coming next", position: "p3" },
  { name: "X", icon: siX, className: "x", state: "Coming next", position: "p4" },
  { name: "LinkedIn", icon: siLinkedin, className: "linkedin", state: "Coming next", position: "p5" },
  { name: "Facebook", icon: siFacebook, className: "facebook", state: "Coming next", position: "p6" },
  { name: "Twitch", icon: siTwitch, className: "twitch", state: "Coming next", position: "p7" },
  { name: "Reddit", icon: siReddit, className: "reddit", state: "Coming next", position: "p8" },
  { name: "Pinterest", icon: siPinterest, className: "pinterest", state: "Coming next", position: "p9" },
  { name: "Discord", icon: siDiscord, className: "discord", state: "Coming next", position: "p10" },
  { name: "Spotify", icon: siSpotify, className: "spotify", state: "Coming next", position: "p11" },
  { name: "Snapchat", icon: siSnapchat, className: "snapchat", state: "Coming next", position: "p12" },
];

function formatCount(value: number) {
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
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (/travel|trip|tourism|hotel|flight|vacation/.test(text)) return "Travel";
  if (/gaming|game|xbox|playstation|steam|gpu/.test(text)) return "Gaming";
  if (/food|recipe|meal|cooking|restaurant/.test(text)) return "Food";
  if (/fitness|workout|gym|health/.test(text)) return "Fitness";
  if (/ai|artificial intelligence|chatgpt|machine learning|openai|robot/.test(text)) return "AI";
  return "Tech";
}

function signalFor(item: DiscoveryItem) {
  return item.metadata?.signal ?? "Trending";
}

export default function Home() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [activeTopic, setActiveTopic] = useState("Trending");
  const [activePlatform, setActivePlatform] = useState("YouTube");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [notice, setNotice] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    if (!PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) return;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) console.info("[RALLIVIO PERF] LCP candidate", Math.round(last.startTime), "ms");
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    return () => observer.disconnect();
  }, []);

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
        setSelectedId((current) => current && next.some((item: DiscoveryItem) => item.id === current) ? current : next[0]?.id ?? null);
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
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const ranked = useMemo(() => [...items].sort((a, b) => (b.metadata?.momentum_score ?? 0) - (a.metadata?.momentum_score ?? 0)), [items]);
  const visible = useMemo(() => activeTopic === "Trending" ? ranked : ranked.filter((item) => topicFor(item) === activeTopic), [activeTopic, ranked]);
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? ranked[0] ?? null;
  const emerging = useMemo(() => ranked.filter((item) => {
    const subscribers = item.metadata?.subscriber_count ?? 0;
    return subscribers > 0 && subscribers <= 500_000;
  }).slice(0, 5), [ranked]);

  const heroSignals = useMemo(() => {
    const byTopic = topics.slice(1).map((topic) => ranked.find((item) => topicFor(item) === topic));
    return byTopic.filter((item): item is DiscoveryItem => Boolean(item));
  }, [ranked]);
  const heroSignal = heroSignals[heroSignals.length ? heroIndex % heroSignals.length : 0] ?? null;

  const heroHeadline = useMemo(() => {
    if (!heroSignal) return "Waiting for a verified signal.";
    const topic = topicFor(heroSignal);
    const region = heroSignal.region && heroSignal.region.toUpperCase() !== "GLOBAL" ? heroSignal.region : "worldwide";
    const signal = signalFor(heroSignal).toLowerCase();
    if (/accelerat|acceleration/.test(signal)) return `${topic} is accelerating in ${region}.`;
    if (/emerg|newcom|rising/.test(signal) || ((heroSignal.metadata?.subscriber_count ?? 0) > 0 && (heroSignal.metadata?.subscriber_count ?? 0) <= 500_000)) return `Newcomers are rising in ${topic} in ${region}.`;
    if (/surge|break|velocity|momentum|spike/.test(signal)) return `${topic} content is surging in ${region}.`;
    return `${topic} is moving in ${region}.`;
  }, [heroSignal]);

  useEffect(() => {
    if (heroPaused || heroSignals.length < 2) return;
    const timer = window.setInterval(() => setHeroIndex((index) => index + 1), 5500);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroSignals.length]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({ x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 });
  };

  const selectItem = (item: DiscoveryItem) => {
    setSelectedId(item.id);
    setActivePlatform("YouTube");
  };

  const selectPlatform = (name: string) => {
    setActivePlatform(name);
    if (name === "YouTube") {
      setNotice("YouTube environment connected — showing verified discovery data.");
    } else {
      setNotice(`${name} environment is being prepared. No unverified activity is shown.`);
    }
  };

  return (
    <main className="rallivioDiscover" onPointerMove={handlePointerMove} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
      <style jsx global>{`
        :root { --rv-bg:#07091a; --rv-purple:#8c4dff; --rv-pink:#e56cff; --rv-blue:#38bdf8; --rv-text:#f8f7ff; --rv-muted:#b8b8ce; }
        * { box-sizing:border-box; }
        body { margin:0; background:#060817; color:var(--rv-text); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
        button,input { font:inherit; } button { cursor:pointer; }
        .rallivioDiscover { min-height:100vh; overflow:hidden; background:radial-gradient(circle at 50% 10%,rgba(110,66,255,.27),transparent 33%),radial-gradient(circle at 86% 40%,rgba(0,210,255,.09),transparent 28%),linear-gradient(135deg,#090b21 0%,#08081a 52%,#10112b 100%); }
        .topbar { position:sticky;top:0;z-index:50;height:72px;display:flex;align-items:center;gap:24px;padding:0 34px;border-bottom:1px solid rgba(255,255,255,.11);background:rgba(8,9,25,.73);backdrop-filter:blur(22px); }
        .brand { font-size:28px;font-weight:900;letter-spacing:-1.5px;white-space:nowrap;line-height:.85; }.brand span,.footerLogo span { color:#a768ff; }.brand small { display:block;font-size:6px;letter-spacing:1.1px;color:#aaa9c1;margin-top:6px; }
        .nav { display:flex;gap:18px;align-items:center;flex:1;min-width:0; }.nav button { border:0;background:transparent;color:#deddef;padding:10px 0;border-radius:999px;font-weight:600;white-space:nowrap;transition:.25s; }.nav button:hover,.nav button.active { color:#fff;background:linear-gradient(135deg,#8544ff,#bd61ff);box-shadow:0 0 28px rgba(157,75,255,.35); }
        .topSearch { width:min(320px,24vw);height:42px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:rgba(4,5,17,.45);color:#bbb9cf;padding:0 18px;outline:0; }.topSearch:focus { border-color:#9b61ff;box-shadow:0 0 0 3px rgba(155,97,255,.12); }.topActions{display:flex;align-items:center;gap:12px;flex:0 0 auto}.circleButton{width:39px;height:39px;border-radius:50%;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff}.avatar{width:37px;height:37px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ffbf65,#8e4fff);font-weight:800}
        .hero { position:relative;min-height:625px;padding:50px 48px 32px;display:grid;grid-template-columns:minmax(300px,.82fr) minmax(510px,1.7fr) minmax(250px,.62fr);gap:20px;align-items:center;isolation:isolate; }.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 51% 46%,rgba(121,71,255,.30),transparent 27%),linear-gradient(180deg,rgba(17,19,51,.15),rgba(6,8,22,.9));z-index:-2}.hero::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:58px 58px;mask-image:linear-gradient(to bottom,black,transparent);z-index:-1}
        .heroCopy{align-self:center;max-width:470px}.heroHeadlineWrap{min-height:178px}.heroUpdated{display:flex;align-items:center;gap:7px;margin-top:-5px;color:#9ea6c3;font-size:10px;letter-spacing:.35px}.heroUpdatedDot{width:7px;height:7px;border-radius:50%;background:#57e6a9;box-shadow:0 0 12px #57e6a9;animation:heroLivePulse 1.1s ease-in-out infinite}.livePill{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border-radius:999px;background:rgba(255,50,84,.13);border:1px solid rgba(255,74,102,.38);font-size:11px;font-weight:800}.liveDot{width:8px;height:8px;border-radius:50%;background:#ff4265;box-shadow:0 0 16px #ff4265;animation:blink 1.4s infinite}@keyframes blink{50%{opacity:.4;transform:scale(.75)}}
        .hero h1{margin:18px 0 14px;font-size:clamp(48px,5.1vw,75px);line-height:.94;letter-spacing:-4px}.hero h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c269ff 60%,#7f6bff);-webkit-background-clip:text;color:transparent}.heroLead{color:#d0cfe0;font-size:18px;line-height:1.55;max-width:430px}.heroSearch{margin-top:25px;display:flex;align-items:center;height:52px;border-radius:28px;background:rgba(255,255,255,.95);padding:5px 6px 5px 18px;box-shadow:0 15px 50px rgba(75,49,184,.32)}.heroSearch input{flex:1;border:0;outline:0;background:transparent;color:#252239;font-size:14px}.heroSearch button{width:42px;height:42px;border:0;border-radius:50%;background:linear-gradient(135deg,#6244ff,#b45eff);color:#fff;font-size:22px}.topicPills{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.topicPills button{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.06);color:#eee;padding:8px 13px;border-radius:18px;font-size:12px}.topicPills button.active{border-color:#e66aff;background:linear-gradient(135deg,rgba(119,64,255,.5),rgba(230,106,255,.32));box-shadow:0 0 22px rgba(179,85,255,.25)}
        .stats{display:flex;gap:0;margin-top:25px;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10)}.stat{flex:1;padding:12px 13px;border-right:1px solid rgba(255,255,255,.08)}.stat:last-child{border:0}.stat strong{display:block;font-size:19px}.stat span{font-size:9px;color:#aaa9bf}
        .ecosystem{position:relative;height:570px;display:grid;place-items:center;transition:transform .22s ease-out}.ecosystemInner{position:relative;width:100%;height:100%;transform:perspective(1200px) rotateY(calc(var(--mx) * -2deg)) rotateX(calc(var(--my) * 1.5deg));transition:transform .25s ease-out}.ecosystemGlow{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:390px;height:390px;border-radius:50%;background:radial-gradient(circle,rgba(151,75,255,.46),rgba(72,50,201,.16) 38%,transparent 68%);filter:blur(5px);animation:glow 5s ease-in-out infinite}@keyframes glow{50%{transform:translate(-50%,-50%) scale(1.08);opacity:.78}}
        .core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:220px;height:220px;border-radius:50%;display:grid;place-items:center;text-align:center;background:radial-gradient(circle at 35% 25%,#3846b7,#12142d 48%,#080a19 76%);border:1px solid rgba(184,140,255,.72);box-shadow:0 0 0 10px rgba(145,81,255,.07),0 0 70px rgba(131,69,255,.5),inset 0 0 60px rgba(72,57,208,.35);z-index:8}.core::before{content:"";position:absolute;inset:-20px;border-radius:50%;border:1px solid rgba(141,100,255,.2);animation:spin 22s linear infinite}.core::after{content:"";position:absolute;inset:-68px;border-radius:50%;border:1px dashed rgba(111,154,255,.17);animation:spin 34s linear infinite reverse}@keyframes spin{to{transform:rotate(360deg)}}.coreLogo{font-size:35px;font-weight:900;letter-spacing:-2px}.coreLogo span{color:#a75eff}.coreSub{font-size:9px;color:#d8d6ec;letter-spacing:.7px}.corePulse{margin-top:9px;font-size:9px;color:#72e4b3}.corePulse::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#61e8ad;box-shadow:0 0 10px #61e8ad;margin-right:5px}
        .platformNode{position:absolute;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:88px;border:0;background:transparent;color:#fff;transition:transform .4s cubic-bezier(.2,.8,.2,1);z-index:10}.platformNode:hover{transform:translateY(-7px) scale(1.06)}.platformIcon{width:61px;height:61px;border-radius:18px;display:grid;place-items:center;font-size:28px;font-weight:900;background:#11132b;border:1px solid rgba(255,255,255,.18);box-shadow:0 15px 35px rgba(0,0,0,.35)}.youtube .platformIcon{background:linear-gradient(135deg,#ff2d43,#9f1222)}.instagram .platformIcon{background:linear-gradient(135deg,#ffbf44,#ef3f86,#7d43e9)}.tiktok .platformIcon{background:#050607}.x .platformIcon{background:#050505}.linkedin .platformIcon{background:#0b66c2}.platformNode strong{font-size:11px}.platformNode small{font-size:8px;color:#a9a8bf}.p1{top:1%;left:43%}.p2{top:18%;right:6%}.p3{bottom:11%;right:12%}.p4{top:42%;left:6%}.p5{bottom:1%;left:42%}
        .thumbNode{position:absolute;width:92px;border:1px solid rgba(255,255,255,.12);border-radius:15px;overflow:hidden;background:rgba(8,10,28,.72);color:#fff;padding:0;box-shadow:0 14px 35px rgba(0,0,0,.34);transition:transform .35s}.thumbNode:hover{transform:translateY(-8px) scale(1.07)}.thumbNode img{display:block;width:92px;height:67px;object-fit:cover}.thumbNode span{display:block;padding:6px 7px 7px;font-size:8px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.t1{top:22%;left:11%}.t2{top:12%;left:66%}.t3{bottom:14%;left:15%}.t4{bottom:19%;right:3%}.t5{top:55%;right:5%}
        .orbitLine{position:absolute;left:11%;top:24%;width:78%;height:50%;border:1px solid rgba(150,111,255,.17);border-radius:50%;transform:rotate(-13deg)}.orbitLine.two{width:67%;height:70%;left:16%;top:15%;transform:rotate(30deg);border-color:rgba(52,191,255,.11)}
        .activity{align-self:start;margin-top:18px;border:1px solid rgba(113,164,255,.35);border-radius:20px;background:rgba(11,15,39,.75);box-shadow:0 20px 50px rgba(0,0,0,.28),inset 0 0 35px rgba(54,104,255,.08);overflow:hidden}.activityHead{display:flex;justify-content:space-between;align-items:center;padding:17px 18px;border-bottom:1px solid rgba(255,255,255,.1)}.activityHead strong{font-size:18px}.liveStatus{font-size:9px;color:#5ef0b1}.activityList{padding:5px 0}.activityItem{display:grid;grid-template-columns:30px 1fr auto;gap:9px;align-items:center;width:100%;padding:11px 15px;border:0;background:transparent;color:#fff;text-align:left}.activityItem:hover{background:rgba(255,255,255,.04)}.activityIcon{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:#ff2c43;font-size:12px}.activityItem:nth-child(2) .activityIcon{background:#d943e7}.activityItem:nth-child(3) .activityIcon{background:#111}.activityItem:nth-child(4) .activityIcon{background:#15bfa2}.activityItem:nth-child(5) .activityIcon{background:#1985cf}.activityText{font-size:10px;line-height:1.25}.activityTime{font-size:8px;color:#8d8ca4;white-space:nowrap}
        .movingSection{margin:-44px 48px 0;position:relative;z-index:20;padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:rgba(248,246,255,.95);color:#13132c;box-shadow:0 25px 80px rgba(0,0,0,.35)}.sectionHead{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:15px}.sectionHead h2{margin:0;font-size:25px;color:#17183d}.sectionHead p{margin:4px 0 0;font-size:12px;color:#45466c}.viewAll{border:0;background:transparent;color:#6942dd;font-weight:700}.movingGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.trendCard{position:relative;border-radius:15px;overflow:hidden;background:#fff;box-shadow:0 8px 24px rgba(30,25,75,.13);cursor:pointer;transition:transform .28s,box-shadow .28s}.trendCard:hover{transform:translateY(-6px);box-shadow:0 15px 35px rgba(74,45,155,.22)}.trendCard.chosen{outline:2px solid #8b50ff}.trendImage{height:130px;position:relative;overflow:hidden;background:#ddd}.trendImage img{width:100%;height:100%;object-fit:cover;display:block}.trendBadge{position:absolute;top:9px;left:9px;padding:5px 9px;border-radius:10px;color:#fff;font-size:9px;font-weight:800;background:#7546ff}.trendPlay{position:absolute;right:8px;bottom:8px;width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#6031df}.trendInfo{padding:10px}.trendInfo strong{display:block;font-size:12px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.trendInfo span{display:block;font-size:9px;color:#696a83;margin-top:6px}.trendInfo small{font-size:9px;color:#30314a}.lowerGrid{display:grid;grid-template-columns:1.3fr .7fr;gap:15px;margin-top:16px}.journey{border-radius:20px;background:linear-gradient(100deg,#f2f0ff,#fff3ff);padding:20px 22px;border:1px solid rgba(104,66,220,.12)}.journey h2{margin:0 0 3px;font-size:23px;color:#24214d}.journey p{margin:0;color:#535275;font-size:12px}.journeySteps{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:19px}.journeyStep{display:flex;align-items:center;gap:8px;color:#29264e;font-size:10px;font-weight:700}.journeyStep i{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#fff;border:1px solid #ddd7ff;color:#6d43ef;font-style:normal;font-size:14px}.opportunity{border-radius:20px;overflow:hidden;position:relative;min-height:155px;padding:20px;background:linear-gradient(135deg,#24124f,#301067 58%,#19204d)}.opportunity::after{content:"";position:absolute;right:-20px;bottom:-35px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(239,105,255,.6),transparent 66%)}.opportunity h3{margin:0;position:relative;z-index:1;font-size:16px}.opportunity p{position:relative;z-index:1;color:#c8c2e2;font-size:11px;max-width:240px;line-height:1.5}.opportunity button{position:relative;z-index:1;border:0;border-radius:16px;padding:9px 13px;background:linear-gradient(135deg,#7b4aff,#cf5fff);color:#fff;font-size:10px;font-weight:700}
        .emerging{margin:16px 0 0;border-radius:20px;background:rgba(255,255,255,.95);color:#17172f;padding:20px 22px}.emergingList{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.creator{display:grid;grid-template-columns:40px 1fr auto;gap:8px;align-items:center;padding:9px;border:1px solid #e8e5f5;border-radius:14px}.creator img{width:40px;height:40px;border-radius:50%;object-fit:cover}.creator strong{font-size:10px;display:block}.creator span{font-size:8px;color:#77758e}.creator b{font-size:10px;color:#22b95e}.follow{border:0;background:#7a48ed;color:#fff;border-radius:10px;padding:6px 8px;font-size:9px}.footerNote{padding:35px 48px 55px;color:#9291ad;font-size:10px;display:flex;justify-content:space-between}.footerLogo{font-size:18px;font-weight:900}.footerLogo small{display:block;font-size:8px;font-weight:400;margin-top:3px}.notice{position:fixed;right:24px;bottom:24px;z-index:100;padding:12px 16px;border:1px solid rgba(181,121,255,.35);border-radius:14px;background:rgba(12,13,34,.92);box-shadow:0 15px 45px rgba(0,0,0,.35);font-size:11px;color:#eee}
        @media(max-width:1280px){.topbar{gap:16px;padding:0 20px}.brand{min-width:165px}.nav{gap:13px}.nav button{font-size:11px}.headerSearchWrap{min-width:190px}.topSearch{font-size:11px}.headerLunar{display:none}.hero{grid-template-columns:1fr 1.2fr;padding:35px 25px}.heroHeadlineWrap{min-height:160px}.heroDynamicTitle{min-height:160px}.activity{display:none}.movingSection{margin:-25px 25px 0}.movingGrid{grid-template-columns:repeat(3,1fr)}.emergingList{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:760px){.topbar{position:relative;flex-wrap:wrap}.nav{order:3;width:100%;overflow:auto}.topSearch{flex:1;width:auto}.hero{display:block;min-height:auto;padding:30px 18px 12px}.hero h1{font-size:50px;letter-spacing:-2.8px}.heroLead{font-size:15px}.ecosystem{height:430px;margin-top:15px}.core{width:170px;height:170px}.coreLogo{font-size:27px}.platformIcon{width:48px;height:48px;font-size:22px}.p1{top:0;left:39%}.p2{top:17%;right:0}.p3{bottom:9%;right:2%}.p4{top:43%;left:0}.p5{bottom:0;left:38%}.thumbNode{transform:scale(.86)}.t1{top:24%;left:8%}.t2{top:14%;left:66%}.t3{bottom:15%;left:7%}.t4{bottom:20%;right:-3%}.t5{top:55%;right:-2%}.movingSection{margin:0 12px;padding:14px}.movingGrid{grid-template-columns:repeat(2,1fr)}.trendImage{height:110px}.lowerGrid{grid-template-columns:1fr}.journeySteps{grid-template-columns:1fr 1fr}.emergingList{grid-template-columns:1fr}.stats{overflow:auto}.stat{min-width:80px}.footerNote{padding:25px 18px;display:block}.footerNote span{display:block;margin-top:10px}}
        /* LIVE DISCOVER precision pass */
        .topbar{height:74px;padding:10px 38px;gap:22px;position:sticky;top:0;z-index:100;background:rgba(5,7,20,.9);border-bottom:1px solid rgba(150,120,255,.18);box-shadow:0 8px 30px rgba(0,0,0,.2)}
        .brand{font-size:29px;line-height:.82;min-width:195px}.brand small{font-size:6px}
        .nav{gap:2px;align-items:center}.nav button{font-size:13px;padding:11px 13px;white-space:nowrap}.nav button:nth-child(3){max-width:150px;line-height:1.05}
        .headerSearchWrap{position:relative;display:flex;align-items:center;flex:0 1 360px;min-width:230px}.headerSearchWrap>span{position:absolute;left:14px;color:#747b99;font-size:14px;z-index:1}.headerSearchWrap .topSearch{width:100%;padding-left:35px;height:42px}
        .topActions{gap:8px}.headerLive,.headerLunar,.headerLogin{height:40px;border-radius:22px;font-size:11px;font-weight:850;cursor:pointer}.headerLive{padding:0 16px;border:1px solid #7a5dff88;background:linear-gradient(135deg,#8b43ff,#bb60ff);color:#fff;box-shadow:0 0 22px #914eff33}.headerLive i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#61efb2;box-shadow:0 0 10px #61efb2;margin-right:7px}.headerLunar{padding:0 14px;border:1px solid #ffffff18;background:#10132a;color:#d7d8e8}.headerLogin{padding:0 19px;border:0;background:linear-gradient(135deg,#9850ff,#c061ff);color:#fff;box-shadow:0 8px 24px #8d49ff33}
        .heroNowTicker{display:flex;align-items:center;gap:7px;margin-top:12px;color:#9ea6c3;font-size:9px;text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;overflow:hidden}.heroNowTicker b{color:#67e6b1}.heroNowTicker strong{color:#dce0f2;font-size:10px;overflow:hidden;text-overflow:ellipsis}.heroNowTicker small{color:#7d87a2;margin-left:auto}.heroNowPulse{width:7px;height:7px;border-radius:50%;background:#57e6a9;box-shadow:0 0 12px #57e6a9;animation:heroLivePulse 1.1s ease-in-out infinite}@keyframes heroLivePulse{50%{transform:scale(1.65);opacity:.45}}\n        @media (prefers-reduced-motion: reduce){.heroDynamicTitle strong,.heroUpdatedDot,.iconSheen{animation:none!important}.globeStage .discoverGlobeCanvas{display:none}.globeStage .globeFallback{opacity:1!important}.platformNode,.platformNode:hover{transition:none!important;transform:none!important}}
        .heroDynamicTitle{min-height:178px;margin-top:17px!important}.heroDynamicTitle span{display:inline-block}.heroDynamicTitle strong{display:block;max-width:500px;font-size:clamp(27px,2.7vw,44px);line-height:1.02;letter-spacing:-1.8px;color:#dfe2ff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;animation:heroTitleIn .4s cubic-bezier(.4,0,.2,1) both}@keyframes heroTitleIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .ecosystem{height:600px}.ecosystemInner{isolation:isolate}.ecosystemGlow{width:470px;height:470px;background:radial-gradient(circle,rgba(92,120,255,.28),rgba(121,57,255,.16) 38%,transparent 70%);filter:blur(9px)}
        .core{width:260px;height:260px;background:transparent;border:0;box-shadow:none;z-index:8;overflow:visible}.core::before{inset:-24px;border-color:#8d6cff55;z-index:5}.core::after{inset:-74px;border-color:#58caff2e;z-index:5}.coreContent{position:relative;z-index:20;display:grid;place-items:center;pointer-events:none;text-shadow:0 2px 15px #000}
        .globeStage{position:absolute;inset:-4px;z-index:1;border-radius:50%;overflow:visible;filter:drop-shadow(0 0 30px rgba(63,156,255,.34));}
        .globeFallback{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 32% 25%,#66dcff 0,#1b64c7 27%,#09275e 59%,#020711 100%);box-shadow:inset -28px -20px 45px #000c,inset 18px 10px 28px rgba(107,230,255,.2),0 0 0 1px rgba(117,220,255,.48),0 0 35px rgba(60,157,255,.32);transition:opacity .25s ease;}
        .globeFallback::before{content:"";position:absolute;inset:7%;border-radius:50%;background:linear-gradient(100deg,transparent 0 28%,rgba(255,255,255,.10) 38%,transparent 47% 100%);mix-blend-mode:screen;}
        .globeFallback::after{content:"";position:absolute;inset:-7%;border-radius:50%;border:2px solid rgba(110,223,255,.45);box-shadow:0 0 18px rgba(95,217,255,.45),0 0 55px rgba(106,85,255,.18);}
        .globeLand{position:absolute;background:rgba(57,217,160,.76);filter:drop-shadow(0 0 4px rgba(71,230,180,.34));clip-path:polygon(5% 30%,24% 8%,50% 17%,61% 40%,46% 56%,27% 50%,19% 78%,7% 61%);}
        .landA{left:10%;top:22%;width:37%;height:34%;}.landB{left:43%;top:20%;width:38%;height:30%;transform:rotate(8deg);}.landC{left:56%;top:51%;width:30%;height:25%;transform:rotate(-13deg);}
        .discoverGlobeCanvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .25s ease;}
        .globeStage.globeReady .globeFallback{opacity:0;}.globeStage.globeReady .discoverGlobeCanvas{opacity:1;}
        .platformNode{z-index:12;min-width:86px;position:absolute;display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:transparent;color:#fff;transition:transform .35s cubic-bezier(.2,.8,.2,1),filter .35s;}.platformNode:hover{transform:translateY(-5px) scale(1.08);filter:brightness(1.08);}.platformIcon{position:relative;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--brand) 72%,white),var(--brand) 46%,#05060d 100%);border:1px solid rgba(255,255,255,.28);box-shadow:inset 10px 8px 18px rgba(255,255,255,.20),inset -13px -15px 23px rgba(0,0,0,.60),0 14px 30px rgba(0,0,0,.44),0 0 20px color-mix(in srgb,var(--brand) 35%,transparent);transform:translateZ(0);overflow:hidden;}.platformGlyph{position:relative;z-index:3;width:25px;height:25px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55));fill:#fff;}.platformIcon::before{content:"";position:absolute;left:16%;top:13%;width:25%;height:25%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,.24) 42%,transparent 70%);filter:blur(.3px);z-index:4;transition:transform .35s ease;}.platformIcon::after{content:"";position:absolute;inset:4px;border-radius:50%;border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 0 14px rgba(255,255,255,.08),inset -5px -7px 10px rgba(0,0,0,.24);z-index:5;pointer-events:none;}.platformNode:hover .platformIcon::before{transform:translate(5px,3px) scale(1.08);}.iconSheen{position:absolute;inset:-25%;background:linear-gradient(125deg,transparent 35%,rgba(255,255,255,.32) 46%,transparent 55%);transform:translateX(-75%) rotate(15deg);animation:iconSheen 4.6s ease-in-out infinite;z-index:6;}.platformNode strong{font-size:9px;text-shadow:0 2px 8px #000;white-space:nowrap}.platformNode small{font-size:7px;color:#9ba7c4;white-space:nowrap}
        .youtube{--brand:#ff0000}.instagram{--brand:#e4405f}.tiktok{--brand:#111111}.x{--brand:#000000}.linkedin{--brand:#0a66c2}.facebook{--brand:#1877f2}.twitch{--brand:#9146ff}.reddit{--brand:#ff4500}.pinterest{--brand:#bd081c}.discord{--brand:#5865f2}.spotify{--brand:#1ed760}.snapchat{--brand:#fffc00}.snapchat .platformGlyph{fill:#000}
        .p1{top:1%;left:43%}.p2{top:18%;right:6%}.p3{bottom:11%;right:12%}.p4{top:42%;left:6%}.p5{bottom:1%;left:42%}
        .p6{top:9%;left:17%}.p7{top:4%;right:25%}.p8{top:51%;right:0%}.p9{bottom:9%;right:27%}.p10{bottom:2%;left:24%}.p11{top:31%;right:1%}.p12{top:31%;left:22%}
        @keyframes iconSheen{0%,45%{transform:translateX(-75%) rotate(15deg)}65%,100%{transform:translateX(75%) rotate(15deg)}}
        .orbitLine{z-index:3;left:8%;top:20%;width:84%;height:60%;border-color:#8e66ff33;box-shadow:0 0 15px #8e66ff22}.orbitLine.two{width:73%;height:76%;left:14%;top:12%;border-color:#4fcaff2c}.orbitLine.three{position:absolute;left:17%;top:30%;width:66%;height:40%;border:1px dashed #ff72d833;border-radius:50%;transform:rotate(-32deg);z-index:3}
        .thumbNode{z-index:14}
        @media(max-width:1150px){.topbar{gap:10px;padding:10px 20px}.brand{min-width:165px}.nav button{padding:9px 8px;font-size:11px}.headerSearchWrap{min-width:180px}.headerLunar{display:none}.hero{grid-template-columns:1fr 1.2fr;padding:35px 25px}.heroDynamicTitle{min-height:220px}.activity{display:none}}
        @media(max-width:760px){.topbar{height:auto;min-height:58px}.brand{min-width:0}.nav button:nth-child(3){max-width:none}.headerSearchWrap{order:4;flex-basis:100%;min-width:0}.headerLogin{padding:0 14px}.hero{display:block;min-height:auto;padding:30px 18px 12px}.heroHeadlineWrap{min-height:0}.heroDynamicTitle{min-height:0}.heroDynamicTitle strong{font-size:28px}.ecosystem{height:470px}.core{width:190px;height:190px}.platformIcon{width:54px;height:54px}.platformGlyph{width:22px;height:22px}.p6{top:5%;left:4%}.p7{top:3%;right:4%}.p8{right:-2%}.p9{bottom:6%;right:5%}.p10{bottom:0;left:4%}.p11{right:-3%}.p12{left:4%}.coreLogo{font-size:27px}}
      `}</style>

      <header className="topbar">
        <div className="brand">RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></div>
        <nav className="nav" aria-label="Primary navigation">
          <button className="active" type="button">Discover</button>
          <button type="button" onClick={() => document.getElementById("emerging")?.scrollIntoView({ behavior: "smooth" })}>Creators</button>
          <button type="button" onClick={() => document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" })}>Opportunities</button>
          <button type="button" onClick={() => setNotice("Community intelligence is coming into the connected discovery field.")}>Community</button>
          <button type="button" onClick={() => setNotice("RALLIVIO connects creators, brands and opportunities through verified signals.")}>About</button>
        </nav>
        <div className="headerSearchWrap"><span>⌕</span><input className="topSearch" aria-label="Search RALLIVIO" placeholder="Search creators, brands, videos, trends..." /></div>
        <div className="topActions">
          <button className="headerLive" type="button" onClick={() => document.getElementById("moving")?.scrollIntoView({ behavior: "smooth" })}><i/> LIVE</button>
          <button className="headerLunar" type="button" aria-label="Language">EN⌄</button>
          <button className="headerLogin" type="button" onClick={() => window.location.assign("/login")}>Login</button>
        </div>
      </header>

      <section className="hero" aria-label="RALLIVIO Discover">
        <div className="heroCopy">
          <div className="heroNowTicker" aria-live="polite">
            <span className="heroNowPulse"/><b>{heroSignal?.metadata?.signal ?? "LIVE SIGNAL"}</b>
            <span>·</span><strong>{heroSignal ? heroSignal.channel_title : "Verified discovery field"}</strong>
            {heroSignal && <small>{ageLabel(heroSignal.published_at)}</small>}
          </div>
          <div className="heroHeadlineWrap" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}>
            <h1 className="heroDynamicTitle">
              <span>See what&apos;s moving.</span><br />
              <strong key={heroSignal?.id ?? "waiting"}>{heroHeadline}</strong>
            </h1>
          </div>
          <div className="heroUpdated"><span className="heroUpdatedDot" />{lastSync ? `updated ${ageLabel(lastSync)}` : "waiting for verified refresh"}</div>
          <p className="heroLead">Real trends. Real creators. Real brands. Real opportunities — changing as verified signals move.</p>

          <div className="heroSearch"><input aria-label="What would you like to discover" placeholder="What would you like to discover today?" onKeyDown={(event) => { if (event.key === "Enter") document.getElementById("moving")?.scrollIntoView({ behavior: "smooth" }); }} /><button onClick={() => document.getElementById("moving")?.scrollIntoView({ behavior: "smooth" })}>→</button></div>
          <div className="topicPills">{topics.map((topic) => <button key={topic} className={activeTopic === topic ? "active" : ""} onClick={() => setActiveTopic(topic)}>{topic === "Trending" ? "🔥 " : ""}{topic}</button>)}</div>
          <div className="stats"><div className="stat"><strong>{items.length ? `${items.length}+` : "—"}</strong><span>Verified signals</span></div><div className="stat"><strong>{emerging.length || "—"}</strong><span>Emerging creators</span></div><div className="stat"><strong>1</strong><span>Connected platform</span></div><div className="stat"><strong>60s</strong><span>Discovery refresh</span></div></div>
        </div>

        <div className="ecosystem">
          <div className="ecosystemInner" style={{ transform: `perspective(1200px) rotateY(${pointer.x * -2}deg) rotateX(${pointer.y * 1.5}deg)` }}>
            <div className="ecosystemGlow" />
            <div className="orbitLine" /><div className="orbitLine two" /><div className="orbitLine three" />
            {ranked.slice(0, 5).map((item, index) => <button key={item.id} className={`thumbNode t${index + 1}`} onClick={() => selectItem(item)} style={{ transform: `translate(${pointer.x * (index + 1) * 4}px, ${pointer.y * (index + 1) * 3}px)` }} aria-label={`Discover ${item.title}`}><img src={item.thumbnail} alt="" /><span>{item.channel_title}</span></button>)}
            <div className="core">
              <DiscoverGlobe />
              <div className="coreContent">
                <div className="coreLogo">RALL<span>IVIO</span></div><div className="coreSub">A LIVING CREATOR DISCOVERY SYSTEM</div>
                <div className="corePulse">{loading ? "Syncing verified signals" : `${items.length} verified signals in motion`}</div>
              </div>
            </div>
            {platformNodes.map((platform) => <button key={platform.name} className={`platformNode ${platform.className} ${platform.position}`} style={{ "--brand": `#${platform.icon.hex}` } as CSSProperties} onClick={() => selectPlatform(platform.name)} aria-label={`${platform.name} platform environment`}><span className="platformIcon"><svg className="platformGlyph" viewBox="0 0 24 24" aria-hidden="true"><path d={platform.icon.path}/></svg><i className="iconSheen"/></span><strong>{platform.name}</strong><small>{platform.name === activePlatform ? "Selected" : platform.state}</small></button>)}</div>
        </div>

        <aside className="activity">
          <div className="activityHead"><strong>Live Activity</strong><span className="liveStatus">● VERIFIED SOURCE</span></div>
          <div className="activityList">{ranked.slice(0, 5).map((item) => <button className="activityItem" key={item.id} onClick={() => selectItem(item)}><span className="activityIcon">▶</span><span className="activityText">{item.title}</span><span className="activityTime">{ageLabel(item.published_at)}</span></button>)}</div>
          {!ranked.length && <div style={{ padding: 18, color: "#9997b0", fontSize: 12 }}>{error ? "Waiting for the verified discovery source." : "Syncing real activity..."}</div>}
        </aside>
      </section>

      <section className="movingSection" id="moving">
        <div className="sectionHead"><div><h2>What&apos;s Moving Now?</h2><p>Verified discovery signals refreshed from connected sources. Tap any topic to explore.</p></div><button className="viewAll" onClick={() => setActiveTopic("Trending")}>View All →</button></div>
        {error && <div style={{ padding: 15, marginBottom: 12, borderRadius: 12, background: "#fff1f3", color: "#8a2435", fontSize: 12 }}>Verified discovery is temporarily unavailable. RALLIVIO is not substituting fake content.</div>}
        <div className="movingGrid">{visible.slice(0, 5).map((item) => <article key={item.id} className={`trendCard ${selected?.id === item.id ? "chosen" : ""}`} onClick={() => selectItem(item)}><div className="trendImage"><img src={item.thumbnail} alt="" /><span className="trendBadge">{topicFor(item)}</span><span className="trendPlay">▶</span></div><div className="trendInfo"><strong>{item.title}</strong><span>{item.channel_title}</span><small>{formatCount(item.views)} views · {ageLabel(item.published_at)}</small></div></article>)}{!visible.length && !loading && <div style={{ gridColumn: "1/-1", padding: 35, textAlign: "center", color: "#77758e" }}>No verified records match this topic yet.</div>}</div>

        <div className="lowerGrid"><div className="journey"><h2>The RALLIVIO Journey</h2><p>From trends to real growth. A simple flow. A bigger tomorrow.</p><div className="journeySteps"><div className="journeyStep"><i>⌁</i>Discover →</div><div className="journeyStep"><i>◈</i>Understand →</div><div className="journeyStep"><i>◎</i>Connect →</div><div className="journeyStep"><i>♧</i>Collaborate →</div><div className="journeyStep"><i>✦</i>Grow</div></div></div><div className="opportunity" id="opportunities"><h3>Brands Are Looking for Creators</h3><p>Opportunity discovery will connect to verified creator and brand environments as those systems come online.</p><button>Explore Opportunities →</button></div></div>
      </section>

      <section className="emerging" id="emerging"><div className="sectionHead"><div><h2>Emerging Creators</h2><p>Audience-relative discovery: smaller channels can surface when verified performance supports it.</p></div><button className="viewAll">View All →</button></div><div className="emergingList">{emerging.map((item) => <div className="creator" key={item.id}><img src={item.thumbnail} alt="" /><div><strong>{item.channel_title}</strong><span>{topicFor(item)} · {formatCount(item.metadata?.subscriber_count ?? 0)} subscribers</span></div><b>{item.metadata?.momentum_score ?? 0}</b><button className="follow" onClick={() => selectItem(item)}>View</button></div>)}{!emerging.length && <div style={{ gridColumn: "1/-1", padding: 25, color: "#77758e" }}>Emerging-creator signals will appear after enough verified observations are available.</div>}</div></section>

      <footer className="footerNote"><div className="footerLogo">RALL<span>IVIO</span><small>Discover People. Power What&apos;s Next.</small></div><span>{lastSync ? "Verified source observations drive the discovery surface. Presentation motion is simulated; factual activity is not fabricated." : "Waiting for the first verified refresh."}</span></footer>
      {notice && <div className="notice" role="status">{notice}</div>}
    </main>
  );
}
