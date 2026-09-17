"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string; title: string; channelTitle: string; channelSubscribers: number; channelAgeDays: number;
  publishedAt: string; thumbnail: string; description: string; format: string; live: boolean;
  views: number; likes: number; comments: number; engagement: number; velocity: number;
  momentumScore: number; signal: string; why: string[]; embeddable: boolean; url: string; rank: number;
};

type Response = { ok: boolean; state?: string; items?: Item[]; fetchedAt?: string; region?: string };

const categories = [
  ["0", "All topics"], ["1", "Film & Animation"], ["2", "Autos & Vehicles"], ["10", "Music"], ["15", "Pets & Animals"],
  ["17", "Sports"], ["19", "Travel & Events"], ["20", "Gaming"], ["22", "People & Blogs"], ["23", "Comedy"],
  ["24", "Entertainment"], ["25", "News & Politics"], ["26", "Howto & Style"], ["27", "Education"], ["28", "Science & Technology"], ["29", "Nonprofits & Activism"],
];
const regions = [
  ["", "Worldwide"], ["IN", "India"], ["US", "United States"], ["GB", "United Kingdom"], ["CA", "Canada"], ["AU", "Australia"],
  ["SG", "Singapore"], ["VN", "Vietnam"], ["JP", "Japan"], ["KR", "South Korea"], ["DE", "Germany"], ["FR", "France"], ["IT", "Italy"], ["ES", "Spain"],
  ["BR", "Brazil"], ["MX", "Mexico"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["ID", "Indonesia"], ["MY", "Malaysia"], ["TH", "Thailand"],
];
const signals = ["all", "Breaking Out", "On the Rise", "Under the Radar", "Newcomer Rising", "Now Moving", "Live"];
const formats = [["all", "All formats"], ["short", "Short-form"], ["long", "Long-form"], ["live", "Live"]];
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : h < 720 ? `${Math.floor(h / 24)}d ago` : `${Math.floor(h / 720)}mo ago`; };
const detectRegion = () => { if (typeof navigator === "undefined") return "IN"; const m = navigator.language.match(/-([A-Z]{2})$/i); return m ? m[1].toUpperCase() : "IN"; };

