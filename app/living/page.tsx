"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string; title: string; channel_title: string; published_at: string; thumbnail: string;
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
const nav = [["Discover", "/"], ["Creators", "/creators"], ["Brands", "/brands"], ["Opportunities", "/opportunities"], ["Community", "/community"], ["About", "/about"]] as const;
const signalKey = (s?: string) => (s || "").toLowerCase().replace(/[_-]/g, " ").trim();
const signalMatches = (item: Item, signal: string) => signalKey(item.metadata?.signal) === signalKey(signal);
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`; };
const categoryFor = (x: Item) => { const text = `${x.topic} ${x.title} ${x.description}`.toLowerCase(); return categories.find(c => c.name !== "Trending" && c.keywords.some(k => text.includes(k)))?.name || "Other"; };

function PlatformIcon({ kind }: { kind: string }) {
  const common = { width: 30, height: 30, viewBox: "0 0 32 32", fill: "none", "aria-hidden": true as const };
  switch (kind) {
    case "youtube": return <svg {...common}><rect x="3" y="7" width="26" height="18" rx="5" fill="currentColor"/><path d="M13 11.5 22 16l-9 4.5v-9Z" fill="#0b0d20"/></svg>;
    case "instagram": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="3"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="3"/><circle cx="23" cy="9" r="1.7" fill="currentColor"/></svg>;
    case "tiktok": return <svg {...common}><path d="M19 5c.4 3.3 2.1 5.2 5 5.7v4.2c-2.2-.1-4-.8-5.6-2v7.3a6.1 6.1 0 1 1-5.2-6v4.2a2 2 0 1 0 1 1.8V5H19Z" fill="currentColor"/></svg>;
    case "x": return <svg {...common}><path d="M7 6h5.1l4.1 5.8L21.1 6H25l-7 8.1L25.4 26h-5.1l-4.9-6.8L9.4 26H5.5l7.4-8.5L7 6Z" fill="currentColor"/></svg>;
    case "linkedin": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="3" fill="currentColor"/><circle cx="10" cy="11" r="1.7" fill="#0b0d20"/><path d="M8.7 14h2.7v9H8.7v-9Zm4.5 0h2.6v1.2c.8-1 1.8-1.6 3.4-1.6 2.7 0 3.9 1.7 3.9 4.6V23h-2.7v-4.4c0-1.4-.5-2.3-1.7-2.3-1.3 0-1.8 1-1.8 2.4V23h-2.7v-9Z" fill="#0b0d20"/></svg>;
    case "spotify": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M10 13c4.4-1.1 8.2-.7 11.7.9M10.8 17c3.6-.8 6.8-.5 9.7.7M12 20.5c2.5-.5 4.8-.2 6.8.6" stroke="#0b0d20" strokeWidth="2" strokeLinecap="round"/></svg>;
    case "twitch": return <svg {...common}><path d="M5 5h22v16l-5 5h-6l-4 3v-3H5V5Z" fill="currentColor"/><path d="M10 10h3v7h-3v-7Zm7 0h3v7h-3v-7Z" fill="#0b0d20"/></svg>;
    case "facebook": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M18 10h2V6.5c-.7-.1-1.6-.2-2.7-.2-3.1 0-5.2 1.9-5.2 5.4v2.9H9v3.8h3.1V26h3.9v-7.6h3.2l.5-3.8H16v-2.4c0-1.1.3-2.2 2-2.2Z" fill="#0b0d20"/></svg>;
    case "pinterest": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M14 24c.7-2 1-3.1 1.4-4.8-.9-.8-1.4-2-1.4-3.5 0-2.7 1.8-4.9 4.2-4.9 2 0 3.4 1.5 3.4 3.5 0 2.3-1.1 5.1-3.1 5.1-1 0-1.8-.8-1.6-1.9l.6-2.5c.3-1 .1-1.8-.8-1.8-1 0-1.7 1-1.7 2.3 0 .9.3 1.5.3 1.5l-1.1 4.5c-.3 1.2-.1 2.7 0 3.5Z" fill="#0b0d20"/></svg>;
    case "reddit": return <svg {...common}><circle cx="16" cy="17" r="9" fill="currentColor"/><path d="M11.5 16.5h.1m8.8 0h.1M13 20c1.8 1.4 4.2 1.4 6 0M19.5 11l1-3 3 .7" stroke="#0b0d20" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "discord": return <svg {...common}><path d="M6.5 8.5c4.2-2.2 14.8-2.2 19 0l2 13c-3.4 2.5-6.6 3.4-9.5 3.6l-1.5-2.1c1.5-.4 2.7-1 3.7-1.7-4 .9-5.9.9-10 0 1 .7 2.2 1.3 3.7 1.7L12.4 25c-2.9-.2-6.1-1.1-9.5-3.6l2-13Z" fill="currentColor"/><circle cx="12" cy="16" r="1.7" fill="#0b0d20"/><circle cx="20" cy="16" r="1.7" fill="#0b0d20"/></svg>;
    case "snapchat": return <svg {...common}><path d="M16 4.8c-4.2 0-6.7 3-6.7 7.2v2.3c0 .7-.4 1.2-1.2 1.7-.7.4-1.3.7-1.3 1.3 0 .7 1.2 1 2.1 1.2.7.2 1.2.5 1.4 1.1.2.8.5 1.2 1.3 1.2 1.1 0 1.8-.7 2.9-.7.9 0 1.7.8 3.5.8s2.6-.8 3.5-.8c1.1 0 1.8.7 2.9.7.8 0 1.1-.4 1.3-1.2.2-.6.7-.9 1.4-1.1.9-.2 2.1-.5 2.1-1.2 0-.6-.6-.9-1.3-1.3-.8-.5-1.2-1-1.2-1.7V12c0-4.2-2.5-7.2-6.7-7.2Z" fill="currentColor"/></svg>;
    default: return <span className="genericMark">•</span>;
  }
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
      <button className="round" type="button" onClick={() => setNotice("Signals are sourced from the verified discovery pool.")}>◌</button>
      <div className="themePickerWrap">
        <button className="round themeButton" type="button" aria-label="Choose theme" aria-expanded={showThemes} onClick={() => setShowThemes(v => !v)}>✦ <span>Theme</span></button>
        {showThemes && <div className="themeMenu" role="menu">
          <div className="themeMenuTitle">FIELD THEME</div>
          {[
            ["nebula", "Nebula Pulse", "violet / deep space"],
            ["aurora", "Aurora Matrix", "cyan / emerald"],
            ["neon", "Neon Reactor", "magenta / ember"],
            ["lunar", "Lunar Glass", "ice / silver"],
          ].map(([id, name, desc]) => (
            <button key={id} className={theme === id ? "themeOption active" : "themeOption"} type="button" role="menuitem" onClick={() => { setTheme(id); setShowThemes(false); }}>
              <i className={"themeSwatch " + id} /><span><b>{name}</b><small>{desc}</small></span><em>{theme === id ? "●" : ""}</em>
            </button>
          ))}
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
        <h1>Discover<br/><em>A Brighter</em><br/>Tomorrow.</h1>
        <p>Real trends. Real creators. Real brands. One ecosystem. Unlimited opportunities.</p>
        <form className="heroSearch" onSubmit={e => { e.preventDefault(); command(q); }}><span className="searchMark">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="What do you want to discover?" aria-label="Universal discovery search"/><button type="submit" aria-label="Search">→</button></form>
        <div className="categoryRail" aria-label="Discovery categories">
          {visibleCategories.map(c => <button key={c.name} className={filter === c.name ? "active" : ""} type="button" onClick={() => { setFilter(c.name); setQ(""); pulseField(`Field tuned to ${c.name}.`); }}><span>{c.icon}</span>{c.name}</button>)}
          <button className="more" type="button" onClick={() => setShowAllCategories(v => !v)}>{showAllCategories ? "Less ↑" : `+${categories.length - 10} more`}</button>
        </div>
      </div>

      <div className="ecosystem">
        <div className={`field ${pulse ? "responding" : ""}`} aria-label="RALLIVIO living platform field" style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", flexShrink: 0 }}>
          <div className="fieldSpace">
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

    <section className="signals" id="signals">
      <div className="signalsHead"><div><span className="eyebrow">LIVE SIGNALS</span><h2>What is moving right now?</h2><p>Discovery states are shown only when the verified pool contains evidence for that signal.</p></div><div className="sourceState"><i/> SOURCE CONNECTED <b>YouTube</b><small>Verified data refreshes every 60s</small></div></div>
      <div className="signalTypes">{signalGroups.map(g => <button key={g.name} className={`signalType ${g.items.length ? "hasData" : "empty"}`} type="button" onClick={() => { if (g.items[0]) setModal(g.items[0]); else setNotice(`No verified ${g.name} observations are available right now.`); }}><span className="signalDot"/><strong>{g.name}</strong><small>{g.items.length ? `${g.items.length} verified` : "No verified observations"}</small></button>)}</div>
      <div className="signalGrid">{ranked.slice(0, 6).map(x => <button className="signalCard" key={x.id} type="button" onClick={() => setModal(x)}><div className="signalIcon"><img src={x.thumbnail} alt=""/></div><div className="signalBody"><div className="signalTop"><span>{x.metadata?.signal || "Observed"}</span><time>{age(x.published_at)}</time></div><strong>{x.title}</strong><small>{x.channel_title}</small><div className="signalMeta"><span>{fmt(x.views)} views</span><span>{categoryFor(x)}</span><span>{x.metadata?.momentum_score != null ? `Score ${Math.round(x.metadata.momentum_score)}` : "Verified"}</span></div></div><em>↗</em></button>)}{!loading && !ranked.length && <div className="signalEmpty">No verified observations are available for this environment yet.</div>}{loading && <div className="signalEmpty">Syncing verified observations…</div>}</div>
    </section>

    <section className="discoverySurface"><div className="surfaceHead"><div><span className="eyebrow">DISCOVERY POOL</span><h2>{filter === "Trending" ? "Trending across the field" : `${filter} is moving`}</h2><p>Search and category controls change the same underlying verified candidate pool.</p></div><button type="button" onClick={() => { setFilter("Trending"); setQ(""); }}>Reset field ↺</button></div><div className="cards">{shown.slice(0, 5).map(x => <article className="card" key={x.id} onClick={() => setModal(x)}><div className="thumb"><img src={x.thumbnail} alt=""/><span>{categoryFor(x)}</span><button type="button" onClick={e => { e.stopPropagation(); setModal(x); }}>▶</button></div><h3>{x.title}</h3><p>{x.channel_title}</p><small>{fmt(x.views)} views · {age(x.published_at)} · {x.metadata?.signal || "Observed"}</small></article>)}</div></section>

    <footer><b>RALL<span>IVIO</span></b><small>Discover People. Power What’s Next.</small><p>Source observations drive discovery. Motion responds to state; factual activity is never fabricated.</p></footer>
    {notice && <div className="toast" role="status"><b>RALLIVIO</b><span>{notice}</span></div>}
    {modal && <div className="backdrop" onClick={() => setModal(null)}><div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="close" type="button" onClick={() => setModal(null)}>×</button><div className="player">{modal.embeddable ? <iframe src={`https://www.youtube.com/embed/${modal.id}?autoplay=1&rel=0`} title={modal.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <img src={modal.thumbnail} alt=""/>}</div><span className="eyebrow">{modal.metadata?.signal || "Observed"} · VERIFIED OBSERVATION</span><h2>{modal.title}</h2><p>{modal.channel_title} · {fmt(modal.views)} views · {age(modal.published_at)}</p><button className="primary" type="button" onClick={() => window.open(modal.url, "_blank", "noopener,noreferrer")}>Watch on source ↗</button></div></div>}
  </main>;
}

