"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  metadata?: {
    subscriber_count?: number | null;
    signal?: string;
    momentum_score?: number;
  };
};

type Category = { name: string; icon: string; keywords: string[] };

type Platform = {
  name: string;
  mark: string;
  kind: string;
  connected: boolean;
};

const platforms: Platform[] = [
  { name: "YouTube", mark: "▶", kind: "youtube", connected: true },
  { name: "Instagram", mark: "◎", kind: "instagram", connected: false },
  { name: "TikTok", mark: "♪", kind: "tiktok", connected: false },
  { name: "X", mark: "𝕏", kind: "x", connected: false },
  { name: "LinkedIn", mark: "in", kind: "linkedin", connected: false },
  { name: "Spotify", mark: "◉", kind: "spotify", connected: false },
  { name: "Twitch", mark: "⌁", kind: "twitch", connected: false },
  { name: "Facebook", mark: "f", kind: "facebook", connected: false },
  { name: "Pinterest", mark: "p", kind: "pinterest", connected: false },
  { name: "Reddit", mark: "●", kind: "reddit", connected: false },
  { name: "Discord", mark: "◌", kind: "discord", connected: false },
  { name: "Snapchat", mark: "⌁", kind: "snapchat", connected: false },
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

export default function LivingDiscover() {
  const path = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState("Trending");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activePlatform, setActivePlatform] = useState("YouTube");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [fieldPulse, setFieldPulse] = useState(0);
  const [tick, setTick] = useState(0);
  const isHome = path === "/living" || path === "/" || path === "/home";

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

  useEffect(() => { const id = window.setInterval(() => setTick(n => n + 1), 7000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!notice) return; const id = window.setTimeout(() => setNotice(""), 3500); return () => window.clearTimeout(id); }, [notice]);

  const ranked = useMemo(() => [...items].sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)), [items]);
  const shown = useMemo(() => {
    const base = filter === "Trending" ? ranked : ranked.filter(x => categoryFor(x) === filter);
    const s = q.trim().toLowerCase();
    return s ? base.filter(x => `${x.title} ${x.channel_title} ${x.description} ${x.topic}`.toLowerCase().includes(s)) : base;
  }, [ranked, filter, q]);
  const activity = useMemo(() => [...shown, ...ranked].filter((x, i, a) => a.findIndex(y => y.id === x.id) === i), [shown, ranked]);
  const activityOffset = activity.length ? tick % activity.length : 0;
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 10);
  const go = (p: string) => { router.push(p); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const pulseField = (message: string) => {
    setFieldPulse(n => n + 1);
    setNotice(message);
  };

  const command = (s: string) => {
    const l = s.trim().toLowerCase();
    if (!l) return;
    const c = categories.find(x => x.name.toLowerCase() === l || x.name.toLowerCase().includes(l) || l.includes(x.name.toLowerCase()));
    if (c) { setFilter(c.name); setQ(""); pulseField(`RALLIVIO tuned the field to ${c.name}.`); return; }
    const p = platforms.find(x => l.includes(x.name.toLowerCase()));
    if (p) { activatePlatform(p); return; }
    if (l.includes("creator") || l.includes("profile")) { go("/creators"); return; }
    if (l.includes("brand")) { go("/brands"); return; }
    if (l.includes("opportun")) { go("/opportunities"); return; }
    if (l.includes("moving") || l.includes("trending") || l.includes("content") || l.includes("video") || l.includes("topic") || l.includes("signal")) {
      setFilter("Trending");
      setQ(s);
      pulseField(`Searching verified discovery for “${s}”.`);
      return;
    }
    setQ(s);
    setFilter("Trending");
    pulseField(`Searching verified discovery for “${s}”.`);
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPointer({ x: (e.clientX - r.left) / r.width - .5, y: (e.clientY - r.top) / r.height - .5 });
  };

  function activatePlatform(p: Platform) {
    setActivePlatform(p.name);
    setFieldPulse(n => n + 1);
    setNotice(p.connected
      ? "YouTube is source-connected. The field is responding to verified observations."
      : `${p.name} is active in the ecosystem. Its source adapter is not connected yet, so no activity is fabricated.`);
  }

  const resetCore = () => {
    setActivePlatform("YouTube");
    setFilter("Trending");
    setQ("");
    pulseField("RALLIVIO re-centered. The living field is listening.");
  };

  return <main className="rv" onPointerMove={move} onPointerLeave={() => setPointer({ x: 0, y: 0 })}>
    <style>{css}</style>
    <header className="topbar">
      <button className="brand" type="button" onClick={() => go("/")}>RALL<span>IVIO</span><small>CREATORS. BRANDS. A BRIGHTER TOMORROW.</small></button>
      <nav>{nav.map(([n, p]) => <button key={p} className={p === "/" ? "active" : ""} type="button" onClick={() => go(p)}>{n}</button>)}</nav>
      <form className="search" onSubmit={e => { e.preventDefault(); command(q); }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search anything: creators, brands, videos, trends…"/><button type="submit">⌕</button></form>
      <button className="round" type="button" onClick={() => setNotice("Signals are sourced from the verified discovery pool.")}>◌</button>
      <button className="round" type="button" onClick={() => document.documentElement.classList.toggle("light")}>☼</button>
      <button className="avatar" type="button" onClick={() => setNotice("Your RALLIVIO space is ready.")}>R</button>
    </header>

    <section className="hero">
      <div className="heroCopy">
        <span className="pill"><i/> LIVE / THE CREATOR ECONOMY IS MOVING RIGHT NOW</span>
        <h1>Discover<br/><em>A Brighter</em><br/>Tomorrow.</h1>
        <p>Real trends. Real creators. Real brands. One ecosystem. Unlimited opportunities.</p>
        <form className="heroSearch" onSubmit={e => { e.preventDefault(); command(q); }}>
          <span className="searchMark">⌕</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="What do you want to discover?" aria-label="Universal discovery search"/>
          <button type="submit" aria-label="Search">→</button>
        </form>
        <div className="categoryRail" aria-label="Discovery categories">
          {visibleCategories.map(c => <button key={c.name} className={filter === c.name ? "active" : ""} type="button" onClick={() => { setFilter(c.name); setQ(""); pulseField(`Field tuned to ${c.name}.`); }}><span>{c.icon}</span>{c.name}</button>)}
          <button className="more" type="button" onClick={() => setShowAllCategories(v => !v)}>{showAllCategories ? "Less ↑" : `+${categories.length - 10} more`}</button>
        </div>
      </div>

      <div className="ecosystem">
        <div className="field" aria-label="RALLIVIO living platform field">
          <div className={`fieldInner ${fieldPulse ? "fieldActive" : ""}`} key={fieldPulse || "idle"} style={{ transform: `perspective(1100px) rotateY(${pointer.x * -4}deg) rotateX(${pointer.y * 3}deg)` }}>
            <div className="starDust s1"/><div className="starDust s2"/><div className="starDust s3"/>
            <div className="ambient a1"/><div className="ambient a2"/>
            <div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/>
            {platforms.map((p, i) => <button key={p.name} className={`platform p${i} ${activePlatform === p.name ? "selected" : ""}`} type="button" aria-label={`${p.name} platform`} onClick={() => activatePlatform(p)} onPointerEnter={() => setActivePlatform(p.name)}>
              <span className={`platformMark ${p.kind}`}>{p.mark}</span>
              <b>{p.name}</b>
              <small>{p.connected ? "Connected" : "Explore"}</small>
            </button>)}
            <button className="core" type="button" aria-label="Activate RALLIVIO living discovery core" onClick={resetCore} onPointerDown={() => setFieldPulse(n => n + 1)}>
              <div className="corePulse"/><div className="corePulse corePulse2"/><div className="coreGlow"/>
              <strong>RALL<span>IVIO</span></strong>
              <small>LIVING DISCOVERY SYSTEM</small>
              <i><b>●</b> {loading ? "syncing" : `${ranked.length} verified signals`} {activePlatform !== "YouTube" ? `· ${activePlatform} focus` : "· in motion"}</i>
            </button>
          </div>
        </div>
        <div className="fieldHint"><span>◉</span> Touch / hover the core or any platform — the field responds</div>
      </div>
    </section>

    <section className="signals" id="signals">
      <div className="signalsHead"><div><span className="eyebrow">LIVE SIGNALS</span><h2>What is moving right now?</h2><p>Verified observations, formatted as signals — not a simulated feed.</p></div><div className="sourceState"><i/> SOURCE CONNECTED <b>YouTube</b><small>Refreshes every 60s</small></div></div>
      <div className="signalGrid">
        {activity.slice(activityOffset, activityOffset + 6).map(x => <button className="signalCard" key={x.id} type="button" onClick={() => setModal(x)}><div className="signalIcon"><img src={x.thumbnail} alt=""/></div><div className="signalBody"><div className="signalTop"><span>{x.metadata?.signal || "Observed"}</span><time>{age(x.published_at)}</time></div><strong>{x.title}</strong><small>{x.channel_title}</small><div className="signalMeta"><span>{fmt(x.views)} views</span><span>{categoryFor(x)}</span><span>Score {Math.round(x.metadata?.momentum_score || 0)}</span></div></div><em>↗</em></button>)}
        {!loading && !activity.length && <div className="signalEmpty">No verified observations are available for this environment yet.</div>}
        {loading && <div className="signalEmpty">Syncing verified observations…</div>}
      </div>
    </section>

    <section className="discoverySurface">
      <div className="surfaceHead"><div><span className="eyebrow">DISCOVERY POOL</span><h2>{filter === "Trending" ? "Trending across the field" : `${filter} is moving`}</h2><p>Search and category controls change the same underlying verified candidate pool.</p></div><button type="button" onClick={() => { setFilter("Trending"); setQ(""); }}>Reset field ↺</button></div>
      <div className="cards">{shown.slice(0, 5).map(x => <article className="card" key={x.id} onClick={() => setModal(x)}><div className="thumb"><img src={x.thumbnail} alt=""/><span>{categoryFor(x)}</span><button type="button" onClick={e => { e.stopPropagation(); setModal(x); }}>▶</button></div><h3>{x.title}</h3><p>{x.channel_title}</p><small>{fmt(x.views)} views · {age(x.published_at)} · {x.metadata?.signal || "Observed"}</small></article>)}</div>
    </section>

    <footer><b>RALL<span>IVIO</span></b><small>Discover People. Power What’s Next.</small><p>Source observations drive discovery. Motion responds to state; factual activity is never fabricated.</p></footer>
    {notice && <div className="toast" role="status"><b>RALLIVIO</b><span>{notice}</span></div>}
    {modal && <div className="backdrop" onClick={() => setModal(null)}><div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="close" type="button" onClick={() => setModal(null)}>×</button><div className="player">{modal.embeddable ? <iframe src={`https://www.youtube.com/embed/${modal.id}?autoplay=1&rel=0`} title={modal.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <img src={modal.thumbnail} alt=""/>}</div><span className="eyebrow">{modal.metadata?.signal || "Observed"} · VERIFIED OBSERVATION</span><h2>{modal.title}</h2><p>{modal.channel_title} · {fmt(modal.views)} views · {age(modal.published_at)}</p><button className="primary" type="button" onClick={() => window.open(modal.url, "_blank", "noopener,noreferrer")}>Watch on source ↗</button></div></div>}
  </main>;
}

const css = `
:root{--bg:#07091a;--text:#f7f6ff;--muted:#aaa9c2;--line:#ffffff1b;--purple:#8c4dff;--purple2:#c16bff;--panel:#0c1024}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}button,input{font:inherit}button{cursor:pointer;color:inherit}.rv{min-height:100vh;overflow:hidden;background:radial-gradient(circle at 52% 14%,#713cff32,transparent 32%),linear-gradient(135deg,#090b21,#07081a 58%,#0d1028)}.topbar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:18px;padding:12px 34px;border-bottom:1px solid var(--line);background:#080919df;backdrop-filter:blur(18px)}.brand{border:0;background:transparent;text-align:left;font-size:28px;font-weight:950;letter-spacing:-1.7px;line-height:.85;white-space:nowrap}.brand span,.core span,footer span{color:#a868ff}.brand small{display:block;font-size:6px;letter-spacing:1px;color:#aaa9c1;margin-top:6px}.topbar nav{display:flex;gap:3px;flex:1}.topbar nav button{border:0;background:transparent;padding:10px 13px;border-radius:999px;color:#deddef;font-weight:650}.topbar nav button.active,.topbar nav button:hover{background:linear-gradient(135deg,#8544ff,#bd61ff);color:#fff}.search{display:flex;width:min(390px,29vw);height:42px;border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#050611aa}.search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;padding:0 15px;font-size:12px}.search button{width:46px;border:0;background:transparent;font-size:21px}.round,.avatar{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#ffffff0d}.avatar{background:linear-gradient(135deg,#ffbd6a,#8c4eff);font-weight:850}.hero{min-height:650px;padding:48px 55px 30px;display:grid;grid-template-columns:minmax(390px,.9fr) minmax(640px,1.5fr);gap:12px;align-items:center}.heroCopy{max-width:560px;z-index:3}.pill{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border:1px solid #ff4a6666;border-radius:999px;background:#ff36591f;font-size:10px;font-weight:850;letter-spacing:.15px}.pill i{width:8px;height:8px;border-radius:50%;background:#ff4265;animation:pulse 1.5s infinite}@keyframes pulse{50%{opacity:.25}}h1{font-size:clamp(54px,5vw,78px);line-height:.94;letter-spacing:-4px;margin:20px 0}.heroCopy h1 em,.subpage h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c269ff 58%,#7f6bff);-webkit-background-clip:text;color:transparent}.heroCopy>p,.subpage>p{font-size:17px;line-height:1.55;color:#d0cfe0;max-width:520px}.heroSearch{display:flex;align-items:center;height:60px;margin-top:24px;padding:5px 6px 5px 17px;border-radius:31px;background:#f7f6fb;box-shadow:0 12px 45px #0005}.heroSearch .searchMark{font-size:19px;color:#67657c}.heroSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#252239;padding:0 10px}.heroSearch button{width:47px;height:47px;border:0;border-radius:50%;background:linear-gradient(135deg,#6244ff,#b45eff);color:#fff;font-size:19px}.categoryRail{display:flex;gap:7px;flex-wrap:wrap;margin-top:15px;max-width:640px}.categoryRail button{display:flex;align-items:center;gap:6px;border:1px solid #fff2;background:#ffffff09;padding:8px 11px;border-radius:18px;color:#dddbea;font-size:11px}.categoryRail button span{color:#c18bff}.categoryRail button.active{border-color:#b66cff;background:#713cff35;color:#fff}.categoryRail .more{color:#c69bff}.ecosystem{position:relative;min-width:0}.field{height:575px;position:relative}.fieldInner{height:100%;position:relative;transition:transform .25s ease}.fieldInner.fieldActive{animation:fieldReact .75s ease-out}@keyframes fieldReact{0%{filter:brightness(1)}25%{filter:brightness(1.24)}100%{filter:brightness(1)}}.ambient{position:absolute;left:50%;top:50%;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.a1{width:430px;height:430px;background:radial-gradient(circle,#8c4dff33,transparent 67%);animation:breathe 5s ease-in-out infinite}.a2{width:280px;height:280px;background:radial-gradient(circle,#3c61ff24,transparent 65%);animation:breathe 4s ease-in-out infinite reverse}@keyframes breathe{50%{transform:translate(-50%,-50%) scale(1.09);opacity:.7}}.orbit{position:absolute;left:50%;top:50%;border:1px solid #7565ff2d;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.o1{width:330px;height:330px}.o2{width:455px;height:455px;border-style:dashed;animation:spin 28s linear infinite}.o3{width:555px;height:555px;border-color:#3c9dff1d;animation:spin 42s linear infinite reverse}@keyframes spin{to{transform:translate(-50%,-50%) rotate(360deg)}}.starDust{position:absolute;width:4px;height:4px;border-radius:50%;background:#c8b4ff;box-shadow:0 0 14px #a56cff;opacity:.55;pointer-events:none}.s1{left:18%;top:27%;animation:floatStar 4s ease-in-out infinite}.s2{right:17%;top:30%;animation:floatStar 5s ease-in-out infinite reverse}.s3{right:27%;bottom:20%;animation:floatStar 3.5s ease-in-out infinite}@keyframes floatStar{50%{transform:translateY(-12px) scale(1.5);opacity:1}}.core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:218px;height:218px;border-radius:50%;display:grid;place-items:center;align-content:center;border:1px solid #b88cffb8;background:radial-gradient(circle at 35% 25%,#4650c4,#12142d 48%,#080a19 76%);box-shadow:0 0 85px #8345ff5e,0 0 0 18px #7e4aff0b;z-index:20;transition:transform .25s,box-shadow .25s}.core:hover,.core:focus-visible,.core:active{transform:translate(-50%,-50%) scale(1.045);box-shadow:0 0 120px #9b62ff9a,0 0 0 30px #7e4aff14}.core strong{font-size:35px;letter-spacing:-2px}.core small{font-size:8px;color:#aaa9bf;letter-spacing:.8px}.core i{font-style:normal;color:#72e4b3;font-size:9px;margin-top:10px}.core i b{font-size:8px}.corePulse{position:absolute;inset:-12px;border-radius:50%;border:1px solid #9b6cff4d;animation:corePulse 2.4s ease-out infinite}.corePulse2{inset:-27px;border-color:#7d66ff24;animation-delay:.65s}@keyframes corePulse{0%{transform:scale(.9);opacity:.8}100%{transform:scale(1.15);opacity:0}}.coreGlow{position:absolute;inset:15px;border-radius:50%;background:radial-gradient(circle,#9b6cff12,transparent 65%);animation:coreGlow 2.6s ease-in-out infinite;pointer-events:none}@keyframes coreGlow{50%{transform:scale(1.08);opacity:.5}}.platform{position:absolute;width:96px;border:0;background:transparent;text-align:center;z-index:25;padding:5px;border-radius:16px;transition:transform .2s,filter .2s}.platformMark{display:grid;place-items:center;width:57px;height:57px;margin:auto;border-radius:17px;background:#10132a;border:1px solid #ffffff20;font-size:25px;font-weight:900;box-shadow:0 10px 30px #0004;transition:box-shadow .2s,border-color .2s,background .2s}.platformMark.instagram{font-size:31px}.platformMark.youtube{color:#fff}.platformMark.x{font-size:24px}.platformMark.linkedin,.platformMark.facebook,.platformMark.pinterest{font-family:Arial,sans-serif}.platformMark.linkedin{font-size:19px}.platformMark.facebook{font-size:31px}.platformMark.pinterest{font-size:30px}.platform b{display:block;font-size:10px;margin-top:6px}.platform small{display:block;color:#85859e;font-size:7px;margin-top:3px}.platform:hover,.platform.selected{transform:translateY(-7px) scale(1.09);filter:brightness(1.2)}.platform:hover .platformMark,.platform.selected .platformMark{border-color:#a969ff;box-shadow:0 0 34px #8b4fff66,0 0 0 5px #8b4fff0d;background:#171335}.p0{left:45%;top:0}.p1{right:10%;top:9%}.p2{right:0;top:40%}.p3{right:8%;bottom:7%}.p4{left:45%;bottom:0}.p5{left:20%;bottom:5%}.p6{left:3%;bottom:28%}.p7{left:1%;top:36%}.p8{left:10%;top:9%}.p9{left:30%;top:12%}.p10{right:28%;top:17%}.p11{right:21%;bottom:21%}.fieldHint{position:absolute;left:50%;bottom:0;transform:translateX(-50%);white-space:nowrap;padding:8px 13px;border:1px solid #ffffff14;border-radius:999px;background:#080a1a99;color:#a8a7bf;font-size:9px}.fieldHint span{color:#b16aff;margin-right:5px}.signals{margin:0 55px;padding:27px 24px 25px;border:1px solid #5879c533;border-radius:25px;background:linear-gradient(135deg,#0d132b,#0a0d20);box-shadow:0 25px 70px #0002}.signalsHead{display:flex;justify-content:space-between;align-items:flex-end;gap:25px}.eyebrow{display:inline-block;color:#a66aff;font-size:9px;font-weight:900;letter-spacing:1.4px}.signals h2,.discoverySurface h2{margin:5px 0 6px;font-size:29px;letter-spacing:-.8px}.signalsHead p,.surfaceHead p{margin:0;color:#888ba8;font-size:11px}.sourceState{display:grid;grid-template-columns:auto auto;gap:3px 7px;text-align:right;font-size:8px;color:#6fe0ae;letter-spacing:.6px}.sourceState i{width:7px;height:7px;background:#61e0ad;border-radius:50%;align-self:center;justify-self:end}.sourceState b{color:#fff;font-size:9px}.sourceState small{grid-column:1/-1;color:#747791}.signalGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:18px}.signalCard{display:grid;grid-template-columns:48px 1fr 18px;gap:11px;align-items:center;text-align:left;border:1px solid #ffffff0e;background:#ffffff05;border-radius:15px;padding:10px 12px;min-width:0;transition:transform .18s,border-color .18s,background .18s}.signalCard:hover{transform:translateY(-2px);border-color:#9b66ff66;background:#ffffff0a}.signalIcon img{width:48px;height:48px;object-fit:cover;border-radius:11px}.signalBody{min-width:0}.signalTop{display:flex;justify-content:space-between;gap:10px}.signalTop span{font-size:7px;color:#b67aff;font-weight:850;text-transform:uppercase;letter-spacing:.8px}.signalTop time{font-size:7px;color:#70738d}.signalBody strong{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.signalBody>small{display:block;color:#9295ad;font-size:8px;margin-top:3px}.signalMeta{display:flex;gap:10px;margin-top:5px;color:#777b99;font-size:7px}.signalCard>em{font-style:normal;color:#a96cff;font-size:17px}.signalEmpty{grid-column:1/-1;padding:28px;text-align:center;color:#777b98;font-size:10px;border:1px dashed #ffffff14;border-radius:14px}.discoverySurface{margin:18px 55px 35px;padding:28px 24px;background:#f2f1f8;color:#1d2243;border-radius:26px}.surfaceHead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}.surfaceHead>button{border:0;background:transparent;color:#7040e9;font-weight:800}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:13px;margin-top:18px}.card{background:#fff;border:1px solid #ddddec;border-radius:17px;overflow:hidden;cursor:pointer;transition:transform .18s,box-shadow .18s}.card:hover{transform:translateY(-3px);box-shadow:0 12px 30px #27234d14}.thumb{height:135px;position:relative}.thumb img{width:100%;height:100%;object-fit:cover}.thumb>span{position:absolute;top:9px;left:9px;padding:5px 7px;border-radius:7px;background:#713cff;color:#fff;font-size:7px;font-weight:800}.thumb button{position:absolute;right:8px;bottom:8px;width:33px;height:33px;border:0;border-radius:50%;background:#fff;color:#6e3fff}.card h3{font-size:11px;margin:11px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.card p{margin:0 11px 6px;color:#6e7391;font-size:8px}.card>small{display:block;padding:0 11px 12px;color:#4e5474;font-size:7px}.subpage{min-height:720px;padding:90px 8%}.back{border:0;background:transparent;color:#b6b4ca;margin-bottom:30px}.subIcon{width:76px;height:76px;border-radius:22px;display:grid;place-items:center;background:#17132f;border:1px solid var(--line);font-size:30px;margin-bottom:20px}.subpage h1{font-size:64px}.actions{display:flex;gap:10px;margin-top:25px}.primary{border:0;border-radius:20px;padding:11px 15px;background:linear-gradient(135deg,#7544ff,#b45eff);color:#fff;font-size:11px;font-weight:800}.secondary{border:1px solid #fff3;background:#ffffff0d;padding:10px 14px;border-radius:20px;color:inherit;font-size:11px}.toast{position:fixed;right:25px;bottom:25px;z-index:100;padding:12px 15px;border:1px solid #c466ff73;border-radius:14px;background:#15132a;box-shadow:0 15px 40px #0008;font-size:10px;max-width:390px}.toast b{display:block;color:#c58bff;font-size:8px;letter-spacing:1px;margin-bottom:4px}.toast span{display:block}.backdrop{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:25px;background:#03040dcc;backdrop-filter:blur(12px)}.modal{position:relative;width:min(860px,94vw);max-height:92vh;overflow:auto;padding:18px;border:1px solid var(--line);border-radius:22px;background:#0e1126}.close{position:absolute;right:15px;top:12px;width:38px;height:38px;border:1px solid var(--line);border-radius:50%;background:#0008;z-index:2}.player{aspect-ratio:16/9;border-radius:15px;overflow:hidden;background:#05060d;margin-bottom:18px}.player iframe,.player img{width:100%;height:100%;border:0;object-fit:cover}.modal h2{font-size:22px}.modal p{color:var(--muted);font-size:11px}@media(max-width:1250px){.hero{grid-template-columns:1fr 1.25fr}.cards{grid-template-columns:repeat(3,1fr)}}@media(max-width:950px){.topbar{flex-wrap:wrap;padding:10px 16px}.topbar nav{order:3;width:100%;overflow:auto}.search{flex:1;width:auto}.hero{grid-template-columns:1fr;padding:35px 20px}.field{height:570px}.signals,.discoverySurface{margin-left:16px;margin-right:16px}.cards{grid-template-columns:repeat(2,1fr)}.signalGrid{grid-template-columns:1fr}}@media(max-width:600px){.hero h1,.subpage h1{font-size:51px}.field{height:500px}.core{width:170px;height:170px}.core strong{font-size:28px}.orbit.o3{width:470px;height:470px}.platform{width:72px}.platformMark{width:45px;height:45px;font-size:21px}.platform b{font-size:8px}.platform small{font-size:6px}.p5{left:15%;bottom:2%}.p6{left:0;bottom:29%}.p7{left:0;top:38%}.p8{left:5%;top:9%}.p9{left:28%;top:8%}.p10{right:24%;top:11%}.p11{right:12%;bottom:19%}.fieldHint{font-size:7px;max-width:90%;overflow:hidden;text-overflow:ellipsis}.categoryRail{max-height:96px;overflow:hidden}.categoryRail button:nth-child(n+7){display:none}.categoryRail .more{display:flex}.cards{grid-template-columns:1fr}.signalsHead,.surfaceHead{display:block}.sourceState{margin-top:12px;text-align:left;justify-content:start}.sourceState i{justify-self:start}.sourceState small{grid-column:2}.discoverySurface{padding:23px 15px}footer{padding:35px 20px;grid-template-columns:1fr}footer p{grid-column:auto;text-align:left}}
`;
