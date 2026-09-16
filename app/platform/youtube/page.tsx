"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  channel_title: string;
  published_at: string;
  thumbnail: string;
  description: string;
  views: number;
  likes?: number;
  comments?: number;
  url: string;
  embeddable: boolean;
  live_broadcast_content?: string | null;
  metadata?: { signal?: string; momentum_score?: number; subscriber_count?: number | null };
};

const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s: string) => { const h = Math.max(0, (Date.now() - new Date(s).getTime()) / 36e5); return h < 1 ? "just now" : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`; };

export default function YouTubePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/discovery", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.state || "DATA_UNAVAILABLE");
        setItems(Array.isArray(body.items) ? body.items : []);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "DATA_UNAVAILABLE");
      } finally {
        setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const ranked = useMemo(() => [...items].sort((a, b) => (b.metadata?.momentum_score || 0) - (a.metadata?.momentum_score || 0)), [items]);
  const live = ranked.filter(x => x.live_broadcast_content === "live");
  const rising = ranked.filter(x => ["Breaking Out", "Rising", "Trending", "Under the Radar"].includes(x.metadata?.signal || ""));
  const filtered = useMemo(() => {
    const base = tab === "Live" ? live : tab === "Rising" ? rising : ranked;
    const q = query.trim().toLowerCase();
    return q ? base.filter(x => `${x.title} ${x.channel_title} ${x.description}`.toLowerCase().includes(q)) : base;
  }, [query, tab, ranked, live, rising]);

  return <main className="yt">
    <style>{css}</style>
    <header className="topbar">
      <a className="brand" href="/">RALL<span>IVIO</span><small>DISCOVER · UNDERSTAND · CONNECT · GROW</small></a>
      <nav><a href="/">Discover</a><a className="active" href="/platform/youtube">YouTube</a><a href="/creators">Creators</a><a href="/brands">Brands</a></nav>
      <a className="back" href="/">← Discover</a>
    </header>

    <section className="hero">
      <div>
        <div className="source"><span className="ytmark">▶</span> YOUTUBE SOURCE</div>
        <h1>Discover what is<br /><em>moving on YouTube.</em></h1>
        <p>RALLIVIO surfaces verified YouTube observations and sends viewers back to the original creator. Content remains hosted by YouTube; RALLIVIO does not download or host copies.</p>
        <div className="actions"><a href="#feed">Explore discovery ↓</a><a className="outline" href="https://www.youtube.com" target="_blank" rel="noreferrer">Open YouTube ↗</a></div>
      </div>
      <div className="promise">
        <small>RALLIVIO × YOUTUBE</small>
        <b>Discovery layer,<br />not a content copy.</b>
        <span>Official embedded playback when available · source attribution · direct link to creator</span>
      </div>
    </section>

    <section className="feed" id="feed">
      <div className="feedHead"><div><small>VERIFIED DISCOVERY</small><h2>YouTube right now</h2><p>Signals are calculated from the verified source pool. They are observations, not promises of virality.</p></div><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search this verified pool..." /></div>
      <div className="tabs">{["All", "Rising", "Live"].map(t => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}{t === "Live" && live.length ? <b>{live.length}</b> : null}</button>)}</div>

      {loading && <div className="state">Loading verified YouTube observations…</div>}
      {!loading && error && <div className="state error"><b>Source unavailable.</b><span>{error}</span><small>RALLIVIO does not invent fallback content when the verified source is unavailable.</small></div>}
      {!loading && !error && !filtered.length && <div className="state">No verified observations match this selection.</div>}

      <div className="grid">{filtered.map(item => <article className="card" key={item.id}>
        <button className="thumb" onClick={() => setSelected(item)} aria-label={`Play ${item.title}`}><img src={item.thumbnail} alt="" /><span>▶</span>{item.live_broadcast_content === "live" && <b>LIVE</b>}</button>
        <div className="cardBody"><div className="signal">{item.metadata?.signal || "Observed"}</div><h3>{item.title}</h3><p>{item.channel_title}</p><small>{fmt(item.views)} views · {age(item.published_at)}</small><div className="links"><button onClick={() => setSelected(item)} disabled={!item.embeddable}>Watch here</button><a href={item.url} target="_blank" rel="noreferrer">YouTube ↗</a></div></div>
      </article>)}</div>
    </section>

    <section className="creatorNote"><div><small>WHY THIS EXISTS</small><h2>RALLIVIO should help creators,<br />not replace their platforms.</h2></div><p>We use platform-provided discovery data and official playback mechanisms. The original platform remains the source of the audiovisual content, and viewers can go directly to the creator. RALLIVIO's independent value is discovery intelligence, creator analysis and collaboration.</p></section>

    {selected && <div className="overlay" onClick={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)}>×</button><div className="player">{selected.embeddable ? <iframe src={`https://www.youtube.com/embed/${selected.id}?rel=0&origin=${typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : ""}`} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <div className="notEmbed">This video is not available for embedded playback.<a href={selected.url} target="_blank" rel="noreferrer">Watch it on YouTube ↗</a></div>}</div><div className="modalMeta"><span>{selected.metadata?.signal || "Verified observation"}</span><small>Source: YouTube</small></div><h2>{selected.title}</h2><p>{selected.channel_title} · {fmt(selected.views)} views</p><a className="sourceButton" href={selected.url} target="_blank" rel="noreferrer">Open original on YouTube ↗</a></section></div>}
  </main>;
}

