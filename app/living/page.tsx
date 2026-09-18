"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import * as si from "simple-icons";

type Item = {
  id: string; title: string; channel_title: string; channel_id: string; published_at: string; thumbnail: string;
  description: string; views: number; url: string; embeddable: boolean; topic: string; region?: string;
  metadata?: { subscriber_count?: number | null; signal?: string; momentum_score?: number };
};
type Category = { name: string; icon: string; keywords: string[] };
type Platform = { id: string; name: string; kind: string; connected: boolean; x: number; y: number };

const platforms: Platform[] = [
  { id: "youtube", name: "YouTube", kind: "youtube", x: 50.0, y: 8.0, connected: true },
  { id: "tiktok", name: "TikTok", kind: "tiktok", x: 71.0, y: 13.6, connected: false },
  { id: "linkedin", name: "LinkedIn", kind: "linkedin", x: 86.4, y: 29.0, connected: false },
  { id: "reddit", name: "Reddit", kind: "reddit", x: 92.0, y: 50.0, connected: false },
  { id: "discord", name: "Discord", kind: "discord", x: 86.4, y: 71.0, connected: false },
  { id: "snapchat", name: "Snapchat", kind: "snapchat", x: 71.0, y: 86.4, connected: false },
  { id: "pinterest", name: "Pinterest", kind: "pinterest", x: 50.0, y: 92.0, connected: false },
  { id: "spotify", name: "Spotify", kind: "spotify", x: 29.0, y: 86.4, connected: false },
  { id: "twitch", name: "Twitch", kind: "twitch", x: 13.6, y: 71.0, connected: false },
  { id: "facebook", name: "Facebook", kind: "facebook", x: 8.0, y: 50.0, connected: false },
  { id: "x", name: "X", kind: "x", x: 13.6, y: 29.0, connected: false },
  { id: "instagram", name: "Instagram", kind: "instagram", x: 29.0, y: 13.6, connected: false },
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

const signalTypes = ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped", "Live"] as const;
const themeDefinitions = [
  { id: "nebula", name: "Nebula Pulse", short: "Nebula", desc: "violet / deep space", mode: "explore", accent: "violet" },
  { id: "aurora", name: "Aurora Matrix", short: "Aurora", desc: "cyan / emerald", mode: "flow", accent: "cyan" },
  { id: "neon", name: "Neon Reactor", short: "Neon", desc: "magenta / ember", mode: "reactor", accent: "magenta" },
  { id: "lunar", name: "Lunar Glass", short: "Lunar", desc: "ice / silver", mode: "calm", accent: "ice" },
] as const;
const nav = [["Discover", "/"], ["Creators", "/creators"], ["Brands & Opportunities", "/brands"], ["Community", "/community"], ["About", "/about"]] as const;
const signalKey = (s?: string) => (s || "").toLowerCase().replace(/[_-]/g, " ").trim();
const signalMatches = (item: Item, signal: string) => { const actual = signalKey(item.metadata?.signal); const wanted = signalKey(signal); return actual === wanted || (wanted === "on the rise" && actual === "rising") || (wanted === "now moving" && actual === "trending"); };
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`; };
const categoryFor = (x: Item) => { const text = `${x.topic} ${x.title} ${x.description}`.toLowerCase(); return categories.find(c => c.name !== "Trending" && c.keywords.some(k => text.includes(k)))?.name || "Other"; };

function PlatformIcon({ kind }: { kind: string }) {
  const icons: Record<string, { path: string; title: string }> = {
    youtube: si.siYoutube,
    instagram: si.siInstagram,
    tiktok: si.siTiktok,
    x: si.siX,
    linkedin: {
      title: "LinkedIn",
      path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
    },
    spotify: si.siSpotify,
    twitch: si.siTwitch,
    facebook: si.siFacebook,
    pinterest: si.siPinterest,
    reddit: si.siReddit,
    discord: si.siDiscord,
    snapchat: si.siSnapchat,
  };
  const icon = icons[kind];
  if (!icon) return <span className="genericMark">•</span>;
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" role="img">
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

export default function LivingDiscover() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
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

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/discovery", { cache: "no-store" });
        const b = await r.json();
        if (!r.ok) throw new Error(b.state || "DATA_UNAVAILABLE");
        setItems(Array.isArray(b.items) ? b.items : []);
        setNotice("");
      } catch (e) { setNotice(e instanceof Error ? e.message : "DATA_UNAVAILABLE"); }
      finally { setLoading(false); }
    };
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 4200); return () => window.clearTimeout(id); }, [notice]);

  const ranked = useMemo(() => [...items].sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)), [items]);
  const shown = useMemo(() => {
    const base = filter === "Trending" ? ranked : ranked.filter(x => categoryFor(x) === filter);
    const s = q.trim().toLowerCase();
    return s ? base.filter(x => `${x.title} ${x.channel_title} ${x.description} ${x.topic}`.toLowerCase().includes(s)) : base;
  }, [ranked, filter, q]);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);
  const signalGroups = useMemo(() => signalTypes.map(name => ({ name, items: ranked.filter(x => signalMatches(x, name)).slice(0, 3) })), [ranked]);
  const emergingCreators = useMemo(() => {
    const byChannel = new Map<string, Item>();
    for (const item of ranked) {
      const current = byChannel.get(item.channel_id || item.channel_title);
      if (!current || (item.metadata?.momentum_score || 0) > (current.metadata?.momentum_score || 0)) byChannel.set(item.channel_id || item.channel_title, item);
    }
    return [...byChannel.values()].slice(0, 5);
  }, [ranked]);
  const go = (p: string) => { router.push(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pulseField = (message: string) => { setPulse(n => n + 1); setNotice(message); };
  const activatePlatform = (p: Platform) => { setActivePlatform(p.name); setPulse(n => n + 1); setNotice(p.connected ? "YouTube is source-connected. The field is responding to verified observations." : `${p.name} is present in the ecosystem. Its source adapter is not connected yet, so no activity is fabricated.`); };
  const command = (s: string) => {
    const l = s.trim().toLowerCase(); if (!l) return;
    const c = categories.find(x => x.name.toLowerCase() === l || x.name.toLowerCase().includes(l) || l.includes(x.name.toLowerCase()));
    if (c) { setFilter(c.name); setQ(""); pulseField(`RALLIVIO tuned the field to ${c.name}.`); return; }
    const p = platforms.find(x => l.includes(x.name.toLowerCase()));
    if (p) { activatePlatform(p); return; }
    if (l.includes("creator") || l.includes("profile")) { go("/creators"); return; }
    if (l.includes("brand")) { go("/brands"); return; }
    if (l.includes("opportun")) { go("/opportunities"); return; }
    setFilter("Trending"); setQ(s); pulseField(`Searching the verified discovery pool for “${s}”.`);
  };
  const activateCore = () => { setActivePlatform("YouTube"); setFilter("Trending"); setQ(""); pulseField("RALLIVIO re-centered. The living field is listening."); };

  return <main className={`rv theme-${theme}`}>
    <button className="themeScrim" type="button" aria-label="Close theme picker" onClick={() => setShowThemes(false)} style={{ display: showThemes ? "block" : "none" }} />
    <style>{css}</style>
    <header className="topbar">
      <button className="brand" type="button" onClick={() => go("/")}>RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></button>
      <nav>{nav.map(([n, p]) => <button key={p} className={p === "/" ? "active" : ""} type="button" onClick={() => go(p)}>{n}</button>)}</nav>
      <form className="search" onSubmit={e => { e.preventDefault(); command(q); }}><span>⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search anything: creators, brands, videos, trends…"/><button type="submit">↗</button></form>
      <button className="round signalButton" type="button" onClick={() => setNotice("Signals are sourced from the verified discovery pool.")}><i/>Live</button>
      <div className="themePickerWrap">
        <button className="round themeButton" type="button" aria-label="Choose field theme" aria-expanded={showThemes} onClick={() => setShowThemes(v => !v)}>
          <span className={"themeButtonGlyph " + theme}>✦</span><span>{themeDefinitions.find(x => x.id === theme)?.short || "Theme"}</span><i className={"themeButtonDot " + theme}/>
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
      {userEmail ? (
        <button className="loginButton" type="button" onClick={() => router.push("/account")}>
          {userEmail.split("@")[0]}
        </button>
      ) : (
        <button className="loginButton" type="button" onClick={() => router.push("/login")}>Login</button>
      )}
    </header>

    <section className="hero">
      <div className="heroCopy">
        <span className="pill"><i/> LIVE / THE CREATOR ECONOMY IS MOVING RIGHT NOW</span>
        <h1>See what’s<br/><em>moving.</em><br/>Shape what’s next.</h1>
        <p>RALLIVIO turns the creator internet into a living field — people, culture, signals and opportunities moving together in one place.</p>
        <form className="heroSearch" onSubmit={e => { e.preventDefault(); command(q); }}><span className="searchMark">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="What do you want to discover?" aria-label="Universal discovery search"/><button type="submit" aria-label="Search">→</button></form>
        <div className="categoryRail" aria-label="Discovery categories">
          {visibleCategories.map(c => <button key={c.name} className={filter === c.name ? "active" : ""} type="button" onClick={() => { setFilter(c.name); setQ(""); pulseField(`Field tuned to ${c.name}.`); }}><span>{c.icon}</span>{c.name}</button>)}
          <button className="more" type="button" onClick={() => setShowAllCategories(v => !v)}>{showAllCategories ? "Less ↑" : `+${categories.length - 10} more`}</button>
        </div>
        <div className="liveStrip" aria-label="Live discovery activity">
          <div className="liveStripHead"><span><i/> LIVE FIELD</span><small>{loading ? "syncing" : `${ranked.length} verified signals`}</small></div>
          <div className="liveStripItems">
            {ranked.slice(0, 3).map((x, i) => (
              <button key={x.id} type="button" onClick={() => setModal(x)}>
                <img src={x.thumbnail} alt="" />
                <span><b>{x.metadata?.signal || "Observed"}</b><small>{x.channel_title}</small></span>
                <em>{i === 0 ? "●" : "↗"}</em>
              </button>
            ))}
            {!ranked.length && <div className="liveStripEmpty">Waiting for the field to sync…</div>}
          </div>
        </div>
      </div>

      <div className="ecosystem">
        <div className={`field ${pulse ? "responding" : ""}`} aria-label="RALLIVIO living platform field" style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", flexShrink: 0 }}>
          <div className="fieldSpace">
            <div className="fieldBadge"><i/> LIVING FIELD <span>12 platforms · live interaction</span></div>
            <div className="fieldGrid"/><div className="nebula n1"/><div className="nebula n2"/>
            <div className="energyRing er1"/><div className="energyRing er2"/><div className="energyRing er3"/>
            <div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/>
            <div className="energyArc arc1"/><div className="energyArc arc2"/><div className="energyArc arc3"/>
            {Array.from({ length: 22 }, (_, i) => <i key={i} className={`particle particle${i + 1}`}/>) }
            {platforms.map(p => <button key={p.id} className={`platform ${activePlatform === p.name ? "selected" : ""}`} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", width: 110, textAlign: "center" }} type="button" aria-label={`${p.name} platform`} onClick={() => activatePlatform(p)} onPointerEnter={() => setActivePlatform(p.name)} onFocus={() => setActivePlatform(p.name)}>
              <span className={`platformMark ${p.kind}`}><PlatformIcon kind={p.kind}/></span><b>{p.name}</b><small>{p.connected ? "Connected" : "Explore"}</small>
            </button>)}
            <button className="core" type="button" aria-label="Activate RALLIVIO living discovery core" onClick={activateCore} onPointerDown={() => setPulse(n => n + 1)}>
              <span className="coreHalo h1"/><span className="coreHalo h2"/><span className="coreHalo h3"/><span className="coreLight"/>
              <strong>RALL<span>IVIO</span></strong><small>LIVING DISCOVERY SYSTEM</small><i><b>●</b> {loading ? "syncing" : `${ranked.length} verified signals`} · {activePlatform} focus</i>
            </button>
          </div>
        </div>
        <div className="fieldHint"><span>✦</span> Touch / hover the core or any platform — the field responds</div>
      </div>
    </section>

    <section className="lowerDiscover" id="signals">
      <div className="lowerHead">
        <div><span className="eyebrow">WHAT’S MOVING NOW?</span><h2>Live trends from the connected field.</h2><p>Real observations from YouTube, refreshed from the verified discovery pool.</p></div>
        <div className="sourceState"><i/> SOURCE CONNECTED <b>YouTube</b><small>{loading ? "Syncing source…" : `${ranked.length} verified videos · refresh every 60s`}</small></div>
      </div>
      <div className="movingLayout">
        <div className="movingMain">
          <div className="movingCards">
            {ranked.slice(0, 5).map((x, i) => <button className="movingCard" key={x.id} type="button" onClick={() => setModal(x)}>
              <div className="movingThumb"><img src={x.thumbnail} alt=""/><span>{categoryFor(x)}</span><b>{i === 0 ? "↗" : "▶"}</b></div>
              <div className="movingBody"><strong>{x.title}</strong><small>{x.channel_title}</small><div><em>{fmt(x.views)} views</em><span>{x.metadata?.signal || "Observed"}</span></div></div>
            </button>)}
            {!loading && !ranked.length && <div className="lowerEmpty">YouTube is connected, but the verified discovery pool has not returned observations yet.</div>}
            {loading && <div className="lowerEmpty">Syncing YouTube observations…</div>}
          </div>
          <div className="signalRail">
            {signalGroups.map(g => <button key={g.name} type="button" className={g.items.length ? "active" : ""} onClick={() => g.items[0] ? setModal(g.items[0]) : setNotice(`No verified ${g.name} observations are available right now.`)}><i/><b>{g.name}</b><small>{g.items.length ? `${g.items.length} verified` : "Waiting"}</small></button>)}
          </div>
        </div>
        <aside className="creatorPanel">
          <div className="panelHead"><div><span>EMERGING CREATORS</span><b>From the live pool</b></div><button type="button" onClick={() => go("/creators")}>View all →</button></div>
          {emergingCreators.map((x, i) => <button className="creatorRow" key={x.channel_id || x.channel_title} type="button" onClick={() => setModal(x)}>
            <span>{(i + 1).toString().padStart(2, "0")}</span><div><strong>{x.channel_title}</strong><small>{categoryFor(x)} · {fmt(Number(x.metadata?.subscriber_count || 0))} subscribers</small></div><em>{Math.round(Number(x.metadata?.momentum_score || 0))}</em>
          </button>)}
          {!loading && !emergingCreators.length && <div className="panelEmpty">Creator signals will appear here when YouTube observations are available.</div>}
        </aside>
      </div>
    </section>

    <section className="journeySection">
      <div className="journeyHead"><div><span className="eyebrow">THE RALLIVIO JOURNEY</span><h2>From discovery to momentum.</h2><p>A simple path from what’s moving to what you do next.</p></div><button type="button" onClick={() => go("/creators")}>Explore creators →</button></div>
      <div className="journeySteps">
        <button type="button" onClick={activateCore}><span>01</span><b>Discover</b><small>See what’s moving</small></button>
        <i>→</i>
        <button type="button" onClick={() => go("/creators")}><span>02</span><b>Understand</b><small>Explore creator signals</small></button>
        <i>→</i>
        <button type="button" onClick={() => go("/brands")}><span>03</span><b>Connect</b><small>Creators & brands</small></button>
        <i>→</i>
        <button type="button" onClick={() => go("/brands")}><span>04</span><b>Collaborate</b><small>Turn ideas into action</small></button>
        <i>→</i>
        <button type="button" onClick={() => go("/brands")}><span>05</span><b>Grow</b><small>Reach new audiences</small></button>
      </div>
    </section>

    <section className="opportunityBanner">
      <div><span className="eyebrow">BRANDS & OPPORTUNITIES</span><h2>Turn creator discovery into your next move.</h2><p>Explore the brand side of RALLIVIO for creator discovery, collaboration and opportunities.</p></div>
      <button type="button" onClick={() => go("/brands")}>Explore opportunities →</button>
    </section>

    <footer><b>RALL<span>IVIO</span></b><small>Discover People. Power What’s Next.</small><p>Source observations drive discovery. Motion responds to state; factual activity is never fabricated.</p></footer>
    {notice && <div className="toast" role="status"><b>RALLIVIO</b><span>{notice}</span></div>}
    {modal && <div className="backdrop" onClick={() => setModal(null)}><div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="close" type="button" onClick={() => setModal(null)}>×</button><div className="player">{modal.embeddable ? <iframe src={`https://www.youtube.com/embed/${modal.id}?autoplay=1&rel=0`} title={modal.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <img src={modal.thumbnail} alt=""/>}</div><span className="eyebrow">{modal.metadata?.signal || "Observed"} · VERIFIED OBSERVATION</span><h2>{modal.title}</h2><p>{modal.channel_title} · {fmt(modal.views)} views · {age(modal.published_at)}</p><button className="primary" type="button" onClick={() => window.open(modal.url, "_blank", "noopener,noreferrer")}>Watch on source ↗</button></div></div>}
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
.platform{padding:7px;border-radius:18px;transition:transform .2s,filter .2s}.platformMark{width:64px;height:64px;border-radius:50%;background:#151934;border:1px solid rgba(255,255,255,.16);box-shadow:0 14px 35px rgba(0,0,0,.35);position:relative;display:grid;place-items:center;overflow:hidden;transition:transform .2s,box-shadow .2s,border-color .2s}.platformMark:after{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(145deg,#ffffff18,transparent 48%,#00000018);pointer-events:none}.platformMark svg{width:31px;height:31px;position:relative;z-index:1}.platformMark.youtube{background:#ff0033;color:#fff;box-shadow:0 0 28px #ff00334d,0 14px 35px #0005}.platformMark.instagram{background:linear-gradient(145deg,#ffd600 0%,#ff7a00 28%,#ff0169 58%,#d300c5 82%,#7638fa 100%);color:#fff;box-shadow:0 0 28px #ff2d954d,0 14px 35px #0005}.platformMark.tiktok{background:#08090d;color:#fff;box-shadow:0 0 28px #25f4ee38,0 14px 35px #0005}.platformMark.linkedin{background:#0a66c2;color:#fff;box-shadow:0 0 28px #0a66c24d,0 14px 35px #0005}.platformMark.x{background:#050505;color:#fff;box-shadow:0 0 28px #ffffff22,0 14px 35px #0005}.platformMark.facebook{background:#1877f2;color:#fff;box-shadow:0 0 28px #1877f24d,0 14px 35px #0005}.platformMark.reddit{background:#ff4500;color:#fff;box-shadow:0 0 28px #ff45004d,0 14px 35px #0005}.platformMark.discord{background:#5865f2;color:#fff;box-shadow:0 0 28px #5865f24d,0 14px 35px #0005}.platformMark.twitch{background:#9146ff;color:#fff;box-shadow:0 0 28px #9146ff4d,0 14px 35px #0005}.platformMark.spotify{background:#1ed760;color:#050505;box-shadow:0 0 28px #1ed7604d,0 14px 35px #0005}.platformMark.pinterest{background:#e60023;color:#fff;box-shadow:0 0 28px #e600234d,0 14px 35px #0005}.platformMark.snapchat{background:#fffc00;color:#050505;box-shadow:0 0 28px #fffc004d,0 14px 35px #0005}.platform b{font-size:10px;color:#f1eff8}.platform small{color:#74778e}.platform:hover .platformMark,.platform:focus-visible .platformMark,.platform.selected .platformMark{transform:scale(1.08);border-color:#ffffff88;box-shadow:0 0 34px color-mix(in srgb,var(--accent) 55%,transparent),0 0 0 6px color-mix(in srgb,var(--accent) 10%,transparent),0 14px 35px #0006}
.core{width:238px;height:238px;border-color:color-mix(in srgb,var(--accent) 78%,white);background:radial-gradient(circle at 34% 22%,color-mix(in srgb,var(--accent) 40%,#39458c) 0,color-mix(in srgb,var(--accent) 20%,#171c3d) 30%,#090c1d 75%);box-shadow:0 0 75px color-mix(in srgb,var(--accent) 48%,transparent),0 0 150px color-mix(in srgb,var(--accent) 18%,transparent),0 0 0 20px color-mix(in srgb,var(--accent) 5%,transparent);transition:transform .25s,box-shadow .25s}.core strong{font-size:39px}.core:hover,.core:focus-visible{box-shadow:0 0 120px color-mix(in srgb,var(--accent) 68%,transparent),0 0 210px color-mix(in srgb,var(--accent) 24%,transparent),0 0 0 34px color-mix(in srgb,var(--accent) 9%,transparent)}
.core i{color:#70e4b2}
.particle{opacity:.5;box-shadow:0 0 15px var(--accent);background:#e4dcff}
.energyArc{border-top-color:color-mix(in srgb,var(--accent) 50%,transparent);border-right-color:color-mix(in srgb,var(--accent2) 28%,transparent)}
.er1,.er2,.er3{border-color:color-mix(in srgb,var(--accent) 25%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--accent) 10%,transparent)}
.fieldHint{bottom:-10px;background:rgba(7,9,22,.72);border-color:rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.25);backdrop-filter:blur(12px);color:#9698ae}
.lowerDiscover{margin:0 55px;padding:28px 24px 24px;border:1px solid #5879c533;border-radius:25px;background:linear-gradient(135deg,#0d132b,#0a0d20);box-shadow:0 25px 70px #0002}.lowerHead{display:flex;justify-content:space-between;align-items:flex-end;gap:25px}.lowerHead h2,.journeyHead h2,.opportunityBanner h2{margin:5px 0 6px;font-size:29px;letter-spacing:-.8px}.lowerHead p,.journeyHead p,.opportunityBanner p{margin:0;color:#888ba8;font-size:11px}.sourceState{display:grid;grid-template-columns:auto auto;gap:3px 7px;text-align:right;font-size:8px;color:#6fe0ae;letter-spacing:.6px}.sourceState i{width:7px;height:7px;background:#61e0ad;border-radius:50%;align-self:center;justify-self:end}.sourceState b{color:#fff;font-size:9px}.sourceState small{grid-column:1/-1;color:#747791}.movingLayout{display:grid;grid-template-columns:minmax(0,1fr) 275px;gap:15px;margin-top:19px}.movingCards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.movingCard{min-width:0;padding:0;border:1px solid #ffffff14;border-radius:16px;overflow:hidden;background:#11182a;text-align:left;transition:transform .18s,border-color .18s,box-shadow .18s}.movingCard:hover{transform:translateY(-3px);border-color:#9b66ff77;box-shadow:0 15px 35px #0004}.movingThumb{height:125px;position:relative;background:#0a0e1c}.movingThumb img{width:100%;height:100%;object-fit:cover}.movingThumb>span{position:absolute;top:8px;left:8px;padding:5px 7px;border-radius:7px;background:#6e3fff;color:#fff;font-size:7px;font-weight:850}.movingThumb>b{position:absolute;right:8px;bottom:8px;width:29px;height:29px;display:grid;place-items:center;border-radius:50%;background:#fff;color:#673cff;font-size:12px}.movingBody{padding:10px}.movingBody strong{display:block;font-size:10px;line-height:1.35;min-height:27px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.movingBody small{display:block;color:#8589a2;font-size:8px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.movingBody>div{display:flex;justify-content:space-between;gap:5px;margin-top:9px}.movingBody em{font-style:normal;color:#c8c5d8;font-size:7px}.movingBody div span{color:#75dfb0;font-size:7px;text-transform:uppercase}.lowerEmpty{grid-column:1/-1;min-height:235px;display:grid;place-items:center;text-align:center;border:1px dashed #ffffff18;border-radius:16px;color:#777b98;font-size:10px;padding:30px}.signalRail{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-top:11px}.signalRail button{border:1px solid #ffffff10;background:#ffffff04;border-radius:11px;padding:8px;text-align:left;color:#777b98}.signalRail button.active{border-color:#9863ff55;background:#8a4fff0c;color:#fff}.signalRail i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#777b95;margin-right:5px}.signalRail button.active i{background:#6fe0ae;box-shadow:0 0 8px #6fe0ae66}.signalRail b{font-size:7px}.signalRail small{display:block;font-size:6px;margin-top:3px;margin-left:11px}.creatorPanel{border:1px solid #ffffff12;border-radius:18px;background:linear-gradient(145deg,#111a2e,#0a1020);padding:15px}.panelHead{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:10px}.panelHead span{display:block;color:#d9d7e8;font-size:10px;font-weight:900}.panelHead b{display:block;color:#777c98;font-size:7px;margin-top:3px}.panelHead button,.journeyHead button{border:0;background:transparent;color:#a96cff;font-size:8px;font-weight:850;white-space:nowrap}.creatorRow{width:100%;display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;text-align:left;padding:10px 0;border:0;border-top:1px solid #ffffff0b;background:transparent}.creatorRow>span{color:#60657d;font-size:8px}.creatorRow strong{display:block;color:#f1eff8;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.creatorRow small{display:block;color:#777c98;font-size:7px;margin-top:3px}.creatorRow em{font-style:normal;color:#69dfad;font-size:9px;font-weight:850}.panelEmpty{padding:25px 5px;color:#777c98;font-size:8px;line-height:1.5}.journeySection{margin:18px 55px 0;padding:24px;border:1px solid #7d62d833;border-radius:25px;background:linear-gradient(135deg,#12182b,#0d1120)}.journeyHead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.journeySteps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr auto 1fr;align-items:center;gap:8px;margin-top:18px}.journeySteps button{min-height:80px;border:1px solid #ffffff10;border-radius:15px;background:#ffffff05;text-align:left;padding:12px;transition:transform .18s,border-color .18s}.journeySteps button:hover{transform:translateY(-2px);border-color:#9b66ff55}.journeySteps span{display:block;color:#a96cff;font-size:7px;font-weight:900;letter-spacing:1px}.journeySteps b{display:block;font-size:10px;margin-top:8px}.journeySteps small{display:block;color:#777c98;font-size:7px;margin-top:3px}.journeySteps>i{font-style:normal;color:#a96cff;font-size:20px;text-align:center}.opportunityBanner{margin:18px 55px 35px;padding:24px;display:flex;justify-content:space-between;align-items:center;gap:25px;border:1px solid #9d5eff55;border-radius:25px;background:radial-gradient(circle at 80% 30%,#a45cff22,transparent 35%),linear-gradient(135deg,#17112c,#0c1022)}.opportunityBanner h2{max-width:700px}.opportunityBanner button{border:0;border-radius:22px;padding:12px 17px;background:linear-gradient(135deg,#7040f2,#c15cff);color:#fff;font-size:9px;font-weight:850;white-space:nowrap}footer{display:grid;grid-template-columns:auto auto 1fr;gap:12px 22px;align-items:center;padding:45px 55px 55px;color:#b5b5c9;border-top:1px solid #ffffff0b}footer b{font-size:24px}footer small{font-size:10px}footer p{grid-column:1/-1;margin:0;color:#686b86;font-size:9px}
.toast{position:fixed;right:25px;bottom:25px;z-index:100;padding:12px 15px;border:1px solid #c466ff73;border-radius:14px;background:#15132a;box-shadow:0 15px 40px #0008;font-size:10px;max-width:390px}.toast b{display:block;color:#c58bff;font-size:8px;letter-spacing:1px;margin-bottom:4px}.toast span{display:block}.backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:25px;background:#03040dcc;backdrop-filter:blur(12px)}.modal{position:relative;width:min(860px,94vw);max-height:92vh;overflow:auto;padding:18px;border:1px solid var(--line);border-radius:22px;background:#0e1126}.close{position:absolute;right:15px;top:12px;width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#0008;z-index:2}.player{aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:#05060d;margin-bottom:18px}.player iframe,.player img{width:100%;height:100%;border:0;object-fit:cover}.modal h2{font-size:22px}.modal p{color:var(--muted);font-size:11px}.primary{border:0;border-radius:20px;padding:11px 15px;background:linear-gradient(135deg,#7544ff,#b45eff);color:#fff;font-size:11px;font-weight:800}.genericMark{font-size:30px}@media(max-width:1250px){.hero{grid-template-columns:1fr 1.25fr}.movingCards{grid-template-columns:repeat(3,1fr)}.signalRail{grid-template-columns:repeat(3,1fr)}}@media(max-width:950px){.topbar{flex-wrap:wrap;padding:10px 16px}.topbar nav{order:3;width:100%;overflow:auto}.search{flex:1;width:auto}.hero{grid-template-columns:1fr;padding:35px 20px}.lowerDiscover,.journeySection,.opportunityBanner{margin-left:16px;margin-right:16px}.movingCards{grid-template-columns:repeat(2,1fr)}.movingLayout{grid-template-columns:1fr}}@media(max-width:600px){.hero h1{font-size:51px}.core{width:172px;height:172px}.orbit.o3{width:470px;height:470px}.platformMark{width:46px;height:46px;border-radius:14px}.platformMark svg{width:24px;height:24px}.platform b{font-size:8px}.platform small{font-size:6px}.fieldHint{font-size:7px;max-width:90%;overflow:hidden;text-overflow:ellipsis}.categoryRail{max-height:96px;overflow:hidden}.categoryRail button:nth-child(n+7){display:none}.categoryRail .more{display:flex}.signalRail{grid-template-columns:repeat(2,1fr)}.movingCards{grid-template-columns:1fr 1fr}.movingLayout{grid-template-columns:1fr}.lowerHead,.journeyHead{display:block}.sourceState{margin-top:12px;text-align:left;justify-content:start}.sourceState i{justify-self:start}.sourceState small{grid-column:2}.opportunityBanner{display:block}.opportunityBanner button{margin-top:15px}.lowerDiscover,.journeySection,.opportunityBanner{padding:23px 15px}footer{padding:35px 20px;grid-template-columns:1fr}footer p{grid-column:auto}}
`;
