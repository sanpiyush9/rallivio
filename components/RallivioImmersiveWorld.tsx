"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Sparkles } from "@react-three/drei";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./RallivioImmersiveWorld.module.css";

type Item = {
  id: string;
  title: string;
  channel_title: string;
  thumbnail: string;
  url: string;
  topic?: string;
  region?: string;
  views?: number;
  metadata?: { signal?: string; momentum_score?: number; subscriber_count?: number | null };
};

const SIGNALS=["Now Moving","Breaking Out","On the Rise","Under the Radar","Just Dropped"];
const SOURCES=["ALL","YOUTUBE","INSTAGRAM","TIKTOK","X","REDDIT"];
const SIGNAL_COLOR:Record<string,string>={
  "Now Moving":"#22d3ee","Breaking Out":"#f59e0b","On the Rise":"#34d399",
  "Under the Radar":"#a78bfa","Just Dropped":"#f472b6","Live":"#ef4444","Observed":"#64748b"
};
const compact=(n?:number)=>!n?"—":n>=1e9?(n/1e9).toFixed(1)+"B":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":n.toLocaleString();

function CameraRig({progress}:{progress:number}) {
  const {camera}=useThree();
  useFrame((_,delta)=>{
    const targets=[
      new THREE.Vector3(0,0,8.8),new THREE.Vector3(0,.2,7.2),
      new THREE.Vector3(1.5,.6,6),new THREE.Vector3(-1.2,.3,6.8),
      new THREE.Vector3(0,-.3,7.8)
    ];
    const t=targets[Math.min(4,Math.floor(progress*5))];
    camera.position.lerp(t,1-Math.pow(.001,delta));
    camera.lookAt(0,0,0);
  });
  return null;
}

function World({items,progress,selected,onSelect}:{items:Item[];progress:number;selected:Item|null;onSelect:(x:Item)=>void}) {
  const group=useRef<THREE.Group>(null);
  const nodes=useMemo(()=>items.slice(0,42).map((item,i)=>{
    const a=i*.91, r=2.0+(i%7)*.33;
    return {item, p:[Math.cos(a)*r,Math.sin(a*1.73)*1.65,Math.sin(a)*r*.72] as [number,number,number], s:.75+(i%5)*.09};
  }),[items]);
  useFrame((state,delta)=>{
    if(group.current){group.current.rotation.y+=delta*(.035+progress*.025);group.current.rotation.x=Math.sin(state.clock.elapsedTime*.12)*.06;}
  });
  return <group ref={group}>
    <Sparkles count={900} scale={[16,9,12]} size={1.4} speed={.18} opacity={.55}/>
    <mesh><icosahedronGeometry args={[1.15,4]}/><meshBasicMaterial color="#071b27" wireframe transparent opacity={.34}/></mesh>
    <mesh><sphereGeometry args={[.78,32,32]}/><meshStandardMaterial color="#06141d" emissive="#27d9ff" emissiveIntensity={4.2} metalness={.5} roughness={.2}/></mesh>
    {[2.2,3.15,4.1].map((r,i)=><mesh key={r} rotation={[i*.65,i*.4,0]}><torusGeometry args={[r,r*.0028,8,160]}/><meshBasicMaterial color={i===1?"#a678ff":"#35dfff"} transparent opacity={.18-i*.035}/></mesh>)}
    <Line points={nodes.slice(0,18).map(n=>new THREE.Vector3(...n.p))} color="#55e6ff" transparent opacity={.1} lineWidth={1}/>
    {nodes.map(({item,p,s},i)=>{
      const signal=item.metadata?.signal||"Observed", active=selected?.id===item.id, color=SIGNAL_COLOR[signal]||"#22d3ee";
      return <group key={item.id+i} position={p} scale={active?s*1.45:s} onClick={(e)=>{e.stopPropagation();onSelect(item);}}>
        <mesh><sphereGeometry args={[.055+(i%3)*.018,12,12]}/><meshBasicMaterial color={active?"#fff":color}/></mesh>
        {active&&<mesh><ringGeometry args={[.12,.145,32]}/><meshBasicMaterial color={color} transparent opacity={.75}/></mesh>}
        {i<10&&<Html distanceFactor={8} center style={{pointerEvents:"none"}}>
          <div className={styles["ri-node"]} style={{"--signal":color} as React.CSSProperties}>
            <span>{signal}</span><b>{item.title}</b><small>{item.channel_title} · {item.topic||"WORLD"}</small>
          </div>
        </Html>}
      </group>;
    })}
    <Html position={[0,0,1.2]} center style={{pointerEvents:"none"}}>
      <div className={styles["ri-core"]}><b>RALLIVIO</b><span>THE LIVING INTERNET</span></div>
    </Html>
  </group>;
}

