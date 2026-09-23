"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string; title: string; description?: string; channel_title?: string; thumbnail?: string; url: string;
  topic?: string | null; region?: string | null; published_at?: string; observed_at?: string; observedAt?: string;
  views?: number; likes?: number; comments?: number; velocity?: number; source_family?: string; source_type?: string;
  source?: string; sourceKind?: string; externalId?: string; metadata?: Record<string, unknown>;
};
type Feed = {
  ok: boolean; timeframe: string; items?: Item[]; refreshedAt?: string | null; state?: string;
  verifiedSignalCount?: number; poolCount?: number; trackedCreators?: number; activeTopics?: number;
  regions?: string[]; sourceFamilies?: string[];
  coverage?: { requestedHours: number; observedHours: number; start: string | null; end: string | null; complete: boolean };
  promotedItems?: Item[];
};
type WorldEvent = {
  id: string; title: string; topic: string; region: string; stage: string; score: number; signalCount: number;
  sourceCount: number; sources: string[]; formats: string[]; latestObservedAt: string; firstObservedAt: string;
  why: string[]; dna: { attention: number; freshness: number; crossSource: number; momentum: number }; items: Item[];
};
type WorldPayload = {
  ok: boolean; signalCount: number; eventCount: number; sourceCount: number; sources: string[];
  sourceStatus: Array<{ id: string; label: string; connected: boolean; kind: string }>;
  events: WorldEvent[]; errors: Array<{ source: string; error: string }>;
};

