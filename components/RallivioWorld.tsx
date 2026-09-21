"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  channel_title: string;
  thumbnail: string;
  url: string;
  topic?: string;
  region?: string;
  published_at?: string;
  views?: number;
  metadata?: { signal?: string; momentum_score?: number; subscriber_count?: number | null };
};

const SIGNALS = ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped"];

const topics = [
  "AI & Tech","Gaming","Music","Sports","Entertainment","Food","News","Pets","Beauty",
  "Travel","Business","Finance","Fitness","Fashion","Science","Education","Automotive"
];

function compact(n:number|undefined){
  if(!n) return "—";
  if(n>=1e9) return (n/1e9).toFixed(1)+"B";
  if(n>=1e6) return (n/1e6).toFixed(1)+"M";
  if(n>=1e3) return (n/1e3).toFixed(1)+"K";
  return n.toLocaleString();
}

export default function RallivioWorld(){
  const [items,setItems]=useState<Item[]>([]);
  const [selected,setSelected]=useState<Item|null>(null);
  const [topic,setTopic]=useState("ALL");
  const [signal,setSignal]=useState("ALL");
  const [activeRoom,setActiveRoom]=useState("DISCOVER");
  const [cursor,setCursor]=useState({x:0,y:0});
  const [stats,setStats]=useState({pool:0,signals:0,creators:0,topics:0});

  useEffect(()=>{
    const move=(e:MouseEvent)=>setCursor({x:(e.clientX/innerWidth-.5)*2,y:(e.clientY/innerHeight-.5)*2});
    addEventListener("mousemove",move,{passive:true});
    return()=>removeEventListener("mousemove",move);
  },[]);

  useEffect(()=>{
    let live=true;
    const load=async()=>{
      try{
        const endpoint=new URL("/api/discovery?limit=60",window.location.origin).toString();
        const r=await fetch(endpoint,{cache:"no-store",headers:{accept:"application/json"}});
        const text=await r.text();
        let b: Record<string, unknown>;
        try{ b=JSON.parse(text); }catch(parseError){
          console.error("RALLIVIO discovery: invalid JSON",{status:r.status,contentType:r.headers.get("content-type"),text:text.slice(0,500),parseError});
          return;
        }
        const rawItems = Array.isArray(b.items) ? b.items : [];
        console.log("RALLIVIO discovery RAW",Object.keys(b),b.poolCount,rawItems.length);
        if(!live) return;
        if(!r.ok || b?.ok!==true){
          console.error("RALLIVIO discovery: API rejected",{status:r.status,payload:b});
          return;
        }
        const nextItems=rawItems as Item[];
        setItems(nextItems);
        setStats({
          pool:Number(b.poolCount ?? 0),
          signals:Number(b.verifiedSignalCount ?? 0),
          creators:Number(b.trackedCreators ?? 0),
          topics:Number(b.activeTopics ?? 0)
        });
      }catch(error){
        console.error("RALLIVIO discovery: fetch failed",error);
      }
    };
    void load();
    const id=setInterval(()=>void load(),60000);
    return()=>{live=false;clearInterval(id)};
  },[]);

  const filtered=useMemo(()=>items.filter(x=>
    (topic==="ALL"||x.topic===topic) &&
    (signal==="ALL"||x.metadata?.signal===signal)
  ),[items,topic,signal]);

  const hero=filtered[0]||items[0];
  const orbit=filtered.slice(0,10);
  const creators=Array.from(new Map(filtered.map(x=>[x.channel_title,x])).values()).slice(0,7);
  const rooms=["DISCOVER","LIVE","TOPICS","CREATORS","OPPORTUNITIES"];

  return <main className="rw">
    <div className="rw-noise"/>
    <div className="rw-grid"/>
    <div className="rw-aura rw-aura-a" style={{transform:`translate3d(${cursor.x*28}px,${cursor.y*18}px,0)`}}/>
    <div className="rw-aura rw-aura-b" style={{transform:`translate3d(${cursor.x*-20}px,${cursor.y*-12}px,0)`}}/>
    <div className="rw-particle-field" aria-hidden="true">
      {Array.from({length:42},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}/>)}
    </div>

    <header className="rw-nav">
      <Link href="/" className="rw-logo">RALL<span>IVIO</span></Link>
      <nav>{rooms.map(r=><button key={r} className={activeRoom===r?"active":""} onClick={()=>setActiveRoom(r)}>{r}</button>)}</nav>
      <div className="rw-nav-right"><span className="rw-live"><i/>LIVE INTELLIGENCE</span><button className="rw-search">⌕ <span>Search the field</span></button><Link href="/pricing" className="rw-pro">PRO</Link></div>
    </header>

    <section className="rw-hero">
      <div className="rw-hero-copy">
        <div className="rw-kicker"><i/> GLOBAL SIGNAL FIELD <b>REAL DATA</b></div>
        <h1>THE INTERNET<br/><em>IS MOVING.</em></h1>
        <p>RALLIVIO turns the live internet into a navigable world — signals, creators, topics and opportunities connected in one spatial experience.</p>
        <div className="rw-actions">
          <button className="rw-primary" onClick={()=>document.getElementById("rw-field")?.scrollIntoView({behavior:"smooth"})}>ENTER THE FIELD <span>↗</span></button>
          <button className="rw-ghost" onClick={()=>setSignal("Breaking Out")}>FIND BREAKOUTS <span>⌁</span></button>
        </div>
      </div>

      <div className="rw-hero-camera" style={{transform:`translate3d(${cursor.x*18}px,${cursor.y*12}px,0)`}}>
        <div className="rw-hero-world">
          <div className="rw-energy energy-a"/><div className="rw-energy energy-b"/><div className="rw-energy energy-c"/>
          <div className="rw-ring ring-1"/><div className="rw-ring ring-2"/><div className="rw-ring ring-3"/>
        <div className="rw-core">
          <div className="rw-core-orb"/>
          <span>RALLIVIO</span><small>DISCOVERY OS</small>
        </div>
        {orbit.map((x,i)=><button key={x.id} className={`rw-node n${i}`} onClick={()=>setSelected(x)} title={x.title}>
          <span className="rw-node-pulse"/><b>{x.metadata?.signal||"SIGNAL"}</b><small>{x.topic||"WORLD"}</small>
        </button>)}
          <div className="rw-axis x"/><div className="rw-axis y"/>
          <div className="rw-scanline"/>
        </div>
      </div>

      <div className="rw-floating rw-float-a"><span>WORLDWIDE</span><strong>{stats.pool.toLocaleString()}</strong><small>DISCOVERY POOL</small></div>
      <div className="rw-floating rw-float-b"><span>LIVE</span><strong>{stats.signals.toLocaleString()}</strong><small>VERIFIED SIGNALS</small></div>
    </section>

    <div className="rw-motion-ticker" aria-hidden="true"><span>LIVE SIGNALS</span><i/><span>VELOCITY</span><i/><span>ATTENTION</span><i/><span>CREATOR FLOW</span><i/><span>GLOBAL NOW</span><i/></div>

    <section className="rw-metrics">
      <div><strong>{stats.signals.toLocaleString()}</strong><span>signals in motion</span></div>
      <div><strong>{stats.creators.toLocaleString()}</strong><span>creator nodes</span></div>
      <div><strong>{stats.topics.toLocaleString()}</strong><span>active worlds</span></div>
      <div><strong>60s</strong><span>refresh cycle</span></div>
    </section>

    <section id="rw-field" className="rw-field">
      <div className="rw-section-head">
        <div><span>01 / THE FIELD</span><h2>Navigate what&apos;s<br/><em>moving now.</em></h2></div>
        <p>Not a dashboard. A living map of attention. Select a topic or signal and move deeper into the network.</p>
      </div>
      <div className="rw-filters">
        <div><span>TOPIC</span><button className={topic==="ALL"?"on":""} onClick={()=>setTopic("ALL")}>ALL</button>{topics.slice(0,9).map(t=><button key={t} className={topic===t?"on":""} onClick={()=>setTopic(t)}>{t}</button>)}</div>
        <div><span>SIGNAL</span><button className={signal==="ALL"?"on":""} onClick={()=>setSignal("ALL")}>ALL</button>{SIGNALS.map(s=><button key={s} className={signal===s?"on":""} onClick={()=>setSignal(s)}>{s}</button>)}</div>
      </div>

      <div className="rw-stage">
        <div className="rw-stage-sky"/>
        <div className="rw-stage-grid"/>
        <div className="rw-stage-trails" aria-hidden="true"><i/><i/><i/><i/><i/></div>
        <div className="rw-stage-title"><span>ATTENTION NETWORK</span><strong>{filtered.length||items.length}</strong><small>VISIBLE NODES</small></div>
        {filtered.slice(0,18).map((x,i)=><button key={x.id} className={`rw-card c${i%9}`} onClick={()=>setSelected(x)}>
          <img src={x.thumbnail} alt=""/>
          <div><small>{x.metadata?.signal||"SIGNAL"} · {x.topic||"WORLD"}</small><strong>{x.title}</strong><span>{x.channel_title} · {compact(x.views)} views</span></div>
        </button>)}
        <div className="rw-stage-core"><span>DISCOVERY</span><b>FIELD</b><i/></div>
      </div>
    </section>

    <section className="rw-worlds">
      <div className="rw-section-head compact"><div><span>02 / WORLDS</span><h2>Enter a <em>topic.</em></h2></div><p>Each topic becomes a world with its own creators, velocity and emerging signals.</p></div>
      <div className="rw-topic-grid">{topics.map((t,i)=>{
        const count=items.filter(x=>x.topic===t).length;
        return <button key={t} onClick={()=>{setTopic(t);document.getElementById("rw-field")?.scrollIntoView({behavior:"smooth"})}} className="rw-topic">
          <span>0{i+1}</span><strong>{t}</strong><small>{count||0} visible signals</small><i/>
        </button>
      })}</div>
    </section>

    <section className="rw-creators">
      <div className="rw-section-head compact"><div><span>03 / CREATOR NETWORK</span><h2>People behind<br/><em>the movement.</em></h2></div><p>Creators are nodes in the same intelligence field — not isolated profile pages.</p></div>
      <div className="rw-creator-map">
        <div className="rw-creator-core">CREATOR<br/><b>NETWORK</b></div>
        {creators.map((x,i)=><button key={x.channel_title} className={`rw-creator cr${i}`} onClick={()=>setSelected(x)}>
          <img src={x.thumbnail} alt=""/><strong>{x.channel_title}</strong><small>{x.topic||"Creator"} · {compact(x.metadata?.subscriber_count||0)} audience</small>
        </button>)}
      </div>
    </section>

    <section className="rw-opps">
      <div><span>04 / OPPORTUNITIES</span><h2>Where attention<br/><em>becomes opportunity.</em></h2></div>
      <div className="rw-opps-card"><i/><strong>OPPORTUNITY LAYER</strong><p>Brands, creators and signals will connect here as the RALLIVIO network expands.</p><button onClick={()=>setActiveRoom("OPPORTUNITIES")}>OPEN OPPORTUNITIES ↗</button></div>
    </section>

    <footer className="rw-footer"><strong>RALL<span>IVIO</span></strong><span>DISCOVER PEOPLE. POWER WHAT&apos;S NEXT.</span><small>GLOBAL DISCOVERY INTELLIGENCE</small></footer>

    {selected&&<div className="rw-modal" onClick={()=>setSelected(null)}>
      <div className="rw-modal-card" onClick={e=>e.stopPropagation()}>
        <button className="rw-close" onClick={()=>setSelected(null)}>×</button>
        <img src={selected.thumbnail} alt=""/>
        <div><span>{selected.metadata?.signal||"SIGNAL"} · {selected.topic||"WORLD"} · {selected.region||"GLOBAL"}</span><h3>{selected.title}</h3><p>{selected.channel_title}</p><small>{compact(selected.views)} views · momentum {selected.metadata?.momentum_score??"—"}</small><a href={selected.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></div>
      </div>
    </div>}
  </main>
}