export default function RallivioImmersiveWorld(){
  const [items,setItems]=useState<Item[]>([]);
  const [selected,setSelected]=useState<Item|null>(null);
  const [source,setSource]=useState("ALL"),[signal,setSignal]=useState("ALL"),[query,setQuery]=useState("");
  const [promote,setPromote]=useState(false),[progress,setProgress]=useState(0);
  const [stats,setStats]=useState({pool:0,signals:0,creators:0,topics:0});

  useEffect(()=>{
    let alive=true;
    const load=async()=>{try{
      const r=await fetch("/api/discovery?limit=120",{cache:"no-store"}); const b=await r.json();
      if(!alive||!r.ok||b.ok!==true)return;
      setItems(Array.isArray(b.items)?b.items:[]);
      setStats({pool:Number(b.poolCount||0),signals:Number(b.verifiedSignalCount||0),creators:Number(b.trackedCreators||0),topics:Number(b.activeTopics||0)});
    }catch{}};
    void load(); const id=setInterval(load,60000);
    const onScroll=()=>{const h=Math.max(document.documentElement.scrollHeight-innerHeight,1);setProgress(Math.min(1,scrollY/h));};
    addEventListener("scroll",onScroll,{passive:true}); onScroll();
    return()=>{alive=false;clearInterval(id);removeEventListener("scroll",onScroll);};
  },[]);

  const filtered=useMemo(()=>items.filter(x=>{
    const hay=(x.title+" "+x.channel_title+" "+(x.topic||"")).toLowerCase();
    const sourceMatch=source==="ALL"||((x as Item & {source?:string}).source||"").toUpperCase()===source;
    return sourceMatch&&(signal==="ALL"||x.metadata?.signal===signal)&&(!query||hay.includes(query.toLowerCase()));
  }),[items,source,signal,query]);

  const visible=filtered.length?filtered:items;
  const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return <main className={styles["ri"]}>
    <div className={styles["ri-stage"]}><Canvas dpr={[1,1.8]} camera={{position:[0,0,8.8],fov:48}} gl={{antialias:true,alpha:true}}>
      <color attach="background" args={["#010409"]}/><ambientLight intensity={.3}/><pointLight position={[3,4,5]} intensity={18} color="#3ddfff"/><pointLight position={[-4,-2,2]} intensity={10} color="#8b5cf6"/>
      <CameraRig progress={progress}/><World items={visible} progress={progress} selected={selected} onSelect={setSelected}/>
    </Canvas></div>
    <div className={styles["ri-vignette"]}/>
    <header className={styles["ri-nav"]}><Link href="/" className={styles["ri-logo"]}>RALL<span>IVIO</span></Link><nav>{["discover","signals","creators","opportunities","about"].map((x,i)=><button key={x} onClick={()=>jump(x)}>{String(i+1).padStart(2,"0")} / {x}</button>)}</nav><button className={styles["ri-promote"]} onClick={()=>setPromote(true)}>PROMOTE ↗</button></header>
    <div className={styles["ri-progress"]}><i style={{transform:`scaleX(${progress})`}}/></div>

    <section id="discover" className={styles["ri-screen ri-intro"]}><div className={styles["ri-copy"]}><span className={styles["ri-eyebrow"]}>GLOBAL ATTENTION SYSTEM / LIVE</span><h1>THE INTERNET<br/><em>IS MOVING.</em></h1><p>RALLIVIO is a living map of attention — discovering movement across creators, topics, platforms and regions in real time.</p><div className={styles["ri-actions"]}><button onClick={()=>jump("signals")}>ENTER THE FIELD ↓</button><button onClick={()=>setPromote(true)}>PUT CONTENT IN MOTION ↗</button></div></div><div className={styles["ri-metrics"]}><b>{compact(stats.signals)}</b><span>LIVE SIGNALS</span><b>{compact(stats.creators)}</b><span>CREATOR NODES</span><b>{stats.topics}</b><span>ACTIVE WORLDS</span></div></section>

    <section id="signals" className={styles["ri-screen ri-panel"]}><div><span className={styles["ri-eyebrow"]}>01 / SIGNAL FIELD</span><h2>Attention<br/><em>has velocity.</em></h2><p>Filter the living field. Every point is a piece of content moving through the network.</p></div><div className={styles["ri-console"]}><div className={styles["ri-search"]}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the living internet"/><button onClick={()=>setPromote(true)}>PROMOTE</button></div><div className={styles["ri-filters"]}>{SOURCES.map(x=><button key={x} className={source===x?"on":""} onClick={()=>setSource(x)}>{x}</button>)}<i/>{SIGNALS.map(x=><button key={x} className={signal===x?"on":""} onClick={()=>setSignal(signal===x?"ALL":x)}>{x}</button>)}</div><div className={styles["ri-stream"]}>{visible.slice(0,6).map((x,i)=><button key={x.id} onClick={()=>setSelected(x)}><span>{String(i+1).padStart(2,"0")}</span><div><small>{x.metadata?.signal||"SIGNAL"} · {x.topic||"WORLD"}</small><b>{x.title}</b><em>{x.channel_title}</em></div><strong>{compact(x.views)}</strong></button>)}</div></div></section>

    <section id="creators" className={styles["ri-screen ri-panel"]}><div><span className={styles["ri-eyebrow"]}>02 / CREATOR NETWORK</span><h2>People become<br/><em>nodes.</em></h2><p>{compact(stats.creators)} creators are part of the tracked attention network.</p></div><div className={styles["ri-orbit-list"]}>{visible.slice(0,8).map((x,i)=><button key={x.id+i} onClick={()=>setSelected(x)} style={{"--i":i} as React.CSSProperties}><img src={x.thumbnail} alt=""/><span>{x.channel_title}</span><small>{x.topic||"WORLD"} · {x.region||"GLOBAL"}</small></button>)}</div></section>

    <section id="opportunities" className={styles["ri-screen ri-panel ri-opps"]}><div><span className={styles["ri-eyebrow"]}>03 / OPPORTUNITIES</span><h2>Where attention<br/><em>becomes action.</em></h2><p>Brands publish requirements. Creators discover opportunities. RALLIVIO connects both sides.</p><button onClick={()=>jump("about")}>EXPLORE THE NETWORK ↗</button></div><div className={styles["ri-opportunity"]}><b>10%</b><span>RALLIVIO DEAL COMMISSION</span><div>BRANDS ↔ CREATORS</div></div></section>

    <section id="about" className={styles["ri-screen ri-panel ri-about"]}><div><span className={styles["ri-eyebrow"]}>04 / RALLIVIO</span><h2>Not a page.<br/><em>A world.</em></h2><p>Discover. Promote. Connect. Create. Grow.</p></div><div className={styles["ri-words"]}><span>DISCOVER</span><span>PROMOTE</span><span>CONNECT</span><span>CREATE</span><span>GROW</span></div><footer>RALLIVIO / THE LIVING INTERNET</footer></section>

    {selected&&<div className={styles["ri-modal"]} onClick={()=>setSelected(null)}><div className={styles["ri-card"]} onClick={e=>e.stopPropagation()}><button onClick={()=>setSelected(null)}>×</button><img src={selected.thumbnail} alt=""/><div><span>{selected.metadata?.signal||"SIGNAL"} · {selected.topic||"WORLD"} · {selected.region||"GLOBAL"}</span><h3>{selected.title}</h3><p>{selected.channel_title}</p><small>{compact(selected.views)} views · momentum {selected.metadata?.momentum_score??"—"}</small><a href={selected.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></div></div></div>}
    {promote&&<div className={styles["ri-modal"]} onClick={()=>setPromote(false)}><div className={styles["ri-promote-card"]} onClick={e=>e.stopPropagation()}><button onClick={()=>setPromote(false)}>×</button><span>RALLIVIO / PROMOTE</span><h3>Put content into the attention field.</h3><p>Paste a public content URL to begin the discovery workflow.</p><input autoFocus placeholder="https://youtube.com/... / instagram.com/..."/><button className={styles["ri-cta"]} onClick={()=>setPromote(false)}>ANALYZE CONTENT ↗</button></div></div>}
  </main>;
}
