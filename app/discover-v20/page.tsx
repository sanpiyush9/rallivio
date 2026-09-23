"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string; title: string; channel_title?: string; thumbnail?: string; url: string;
  topic?: string | null; region?: string | null; published_at?: string; views?: number;
  likes?: number; comments?: number; velocity?: number; metadata?: Record<string, unknown>;
};

type Feed = { ok: boolean; timeframe: string; items?: Item[]; metrics?: Record<string, number>; refreshedAt?: string | null; state?: string };
const WINDOWS = ["15m", "1h", "1d", "1w", "1m"] as const;

function compact(n: number) { return n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : n.toLocaleString(); }
function age(iso?: string) { if (!iso) return "—"; const h = Math.max(0, (Date.now()-Date.parse(iso))/36e5); return h < 1 ? "now" : h < 24 ? `${Math.floor(h)}h` : `${Math.floor(h/24)}d`; }
function promoted(item: Item) { return Boolean(item.metadata?.promoted); }
function signal(item: Item) { return String(item.metadata?.signal ?? "Trending"); }

export default function DiscoverV20() {
  const [timeframe, setTimeframe] = useState<(typeof WINDOWS)[number]>("15m");
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Item | null>(null);
  const [tab, setTab] = useState("All");
  const [lens, setLens] = useState("");

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const responses = await Promise.all(WINDOWS.map(async (window) => {
          const r = await fetch(`/api/discovery?timeframe=${window}&limit=60`, { cache: "no-store" });
          return [window, await r.json()] as const;
        }));
        if (!dead) setFeeds(Object.fromEntries(responses));
      } finally { if (!dead) setLoading(false); }
    }
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { dead = true; window.clearInterval(timer); };
  }, []);

  const feed = feeds[timeframe];
  const items = feed?.items ?? [];
  const topics = useMemo(() => ["All", ...Array.from(new Set(items.map(x => x.topic).filter(Boolean) as string[])).slice(0, 8)], [items]);
  const visible = useMemo(() => tab === "All" ? items : items.filter(x => x.topic === tab), [items, tab]);
  const events = useMemo(() => {
    const groups = new Map<string, Item[]>();
    for (const item of visible) {
      const key = `${item.topic ?? "World"}::${(item.title ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").slice(0, 5).join(" ")}`;
      const list = groups.get(key) ?? []; list.push(item); groups.set(key, list);
    }
    return Array.from(groups.values()).sort((a,b) => (b.length + (b[0]?.velocity ?? 0)) - (a.length + (a[0]?.velocity ?? 0))).slice(0, 12);
  }, [visible]);
  const regions = useMemo(() => Array.from(new Set(items.map(x => x.region).filter(Boolean) as string[])).slice(0, 12), [items]);
  const sourceCount = new Set(items.map(x => x.metadata?.source).filter(Boolean)).size || (items.length ? 1 : 0);
  const timeframeIntegrity = WINDOWS.map(w => ({ w, count: feeds[w]?.items?.length ?? 0 }));
  const sameCounts = timeframeIntegrity.filter(x => x.count > 0).every(x => x.count === timeframeIntegrity.find(y => y.count > 0)?.count);

  return <main className="v20">
    <style jsx global>{`html,body{margin:0;background:#050817;color:#f7f7ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.v20{min-height:100vh;background:radial-gradient(circle at 50% 0%,#18245a 0,transparent 34%),radial-gradient(circle at 100% 55%,#062d45 0,transparent 28%),#050817}.shell{max-width:1480px;margin:auto;padding:24px 34px 70px}.top{height:64px;display:flex;align-items:center;gap:28px;border-bottom:1px solid #ffffff16}.logo{font-size:26px;font-weight:900;letter-spacing:-1px}.logo b{color:#9d62ff}.nav{display:flex;gap:22px;flex:1}.nav button{border:0;background:none;color:#aeb3c9;padding:10px 0;font-weight:650}.nav button:first-child{color:#fff}.live{font-size:11px;color:#5ff0b1;border:1px solid #5ff0b133;border-radius:999px;padding:8px 12px}.pulse{display:flex;gap:14px;margin:26px 0 18px}.metric{flex:1;min-width:130px;padding:17px;border:1px solid #ffffff12;border-radius:18px;background:#0c1024c9;box-shadow:0 18px 50px #0003}.metric small{display:block;color:#7f879f;font-size:10px;text-transform:uppercase;letter-spacing:1.2px}.metric strong{display:block;font-size:24px;margin-top:7px}.hero{display:grid;grid-template-columns:1.35fr .65fr;gap:18px}.panel{border:1px solid #ffffff14;background:linear-gradient(145deg,#0d1530e8,#090d20e8);border-radius:24px;box-shadow:0 30px 90px #0005}.world{min-height:390px;padding:28px;position:relative;overflow:hidden}.world:before{content:"";position:absolute;width:520px;height:520px;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 35% 30%,#4aa6ff66,#152c6555 42%,#081020 72%);box-shadow:0 0 100px #2a82ff33;animation:float 8s ease-in-out infinite}.world:after{content:"";position:absolute;inset:18%;border:1px solid #57b9ff25;border-radius:50%;transform:rotate(22deg);box-shadow:0 0 0 45px #57b9ff05,0 0 0 90px #57b9ff04}.world>*{position:relative;z-index:1}.eyebrow{font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#6d8eb5}.world h1{font-size:42px;line-height:1.02;max-width:560px;margin:12px 0}.world p{color:#9da6bd;max-width:560px}.regions{display:flex;gap:7px;flex-wrap:wrap;margin-top:20px}.chip{padding:6px 9px;border:1px solid #ffffff15;border-radius:999px;color:#b9c2d9;font-size:10px;background:#ffffff06}.side{padding:24px}.side h2,.section h2{margin:0;font-size:17px}.timeline{margin-top:20px}.tick{display:grid;grid-template-columns:54px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid #ffffff0b}.tick time{color:#65708a;font-size:10px}.tick b{font-size:12px}.tick span{display:block;color:#7e879d;font-size:10px;margin-top:4px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0}.controls button{border:1px solid #ffffff16;background:#0d1228;color:#aeb6cd;padding:9px 13px;border-radius:999px;font-size:11px}.controls button.active{background:linear-gradient(135deg,#7040ff,#b255ff);color:#fff;border-color:#a565ff66}.section{margin-top:20px;padding:24px}.sectionHead{display:flex;justify-content:space-between;align-items:center;gap:15px}.events{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}.event{min-height:235px;border:1px solid #ffffff12;border-radius:18px;background:#0a0f23;overflow:hidden;cursor:pointer;transition:.2s}.event:hover{transform:translateY(-3px);border-color:#7e5cff66;box-shadow:0 20px 50px #0005}.thumb{height:120px;background:#10182d;position:relative}.thumb img{width:100%;height:100%;object-fit:cover;opacity:.8}.badge{position:absolute;left:10px;top:10px;padding:5px 8px;border-radius:999px;background:#050817dd;color:#67f0b2;font-size:9px}.eventBody{padding:13px}.eventBody h3{margin:0;font-size:13px;line-height:1.35}.meta{display:flex;justify-content:space-between;gap:10px;color:#737d95;font-size:9px;margin-top:10px}.campaign{color:#ffbd69}.integrity{margin-top:12px;padding:10px 12px;border-radius:12px;background:#f3a63b12;border:1px solid #f3a63b25;color:#e8c48e;font-size:10px}.integrity.ok{background:#5ff0b10c;border-color:#5ff0b122;color:#80ddb1}.lens{display:flex;gap:10px;margin-top:16px}.lens input{flex:1;min-width:0;background:#050817;border:1px solid #ffffff18;border-radius:12px;color:#fff;padding:12px 14px;outline:0}.lens button{border:0;border-radius:12px;padding:0 18px;background:#8b55ff;color:#fff;font-weight:750}.modal{position:fixed;inset:0;background:#02030aaa;backdrop-filter:blur(14px);display:grid;place-items:center;padding:25px;z-index:100}.detail{max-width:760px;width:100%;max-height:88vh;overflow:auto;padding:28px;border:1px solid #ffffff1b;border-radius:24px;background:#0b1024}.close{float:right;border:1px solid #ffffff18;background:#ffffff08;color:#fff;border-radius:50%;width:34px;height:34px}.detail h2{font-size:28px;max-width:650px}.dna{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:20px 0}.dna div{padding:12px;background:#ffffff05;border:1px solid #ffffff0d;border-radius:12px}.dna small{display:block;color:#6f7890;font-size:9px}.dna b{display:block;margin-top:5px;font-size:12px}@keyframes float{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-52%) scale(1.025)}}@media(max-width:1050px){.hero{grid-template-columns:1fr}.events{grid-template-columns:repeat(2,minmax(0,1fr))}.nav{display:none}}@media(max-width:650px){.shell{padding:15px}.pulse{overflow:auto}.events{grid-template-columns:1fr}.world h1{font-size:32px}.dna{grid-template-columns:repeat(2,1fr)}.top{gap:14px}.live{margin-left:auto}}`}</style>

    <div className="shell">
      <header className="top"><div className="logo">RALLI<span>VIO</span></div><nav className="nav"><button>Discover</button><button>Creator</button><button>Brands & Opportunities</button><button>Community</button><button>About</button></nav><span className="live">● LIVE INTELLIGENCE</span></header>

      <section className="pulse">
        <div className="metric"><small>Observed signals</small><strong>{loading ? "—" : compact(items.length)}</strong></div>
        <div className="metric"><small>Detected events</small><strong>{loading ? "—" : compact(events.length)}</strong></div>
        <div className="metric"><small>Regions</small><strong>{loading ? "—" : regions.length}</strong></div>
        <div className="metric"><small>Sources</small><strong>{loading ? "—" : sourceCount}</strong></div>
        <div className="metric"><small>Window</small><strong>{timeframe}</strong></div>
      </section>

      <section className="hero">
        <div className="panel world"><div className="eyebrow">RALLIVIO WORLD PULSE</div><h1>See what is moving across the connected world.</h1><p>Signals are grouped into emerging events so users can explore what is happening, why it matters, and how attention is spreading.</p><div className="regions">{regions.map(r=><span className="chip" key={r}>{r}</span>)}</div></div>
        <aside className="panel side"><div className="eyebrow">TREND REPLAY</div><h2>How this window is changing</h2><div className="timeline">{items.slice(0,5).map((x,i)=><div className="tick" key={x.id}><time>{age(x.published_at)}</time><div><b>{x.topic ?? "World"}</b><span>{signal(x)} · {x.channel_title ?? "source"}</span></div></div>)}</div></aside>
      </section>

      <section className="panel section">
        <div className="sectionHead"><div><div className="eyebrow">LIVE DISCOVERY</div><h2>Events, not isolated feeds</h2></div><div className="controls">{WINDOWS.map(w=><button key={w} className={timeframe===w?"active":""} onClick={()=>setTimeframe(w)}>{w}</button>)}</div></div>
        {!loading && sameCounts && timeframeIntegrity.filter(x=>x.count>0).length>1 && <div className="integrity">Timeframe integrity check: these windows currently return the same row count. The selector is wired, but the underlying observation/RPC separation still needs verification before we claim distinct historical datasets.</div>}
        {!loading && !sameCounts && <div className="integrity ok">Timeframe integrity check: row counts differ across available windows. Continue validating timestamp boundaries and observation IDs.</div>}
        <div className="controls">{topics.map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</div>
        <div className="events">{events.map((group,i)=>{const item=group[0];return <article className="event" key={`${item.id}-${i}`} onClick={()=>setSelected(item)}><div className="thumb">{item.thumbnail&&<img src={item.thumbnail} alt="" loading="lazy"/>}<span className={`badge ${promoted(item)?"campaign":""}`}>{promoted(item)?"RALLIVIO CAMPAIGN":signal(item)}</span></div><div className="eventBody"><h3>{item.title}</h3><div className="meta"><span>{item.topic ?? "World"} · {item.region ?? "Global"}</span><span>{compact(group.length)} signals</span></div><div className="meta"><span>{item.channel_title ?? "Source"}</span><span>{compact(item.views ?? 0)} views</span></div></div></article>})}</div>
        {!loading && !events.length && <div className="integrity">No verified events are available for this window. RALLIVIO is showing an honest empty state rather than fabricating activity.</div>}
      </section>

      <section className="panel section"><div className="eyebrow">RALLIVIO LENS</div><h2>Analyze anything publicly reachable</h2><div className="lens"><input value={lens} onChange={e=>setLens(e.target.value)} placeholder="Paste a YouTube, article, post, website or other public URL"/><button onClick={()=>window.location.href=`/discover-v20?lens=${encodeURIComponent(lens)}`}>Analyze</button></div></section>
    </div>

    {selected && <div className="modal" onClick={()=>setSelected(null)}><article className="detail" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><div className="eyebrow">RALLIVIO EVENT</div><h2>{selected.title}</h2><p style={{color:"#9da6bd"}}>{selected.description ?? "Verified discovery signal grouped into a RALLIVIO event."}</p><div className="dna"><div><small>SIGNAL</small><b>{signal(selected)}</b></div><div><small>TOPIC</small><b>{selected.topic ?? "World"}</b></div><div><small>REGION</small><b>{selected.region ?? "Global"}</b></div><div><small>STATUS</small><b>{promoted(selected)?"Campaign":"Organic discovery"}</b></div></div><div className="eyebrow">SOURCE</div><p style={{color:"#c7ccdc"}}>{selected.channel_title ?? "Unknown source"} · {age(selected.published_at)} · {compact(selected.views ?? 0)} views</p><a href={selected.url} target="_blank" rel="noreferrer" style={{color:"#9d6bff"}}>Open original source →</a></article></div>}
  </main>;
}