const css = `
.themeScrim{display:none}.themePickerWrap{position:relative;z-index:80}.themeButton{min-width:auto;display:flex;align-items:center;gap:6px}.themeButton span{font-size:10px}.themeMenu{position:absolute;right:0;top:47px;width:220px;padding:10px;border:1px solid var(--line);border-radius:17px;background:rgba(10,12,29,.96);box-shadow:0 20px 55px #0009;backdrop-filter:blur(22px);z-index:90}.themeMenuTitle{padding:5px 8px 8px;color:#777b99;font-size:7px;letter-spacing:1.5px;font-weight:900}.themeOption{width:100%;display:grid;grid-template-columns:28px 1fr 12px;gap:9px;align-items:center;text-align:left;border:1px solid transparent;border-radius:12px;background:transparent;padding:9px 8px}.themeOption:hover,.themeOption.active{background:#ffffff09;border-color:#ffffff14}.themeOption span{display:grid;gap:3px}.themeOption b{font-size:10px}.themeOption small{font-size:7px;color:#777b99}.themeOption em{font-style:normal;color:var(--accent)}.themeSwatch{width:22px;height:22px;border-radius:8px;border:1px solid #ffffff30;box-shadow:0 0 15px currentColor}.themeSwatch.nebula{color:#9b62ff;background:linear-gradient(135deg,#5d35ff,#d36cff)}.themeSwatch.aurora{color:#38e4c2;background:linear-gradient(135deg,#08a7d8,#54e39a)}.themeSwatch.neon{color:#ff4fb3;background:linear-gradient(135deg,#ff287f,#ff9b4a)}.themeSwatch.lunar{color:#a8d8ff;background:linear-gradient(135deg,#657da8,#e9f7ff)}
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
:root{--bg:#07091a;--text:#f7f6ff;--muted:#aaa9c2;--line:#ffffff1b;--purple:#8c4dff;--purple2:#c16bff}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}button,input{font:inherit}button{cursor:pointer;color:inherit}.rv{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 63% 28%,#713cff22,transparent 31%),radial-gradient(circle at 18% 42%,#3d48aa16,transparent 32%),linear-gradient(135deg,#090b21,#07081a 58%,#0d1028)}.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:18px;padding:12px 34px;border-bottom:1px solid var(--line);background:#080919df;backdrop-filter:blur(18px)}.brand{border:0;background:transparent;text-align:left;font-size:28px;font-weight:950;letter-spacing:-1.7px;line-height:.85;white-space:nowrap}.brand span,.core span,footer span{color:#a868ff}.brand small{display:block;font-size:6px;letter-spacing:1px;color:#aaa9c1;margin-top:6px}.topbar nav{display:flex;gap:3px;flex:1}.topbar nav button{border:0;background:transparent;padding:10px 13px;border-radius:999px;color:#deddef;font-weight:650}.topbar nav button.active,.topbar nav button:hover{background:linear-gradient(135deg,#8544ff,#bd61ff);color:#fff}.search{display:flex;align-items:center;width:min(390px,29vw);height:42px;border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#050611aa}.search>span{padding-left:14px;color:#7e7d96}.search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;padding:0 9px;font-size:12px}.search button{width:45px;border:0;background:transparent;font-size:17px}.round,.loginButton{min-width:72px;height:38px;border:1px solid rgba(255,255,255,.2);border-radius:20px;background:linear-gradient(135deg,#7b4aff,#b45eff);color:#fff;font-size:12px;font-weight:800;cursor:pointer;padding:0 16px}.avatar{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#ffffff0d}.avatar{background:linear-gradient(135deg,#ffbd6a,#8c4eff);font-weight:850}.hero{min-height:650px;padding:42px 55px 28px;display:grid;grid-template-columns:minmax(390px,.88fr) minmax(640px,1.55fr);gap:10px;align-items:center}.heroCopy{max-width:560px;z-index:3}.pill{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border:1px solid #ff4a6666;border-radius:999px;background:#ff36591f;font-size:10px;font-weight:850}.pill i{width:8px;height:8px;border-radius:50%;background:#ff4265;animation:livePulse 1.4s infinite}@keyframes livePulse{50%{opacity:.25;box-shadow:0 0 14px #ff4265}}h1{font-size:clamp(54px,5vw,78px);line-height:.94;letter-spacing:-4px;margin:20px 0}.heroCopy h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c269ff 58%,#7f6bff);-webkit-background-clip:text;color:transparent}.heroCopy>p{font-size:17px;line-height:1.55;color:#d0cfe0;max-width:520px}.heroSearch{display:flex;align-items:center;height:60px;margin-top:24px;padding:5px 6px 5px 17px;border-radius:31px;background:#f7f6fb;box-shadow:0 12px 45px #0005}.heroSearch .searchMark{font-size:19px;color:#67657c}.heroSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#252239;padding:0 10px}.heroSearch button{width:47px;height:47px;border:0;border-radius:50%;background:linear-gradient(135deg,#6244ff,#b45eff);color:#fff;font-size:19px}.categoryRail{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px;max-width:640px}.categoryRail button{display:flex;align-items:center;gap:6px;border:1px solid #fff2;background:#ffffff09;padding:8px 11px;border-radius:18px;color:#dddbea;font-size:11px}.categoryRail button span{color:#c18bff}.categoryRail button.active{border-color:#b66cff;background:#713cff35;color:#fff}.categoryRail .more{color:#c69bff}.ecosystem{position:relative;min-width:0}.field{position:relative;flex-shrink:0}.fieldSpace{height:100%;position:relative;transition:transform .18s ease;transform-style:preserve-3d}.fieldGrid{position:absolute;inset:12% 7%;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,transparent 0 67px,#ffffff05 68px 69px),radial-gradient(circle,#7653ff0b,transparent 61%);mask-image:radial-gradient(circle,#000 20%,transparent 76%);pointer-events:none}.nebula{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;filter:blur(2px)}.n1{width:470px;height:470px;background:radial-gradient(circle,#814cff2e,transparent 64%);animation:nebula 5.5s ease-in-out infinite}.n2{width:330px;height:330px;background:radial-gradient(circle,#456eff26,transparent 62%);animation:nebula 4.2s ease-in-out infinite reverse}@keyframes nebula{50%{transform:translate(-50%,-50%) scale(1.1);opacity:.7}}.orbit,.energyRing{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.orbit{border:1px solid #7565ff28}.o1{width:300px;height:300px}.o2{width:430px;height:430px;border-style:dashed;animation:spin 26s linear infinite}.o3{width:555px;height:555px;border-color:#3c9dff1d;animation:spin 38s linear infinite reverse}@keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}.energyRing{border:1px solid #a269ff25;box-shadow:0 0 18px #8d54ff10}.er1{width:250px;height:250px;animation:ring 2.8s ease-in-out infinite}.er2{width:365px;height:365px;animation:ring 3.8s ease-in-out infinite .6s}.er3{width:505px;height:505px;animation:ring 5s ease-in-out infinite 1.2s}@keyframes ring{50%{opacity:.25;transform:translate(-50%,-50%) scale(1.035)}}.energyArc{position:absolute;left:50%;top:50%;width:470px;height:470px;border:2px solid transparent;border-top-color:#b76aff5e;border-right-color:#5e8bff2c;border-radius:50%;transform:translate(-50%,-50%);animation:spin 9s linear infinite}.arc2{width:385px;height:385px;border-top-color:#6ce7c44d;border-left-color:#a566ff42;animation-duration:6s;animation-direction:reverse}.arc3{width:570px;height:570px;border-bottom-color:#9b6cff38;border-right-color:#5e83ff38;animation-duration:14s}.particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#cdbbff;box-shadow:0 0 12px #a26aff;opacity:.35;pointer-events:none;animation:particle 3.5s ease-in-out infinite}.particle:nth-child(3n){width:2px;height:2px;animation-duration:4.5s}.particle1{left:18%;top:25%}.particle2{left:29%;top:17%;animation-delay:-1s}.particle3{left:78%;top:20%;animation-delay:-2s}.particle4{left:88%;top:37%;animation-delay:-.4s}.particle5{left:82%;top:63%;animation-delay:-1.8s}.particle6{left:72%;top:78%;animation-delay:-2.4s}.particle7{left:49%;top:90%;animation-delay:-1.3s}.particle8{left:28%;top:80%;animation-delay:-2.7s}.particle9{left:13%;top:61%;animation-delay:-.8s}.particle10{left:8%;top:42%;animation-delay:-1.6s}.particle11{left:38%;top:29%;animation-delay:-2.1s}.particle12{left:66%;top:34%;animation-delay:-.7s}.particle13{left:64%;top:61%;animation-delay:-2.9s}.particle14{left:38%;top:66%;animation-delay:-1.1s}.particle15{left:56%;top:13%;animation-delay:-1.9s}.particle16{left:92%;top:51%;animation-delay:-2.2s}.particle17{left:22%;top:70%;animation-delay:-.2s}.particle18{left:57%;top:84%;animation-delay:-1.5s}.particle19{left:44%;top:8%;animation-delay:-2.6s}.particle20{left:35%;top:92%;animation-delay:-.9s}.particle21{left:74%;top:46%;animation-delay:-3s}.particle22{left:17%;top:48%;animation-delay:-1.2s}@keyframes particle{50%{transform:translate3d(0,-12px,0) scale(1.7);opacity:1}}.platform{border:0;background:transparent;text-align:center;z-index:25;padding:5px;border-radius:17px;transition:filter .2s,scale .2s}.platform:hover,.platform:focus-visible,.platform.selected{scale:1.12;filter:brightness(1.3)}.platformMark{display:grid;place-items:center;width:58px;height:58px;margin:auto;border-radius:18px;background:linear-gradient(145deg,#151934,#0d1023);border:1px solid #ffffff20;box-shadow:0 12px 30px #0006,inset 0 0 20px #ffffff04;color:#f5f3ff;transition:box-shadow .2s,border-color .2s,background .2s}.platform:hover .platformMark,.platform:focus-visible .platformMark,.platform.selected .platformMark{border-color:#b16cff;box-shadow:0 0 36px #8b4fff77,0 0 0 5px #8b4fff0e,inset 0 0 20px #9b62ff12;background:#191533}.platform b{display:block;font-size:10px;margin-top:6px}.platform small{display:block;color:#85859e;font-size:7px;margin-top:3px}.core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:222px;height:222px;border-radius:50%;display:grid;place-items:center;align-content:center;border:1px solid #c097ffcc;background:radial-gradient(circle at 34% 24%,#4854c7 0,#202458 23%,#11152f 52%,#070a18 79%);box-shadow:0 0 70px #7440ff73,0 0 125px #7440ff27,0 0 0 18px #7e4aff09;z-index:30;overflow:visible;transition:transform .22s,box-shadow .22s}.core:hover,.core:focus-visible,.core:active{transform:translate(-50%,-50%) scale(1.045);box-shadow:0 0 105px #9b62ff9b,0 0 175px #7440ff3d,0 0 0 30px #7e4aff10}.core strong{font-size:36px;letter-spacing:-2px;z-index:2}.core small{font-size:8px;color:#aaa9bf;letter-spacing:.8px;z-index:2}.core i{font-style:normal;color:#72e4b3;font-size:8px;margin-top:10px;z-index:2}.core i b{font-size:7px}.coreLight{position:absolute;inset:12px;border-radius:50%;background:radial-gradient(circle at 45% 25%,#7f87ff34,transparent 48%);animation:coreLight 3s ease-in-out infinite}.coreHalo{position:absolute;border-radius:50%;border:1px solid #a46cff45;pointer-events:none}.h1{inset:-14px;animation:halo 2.6s ease-out infinite}.h2{inset:-29px;border-color:#7b68ff2e;animation:halo 3.6s ease-out infinite .8s}.h3{inset:-46px;border-color:#668cff1d;animation:halo 4.8s ease-out infinite 1.5s}@keyframes halo{0%{transform:scale(.9);opacity:.75}100%{transform:scale(1.08);opacity:0}}@keyframes coreLight{50%{transform:scale(1.12);opacity:.55}}.field.responding .energyRing,.field.responding .energyArc{animation-duration:1.1s}.field.responding .particle{animation-duration:1.1s}.fieldHint{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);white-space:nowrap;padding:8px 13px;border:1px solid #ffffff14;border-radius:999px;background:#080a1a99;color:#a8a7bf;font-size:9px}.fieldHint span{color:#b16aff;margin-right:5px}.signals{margin:0 55px;padding:27px 24px 25px;border:1px solid #5879c533;border-radius:25px;background:linear-gradient(135deg,#0d132b,#0a0d20);box-shadow:0 25px 70px #0002}.signalsHead{display:flex;justify-content:space-between;align-items:flex-end;gap:25px}.eyebrow{display:inline-block;color:#a66aff;font-size:9px;font-weight:900;letter-spacing:1.4px}.signals h2,.discoverySurface h2{margin:5px 0 6px;font-size:29px;letter-spacing:-.8px}.signalsHead p,.surfaceHead p{margin:0;color:#888ba8;font-size:11px}.sourceState{display:grid;grid-template-columns:auto auto;gap:3px 7px;text-align:right;font-size:8px;color:#6fe0ae;letter-spacing:.6px}.sourceState i{width:7px;height:7px;background:#61e0ad;border-radius:50%;align-self:center;justify-self:end}.sourceState b{color:#fff;font-size:9px}.sourceState small{grid-column:1/-1;color:#747791}.signalTypes{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:19px}.signalType{min-width:0;text-align:left;border:1px solid #ffffff10;background:#ffffff05;border-radius:14px;padding:12px;display:grid;grid-template-columns:8px 1fr;gap:3px 8px}.signalType:hover,.signalType.hasData{border-color:#9863ff55;background:#8a4fff0c}.signalType.empty{opacity:.62}.signalDot{width:7px;height:7px;border-radius:50%;background:#777b95;grid-row:1/3;margin-top:3px}.hasData .signalDot{background:#6fe0ae;box-shadow:0 0 10px #6fe0ae66}.signalType strong{font-size:9px}.signalType small{font-size:7px;color:#777b98}.signalGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:13px}.signalCard{display:grid;grid-template-columns:48px 1fr 18px;gap:11px;align-items:center;text-align:left;border:1px solid #ffffff0e;background:#ffffff05;border-radius:15px;padding:10px 12px;min-width:0;transition:transform .18s,border-color .18s,background .18s}.signalCard:hover{transform:translateY(-2px);border-color:#9b66ff66;background:#ffffff0a}.signalIcon img{width:48px;height:48px;object-fit:cover;border-radius:11px}.signalBody{min-width:0}.signalTop{display:flex;justify-content:space-between;gap:10px}.signalTop span{font-size:7px;color:#b67aff;font-weight:850;text-transform:uppercase;letter-spacing:.8px}.signalTop time{font-size:7px;color:#70738d}.signalBody strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.signalBody>small{display:block;color:#9295ad;font-size:8px;margin-top:3px}.signalMeta{display:flex;gap:10px;margin-top:5px;color:#777b99;font-size:7px}.signalCard>em{font-style:normal;color:#a96cff;font-size:17px}.signalEmpty{grid-column:1/-1;padding:28px;text-align:center;color:#777b98;font-size:10px;border:1px dashed #ffffff14;border-radius:14px}.discoverySurface{margin:18px 55px 35px;padding:28px 24px;background:#f2f1f8;color:#1d2243;border-radius:26px}.surfaceHead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.surfaceHead>button{border:0;background:transparent;color:#7040e9;font-weight:800}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:13px;margin-top:18px}.card{background:#fff;border:1px solid #ddddec;border-radius:17px;overflow:hidden;cursor:pointer;transition:transform .18s,box-shadow .18s}.card:hover{transform:translateY(-3px);box-shadow:0 12px 30px #27234d14}.thumb{height:135px;position:relative}.thumb img{width:100%;height:100%;object-fit:cover}.thumb>span{position:absolute;top:9px;left:9px;padding:5px 7px;border-radius:7px;background:#713cff;color:#fff;font-size:7px;font-weight:800}.thumb button{position:absolute;right:8px;bottom:8px;width:33px;height:33px;border:0;border-radius:50%;background:#fff;color:#6e3fff}.card h3{font-size:11px;margin:11px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.card p{margin:0 11px 6px;color:#6e7391;font-size:8px}.card>small{display:block;padding:0 11px 12px;color:#4e5474;font-size:7px}footer{display:grid;grid-template-columns:auto auto 1fr;gap:12px 22px;align-items:center;padding:45px 55px 55px;color:#b5b5c9}footer b{font-size:24px}footer small{font-size:10px}footer p{grid-column:1/-1;margin:0;color:#686b86;font-size:9px}.toast{position:fixed;right:25px;bottom:25px;z-index:100;padding:12px 15px;border:1px solid #c466ff73;border-radius:14px;background:#15132a;box-shadow:0 15px 40px #0008;font-size:10px;max-width:390px}.toast b{display:block;color:#c58bff;font-size:8px;letter-spacing:1px;margin-bottom:4px}.toast span{display:block}.backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:25px;background:#03040dcc;backdrop-filter:blur(12px)}.modal{position:relative;width:min(860px,94vw);max-height:92vh;overflow:auto;padding:18px;border:1px solid var(--line);border-radius:22px;background:#0e1126}.close{position:absolute;right:15px;top:12px;width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#0008;z-index:2}.player{aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:#05060d;margin-bottom:18px}.player iframe,.player img{width:100%;height:100%;border:0;object-fit:cover}.modal h2{font-size:22px}.modal p{color:var(--muted);font-size:11px}.primary{border:0;border-radius:20px;padding:11px 15px;background:linear-gradient(135deg,#7544ff,#b45eff);color:#fff;font-size:11px;font-weight:800}.genericMark{font-size:30px}@media(max-width:1250px){.hero{grid-template-columns:1fr 1.25fr}.cards{grid-template-columns:repeat(3,1fr)}.signalTypes{grid-template-columns:repeat(3,1fr)}}@media(max-width:950px){.topbar{flex-wrap:wrap;padding:10px 16px}.topbar nav{order:3;width:100%;overflow:auto}.search{flex:1;width:auto}.hero{grid-template-columns:1fr;padding:35px 20px}.signals,.discoverySurface{margin-left:16px;margin-right:16px}.cards{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.hero h1{font-size:51px}.core{width:172px;height:172px}.orbit.o3{width:470px;height:470px}.platformMark{width:46px;height:46px;border-radius:14px}.platformMark svg{width:24px;height:24px}.platform b{font-size:8px}.platform small{font-size:6px}.fieldHint{font-size:7px;max-width:90%;overflow:hidden;text-overflow:ellipsis}.categoryRail{max-height:96px;overflow:hidden}.categoryRail button:nth-child(n+7){display:none}.categoryRail .more{display:flex}.signalTypes{grid-template-columns:repeat(2,1fr)}.signalGrid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.signalsHead,.surfaceHead{display:block}.sourceState{margin-top:12px;text-align:left;justify-content:start}.sourceState i{justify-self:start}.sourceState small{grid-column:2}.discoverySurface{padding:23px 15px}footer{padding:35px 20px;grid-template-columns:1fr}footer p{grid-column:auto}}
`;
