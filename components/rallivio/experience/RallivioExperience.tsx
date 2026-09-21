"use client";

import {Canvas,useFrame} from "@react-three/fiber";
import {Html,Line,Stars,Trail} from "@react-three/drei";
import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {age,fmt,getDiscovery,signalColor,SignalItem} from "../data/discovery";
import styles from "../rallivio.module.css";

type Mode="world"|"realm"|"signal";
type Node=SignalItem&{p:THREE.Vector3};

function CameraRig({target,focus}:{target:THREE.Vector3;focus:THREE.Vector3}){
  const q=useRef(new THREE.Quaternion());
  useFrame(({camera,clock,mouse})=>{
    const t=clock.elapsedTime;
    const pos=target.clone().add(new THREE.Vector3(mouse.x*1.8,mouse.y*.9,0));
    camera.position.lerp(pos,.055);
    const look=focus.clone().add(new THREE.Vector3(Math.sin(t*.18)*.3,Math.cos(t*.15)*.18,0));
    q.current.setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,look,camera.up));
    camera.quaternion.slerp(q.current,.065);
  });
  return null;
}

function Atmosphere(){
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{if(ref.current)ref.current.rotation.y=clock.elapsedTime*.008});
  return <group ref={ref}>
    <Stars radius={90} depth={55} count={2200} factor={2} saturation={0} fade speed={.35}/>
    {Array.from({length:18},(_,i)=>{
      const a=i*Math.PI*2/18,r=18+(i%3)*5;
      return <mesh key={i} position={[Math.cos(a)*r,(i%5-2)*2,Math.sin(a)*r]} rotation={[0,a,0]}>
        <boxGeometry args={[.04,7,.04]}/><meshBasicMaterial color="#7fe7ff" transparent opacity={.12}/>
      </mesh>;
    })}
  </group>;
}

function Floor(){
  const lines=[];
  for(let i=-10;i<=10;i++)lines.push(<Line key={"x"+i} points={[[i*1.8,-3,-42],[i*1.8,-3,42]]} color="#4ee6ff" transparent opacity={.055}/>);
  for(let i=-23;i<=23;i++)lines.push(<Line key={"z"+i} points={[[-18,-3,i*1.8],[18,-3,i*1.8]]} color="#8c6dff" transparent opacity={.045}/>);
  return <group>{lines}<mesh position={[0,-3,0]} rotation={[-Math.PI/2,0,0]}>
    <planeGeometry args={[42,90]}/><meshBasicMaterial color="#030711" transparent opacity={.35}/>
  </mesh></group>;
}

function Core({active,onEnter}:{active:boolean;onEnter:()=>void}){
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    if(ref.current){
      ref.current.rotation.y=clock.elapsedTime*.18;
      ref.current.position.y=Math.sin(clock.elapsedTime*.7)*.18;
    }
  });
  return <group ref={ref} position={[0,1,-5]} onPointerDown={e=>{e.stopPropagation();onEnter()}}>
    <mesh><icosahedronGeometry args={[1.8,2]}/><meshBasicMaterial color="#0a1727" wireframe transparent opacity={.9}/></mesh>
    <mesh scale={.64}><icosahedronGeometry args={[1.8,2]}/><meshBasicMaterial color="#4de8ff" transparent opacity={active?.22:.12}/></mesh>
    <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.3,.018,8,120]}/><meshBasicMaterial color="#65e8ff" transparent opacity={.55}/></mesh>
    <mesh rotation={[0,Math.PI/3,0]}><torusGeometry args={[2.7,.012,8,120]}/><meshBasicMaterial color="#a47bff" transparent opacity={.35}/></mesh>
    <Html distanceFactor={9}><div className={styles.coreLabel}><b>RALLIVIO</b><span>ATTENTION CORE · LIVE</span></div></Html>
  </group>;
}

function Gateway({label,index,active,onClick}:{label:string;index:number;active:boolean;onClick:()=>void}){
  const a=index*Math.PI*2/8,r=7.5;
  const p:[number,number,number]=[Math.cos(a)*r,Math.sin(index*1.7)*.6,Math.sin(a)*r-5];
  const ref=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    if(ref.current){
      ref.current.position.y=p[1]+Math.sin(clock.elapsedTime*.65+index)*.18;
      ref.current.rotation.y=Math.sin(clock.elapsedTime*.25+index)*.12;
    }
  });
  return <group ref={ref} position={p} onPointerDown={e=>{e.stopPropagation();onClick()}}>
    <mesh rotation={[0,-a,0]}><boxGeometry args={[2.5,.035,3.2]}/><meshBasicMaterial color={active?"#6cf1ff":"#52627c"} transparent opacity={active?.8:.28}/></mesh>
    <mesh position={[0,0,.03]} rotation={[0,-a,0]}><planeGeometry args={[2.2,2.9]}/><meshBasicMaterial color={active?"#0d3040":"#07101c"} transparent opacity={.82}/></mesh>
    <Html distanceFactor={8}>
      <button type="button" className={styles.gateway} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onClick()}}>
        <span>{String(index+1).padStart(2,"0")}</span><b>{label}</b><i>ENTER REALM ↗</i>
      </button>
    </Html>
  </group>;
}