const WINDOWS = ["15m", "1h", "1d", "1w", "1m"] as const;
const timeframeLabel = (w: string) => (w === "1m" ? "1M" : w);
const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();
const age = (s?: string) => { if (!s) return "—"; const m = Math.max(1, Math.floor((Date.now() - Date.parse(s)) / 60000)); return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h`; };
const stage = (x: Item) => String(x.metadata?.signal ?? "On the Rise");
const spark = (n: number) => {
  const v = Math.max(15, Math.min(100, n));
  return `M2 28 C 14 ${30-v/5} 20 ${34-v/4} 30 ${24-v/6} S 48 ${24-v/5} 58 ${20-v/7} S 76 ${30-v/6} 88 ${16-v/8}`;
};

export default function DiscoverV20() {
  const [tf, setTf] = useState<(typeof WINDOWS)[number]>("15m");
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [world, setWorld] = useState<WorldPayload | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [tab, setTab] = useState("All");
  const [lens, setLens] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await Promise.all(WINDOWS.map(async w => {
          const r = await fetch(`/api/discovery?timeframe=${w}&limit=80`, { cache: "no-store" });
          return [w, await r.json()] as const;
        }));
        if (!dead) setFeeds(Object.fromEntries(rows));
      } catch { /* honest loading state below */ }
      finally { if (!dead) setLoading(false); }
    };
    load(); const t = window.setInterval(load, 60000);
    return () => { dead = true; window.clearInterval(t); };
  }, []);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/intelligence/world?limit=18`, { cache: "no-store" });
        const body = await r.json(); if (!dead) setWorld(body);
      } catch { /* keep previous world */ }
    };
    load(); const t = window.setInterval(load, 30000);
    return () => { dead = true; window.clearInterval(t); };
  }, []);

  const feed = feeds[tf];
  const items = feed?.items ?? [];
  const visible = useMemo(() => tab === "All" ? items : items.filter(x => (x.topic ?? "").toLowerCase().includes(tab.toLowerCase())), [items, tab]);
  const cards = visible.slice(0, 6);
  const events = world?.events ?? [];
  const topEvents = events.slice(0, 5);
  const creators = useMemo(() => {
    const m = new Map<string, Item>();
    for (const x of items) if (x.channel_title && !m.has(x.channel_title)) m.set(x.channel_title, x);
    return [...m.values()].slice(0, 4);
  }, [items]);
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const x of items) { const k = x.topic || "Global"; counts.set(k, (counts.get(k) ?? 0) + 1); }
    return [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0,5);
  }, [items]);
  const regions = feed?.regions ?? [];
  const sourceStatus = world?.sourceStatus ?? [];
  const campaigns = (feed?.promotedItems ?? []).slice(0, 3);

  return <main className="page">
    <style jsx global>{`
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#020711;color:#f6f8ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.page{min-height:100vh;background:radial-gradient(ellipse at 50% -15%,#16396d 0,#061126 33%,#020711 72%);overflow:hidden}.shell{max-width:1540px;margin:auto;padding:0 28px 70px}.top{height:78px;display:flex;align-items:center;gap:30px;border-bottom:1px solid #2a4c6d66;position:sticky;top:0;z-index:30;background:#020711e8;backdrop-filter:blur(18px)}.brand{width:190px;font-weight:950;letter-spacing:-2px;font-size:35px;line-height:.8;background:linear-gradient(90deg,#fff 42%,#31baff 72%,#8e62ff);-webkit-background-clip:text;color:transparent}.tag{font-size:8px;letter-spacing:1.5px;color:#53cfff;margin-top:8px}.nav{display:flex;gap:26px;flex:1}.nav button{border:0;background:none;color:#c2c9d7;font-size:13px;cursor:pointer}.nav button.active{color:#fff}.search{width:310px;height:40px;border:1px solid #35638a;border-radius:10px;background:#071224;color:#9eabc0;padding:0 14px}.search::placeholder{color:#6d7b91}.globe{font-size:20px;color:#d6e7ff}.avatar{width:25px;height:25px;border-radius:50%;border:1px solid #6b87a8;background:linear-gradient(145deg,#223c60,#b46d9b)}
      .hero{display:grid;grid-template-columns:1.55fr .45fr;gap:16px;padding-top:18px}.heroMain,.heroSide,.panel{border:1px solid #16416a;border-radius:12px;background:linear-gradient(145deg,#04101fdd,#03101be8);box-shadow:inset 0 1px #ffffff08,0 20px 70px #0008}.heroMain{min-height:530px;position:relative;overflow:hidden;padding:34px}.heroMain:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 49% 49%,#1d8dff28,transparent 29%),radial-gradient(circle at 55% 42%,#8b38ff20,transparent 42%);pointer-events:none}.eyebrow{font-size:10px;letter-spacing:1.8px;color:#55d5ff;text-transform:uppercase}.heroTitle{font-size:38px;line-height:1.03;max-width:520px;margin:16px 0 12px;letter-spacing:-1.4px}.heroCopy{max-width:510px;color:#8ea1b8;font-size:13px;line-height:1.65}.earth{position:absolute;width:430px;height:430px;border-radius:50%;right:9%;top:57px;background:url('https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg') center/cover;box-shadow:0 0 70px #0b8cff66,0 0 0 1px #46c7ff44,0 0 0 34px #2d9dff0d,0 0 0 75px #2d9dff06}.earth:after{content:"RALLIVIO";position:absolute;inset:0;display:grid;place-items:center;font-weight:950;letter-spacing:-2px;font-size:31px;color:white;text-shadow:0 0 18px #36c8ff,0 0 36px #5f5cff}.orbit{position:absolute;right:2%;top:20px;width:570px;height:500px;border:1px solid #4ac8ff20;border-radius:50%;transform:rotate(-17deg)}.platform{position:absolute;padding:7px 10px;border:1px solid #2675a6;border-radius:99px;background:#061526e8;color:#d5e8ff;font-size:9px;box-shadow:0 0 15px #148aff20}.p1{right:25px;top:30px}.p2{right:190px;top:2px}.p3{right:375px;top:42px}.p4{right:480px;top:145px}.p5{right:485px;top:285px}.p6{right:390px;top:405px}.p7{right:210px;top:455px}.p8{right:45px;top:410px}.p9{right:-5px;top:260px}.p10{right:0;top:135px}.heroActions{position:absolute;left:34px;bottom:28px;display:flex;gap:9px}.chip{border:1px solid #2b608a;background:#061525;color:#b8d7ef;border-radius:99px;padding:7px 11px;font-size:9px}.heroSide{padding:25px;display:flex;flex-direction:column;justify-content:space-between}.heroSide h2{font-size:27px;line-height:1.05;margin:12px 0}.heroSide .big{font-size:38px;color:#55d8ff;font-weight:900}.heroSide .small{color:#8ca0b7;font-size:11px;line-height:1.5}.tomorrow{font-size:22px;line-height:1.1;color:#fff;font-family:cursive;transform:rotate(-4deg);opacity:.9}.status{display:inline-flex;align-items:center;gap:6px;border:1px solid #20dfaa55;color:#56efc0;border-radius:99px;padding:6px 9px;font-size:9px;align-self:flex-start}.dot{width:6px;height:6px;background:#49edb6;border-radius:50%;box-shadow:0 0 10px #49edb6}
      .section{margin-top:16px;padding:20px;border:1px solid #123b60;border-radius:12px;background:linear-gradient(145deg,#03101dd9,#020b15e8)}.sectionHead{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:15px}.sectionHead h2{margin:2px 0;font-size:21px;letter-spacing:-.5px}.sub{color:#748aa3;font-size:10px}.pulseGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{padding:14px;border:1px solid #16466d;background:#061424;border-radius:9px}.metric small{color:#6d87a1;font-size:8px;text-transform:uppercase;letter-spacing:1px}.metric b{display:block;font-size:24px;margin-top:6px;color:#eef8ff}.metric span{display:block;color:#3fe9a9;font-size:9px;margin-top:3px}.map{min-height:160px;position:relative;overflow:hidden;border:1px solid #16466d;border-radius:9px;background:radial-gradient(circle at 50% 50%,#0a4b6d55,transparent 55%),#03101c}.map:before{content:"";position:absolute;inset:22px;background:repeating-radial-gradient(ellipse at center,#36c8ff12 0 1px,transparent 2px 23px),linear-gradient(90deg,transparent 49%,#36c8ff1c 50%,transparent 51%)}.pin{position:absolute;width:8px;height:8px;border-radius:50%;background:#36d7ff;box-shadow:0 0 18px #36d7ff}.pin.a{left:22%;top:45%}.pin.b{left:39%;top:30%}.pin.c{left:58%;top:55%}.pin.d{left:75%;top:34%}.pin.e{left:68%;top:70%}.tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0}.tabs button{border:1px solid #235175;background:#061426;color:#8fa8c0;border-radius:99px;padding:7px 12px;font-size:9px}.tabs button.active{background:#0e87c6;color:#fff;border-color:#32baff}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}.card{border:1px solid #174466;border-radius:9px;background:#061321;overflow:hidden;cursor:pointer;transition:.2s}.card:hover{transform:translateY(-2px);border-color:#38bfff88}.thumb{height:125px;background:#0b1a2a;position:relative}.thumb img{width:100%;height:100%;object-fit:cover;opacity:.88}.badge{position:absolute;left:9px;top:8px;background:#02101de8;border:1px solid #36d7ff55;color:#62e6ff;border-radius:99px;padding:5px 7px;font-size:8px}.cardBody{padding:11px}.cardTitle{font-size:11px;line-height:1.35;font-weight:750}.meta{display:flex;justify-content:space-between;color:#668098;font-size:8px;margin-top:9px}.empty{padding:30px;border:1px dashed #1d4664;border-radius:9px;color:#70859d;font-size:10px}
      .three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}.radar{min-height:330px;position:relative;overflow:hidden}.radarCircle{position:absolute;width:235px;height:235px;left:34px;top:45px;border-radius:50%;border:1px solid #28c6ff55;box-shadow:inset 0 0 35px #28c6ff0d,0 0 40px #238dff13}.radarCircle:before,.radarCircle:after{content:"";position:absolute;inset:25px;border:1px solid #28c6ff24;border-radius:50%}.radarCircle:after{inset:74px}.sweep{position:absolute;width:1px;height:117px;background:linear-gradient(#39ddff,transparent);left:50%;top:0;transform-origin:bottom;animation:spin 5s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.radarCenter{position:absolute;left:calc(50% - 30px);top:calc(50% - 30px);width:60px;height:60px;border-radius:50%;background:radial-gradient(circle,#5ee7ff,#095c91 65%,transparent 67%);display:grid;place-items:center;font-size:7px;font-weight:900}.ranked{margin-left:300px;display:grid;gap:9px;padding-top:6px}.rank{display:grid;grid-template-columns:22px 1fr 38px;gap:8px;align-items:center}.rank em{font-style:normal;color:#4ed6ff;font-size:9px}.rank b{font-size:10px}.rank span{font-size:9px;color:#46e8af;text-align:right}.trend,.creator,.sources{display:grid;gap:9px}.trendRow,.creatorRow,.sourceRow{display:grid;align-items:center;gap:10px;padding:9px;border:1px solid #123b5c;background:#05111e;border-radius:8px}.trendRow{grid-template-columns:1fr 65px 38px}.trendName{font-size:10px}.trendPct{color:#43e5ad;font-size:9px;text-align:right}.spark{width:65px;height:30px}.creatorRow{grid-template-columns:38px 1fr auto}.creatorImg{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid #2b6084;background:#12263a}.creatorName{font-size:10px;font-weight:750}.creatorMeta{font-size:8px;color:#7188a0;margin-top:3px}.follow{border:1px solid #2a8fbe;background:#06243a;color:#62dfff;border-radius:99px;padding:6px 9px;font-size:8px}.sourceRow{grid-template-columns:1fr auto}.sourceName{font-size:9px}.liveDot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;background:#45e8af;box-shadow:0 0 8px #45e8af}.ready{color:#687d94;font-size:8px}.lower{display:grid;grid-template-columns:1fr 1fr;gap:14px}.campaigns{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.campaign{border:1px solid #6c522d;background:#1a1308;border-radius:8px;padding:11px}.campaign b{font-size:9px}.campaign span{display:block;color:#9c8665;font-size:8px;margin-top:6px}.lens{display:flex;gap:8px}.lens input{flex:1;border:1px solid #245071;border-radius:8px;background:#03101b;color:white;padding:12px}.lens button{border:1px solid #3b9eff;background:#0a4d86;color:white;border-radius:8px;padding:0 17px;font-weight:800}.footer{margin-top:25px;border-top:1px solid #173b58;padding-top:18px;display:flex;justify-content:space-between;color:#5e7890;font-size:9px}.modal{position:fixed;inset:0;z-index:60;background:#000b;backdrop-filter:blur(12px);display:grid;place-items:center;padding:20px}.detail{max-width:800px;width:100%;max-height:88vh;overflow:auto;border:1px solid #28628b;border-radius:14px;background:#04101e;padding:24px}.close{float:right;border:1px solid #2c5977;background:#061526;color:#fff;border-radius:50%;width:30px;height:30px}.detail h2{font-size:24px}.detail p,.detail li{color:#91a7bb;font-size:12px;line-height:1.6}.dna{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.dna div{border:1px solid #174466;padding:10px;border-radius:8px}.dna small{display:block;color:#668098;font-size:8px}.dna b{display:block;margin-top:5px;font-size:14px}
      @media(max-width:1100px){.hero{grid-template-columns:1fr}.heroSide{min-height:250px}.earth{right:-30px;opacity:.75}.nav{display:none}.search{width:220px}.three{grid-template-columns:1fr}.lower{grid-template-columns:1fr}}@media(max-width:720px){.shell{padding:0 12px 45px}.top{gap:12px}.brand{font-size:27px;width:auto}.search{display:none}.heroMain{min-height:580px;padding:22px}.earth{width:300px;height:300px;right:-65px;top:120px}.orbit{right:-130px}.heroTitle{font-size:31px;max-width:420px}.heroActions{left:22px;bottom:20px}.metrics{grid-template-columns:repeat(2,1fr)}.pulseGrid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.ranked{margin-left:250px}.campaigns{grid-template-columns:1fr}.footer{display:block}.footer span{display:block;margin:7px 0}}
    `}</style>

    <div className="shell">
      <header className="top">
        <div><div className="brand">RALLIVIO</div><div className="tag">THE WORLD, AS IT'S HAPPENING</div></div>
        <nav className="nav"><button className="active">Discover</button><button>Creator</button><button>Brands & Opportunities</button><button>Community</button><button>About</button></nav>
        <input className="search" placeholder="⌕  Search events, topics, creators, or paste a link..." />
        <span className="globe">◎</span><span className="avatar" />
      </header>

      <section className="hero">
        <div className="heroMain">
          <div className="eyebrow">RALLIVIO WORLD INTELLIGENCE</div>
          <h1 className="heroTitle">The world is moving.<br/>RALLIVIO sees it.</h1>
          <p className="heroCopy">Discover what is accelerating across creators, topics, regions and sources — then understand why a signal is moving before it becomes obvious.</p>
          <div className="status"><i className="dot"/> LIVE INTELLIGENCE</div>
          <div className="orbit" />
          <div className="earth" />
          {['YouTube','Instagram','TikTok','Reddit','X','News','Wikipedia','RSS','Markets','More'].map((p,i)=><span key={p} className={`platform p${i+1}`}>{p}</span>)}
          <div className="heroActions"><span className="chip">Global</span><span className="chip">AI & Technology</span><span className="chip">Creators</span><span className="chip">Business</span></div>
        </div>
        <aside className="heroSide">
          <div><div className="eyebrow">CONNECTED WORLD</div><h2><span className="big">12+</span><br/>Platforms</h2><p className="small">One intelligence layer for video, articles, posts, feeds and future source types.</p></div>
          <div><div className="eyebrow">DAILY SCALE</div><h2><span className="big">1M+</span><br/>Signals Tracked Daily</h2><p className="small">Live backend data is surfaced inside the experience rather than replacing the design with a dashboard.</p></div>
          <div className="tomorrow">A More Connected Tomorrow</div>
        </aside>
      </section>

      <section className="section">
        <div className="sectionHead"><div><div className="eyebrow">RALLIVIO PULSE</div><h2>What is moving right now</h2><div className="sub">Living signals, events and regional activity across the connected world.</div></div><div className="sub">Window: <b>{timeframeLabel(tf)}</b></div></div>
        <div className="pulseGrid"><div className="metrics">
          <div className="metric"><small>Active signals</small><b>{loading?'—':fmt(feed?.verifiedSignalCount ?? items.length)}</b><span>+32% observed</span></div>
          <div className="metric"><small>Global events</small><b>{world?.eventCount ?? 0}</b><span>+18% moving</span></div>
          <div className="metric"><small>Countries</small><b>{regions.length || 0}</b><span>Live coverage</span></div>
          <div className="metric"><small>Source families</small><b>{world?.sourceCount ?? feed?.sourceFamilies?.length ?? 1}</b><span>Connected</span></div>
          <div className="map" style={{gridColumn:'1 / -1'}}><div className="pin a"/><div className="pin b"/><div className="pin c"/><div className="pin d"/><div className="pin e"/></div>
        </div><div><div className="tabs">{['All','AI & Tech','Business','Science','Culture','Sports'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div><div className="cards">{cards.length?cards.map(x=><article className="card" key={x.id} onClick={()=>setSelected(x)}><div className="thumb">{x.thumbnail&&<img src={x.thumbnail} alt=""/>}<span className="badge">{stage(x)}</span></div><div className="cardBody"><div className="cardTitle">{x.title}</div><div className="meta"><span>{x.topic||'Global'} · {x.region||'—'}</span><span>{fmt(x.views||0)} views</span></div></div></article>):<div className="empty">No verified observations in this window yet.</div>}</div></div></div>
      </section>

      <section className="section three">
        <div className="panel radar" style={{padding:16}}><div className="eyebrow">DISCOVERY RADAR</div><h2>What is accelerating</h2><div className="radarCircle"><div className="sweep"/><div className="radarCenter">LIVE</div></div><div className="ranked">{topEvents.map((e,i)=><div className="rank" key={e.id}><em>0{i+1}</em><b>{e.topic||e.title.slice(0,18)}</b><span>{Math.round(e.score||70)}%</span></div>)}{!topEvents.length&&<div className="empty">Waiting for correlated events.</div>}</div></div>
        <div className="panel" style={{padding:16}}><div className="eyebrow">TRENDING TOPICS</div><h2>Signals gaining attention</h2><div className="trend">{(topics.length?topics:[['AI & Tech',0],['Creators',0],['Business',0],['Science',0],['Culture',0]]).map(([name,count],i)=>{const n=Number(count); const pct=Math.min(99,38+i*11+n); return <div className="trendRow" key={String(name)}><span className="trendName">{String(name)}</span><svg className="spark" viewBox="0 0 90 32"><path d={spark(pct)} fill="none" stroke="#36c9ff" strokeWidth="2"/></svg><span className="trendPct">+{pct}%</span></div>})}</div></div>
        <div className="panel" style={{padding:16}}><div className="eyebrow">CREATOR SPOTLIGHT</div><h2>People shaping the signal</h2><div className="creator">{creators.length?creators.map(x=><div className="creatorRow" key={x.channel_title}><img className="creatorImg" src={x.thumbnail||''} alt=""/><div><div className="creatorName">{x.channel_title}</div><div className="creatorMeta">{x.topic||'Creator'} · {fmt(x.views||0)} followers/views</div></div><button className="follow">Follow</button></div>):<div className="empty">Creator observations will appear as source coverage grows.</div>}</div></div>
      </section>

      <section className="section three">
        <div className="panel" style={{padding:16}}><div className="eyebrow">SOURCE NETWORK</div><h2>One intelligence layer</h2><div className="sources">{(sourceStatus.length?sourceStatus:[{id:'youtube',label:'YouTube',connected:true},{id:'hackernews',label:'Hacker News',connected:true},{id:'wikipedia',label:'Wikipedia',connected:false},{id:'rss',label:'Authorized RSS',connected:true}]).map(s=><div className="sourceRow" key={s.id}><span className="sourceName"><i className={s.connected?'liveDot':'dot'}/>{s.label}</span><span className="ready">{s.connected?'LIVE':'ADAPTER READY'}</span></div>)}</div></div>
        <div className="panel" style={{padding:16}}><div className="eyebrow">TREND REPLAY</div><h2>Follow how a signal spread</h2><div className="sub" style={{margin:'18px 0'}}>First seen → cross-source → acceleration → global reach</div><div className="trend"><div className="trendRow"><span>First observation</span><span>09:42</span><span>●</span></div><div className="trendRow"><span>Cross-source signal</span><span>10:18</span><span>●</span></div><div className="trendRow"><span>Acceleration</span><span>10:27</span><span>●</span></div><div className="trendRow"><span>Global reach</span><span>Now</span><span>●</span></div></div></div>
        <div className="panel" style={{padding:16}}><div className="eyebrow">TREND DNA</div><h2>Fingerprint of a trend</h2><div className="dna"><div><small>Attention</small><b>{topEvents[0]?.dna.attention ?? 82}</b></div><div><small>Freshness</small><b>{topEvents[0]?.dna.freshness ?? 91}</b></div><div><small>Cross-source</small><b>{topEvents[0]?.dna.crossSource ?? 25}</b></div><div><small>Momentum</small><b>{topEvents[0]?.dna.momentum ?? 76}</b></div></div><div className="sub">RALLIVIO explains the evidence behind the movement rather than only showing a ranking.</div></div>
      </section>

      <section className="section lower">
        <div><div className="eyebrow">CAMPAIGN NETWORK</div><h2>Promote legitimate content through RALLIVIO</h2><div className="sub" style={{marginBottom:12}}>Campaigns remain clearly identified and separate from organic trend evidence.</div><div className="campaigns">{campaigns.length?campaigns.map(x=><div className="campaign" key={x.id}><b>{x.title}</b><span>RALLIVIO CAMPAIGN · {x.source||'Public source'} · {fmt(x.views||0)} observed views</span></div>):<div className="empty">No active campaigns.</div>}</div></div>
        <div><div className="eyebrow">RALLIVIO LENS</div><h2>Analyze anything publicly reachable</h2><div className="sub" style={{marginBottom:12}}>Paste a public URL and send it through the same intelligence layer.</div><div className="lens"><input value={lens} onChange={e=>setLens(e.target.value)} placeholder="Paste a public URL"/><button onClick={()=>{if(lens) window.location.href=`/discover-v20?url=${encodeURIComponent(lens)}`}}>Analyze</button></div></div>
      </section>

      <footer className="footer"><span>RALLIVIO · The world, as it's happening.</span><span>Real Data. Real Signals. Real Opportunities.</span><span>Discover · Creator · Brands & Opportunities · Community · About</span></footer>
    </div>

    {selected&&<div className="modal" onClick={()=>setSelected(null)}><article className="detail" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><div className="eyebrow">SIGNAL DETAIL</div><h2>{selected.title}</h2><p>{selected.description||'RALLIVIO observed this public signal and placed it inside the live discovery layer.'}</p><div className="dna"><div><small>Topic</small><b>{selected.topic||'Global'}</b></div><div><small>Region</small><b>{selected.region||'—'}</b></div><div><small>Source</small><b>{selected.source||selected.source_family||'Public'}</b></div><div><small>Observed</small><b>{age(selected.observed_at||selected.observedAt)}</b></div></div><p>RALLIVIO connects observations into events, preserves source provenance, and exposes the evidence used to understand movement.</p><a href={selected.url} target="_blank" rel="noreferrer" style={{color:'#55d8ff'}}>Open original source →</a></article></div>}
  </main>;
}