export default function YouTubePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("0");
  const [format, setFormat] = useState("all");
  const [signal, setSignal] = useState("all");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => { setRegion(detectRegion()); }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const p = new URLSearchParams({ region, category, format, signal });
        if (submittedQuery) p.set("q", submittedQuery);
        const r = await fetch(`/api/youtube/trending?${p.toString()}`, { cache: "no-store" });
        const b = await r.json() as Response;
        if (!r.ok || !b.ok) throw new Error(b.state || "YOUTUBE_UNAVAILABLE");
        if (!cancelled) { const next = Array.isArray(b.items) ? b.items : []; setItems(next); setSelected(prev => next.find(x => x.id === prev?.id) || next[0] || null); setFetchedAt(b.fetchedAt || ""); }
      } catch (e) { if (!cancelled) { setError(e instanceof Error ? e.message : "YOUTUBE_UNAVAILABLE"); setItems([]); setSelected(null); } }
      finally { if (!cancelled) setLoading(false); }
    };
    if (region) void load();
    return () => { cancelled = true; };
  }, [region, category, format, signal, submittedQuery]);

  const radar = useMemo(() => ({
    breaking: items.filter(x => x.signal === "Breaking Out"), rising: items.filter(x => x.signal === "On the Rise"), radar: items.filter(x => x.signal === "Under the Radar"), newcomers: items.filter(x => x.signal === "Newcomer Rising"),
  }), [items]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); setSubmittedQuery(query.trim()); };
  const select = (x: Item) => { setSelected(x); setWhyOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return <main className="yt"><style>{css}</style>
    <header className="top">
      <Link className="brand" href="/">◁ RALLI<span>VIO</span><small>DISCOVER · UNDERSTAND · CONNECT · GROW</small></Link>
      <nav><Link href="/living">Discover</Link><Link className="active" href="/platform/youtube">YouTube</Link><Link href="/creators">Creators</Link><Link href="/brands">Brands</Link></nav>
      <Link className="back" href="/living">← Discover</Link>
    </header>

    <section className="hero">
      <div><div className="source"><span>▶</span> YOUTUBE DISCOVERY INTELLIGENCE</div><h1>See what is<br/><em>moving now.</em></h1><p>Live YouTube source data combined with RALLIVIO signals for momentum, emerging creators, under-the-radar movement and the reasons a video is getting attention.</p></div>
      <aside><small>REAL SOURCE · RALLIVIO LAYER</small><b>Watch the video.<br/>Understand the movement.</b><p>YouTube remains the source and host. RALLIVIO adds discovery, normalization and transparent signal explanations without fabricating metrics.</p><Link href="/legal/youtube" className="policyLink">Read YouTube content policy →</Link></aside>
    </section>

    <section className="controls">
      <form className="search" onSubmit={submit}><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a topic, video, creator or idea…"/><button type="submit">Search</button></form>
      <div className="filter-row">
        <label>Topic<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
        <label>Video format<select value={format} onChange={e => setFormat(e.target.value)}>{formats.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
        <label>Viewer region<select value={region} onChange={e => setRegion(e.target.value)}>{regions.map(([v, n]) => <option key={v} value={v}>{n}{v && v === detectRegion() ? " · default" : ""}</option>)}</select></label>
        <label>RALLIVIO signal<select value={signal} onChange={e => setSignal(e.target.value)}>{signals.map(v => <option key={v} value={v}>{v === "all" ? "All signals" : v}</option>)}</select></label>
      </div>
      <div className="filter-note">Region controls the YouTube most-popular chart where applicable. “Worldwide” removes the region filter. Signals are RALLIVIO observations calculated from the returned candidate pool.</div>
    </section>

    <section className="live-strip"><span>●</span><b>Live radar</b><span>{region ? regions.find(x => x[0] === region)?.[1] || region : "Worldwide"}</span><span>·</span><span>{categories.find(x => x[0] === category)?.[1]}</span><span>·</span><span>{loading ? "refreshing…" : `${items.length} videos observed`}</span>{fetchedAt && <span className="fetched">updated {age(fetchedAt)}</span>}</section>

    {error ? <div className="state error"><b>{error === "YOUTUBE_API_NOT_CONFIGURED" ? "YouTube API key is not available to this Preview deployment." : "YouTube source unavailable."}</b><span>{error}</span><small>No fallback or fabricated videos are shown.</small></div> : loading ? <div className="state">Building the live YouTube radar…</div> : !items.length ? <div className="state">No videos matched this combination. Try Worldwide, All topics, All formats, or another signal.</div> : <>
      <section className="watch-layout">
        <div className="player-card">
          <div className="player">{selected?.embeddable ? <iframe src={`https://www.youtube.com/embed/${selected.id}?rel=0&modestbranding=1`} title={selected?.title || "YouTube video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/> : <div className="noembed"><b>Embedded playback unavailable</b><a href={selected?.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>}</div>
          {selected && <div className="selected-meta"><div><span className={`signal ${selected.signal.replaceAll(" ", "-").toLowerCase()}`}>{selected.signal}</span><span className="format">{selected.format}</span><span>{age(selected.publishedAt)}</span></div><h2>{selected.title}</h2><p>{selected.channelTitle} · {fmt(selected.views)} views · {selected.engagement.toFixed(1)}% engagement</p><div className="selected-actions"><a href={selected.url} target="_blank" rel="noreferrer">Open original on YouTube ↗</a><button onClick={() => setWhyOpen(v => !v)}>{whyOpen ? "Hide why" : "Why is this moving?"}</button></div></div>}
          {selected && whyOpen && <div className="why"><div><strong>RALLIVIO Momentum</strong><b>{selected.momentumScore}/100</b></div><div className="why-grid"><span><b>{fmt(selected.velocity)}/h</b><small>observed velocity</small></span><span><b>{selected.engagement.toFixed(1)}%</b><small>engagement</small></span><span><b>{selected.channelSubscribers ? `${(selected.views / selected.channelSubscribers).toFixed(1)}×` : "—"}</b><small>views / subscribers</small></span><span><b>{selected.channelAgeDays <= 730 ? "New" : "Established"}</b><small>creator stage</small></span></div><p>{selected.why.join(" · ")}</p><small className="method">Signal explanation is derived from public video/channel fields returned by YouTube; it is not a claim about YouTube's internal recommendation algorithm.</small></div>}
        </div>
        <aside className="queue"><div className="queue-head"><div><small>LIVE QUEUE</small><h3>Next on the radar</h3></div><span>{items.length}</span></div>{items.slice(0, 9).map(x => <button className={`queue-item ${selected?.id === x.id ? "active" : ""}`} key={x.id} onClick={() => select(x)}><img src={x.thumbnail} alt=""/><div><label>{x.signal}</label><strong>{x.title}</strong><small>{x.channelTitle} · {fmt(x.views)} views</small></div></button>)}</aside>
      </section>

      <section className="signal-section"><div className="section-head"><div><small>RALLIVIO SIGNALS</small><h2>Not just trending — <em>why</em> it is moving.</h2><p>Every signal is tied to observable source data. These are RALLIVIO classifications, not YouTube labels.</p></div></div>
        <div className="signal-grid">
          <SignalCard title="Breaking Out" copy="High relative momentum in the current candidate pool." items={radar.breaking} onSelect={select}/>
          <SignalCard title="On the Rise" copy="Strong movement and freshness before the top of the pool." items={radar.rising} onSelect={select}/>
          <SignalCard title="Under the Radar" copy="Engagement or audience-relative performance without the largest raw view totals." items={radar.radar} onSelect={select}/>
          <SignalCard title="Newcomer Rising" copy="A newer channel showing meaningful current momentum." items={radar.newcomers} onSelect={select}/>
        </div>
      </section>

      <section className="analytics"><div><small>LIVE ANALYTICS</small><h2>What is happening right now?</h2><p>RALLIVIO turns the current YouTube candidate set into transparent discovery signals rather than a popularity-only list.</p></div><div className="analytics-grid"><div><b>{fmt(items.reduce((a, x) => a + x.views, 0))}</b><span>visible views</span></div><div><b>{fmt(Math.max(...items.map(x => x.velocity), 0))}</b><span>top observed views/hour</span></div><div><b>{Math.max(...items.map(x => x.momentumScore), 0)}</b><span>top momentum score</span></div><div><b>{items.filter(x => x.channelAgeDays <= 730).length}</b><span>newer creators in pool</span></div></div></section>
    </>}

    <section className="source-note"><div><small>CREATOR-FIRST + COMPLIANCE</small><h2>Discovery is ours. The source stays theirs.</h2></div><p>RALLIVIO embeds eligible YouTube playback, links to the original video and creator, uses public source metadata for discovery signals, and does not present RALLIVIO-derived scores as official YouTube rankings.</p></section>
    <footer><span>YouTube content remains subject to YouTube policies and the rights of its owners.</span><nav><Link href="/legal/youtube">Content & Source Policy</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
  </main>;
}

function SignalCard({ title, copy, items, onSelect }: { title: string; copy: string; items: Item[]; onSelect: (x: Item) => void }) {
  return <div className="signal-card"><div className="signal-card-head"><div><span>{title}</span><h3>{items[0]?.title || "No current match"}</h3></div><b>{items.length}</b></div><p>{copy}</p>{items.slice(0, 3).map(x => <button key={x.id} onClick={() => onSelect(x)}><img src={x.thumbnail} alt=""/><span><strong>{x.title}</strong><small>{x.channelTitle} · {fmt(x.views)} · {fmt(x.velocity)}/h</small></span></button>)}{!items.length && <small className="empty">No current candidate in this signal.</small>}</div>;
}

const css = `:root{--bg:#070814;--panel:#0d1020;--line:#ffffff18;--text:#f8f7ff;--muted:#aaa8bf;--purple:#b56cff;--pink:#ff5b86}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}a,button,input,select{font:inherit}.yt{min-height:100vh;background:radial-gradient(circle at 78% 0,#7b45ff20,transparent 30%),radial-gradient(circle at 18% 5%,#ff31551a,transparent 32%),var(--bg)}.top{height:72px;display:flex;align-items:center;gap:28px;padding:0 42px;border-bottom:1px solid var(--line);background:#080a19e8;backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}.brand{color:#fff;text-decoration:none;font-size:27px;font-weight:950;letter-spacing:-1.5px;line-height:.8}.brand span{color:#a868ff}.brand small{display:block;font-size:6px;letter-spacing:1px;color:#9f9db5;margin-top:7px}.top nav{display:flex;gap:4px;flex:1}.top nav a,.back{color:#c9c7d9;text-decoration:none;padding:9px 14px;border-radius:999px;font-weight:750}.top nav a.active,.top nav a:hover{background:#ffffff10;color:#fff}.back{border:1px solid var(--line)}.hero{max-width:1320px;margin:auto;padding:82px 42px 55px;display:grid;grid-template-columns:1.35fr .65fr;gap:80px;align-items:end}.source{font-size:11px;font-weight:900;letter-spacing:1.4px;color:#ff668a;display:flex;gap:9px;align-items:center}.source span{display:grid;place-items:center;width:25px;height:18px;border-radius:5px;background:#ff003c;color:#fff;font-size:10px}.hero h1{font-size:clamp(52px,6vw,86px);line-height:.92;letter-spacing:-4px;margin:18px 0}.hero h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#c27aff);-webkit-background-clip:text;color:transparent}.hero p{max-width:790px;color:#c3c1d3;font-size:18px;line-height:1.65}.hero aside{padding:28px;border:1px solid var(--line);border-radius:24px;background:#ffffff08}.hero aside small,.signal-section small,.analytics small,.source-note small{color:#9e98bb;font-size:10px;letter-spacing:1.5px;font-weight:900}.hero aside b{display:block;font-size:28px;line-height:1.05;margin:12px 0}.hero aside p{color:var(--muted);font-size:14px}.policyLink{color:#d7b9ff;text-decoration:none;font-weight:800;font-size:13px}.controls{max-width:1320px;margin:auto;padding:0 42px 24px}.search{display:flex;gap:8px}.search input{flex:1;min-width:0;border:1px solid var(--line);border-radius:14px;background:#ffffff08;color:#fff;padding:14px 16px;outline:0}.search button{border:0;border-radius:14px;padding:0 20px;background:linear-gradient(135deg,#7044ff,#b35cff);color:#fff;font-weight:900}.filter-row{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:10px;margin-top:12px}.filter-row label{display:flex;flex-direction:column;gap:6px;color:#8f8ca3;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.filter-row select{border:1px solid var(--line);border-radius:12px;background:#0c0f1d;color:#eee;padding:11px 12px;outline:0;text-transform:none;font-size:13px;font-weight:700;letter-spacing:0}.filter-note{margin-top:10px;color:#77758a;font-size:11px}.live-strip{max-width:1320px;margin:0 auto 22px;padding:11px 16px;border:1px solid #b56cff2a;border-radius:12px;background:#b56cff08;display:flex;gap:9px;align-items:center;color:#a8a4ba;font-size:12px}.live-strip span:first-child{color:#5bffb2}.live-strip b{color:#fff}.live-strip .fetched{margin-left:auto;color:#77758a}.state{max-width:1320px;margin:30px auto;padding:40px;border:1px dashed var(--line);border-radius:20px;color:#aaa8bc;text-align:center;display:flex;flex-direction:column;gap:8px}.state b{color:#fff}.state.error{border-color:#ff5b862e}.watch-layout{max-width:1320px;margin:auto;padding:0 42px 55px;display:grid;grid-template-columns:minmax(0,1.8fr) minmax(300px,.7fr);gap:18px}.player-card,.queue,.signal-card,.analytics,.source-note{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}.player{aspect-ratio:16/9;background:#020308}.player iframe{width:100%;height:100%;border:0}.noembed{height:100%;display:grid;place-items:center;gap:10px;color:#aaa8bc;text-align:center}.noembed a{color:#fff}.selected-meta{padding:20px}.selected-meta>div{display:flex;gap:8px;align-items:center}.selected-meta h2{font-size:25px;line-height:1.15;margin:10px 0 6px}.selected-meta p{margin:0;color:#aaa8bc}.signal,.format{border-radius:999px;padding:5px 8px;background:#ffffff0b;color:#d5b8ff;font-size:10px;font-weight:900;text-transform:uppercase}.signal.breaking-out{color:#ff89a6}.signal.on-the-rise{color:#a8ffca}.signal.under-the-radar{color:#ffd68b}.signal.newcomer-rising{color:#8cdcff}.signal.live{color:#fff;background:#e60038}.selected-actions{margin-top:14px;display:flex;gap:8px}.selected-actions a,.selected-actions button{border:1px solid var(--line);background:#ffffff08;color:#fff;border-radius:999px;padding:8px 12px;text-decoration:none;font-size:12px;font-weight:800}.why{border-top:1px solid var(--line);padding:18px 20px;background:#ffffff05}.why>div:first-child{display:flex;justify-content:space-between}.why>div:first-child strong{color:#bd8aff}.why>div:first-child b{font-size:24px}.why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.why-grid span{padding:12px;border:1px solid var(--line);border-radius:12px}.why-grid b,.why-grid small{display:block}.why-grid small{color:#77758a;font-size:9px;margin-top:4px}.why p{color:#c9c5d7;font-size:12px;line-height:1.6}.method{display:block;color:#6e6c7d;font-size:10px;line-height:1.5}.queue{padding:15px}.queue-head{display:flex;justify-content:space-between;align-items:center;padding:4px 4px 12px}.queue-head small{color:#9e98bb;font-size:9px;letter-spacing:1.3px}.queue-head h3{margin:5px 0 0;font-size:20px}.queue-head>span{width:30px;height:30px;border-radius:50%;background:#ffffff08;display:grid;place-items:center;color:#aaa8bc}.queue-item{display:grid;grid-template-columns:110px 1fr;gap:10px;width:100%;padding:8px;border:1px solid transparent;background:transparent;color:#fff;text-align:left;border-radius:12px}.queue-item:hover,.queue-item.active{background:#ffffff08;border-color:var(--line)}.queue-item img{width:110px;aspect-ratio:16/9;object-fit:cover;border-radius:8px}.queue-item label{display:block;color:#b987ff;font-size:8px;font-weight:900;text-transform:uppercase;margin-bottom:4px}.queue-item strong{display:block;font-size:12px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.queue-item small{display:block;color:#77758a;font-size:9px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.signal-section{max-width:1320px;margin:auto;padding:0 42px 55px}.section-head h2,.analytics h2,.source-note h2{font-size:39px;letter-spacing:-1.8px;margin:7px 0}.section-head h2 em{font-style:normal;color:#c07aff}.section-head p{color:#8e8b9f}.signal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.signal-card{padding:16px}.signal-card-head{display:flex;justify-content:space-between;gap:10px}.signal-card-head span{color:#bd8aff;font-size:10px;font-weight:900;text-transform:uppercase}.signal-card-head h3{font-size:16px;line-height:1.2;margin:6px 0}.signal-card-head>b{font-size:22px;color:#77758a}.signal-card>p{font-size:11px;color:#858296;line-height:1.5;min-height:34px}.signal-card>button{display:grid;grid-template-columns:70px 1fr;gap:8px;width:100%;padding:7px 0;border:0;border-top:1px solid var(--line);background:transparent;color:#fff;text-align:left}.signal-card img{width:70px;aspect-ratio:16/9;object-fit:cover;border-radius:6px}.signal-card strong,.signal-card small{display:block}.signal-card strong{font-size:11px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.signal-card small{color:#77758a;font-size:8px;margin-top:3px}.empty{color:#666477;font-size:11px}.analytics{max-width:1320px;margin:0 auto 55px;padding:28px 42px;display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center}.analytics p,.source-note p{color:#9290a2;line-height:1.6}.analytics-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.analytics-grid div{padding:16px;border:1px solid var(--line);border-radius:14px}.analytics-grid b,.analytics-grid span{display:block}.analytics-grid b{font-size:25px}.analytics-grid span{color:#77758a;font-size:10px;margin-top:4px}.source-note{max-width:1320px;margin:0 auto 35px;padding:28px 42px;display:grid;grid-template-columns:1fr 1fr;gap:50px}footer{max-width:1320px;margin:auto;border-top:1px solid var(--line);padding:22px 42px 45px;display:flex;justify-content:space-between;gap:20px;color:#77758a;font-size:11px}footer nav{display:flex;gap:16px}footer a{color:#aaa8bd;text-decoration:none}@media(max-width:1050px){.hero{grid-template-columns:1fr}.filter-row{grid-template-columns:repeat(2,1fr)}.watch-layout{grid-template-columns:1fr}.signal-grid{grid-template-columns:repeat(2,1fr)}.analytics,.source-note{grid-template-columns:1fr}}@media(max-width:700px){.top{padding:0 18px}.top nav{display:none}.back{display:none}.hero{padding:55px 18px 35px}.hero h1{letter-spacing:-2px}.controls,.watch-layout,.signal-section{padding-left:18px;padding-right:18px}.filter-row{grid-template-columns:1fr}.live-strip{margin-left:18px;margin-right:18px;flex-wrap:wrap}.live-strip .fetched{margin-left:0}.why-grid{grid-template-columns:repeat(2,1fr)}.signal-grid{grid-template-columns:1fr}.analytics,.source-note{margin-left:18px;margin-right:18px;padding:22px}.analytics-grid{grid-template-columns:1fr 1fr}footer{padding-left:18px;padding-right:18px;flex-direction:column}}
`;