function SignalNode({node,onSelect}:{node:Node;onSelect:()=>void}){
  const ref=useRef<THREE.Mesh>(null),c=signalColor(node.metadata?.signal);
  useFrame(({clock})=>{
    if(ref.current){
      const s=1+Math.sin(clock.elapsedTime*2+node.id.length)*.12;
      ref.current.scale.lerp(new THREE.Vector3(s,s,s),.1);
    }
  });
  return <group position={node.p}>
    <Trail width={.07} length={4} color={c} attenuation={x=>x*x}>
      <mesh ref={ref} onPointerDown={e=>{e.stopPropagation();onSelect()}}>
        <sphereGeometry args={[.11,16,16]}/><meshBasicMaterial color={c}/>
      </mesh>
    </Trail>
    <mesh scale={2.4} onPointerDown={e=>{e.stopPropagation();onSelect()}}>
      <sphereGeometry args={[.11,12,12]}/><meshBasicMaterial color={c} transparent opacity={.05}/>
    </mesh>
  </group>;
}

function SignalConstellation({items,onSelect,interactive}:{items:SignalItem[];onSelect:(x:SignalItem)=>void;interactive:boolean}){
  const nodes=useMemo<Node[]>(()=>items.slice(0,100).map((x,i)=>{
    const a=i*2.399,r=3.8+(i%17)*.62;
    return {...x,p:new THREE.Vector3(Math.cos(a)*r,Math.sin(a*1.8)*2.2,Math.sin(a)*r-4)};
  }),[items]);
  const portals=useMemo(()=>nodes.slice(0,18),[nodes]);
  return <group>
    {nodes.map(n=><SignalNode key={n.id} node={n} onSelect={()=>onSelect(n)}/>)}
    {interactive&&portals.map((n,i)=><Html key={"portal-"+n.id} position={n.p} distanceFactor={10}>
      <button type="button" className={styles.signalPortal} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onSelect(n)}}>
        <span style={{color:signalColor(n.metadata?.signal)}}>{n.metadata?.signal||"OBSERVED"}</span>
        <b>{n.title.length>48?n.title.slice(0,48)+"…":n.title}</b>
        <small>{n.channel_title} · {fmt(n.views)} views</small>
        <i>INSPECT ↗</i>
      </button>
    </Html>)}
  </group>;
}