const css = `
:root{--bg:#070814;--panel:#101225;--line:#ffffff18;--text:#f8f7ff;--muted:#aaa9c2;--purple:#9b5cff;--red:#ff0033}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}a,button,input{font:inherit}.yt{min-height:100vh;background:radial-gradient(circle at 72% 8%,#ff00331a,transparent 28%),radial-gradient(circle at 20% 0%,#7c42ff24,transparent 32%),var(--bg)}.topbar{height:72px;display:flex;align-items:center;gap:28px;padding:0 42px;border-bottom:1px solid var(--line);background:#080a19dd;backdrop-filter:blur(18px);position:sticky;top:0;z-index:20}.brand{color:#fff;text-decoration:none;font-weight:950;font-size:27px;letter-spacing:-1.5px;line-height:.8}.brand span{color:#a868ff}.brand small{display:block;font-size:6px;letter-spacing:1px;color:#9f9db5;margin-top:7px}.topbar nav{display:flex;gap:5px;flex:1}.topbar nav a,.back{color:#c9c7d9;text-decoration:none;padding:9px 14px;border-radius:999px;font-weight:700}.topbar nav a.active,.topbar nav a:hover{background:#ffffff10;color:#fff}.back{border:1px solid var(--line)}.hero{max-width:1280px;margin:auto;padding:90px 42px 65px;display:grid;grid-template-columns:1.35fr .65fr;gap:80px;align-items:end}.source{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:900;letter-spacing:1.3px;color:#ff5b7b}.ytmark{display:grid;place-items:center;width:24px;height:18px;border-radius:5px;background:#ff0033;color:#fff;font-size:10px}.hero h1{font-size:clamp(52px,6vw,86px);line-height:.93;letter-spacing:-4px;margin:18px 0}.hero h1 em{font-style:normal;background:linear-gradient(90deg,#fff,#bd6cff);-webkit-background-clip:text;color:transparent}.hero p{max-width:750px;color:#c3c1d3;font-size:18px;line-height:1.65}.actions{display:flex;gap:10px;margin-top:28px}.actions a,.sourceButton{display:inline-flex;padding:12px 17px;border-radius:999px;background:linear-gradient(135deg,#7447ff,#b25fff);color:#fff;text-decoration:none;font-weight:800}.actions .outline{background:transparent;border:1px solid var(--line)}.promise{padding:28px;border:1px solid var(--line);border-radius:24px;background:#ffffff08;display:flex;flex-direction:column;gap:12px}.promise small,.feedHead small,.creatorNote small{color:#9e98bb;font-size:10px;letter-spacing:1.5px;font-weight:900}.promise b{font-size:28px;line-height:1.05}.promise span{color:var(--muted);line-height:1.5}.feed{max-width:1280px;margin:auto;padding:25px 42px 80px}.feedHead{display:flex;justify-content:space-between;gap:30px;align-items:end}.feedHead h2{font-size:40px;letter-spacing:-1.5px;margin:8px 0}.feedHead p{color:var(--muted);margin:0;max-width:680px}.feedHead input{width:300px;border:1px solid var(--line);border-radius:999px;background:#ffffff08;color:#fff;padding:12px 16px;outline:0}.tabs{display:flex;gap:8px;margin:28px 0}.tabs button{border:1px solid var(--line);background:#ffffff07;color:#bdbacd;border-radius:999px;padding:9px 15px;font-weight:800}.tabs button.active{background:#fff;color:#111}.tabs b{margin-left:7px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#0d1020;border:1px solid var(--line);border-radius:20px;overflow:hidden}.thumb{width:100%;aspect-ratio:16/9;border:0;padding:0;background:#05060d;position:relative;display:block}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.thumb span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#000b;color:#fff;font-size:18px}.thumb b{position:absolute;top:10px;left:10px;background:#ff0033;border-radius:5px;padding:4px 7px;font-size:10px}.cardBody{padding:16px}.signal{display:inline-block;color:#bd8aff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px}.card h3{font-size:18px;line-height:1.25;margin:8px 0}.card p{margin:0 0 7px;color:#c7c4d7;font-weight:700}.card small{color:#8f8da4}.links{display:flex;gap:8px;margin-top:15px}.links button,.links a{border:1px solid var(--line);border-radius:999px;background:#ffffff08;color:#fff;text-decoration:none;padding:8px 11px;font-size:12px;font-weight:800}.links button:disabled{opacity:.45;cursor:not-allowed}.state{margin:30px 0;padding:38px;border:1px dashed var(--line);border-radius:20px;color:#aaa8bc;text-align:center}.state.error{display:flex;flex-direction:column;gap:8px}.state.error b{color:#fff}.creatorNote{max-width:1280px;margin:0 auto 80px;padding:32px 42px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:70px}.creatorNote h2{font-size:34px;line-height:1.05;margin:8px 0}.creatorNote p{color:#aaa8bc;line-height:1.7}.overlay{position:fixed;inset:0;background:#000b;backdrop-filter:blur(12px);z-index:50;display:grid;place-items:center;padding:25px}.modal{width:min(940px,100%);background:#0e1020;border:1px solid var(--line);border-radius:22px;padding:18px;position:relative;box-shadow:0 30px 100px #000}.close{position:absolute;right:14px;top:12px;z-index:2;border:0;background:#0009;color:#fff;width:38px;height:38px;border-radius:50%;font-size:25px}.player{aspect-ratio:16/9;background:#05060a;border-radius:14px;overflow:hidden}.player iframe{width:100%;height:100%;border:0}.notEmbed{height:100%;display:grid;place-items:center;gap:12px;color:#aaa8bc;text-align:center}.notEmbed a{color:#fff}.modalMeta{display:flex;gap:12px;margin-top:18px}.modalMeta span{color:#bd8aff;font-size:11px;font-weight:900;text-transform:uppercase}.modalMeta small{color:#88869a}.modal h2{font-size:25px;margin:8px 0}.modal p{color:#aaa8bc}.sourceButton{margin-top:5px}@media(max-width:900px){.hero{grid-template-columns:1fr;padding-top:60px}.grid{grid-template-columns:repeat(2,1fr)}.creatorNote{grid-template-columns:1fr;gap:20px}.topbar{padding:0 18px}.topbar nav{display:none}.feed{padding-left:18px;padding-right:18px}.feedHead{align-items:stretch;flex-direction:column}.feedHead input{width:100%}}@media(max-width:620px){.grid{grid-template-columns:1fr}.hero{padding:50px 18px}.hero h1{letter-spacing:-2px}.feed{padding-bottom:50px}.creatorNote{padding:25px 18px}.back{display:none}}
`;
