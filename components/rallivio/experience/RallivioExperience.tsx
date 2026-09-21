"use client";
import {Canvas,useFrame} from "@react-three/fiber";
import {Float,Html,Line,Sparkles} from "@react-three/drei";
import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {age,fmt,getDiscovery,signalColor,SignalItem} from "../data/discovery";
import styles from "../rallivio.module.css";

type Mode="field"|"topic"|"signal"|"creator";

function Camera({mode}:{mode:Mode}){
 const ref=useRef<THREE.Group>(null);
 useFrame(({camera,clock})=>{
  const t=clock.elapsedTime;
  const z=mode==="signal"?6:mode==="topic"?10:mode==="creator"?11:15;
  camera.position.x=THREE.MathUtils.lerp(camera.position.x,Math.sin(t*.12)*1.4,.025);
  camera.position.y=THREE.MathUtils.lerp(camera.position.y,Math.cos(t*.15)*.65,.025);
  camera.position.z=THREE.MathUtils.lerp(camera.position.z,z+Math.sin(t*.22)*.7,.035);
  camera.lookAt(0,0,0);
  if(ref.current)ref.current.rotation.y=t*.025;
 });
 return <group ref={ref}/>;
}
function Signal({item,selected,onSelect}:{item:SignalItem;selected:boolean;onSelect:()=>void}){
 const ref=useRef<THREE.Mesh>(null); const c=signalColor(item.metadata?.signal); const p=item as SignalItem&{x:number;y:number;z:number};
 useFrame(({clock})=>{if(ref.current){const v=selected?1.45:1+Math.sin(clock.elapsedTime*1.4+(item.id?.length||1))*.08;ref.current.scale.lerp(new THREE.Vector3(v,v,v),.08)}});
 return <group position={[p.x,p.y,p.z]}>
  <mesh ref={ref} onClick={e=>{e.stopPropagation();onSelect()}}><sphereGeometry args={[selected?.45:.22,18,18]}/><meshBasicMaterial color={c}/></mesh>
  <mesh scale={selected?2.2:1.3}><sphereGeometry args={[.22,16,16]}/><meshBasicMaterial color={c} transparent opacity={selected?.14:.055}/></mesh>
  {selected&&<Html distanceFactor={8}><button className={styles.nodeLabel} onClick={onSelect}><b>{item.metadata?.signal||"Observed"}</b><span>{item.channel_title}</span></button></Html>}
 </group>;
}
function World({items,selected,setSelected}:{items:SignalItem[];selected:SignalItem|null;setSelected:(x:SignalItem)=>void}){
 const nodes=useMemo(()=>items.slice(0,70).map((x,i)=>{const a=i*2.399,r=3.5+((i*17)%100)/100*7;return Object.assign({},x,{x:Math.cos(a)*r,y:Math.sin(a*1.37)*3.2,z:Math.sin(a)*r})}),[items]);
 return <group>
  <Sparkles count={900} scale={[28,16,28]} size={1.2} speed={.25} opacity={.55}/>
  <Float speed={1} rotationIntensity={.18} floatIntensity={.3}>
   <mesh><sphereGeometry args={[1.15,48,48]}/><meshBasicMaterial color="#101936" transparent opacity={.85}/></mesh>
   <mesh scale={1.35}><sphereGeometry args={[1.15,48,48]}/><meshBasicMaterial color="#39dcff" wireframe transparent opacity={.09}/></mesh>
   <Line points={[[0,0,-7],[0,0,7]]} color="#35ddff" transparent opacity={.12}/>
   <Line points={[[-7,0,0],[7,0,0]]} color="#9a72ff" transparent opacity={.12}/>
  </Float>
  {nodes.map(n=><Signal key={n.id} item={n} selected={selected?.id===n.id} onSelect={()=>setSelected(n)}/>)}
 </group>;
}
export default function RallivioExperience(){
 const [data,setData]=useState<{items:SignalItem[];refreshedAt?:string|null;signalCounts?:Record<string,number>;trackedCreators?:number}>({items:[]});
 const [error,setError]=useState(""); const [query,setQuery]=useState(""); const [signal,setSignal]=useState("All"); const [topic,setTopic]=useState("All");
 const [mode,setMode]=useState<Mode>("field"); const [selected,setSelected]=useState<SignalItem|null>(null); const [command,setCommand]=useState(false);
 const load=async()=>{try{const d=await getDiscovery();setData(d);setError("")}catch(e){setError(e instanceof Error?e.message:"DATA_UNAVAILABLE")}};
 useEffect(()=>{load();const t=setInterval(load,60000);return()=>clearInterval(t)},[]);
 const topics=useMemo(()=>["All",...Array.from(new Set(data.items.map(x=>x.topic).filter(Boolean))).slice(0,14)],[data.items]);
 const signals=["All","Now Moving","Breaking Out","On the Rise","Under the Radar","Just Dropped","Live"];
 const visible=useMemo(()=>data.items.filter(x=>(topic==="All"||x.topic===topic)&&(signal==="All"||(x.metadata?.signal||"Observed")===signal)&&(!query||((x.title+" "+x.channel_title+" "+x.topic).toLowerCase().includes(query.toLowerCase())))),[data.items,topic,signal,query]);
 const creators=useMemo(()=>{const m=new Map<string,SignalItem>();data.items.forEach(x=>{if(x.channel_id&&!m.has(x.channel_id))m.set(x.channel_id,x)});return Array.from(m.values()).slice(0,8)},[data.items]);
 const select=(x:SignalItem)=>{setSelected(x);setMode("signal")};
 return <main className={styles.world}>
  <div className={styles.canvas}><Canvas dpr={[1,2]} camera={{position:[0,0,15],fov:55}}><color attach="background" args={["#03050c"]}/><fog attach="fog" args={["#03050c",8,30]}/><Camera mode={mode}/><World items={visible} selected={selected} setSelected={select}/></Canvas></div>
  <div className={styles.grid}/><div className={styles.scan}/>
  <header className={styles.hud}><button className={styles.brand} onClick={()=>{setMode("field");setSelected(null)}}><span>RALL</span>IVIO<small>LIVING ATTENTION SYSTEM</small></button><div className={styles.mode}>{mode.toUpperCase()} / <i>ONLINE</i></div><button className={styles.commandBtn} onClick={()=>setCommand(true)}>⌘ K</button></header>
  <div className={styles.leftRail}><div className={styles.railTitle}>SIGNALS</div>{signals.map(s=><button key={s} className={signal===s?styles.activeRail:""} onClick={()=>{setSignal(s);setMode("field")}}>{s}<span>{s==="All"?data.items.length:data.signalCounts?.[s]??""}</span></button>)}</div>
  <section className={styles.centerCopy}><div className={styles.kicker}><span/> GLOBAL ATTENTION FIELD</div><h1>THE INTERNET<br/><em>IS MOVING.</em></h1><p>RALLIVIO maps the live movement of creators, topics, content and opportunity.</p><div className={styles.actions}><button onClick={()=>setCommand(true)}>ENTER THE FIELD <b>↗</b></button><button className={styles.ghost} onClick={()=>setMode("creator")}>CREATOR NETWORK</button></div></section>
  <div className={styles.searchDock}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the living internet"/>{query&&<button onClick={()=>setQuery("")}>×</button>}</div>
  <div className={styles.topicDock}>{topics.map(t=><button key={t} className={topic===t?styles.activeTopic:""} onClick={()=>{setTopic(t);setMode(t==="All"?"field":"topic")}}>{t}</button>)}</div>
  <aside className={styles.metrics}><b>{data.items.length||"—"}</b><span>signals in field</span><b>{data.trackedCreators?fmt(data.trackedCreators):"—"}</b><span>creators tracked</span><small>{data.refreshedAt?"SYNC "+age(data.refreshedAt):"SYNCING"}</small></aside>
  <div className={styles.bottomDock}><button onClick={()=>setMode("field")}>FIELD</button><button onClick={()=>setMode("topic")}>TOPICS</button><button onClick={()=>setMode("creator")}>CREATORS</button><button onClick={()=>setCommand(true)}>SEARCH</button></div>
  {mode==="creator"&&<section className={styles.network}><div><small>CREATOR NETWORK</small><h2>Who is moving.</h2></div>{creators.map(x=><button key={x.channel_id||x.id} onClick={()=>select(x)}><img src={x.thumbnail}/><span><b>{x.channel_title}</b><small>{x.topic} · {fmt(x.metadata?.subscriber_count||0)} audience</small></span><i>{x.metadata?.momentum_score??0}</i></button>)}</section>}
  {selected&&<aside className={styles.inspector}><button className={styles.close} onClick={()=>{setSelected(null);setMode("field")}}>×</button><small>{selected.metadata?.signal||"OBSERVED"} · {selected.topic} · {selected.region}</small><h2>{selected.title}</h2><p>{selected.channel_title} · {fmt(selected.views)} views · {age(selected.published_at)}</p><div className={styles.inspectorLine}><span>Momentum</span><b>{selected.metadata?.momentum_score??0}</b></div><a href={selected.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></aside>}
  {command&&<div className={styles.commandBackdrop} onClick={()=>setCommand(false)}><div className={styles.command} onClick={e=>e.stopPropagation()}><div className={styles.commandHead}><b>RALLIVIO COMMAND</b><button onClick={()=>setCommand(false)}>ESC</button></div><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a signal, creator or topic..."/><div className={styles.commandList}>{visible.slice(0,7).map(x=><button key={x.id} onClick={()=>{select(x);setCommand(false)}}><span style={{background:signalColor(x.metadata?.signal)}}/><div><b>{x.title}</b><small>{x.channel_title} · {x.metadata?.signal||"Observed"}</small></div><i>↗</i></button>)}</div></div></div>}
  {error&&<div className={styles.error}>DATA LINK OFFLINE · {error}</div>}
 </main>;
}
