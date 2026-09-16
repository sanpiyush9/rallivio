"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  title: string;
  channel_title: string;
  published_at: string;
  thumbnail: string;
  description: string;
  views: number;
  url: string;
  embeddable: boolean;
  topic: string;
  region?: string;
  metadata?: { subscriber_count?: number | null; signal?: string; momentum_score?: number };
};

type Category = { name: string; icon: string; keywords: string[] };
type Platform = { name: string; slug: string; icon: string; connected: boolean; top: string; left: string };

const platforms: Platform[] = [
  { name: "YouTube", slug: "youtube", icon: "youtube", connected: true, top: "4%", left: "50%" },
  { name: "Instagram", slug: "instagram", icon: "instagram", connected: false, top: "12%", left: "86%" },
  { name: "TikTok", slug: "tiktok", icon: "tiktok", connected: false, top: "38%", left: "96%" },
  { name: "X", slug: "x", icon: "x", connected: false, top: "70%", left: "91%" },
  { name: "LinkedIn", slug: "linkedin", icon: "linkedin", connected: false, top: "91%", left: "67%" },
  { name: "Spotify", slug: "spotify", icon: "spotify", connected: false, top: "91%", left: "31%" },
  { name: "Twitch", slug: "twitch", icon: "twitch", connected: false, top: "70%", left: "9%" },
  { name: "Facebook", slug: "facebook", icon: "facebook", connected: false, top: "38%", left: "4%" },
  { name: "Pinterest", slug: "pinterest", icon: "pinterest", connected: false, top: "12%", left: "14%" },
  { name: "Reddit", slug: "reddit", icon: "reddit", connected: false, top: "24%", left: "27%" },
  { name: "Discord", slug: "discord", icon: "discord", connected: false, top: "26%", left: "74%" },
  { name: "Snapchat", slug: "snapchat", icon: "snapchat", connected: false, top: "78%", left: "77%" },
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

const nav = [["Discover", "/"], ["Creators", "/creators"], ["Brands", "/brands"], ["Opportunities", "/opportunities"], ["Community", "/community"], ["About", "/about"]] as const;
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`; };
const categoryFor = (x: Item) => { const text = `${x.topic} ${x.title} ${x.description}`.toLowerCase(); return categories.find(c => c.name !== "Trending" && c.keywords.some(k => text.includes(k)))?.name || "Other"; };
const iconUrl = (slug: string) => `https://cdn.simpleicons.org/${slug}/ffffff`;

export default function LivingDiscover() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("Trending");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activePlatform, setActivePlatform] = useState("all");
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 3800); return () => window.clearTimeout(id); }, [notice]);

  const ranked = useMemo(() => [...items].sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)), [items]);
  const shown = useMemo(() => {
    const base = filter === "Trending" ? ranked : ranked.filter(x => categoryFor(x) === filter);
    const s = q.trim().toLowerCase();
    return s ? base.filter(x => `${x.title} ${x.channel_title} ${x.description} ${x.topic}`.toLowerCase().includes(s)) : base;
  }, [ranked, filter, q]);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);
  const go = (p: string) => { router.push(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const command = (value: string) => {
    const s = value.trim(); if (!s) return;
    const l = s.toLowerCase();
    const platform = platforms.find(p => l.includes(p.name.toLowerCase()));
    if (platform) { go(`/platform/${platform.slug}?q=${encodeURIComponent(s)}`); return; }
    const category = categories.find(c => c.name.toLowerCase() === l || c.name.toLowerCase().includes(l) || l.includes(c.name.toLowerCase()));
    if (category) { setFilter(category.name); setActivePlatform("all"); setQ(""); setNotice(`RALLIVIO tuned the field to ${category.name} across connected sources.`); return; }
    if (l.includes("creator")) { go(`/creators?q=${encodeURIComponent(s)}`); return; }
    if (l.includes("brand")) { go(`/brands?q=${encodeURIComponent(s)}`); return; }
    if (l.includes("opportun")) { go(`/opportunities?q=${encodeURIComponent(s)}`); return; }
    setFilter("Trending"); setActivePlatform("all"); setQ(s); setNotice(`Searching the verified discovery pool for “${s}”.`);
  };

  const move = (e: PointerEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); setPointer({ x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 }); };
  const activatePlatform = (p: Platform) => { setActivePlatform(p.slug); go(`/platform/${p.slug}`); };
  const activateCategory = (name: string) => { setFilter(name); setActivePlatform("all"); setQ(""); setNotice(`Field tuned to ${name} across connected sources.`); };

  return <main className="rv" onPointerMove={move} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
    <style>{css}</style>
    <header className="topbar">
      <button className="brand" type="button" onClick={() => go("/")}>RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></button>
      <nav>{nav.map(([n, p]) => <button key={p} className={p === "/" ? "active" : ""} type="button" onClick={() => go(p)}>{n}</button>)}</nav>
      <form className="search" onSubmit={e => { e.preventDefault(); command(q); }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search creators, topics, brands, videos…"/><button type="submit">⌕</button></form>
      <button className="round" type="button" onClick={() => setNotice("RALLIVIO only presents activity supported by connected source data.")}>◌</button>
      <button className="round" type="button" onClick={() => document.documentElement.classList.toggle("light")}>☼</button>
      <button className="avatar" type="button" onClick={() => setNotice("Your RALLIVIO space is ready.")}>R</button>
    </header>

    <section className="hero">
      <div className="heroCopy">
        <span className="pill"><i/> THE CREATOR ECONOMY IS MOVING RIGHT NOW</span>
        <h1>Discover<br/><em>A Brighter</em><br/>Tomorrow.</h1>
        <p>One living field for what is moving across creators, content, platforms and opportunities.</p>
        <form className="heroSearch" onSubmit={e => { e.preventDefault(); command(q); }}><span className="searchMark">⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="What do you want to discover?"/><button type="submit">→</button></form>
        <div className="categoryRail">{visibleCategories.map(c => <button key={c.name} className={filter === c.name ? "active" : ""} type="button" onClick={() => activateCategory(c.name)}><span>{c.icon}</span>{c.name}</button>)}<button className="more" type="button" onClick={() => setShowAllCategories(v => !v)}>{showAllCategories ? "Less ↑" : `+${categories.length - 10} more`}</button></div>
        <div className="routingLine"><span className="routingDot"/> DISCOVERY SCOPE <b>{activePlatform === "all" ? "ALL CONNECTED SOURCES" : platforms.find(p => p.slug === activePlatform)?.name}</b><small>{activePlatform === "all" ? "YouTube is currently connected; new platforms join through verified adapters." : "Platform-specific environment selected."}</small></div>
      </div>

      <div className="ecosystem">
        <div className="field" aria-label="RALLIVIO living platform field">
          <div className="fieldInner" style={{ transform: `perspective(1100px) rotateY(${pointer.x * -4}deg) rotateX(${pointer.y * 3}deg)` }}>
            <div className="ambient a1"/><div className="ambient a2"/><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/>
            <div className="beatHalo">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ "--i": i } as CSSProperties}/>)}</div>
            {platforms.map(p => <button key={p.name} className={`platform ${activePlatform === p.slug ? "selected" : ""} ${p.connected ? "connected" : ""}`} style={{ top: p.top, left: p.left }} type="button" onClick={() => activatePlatform(p)} onPointerEnter={() => setActivePlatform(p.slug)}><span><img src={iconUrl(p.icon)} alt=""/></span><b>{p.name}</b><small>{p.connected ? "Connected" : "Explore"}</small></button>)}
            <button className="core" type="button" onClick={() => { setActivePlatform("all"); setFilter("Trending"); setQ(""); setNotice("RALLIVIO re-centered. The field is listening across connected sources."); }}><div className="corePulse"/><strong>RALL<span>IVIO</span></strong><small>LIVING DISCOVERY SYSTEM</small><i><b>●</b> {loading ? "syncing" : `${ranked.length} verified signals`} · {activePlatform === "all" ? "all sources" : platforms.find(p => p.slug === activePlatform)?.name}</i></button>
          </div>
        </div>
        <div className="fieldHint"><span>◉</span> Touch or move across the field · platforms open their own RALLIVIO environment</div>
      </div>
    </section>

    <section className="signals" id="signals">
      <div className="signalsHead"><div><span className="eyebrow">LIVE SIGNALS</span><h2>What is moving right now?</h2><p>Verified observations. The visual motion is presentation; the signal itself comes from source data.</p></div><div className="sourceState"><i/> SOURCE CONNECTED <b>YouTube</b><small>Refreshes every 60s · {ranked.length} observations</small></div></div>
      <div className="signalGrid">
        {shown.slice(0, 6).map(x => <button className="signalCard" key={x.id} type="button" onClick={() => go(`/platform/youtube?video=${encodeURIComponent(x.id)}`)}><div className="signalIcon"><img src={x.thumbnail} alt=""/></div><div className="signalBody"><div className="signalTop"><span>{x.metadata?.signal || "Observed"}</span><time>{age(x.published_at)}</time></div><strong>{x.title}</strong><small>{x.channel_title}</small><div className="signalMeta"><span>{fmt(x.views)} views</span><span>{categoryFor(x)}</span><span>Score {Math.round(x.metadata?.momentum_score || 0)}</span></div></div><em>↗</em></button>)}
        {!loading && !shown.length && <div className="signalEmpty">No verified observations match this field yet.</div>}
        {loading && <div className="signalEmpty">Syncing verified observations…</div>}
      </div>
    </section>

    {notice && <div className="toast" role="status">{notice}</div>}
    <footer><span>RALL<span>IVIO</span></span><small>Discover what is moving. Follow the signal. Create what comes next.</small></footer>
  </main>;
}