export default function RallivioExperience(){
  const [data,setData]=useState<{items:SignalItem[];trackedCreators?:number}>({items:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState(""),[topic,setTopic]=useState("All"),[signal,setSignal]=useState("All");
  const [mode,setMode]=useState<Mode>("world"),[selected,setSelected]=useState<SignalItem|null>(null);
  const [cursor,setCursor]=useState({x:0,y:0});
  const topics=useMemo(()=>Array.from(new Set(data.items.map(x=>x.topic).filter(Boolean))).slice(0,12),[data.items]);
  const visible=useMemo(()=>data.items.filter(x=>
    (topic==="All"||x.topic===topic)&&
    (signal==="All"||(x.metadata?.signal||"Observed")===signal)&&
    (!query||((x.title+" "+x.channel_title+" "+x.topic).toLowerCase().includes(query.toLowerCase())))
  ),[data.items,topic,signal,query]);
  const [cam,setCam]=useState({target:new THREE.Vector3(0,1,9),focus:new THREE.Vector3(0,0,-5)});

  const refresh=()=>{
    setLoading(true);setError("");
    getDiscovery().then(setData).catch(e=>setError(e instanceof Error?e.message:"Discovery unavailable")).finally(()=>setLoading(false));
  };
  useEffect(()=>{refresh();const id=setInterval(refresh,60000);return()=>clearInterval(id)},[]);
  useEffect(()=>{
    const fn=(e:MouseEvent)=>setCursor({x:e.clientX,y:e.clientY});
    window.addEventListener("mousemove",fn);
    return()=>window.removeEventListener("mousemove",fn);
  },[]);

  const enterTopic=(t:string)=>{
    setTopic(t);setSignal("All");setMode("realm");setSelected(null);
    setCam({target:new THREE.Vector3(0,.7,3.2),focus:new THREE.Vector3(0,.2,-5)});
  };
  const setAttention=(s:string)=>{
    setSignal(s);setMode("realm");setSelected(null);
    setCam({target:new THREE.Vector3(0,.7,2.2),focus:new THREE.Vector3(0,0,-4)});
  };
  const select=(x:SignalItem)=>{
    setSelected(x);setMode("signal");
    setCam({target:new THREE.Vector3(0,.6,2.8),focus:new THREE.Vector3(0,0,-5)});
  };
  const exit=()=>{
    setMode("world");setSelected(null);setSignal("All");
    setCam({target:new THREE.Vector3(0,1,9),focus:new THREE.Vector3(0,0,-5)});
  };

  return <main className={styles.world} onDoubleClick={exit}>
    <Canvas dpr={[1,2]} camera={{position:[0,1,9],fov:62}} onPointerMissed={()=>{if(mode==="signal")setSelected(null)}}>
      <color attach="background" args={["#02050a"]}/><fog attach="fog" args={["#02050a",9,42]}/>
      <CameraRig target={cam.target} focus={cam.focus}/><Atmosphere/><Floor/>
      <Core active={mode!=="world"} onEnter={()=>enterTopic(topic==="All"?(topics[0]||"All"):topic)}/>
      {topics.map((t,i)=><Gateway key={t} label={t} index={i} active={topic===t} onClick={()=>enterTopic(t)}/>)}
      <SignalConstellation items={visible} onSelect={select} interactive={mode!=="world"}/>
    </Canvas>

    <div className={styles.vignette}/>
    <div className={styles.crosshair} style={{transform:"translate("+cursor.x+"px,"+cursor.y+"px)"}}/>

    <div className={styles.identity}>
      <button type="button" onClick={exit}>RALLIVIO</button><span>SPATIAL DISCOVERY OS</span>
    </div>

    <div className={styles.worldState}>
      <span className={styles.pulse}/>{mode==="world"?"WORLD / EXPLORE":mode==="realm"?topic.toUpperCase()+" / REALM":"SIGNAL / INSPECT"}
      <small>{fmt(data.items.length)} SIGNALS · {fmt(data.trackedCreators||0)} CREATORS</small>
    </div>

    <div className={styles.search}>
      <span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the world"/>
      {query&&<button type="button" onClick={()=>setQuery("")}>×</button>}
    </div>

    <nav className={styles.realms}>
      <button type="button" className={topic==="All"&&!query?styles.chosen:""} onClick={exit}>WORLD</button>
      {topics.slice(0,7).map(t=><button type="button" key={t} className={topic===t?styles.chosen:""} onClick={()=>enterTopic(t)}>{t}</button>)}
    </nav>

    <div className={styles.signalBar}>
      <span>ATTENTION · {visible.length} MATCHES</span>
      {["All","Now Moving","Breaking Out","On the Rise","Under the Radar","Just Dropped","Live"].map(s=>
        <button type="button" key={s} className={signal===s?styles.chosen:""} onClick={()=>setAttention(s)}>{s}</button>
      )}
    </div>

    {mode!=="world"&&<div className={styles.realmStatus}>
      <b>{topic==="All"?"GLOBAL ATTENTION":topic.toUpperCase()}</b>
      <span>{visible.length} signals in this space</span>
      <button type="button" onClick={exit}>← RETURN TO WORLD</button>
    </div>}

    {loading&&<div className={styles.status}>CONNECTING TO DISCOVERY…</div>}
    {error&&<div className={styles.statusError}>DISCOVERY OFFLINE · <button type="button" onClick={refresh}>RETRY</button></div>}
    {!loading&&!error&&visible.length===0&&<div className={styles.empty}>NO SIGNALS MATCH THIS SPACE</div>}

    {selected&&<aside className={styles.portal}>
      <button type="button" className={styles.portalClose} onClick={exit}>CLOSE ×</button>
      <div className={styles.portalMeta}>{selected.metadata?.signal||"OBSERVED"} · {selected.topic} · {selected.region}</div>
      <h2>{selected.title}</h2><p>{selected.channel_title}</p>
      <div className={styles.portalStats}>
        <span>{fmt(selected.views)}<small>VIEWS</small></span>
        <span>{selected.metadata?.momentum_score??0}<small>MOMENTUM</small></span>
        <span>{age(selected.published_at)}<small>AGE</small></span>
      </div>
      <p className={styles.sourceHint}>{selected.description?.slice(0,180)||"Live discovery signal detected by RALLIVIO."}</p>
      <a href={selected.url} target="_blank" rel="noreferrer">ENTER SOURCE ↗</a>
    </aside>}

    <div className={styles.hint}>
      {mode==="world"?"MOVE TO LOOK · CLICK A REALM · ENTER":mode==="realm"?"CLICK A SIGNAL PORTAL · INSPECT THE SIGNAL":"SIGNAL LOCKED · OPEN SOURCE OR RETURN"}
      <span>RALLIVIO / LIVE · DOUBLE-CLICK TO RETURN</span>
    </div>
  </main>;
}