const css = `
:root{--bg:#060817;--line:rgba(255,255,255,.12);--text:#f8f7ff;--muted:#aaa9bf}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}button{cursor:pointer}.rv{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 52% 9%,rgba(112,65,255,.24),transparent 31%),radial-gradient(circle at 88% 44%,rgba(0,211,255,.07),transparent 25%),linear-gradient(135deg,#090b21,#070817 55%,#11122c)}
.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:22px;padding:12px 34px;border-bottom:1px solid var(--line);background:rgba(7,8,22,.78);backdrop-filter:blur(22px)}.brand{border:0;background:transparent;color:#fff;font-size:28px;font-weight:900;letter-spacing:-1.5px;line-height:.82;text-align:left;white-space:nowrap}.brand span,footer span span,.core strong span{color:#a967ff}.brand small{display:block;font-size:6px;letter-spacing:1.05px;color:#aaa9c1;margin-top:6px}.topbar nav{display:flex;gap:4px;flex:1}.topbar nav button{border:0;background:transparent;color:#d9d7e8;padding:10px 14px;border-radius:999px;font-weight:650}.topbar nav button:hover,.topbar nav button.active{color:#fff;background:linear-gradient(135deg,#8246ff,#bc62ff);box-shadow:0 0 25px rgba(153,75,255,.3)}.search{width:min(365px,28vw);height:42px;display:flex;border:1px solid var(--line);border-radius:24px;background:rgba(0,0,0,.2);overflow:hidden}.search input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#ddd;padding:0 15px}.search button{width:45px;border:0;background:transparent;color:#aaa}.round,.avatar{border:1px solid var(--line);background:rgba(255,255,255,.04);color:#fff}.round{width:40px;height:40px;border-radius:50%}.avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ffbe68,#874cff);font-weight:800}
.hero{position:relative;min-height:650px;padding:48px 48px 25px;display:grid;grid-template-columns:minmax(330px,.82fr) minmax(570px,1.5fr);gap:25px;align-items:center}.hero:before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(circle at 55% 48%,rgba(121,71,255,.22),transparent 25%),linear-gradient(180deg,rgba(17,19,51,.1),rgba(6,8,22,.86))}.heroCopy{max-width:500px;z-index:3}.pill{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border:1px solid rgba(255,74,102,.4);border-radius:999px;background:rgba(255,50,84,.11);font-size:11px;font-weight:800}.pill i{width:8px;height:8px;border-radius:50%;background:#ff4166;box-shadow:0 0 13px #ff4166;animation:blink 1.4s infinite}@keyframes blink{50%{opacity:.35;transform:scale(.7)}}.hero h1{margin:18px 0 14px;font-size:clamp(48px,5.1vw,75px);line-height:.94;letter-spacing:-4px}.hero h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c36bff 60%,#7b6bff);-webkit-background-clip:text;color:transparent}.heroCopy>p{color:#d0cfe0;font-size:18px;line-height:1.55;max-width:460px}.heroSearch{margin-top:24px;height:56px;display:flex;align-items:center;border-radius:30px;background:#f7f6fc;padding:5px 6px 5px 18px;box-shadow:0 18px 60px rgba(75,49,184,.28)}.heroSearch .searchMark{color:#6c6981}.heroSearch input{flex:1;border:0;outline:0;background:transparent;color:#252239}.heroSearch button{width:45px;height:45px;border:0;border-radius:50%;background:linear-gradient(135deg,#6244ff,#b45eff);color:#fff;font-size:21px}.categoryRail{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.categoryRail button{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#eceaf6;padding:8px 11px;border-radius:18px;font-size:11px}.categoryRail button span{margin-right:5px;color:#c987ff}.categoryRail button.active{border-color:#df68ff;background:linear-gradient(135deg,rgba(119,64,255,.45),rgba(230,106,255,.25));box-shadow:0 0 20px rgba(179,85,255,.22)}.categoryRail .more{border-style:dashed}.routingLine{margin-top:17px;display:grid;grid-template-columns:auto auto auto;gap:7px 8px;align-items:center;color:#9d9ab3;font-size:9px;letter-spacing:.7px}.routingLine b{color:#dedbef}.routingLine small{grid-column:1/-1;color:#74728a;font-size:10px;letter-spacing:0}.routingDot{width:6px;height:6px;border-radius:50%;background:#65e8b0;box-shadow:0 0 10px #65e8b0}
.ecosystem{position:relative;height:600px;display:grid;place-items:center}.field{position:relative;width:min(680px,100%);aspect-ratio:1}.fieldInner{position:absolute;inset:0;transition:transform .22s ease-out}.ambient{position:absolute;border-radius:50%;filter:blur(6px)}.a1{inset:25%;background:radial-gradient(circle,rgba(125,75,255,.42),transparent 68%)}.a2{inset:8%;background:radial-gradient(circle,transparent 47%,rgba(62,97,255,.08),transparent 70%)}.orbit{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);border:1px solid rgba(126,114,255,.2)}.o1{width:42%;height:42%}.o2{width:66%;height:66%;border-style:dashed}.o3{width:88%;height:88%;border-color:rgba(87,121,255,.13)}.orbit:after{content:"";position:absolute;inset:-1px;border-radius:50%;border-top:1px solid rgba(220,107,255,.38);animation:orbitSpin 16s linear infinite}@keyframes orbitSpin{to{transform:rotate(360deg)}}
.core{position:absolute;left:50%;top:50%;width:220px;height:220px;transform:translate(-50%,-50%);border-radius:50%;border:1px solid rgba(190,145,255,.8);background:radial-gradient(circle at 35% 25%,#3d4bc0,#141630 48%,#080a19 77%);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;box-shadow:0 0 0 10px rgba(145,81,255,.07),0 0 80px rgba(131,69,255,.52),inset 0 0 65px rgba(72,57,208,.36);animation:coreDance 1.8s ease-in-out infinite}@keyframes coreDance{0%,100%{transform:translate(-50%,-50%) scale(1)}25%{transform:translate(-50%,-50%) scale(1.035) rotate(-1deg)}50%{transform:translate(-50%,-50%) scale(.985) rotate(1deg)}75%{transform:translate(-50%,-50%) scale(1.025) rotate(-.5deg)}}.core:before{content:"";position:absolute;inset:-18px;border-radius:50%;border:1px solid rgba(158,104,255,.28);animation:coreRing 5s ease-in-out infinite}.core:after{content:"";position:absolute;inset:-62px;border-radius:50%;border:1px dashed rgba(105,144,255,.18);animation:coreRing 12s linear infinite reverse}@keyframes coreRing{50%{transform:scale(1.08);opacity:.55}100%{transform:rotate(360deg)}}.core strong{font-size:35px;letter-spacing:-2px}.core small{font-size:8px;color:#d4d1e7;letter-spacing:.8px}.core i{font-style:normal;font-size:9px;color:#6fe2b0;margin-top:9px}.core i b{font-size:7px}.corePulse{position:absolute;top:27px;width:7px;height:7px;border-radius:50%;background:#6ee7b1;box-shadow:0 0 15px #6ee7b1;animation:beat 900ms ease-in-out infinite}@keyframes beat{50%{transform:scale(1.7);opacity:.55}}
.beatHalo{position:absolute;left:50%;top:50%;width:290px;height:290px;transform:translate(-50%,-50%);pointer-events:none;z-index:6}.beatHalo i{--angle:calc(var(--i)*22.5deg);position:absolute;left:50%;top:50%;width:5px;height:25px;border-radius:5px;background:linear-gradient(#d977ff,#765dff);transform-origin:50% 145px;transform:translate(-50%,-50%) rotate(var(--angle));opacity:.18;animation:beatBars 900ms ease-in-out infinite;animation-delay:calc(var(--i)*55ms)}@keyframes beatBars{45%{height:42px;opacity:.95;filter:drop-shadow(0 0 8px rgba(190,100,255,.8))}100%{height:25px;opacity:.18}}
.platform{position:absolute;transform:translate(-50%,-50%);min-width:78px;padding:0;border:0;background:transparent;color:#fff;display:flex;flex-direction:column;align-items:center;gap:5px;z-index:12;transition:transform .35s cubic-bezier(.2,.8,.2,1),filter .35s}.platform:hover,.platform.selected{transform:translate(-50%,-50%) scale(1.12);filter:drop-shadow(0 0 15px rgba(183,103,255,.55))}.platform span{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:rgba(13,15,37,.9);border:1px solid rgba(255,255,255,.17);box-shadow:0 13px 28px rgba(0,0,0,.32)}.platform.connected span{border-color:rgba(177,113,255,.8);box-shadow:0 0 25px rgba(145,81,255,.28)}.platform img{width:29px;height:29px}.platform b{font-size:11px}.platform small{font-size:8px;color:#88869d}.fieldHint{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);padding:8px 14px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(6,7,19,.55);color:#9d9bb1;font-size:9px;white-space:nowrap}.fieldHint span{color:#b26aff;margin-right:6px}
.signals{margin:0 48px 50px;padding:29px 26px 30px;border:1px solid rgba(255,255,255,.11);border-radius:24px;background:linear-gradient(145deg,rgba(12,15,38,.94),rgba(7,9,24,.94));box-shadow:0 30px 100px rgba(0,0,0,.22)}.signalsHead{display:flex;justify-content:space-between;gap:30px;align-items:flex-end}.eyebrow{font-size:10px;font-weight:850;letter-spacing:1.5px;color:#bc6cff}.signals h2{margin:7px 0 5px;font-size:29px;letter-spacing:-1px}.signals p{margin:0;color:#85839a;font-size:12px}.sourceState{min-width:210px;padding:12px 14px;border:1px solid rgba(255,255,255,.08);border-radius:14px;color:#71e3b2;font-size:9px;text-align:right}.sourceState i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#65e8b0;box-shadow:0 0 9px #65e8b0;margin-right:6px}.sourceState b{display:block;color:#fff;font-size:12px;margin-top:4px}.sourceState small{display:block;color:#77758b;margin-top:3px}.signalGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}.signalCard{display:grid;grid-template-columns:62px 1fr auto;gap:12px;text-align:left;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.025);color:#fff;transition:.25s}.signalCard:hover{transform:translateY(-3px);border-color:rgba(174,101,255,.55);background:rgba(143,75,255,.08)}.signalIcon{width:62px;height:62px;border-radius:11px;overflow:hidden;background:#12142c}.signalIcon img{width:100%;height:100%;object-fit:cover}.signalTop{display:flex;justify-content:space-between;gap:7px}.signalTop span{color:#bd70ff;font-size:9px;font-weight:800}.signalTop time{color:#77758b;font-size:9px}.signalBody strong{display:block;margin:6px 0 3px;font-size:12px;line-height:1.3}.signalBody>small{display:block;color:#9996ad;font-size:9px}.signalMeta{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px;color:#77758b;font-size:8px}.signalCard>em{font-style:normal;color:#b56aff}.signalEmpty{grid-column:1/-1;padding:35px;text-align:center;color:#77758b;border:1px dashed rgba(255,255,255,.1);border-radius:14px}.toast{position:fixed;right:22px;bottom:22px;z-index:80;max-width:430px;padding:12px 15px;border:1px solid rgba(182,105,255,.4);border-radius:13px;background:rgba(10,11,28,.94);box-shadow:0 15px 50px rgba(0,0,0,.45);color:#ddd9ee;font-size:11px}footer{display:flex;justify-content:space-between;align-items:center;padding:28px 48px;border-top:1px solid rgba(255,255,255,.08);color:#77758c}footer>span{font-size:22px;font-weight:900;color:#fff}footer small{font-size:10px}
@media(max-width:1100px){.topbar nav button{padding:9px}.hero{grid-template-columns:1fr}.heroCopy{max-width:720px}.ecosystem{height:620px}.signalGrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.topbar{padding:10px 15px;gap:10px}.topbar nav{display:none}.brand{font-size:23px}.search{display:none}.hero{padding:35px 18px 20px}.hero h1{font-size:50px}.ecosystem{height:490px}.field{width:100%}.platform span{width:47px;height:47px;border-radius:14px}.platform img{width:23px;height:23px}.platform b{font-size:9px}.platform small{display:none}.core{width:175px;height:175px}.core strong{font-size:28px}.beatHalo{width:230px;height:230px}.beatHalo i{transform-origin:50% 115px}.signals{margin:0 14px 30px;padding:22px 14px}.signalsHead{display:block}.sourceState{margin-top:15px;text-align:left}.signalGrid{grid-template-columns:1fr}.routingLine{font-size:8px}footer{padding:25px 18px;display:block}footer small{display:block;margin-top:8px}}
`;
