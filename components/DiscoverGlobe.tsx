// @ts-nocheck
/* eslint-disable */
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const REGION_COORDS = {
  AE:[24.5,54.4],AR:[-34.6,-58.4],AU:[-25.3,133.8],BR:[-14.2,-51.9],CA:[56.1,-106.3],
  CL:[-33.4,-70.7],CO:[4.6,-74.1],DE:[51.2,10.4],EG:[26.8,30.8],ES:[40.4,-3.7],
  FR:[46.2,2.2],GB:[55.4,-3.4],IN:[20.6,78.9],IT:[41.9,12.6],JP:[36.2,138.3],
  KE:[0.2,37.9],KR:[36.5,127.9],MX:[23.6,-102.6],NG:[9.1,8.7],PE:[-9.2,-75],
  SA:[23.9,45.1],SG:[1.35,103.8],TR:[38.9,35.2],US:[39.8,-98.6],ZA:[-30.6,22.9]
};
const SIGNAL_COLORS = {
  "Breaking Out":0xffc76b,"Now Moving":0x63efb0,"On the Rise":0x65dcff,
  "Under the Radar":0xb47aff,"Just Dropped":0xff8068,"Live Now":0xff6485
};
const geo=(lat,lon,r=1.09)=>{
  const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));
};

function StarField(){
  const points=useMemo(()=>{
    const positions=[];
    for(let i=0;i<1400;i++){
      const r=5+Math.random()*12,u=Math.random()*2-1,t=Math.random()*Math.PI*2,q=Math.sqrt(1-u*u);
      positions.push(r*q*Math.cos(t),r*u,r*q*Math.sin(t));
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    return g;
  },[]);
  const ref=useRef(null);
  useFrame((_,d)=>{if(ref.current)ref.current.rotation.y+=d*.003});
  return <points ref={ref} geometry={points}><pointsMaterial color={0xa8e9ff} size={.018} transparent opacity={.52}/></points>;
}

function Earth(){
  const earth=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_day_4096.jpg"),[]);
  const lights=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_lights_2048.png"),[]);
  const clouds=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_clouds_2048.png"),[]);
  const root=useRef(null),cloud=useRef(null);
  useEffect(()=>{earth.colorSpace=THREE.SRGBColorSpace;lights.colorSpace=THREE.SRGBColorSpace;clouds.colorSpace=THREE.SRGBColorSpace},[earth,lights,clouds]);
  useFrame((_,d)=>{
    if(root.current)root.current.rotation.y+=d*Math.PI*2/110;
    if(cloud.current)cloud.current.rotation.y+=d*Math.PI*2/65;
  });
  return <group ref={root} rotation={[THREE.MathUtils.degToRad(23.4),0,0]}>
    <mesh><sphereGeometry args={[1.08,72,72]}/><meshStandardMaterial map={earth} roughness={.8} metalness={.02}/></mesh>
    <mesh scale={1.002}><sphereGeometry args={[1.08,72,72]}/><meshBasicMaterial map={lights} transparent opacity={.24} blending={THREE.AdditiveBlending}/></mesh>
    <mesh ref={cloud} scale={1.097}><sphereGeometry args={[1.08,48,48]}/><meshStandardMaterial map={clouds} transparent opacity={.16}/></mesh>
    <mesh scale={1.075}><sphereGeometry args={[1.08,48,48]}/><meshBasicMaterial color={0x52dfff} transparent opacity={.08} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}

function Signals({items}){
  const data=useMemo(()=>items.slice(0,180).flatMap(s=>{
    const c=REGION_COORDS[(s.region||"").toUpperCase()];
    if(!c)return [];
    return [{...s,pos:geo(c[0],c[1]),color:SIGNAL_COLORS[s.signal]||0x65dcff,size:.012+Math.min(1,Number(s.momentum||0)/100)*.022}];
  }),[items]);
  return <group>{data.map((p,i)=><SignalNode key={p.id||i} item={p}/>)}</group>;
}
function SignalNode({item}){
  const ref=useRef(null);
  useFrame((state)=>{
    if(ref.current){
      const pulse=1+.22*Math.sin(state.clock.elapsedTime*2.5+(item.id||"").length);
      ref.current.scale.setScalar(item.size*pulse);
    }
  });
  return <group ref={ref} position={item.pos}>
    <mesh><sphereGeometry args={[1,8,8]}/><meshBasicMaterial color={item.color} transparent opacity={.95}/></mesh>
    <mesh scale={3.5}><sphereGeometry args={[1,8,8]}/><meshBasicMaterial color={item.color} transparent opacity={.035} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}

function Network({items}){
  const geometry=useMemo(()=>{
    const groups={};
    items.forEach(s=>{
      const c=REGION_COORDS[(s.region||"").toUpperCase()];
      if(!c)return;
      const key=s.topic||"Other";
      groups[key]=groups[key]||[];
      if(groups[key].length<6)groups[key].push(geo(c[0],c[1],1.105));
    });
    const positions=[];
    Object.values(groups).forEach(arr=>{
      for(let i=1;i<arr.length;i++){
        const a=arr[i-1],b=arr[i];
        for(let j=0;j<10;j++){
          const t=j/9,p=a.clone().lerp(b,t);
          p.normalize().multiplyScalar(1.105+Math.sin(Math.PI*t)*.14);
          positions.push(p.x,p.y,p.z);
        }
      }
    });
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    return g;
  },[items]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={0x61dcff} transparent opacity={.24} blending={THREE.AdditiveBlending}/></lineSegments>;
}

function World({items,progress}){
  const {camera}=useThree();
  const target=useRef(new THREE.Vector3());
  useFrame((state,d)=>{
    const anchors=[
      [0,.15,5.0],[1.2,.35,4.1],[2.0,.8,3.3],[-.8,1.9,4.4],[0,2.8,5.8]
    ];
    const x=Math.min(.999,Math.max(0,progress))*4;
    const i=Math.min(3,Math.floor(x)),t=x-i;
    target.current.set(
      anchors[i][0]+(anchors[i+1][0]-anchors[i][0])*t+state.pointer.x*.18,
      anchors[i][1]+(anchors[i+1][1]-anchors[i][1])*t+state.pointer.y*.12,
      anchors[i][2]+(anchors[i+1][2]-anchors[i][2])*t
    );
    camera.position.lerp(target.current,1-Math.exp(-d*3.2));
    camera.lookAt(Math.sin(progress*Math.PI)*.12,progress*.22,0);
  });
  return <group>
    <StarField/><Earth/><Network items={items}/><Signals items={items}/>
    {[1.16,1.21,1.27].map((r,i)=><mesh key={r} rotation={[Math.PI/(2.2+i*.6),i*.5,i*.8]}>
      <torusGeometry args={[r,.004,5,120]}/><meshBasicMaterial color={[0x5fe2ff,0x9e78ff,0x67dfb1][i]} transparent opacity={.28} blending={THREE.AdditiveBlending}/>
    </mesh>)}
  </group>;
}

function Scene({items,progress}){
  return <Canvas camera={{position:[0,.15,5],fov:30}} dpr={[1,1.35]} gl={{alpha:true,antialias:true,powerPreference:"high-performance"}}>
    <color attach="background" args={["#020611"]}/>
    <fog attach="fog" args={["#020611",7,18]}/>
    <ambientLight intensity={.22} color={0x294b66}/>
    <directionalLight position={[-4,4,5]} intensity={3.5} color={0xd9f8ff}/>
    <pointLight position={[2,-1,3]} intensity={4} distance={8} color={0x49ddff}/>
    <World items={items} progress={progress}/><Preload all/>
  </Canvas>;
}

export default function DiscoverGlobe(){
  const [items,setItems]=useState([]),[progress,setProgress]=useState(0),[low,setLow]=useState(false),[cursor,setCursor]=useState({x:0,y:0});
  useEffect(()=>{
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak=(navigator.hardwareConcurrency||8)<=4;
    setLow(reduced||weak);
    const onScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);setProgress(Math.min(1,scrollY/max));};
    const onMove=e=>setCursor({x:e.clientX,y:e.clientY});
    addEventListener("scroll",onScroll,{passive:true});addEventListener("mousemove",onMove,{passive:true});onScroll();
    const load=async()=>{try{const r=await fetch("/api/discovery?limit=100",{cache:"no-store"});const b=await r.json();if(b?.ok)setItems((b.items||[]).map(x=>({id:x.id,region:x.region,topic:x.topic,signal:x.metadata?.signal,momentum:x.metadata?.momentum_score})));}catch{}};
    void load();const timer=setInterval(load,60000);
    return()=>{removeEventListener("scroll",onScroll);removeEventListener("mousemove",onMove);clearInterval(timer);};
  },[]);
  if(low)return <div className="globeFallback3d" aria-hidden="true"><div/></div>;
  return <div className="globeStage3d">
    <Scene items={items} progress={progress}/>
    <div className="rvWorldHud" aria-hidden="true">
      <div className="rvWorldTop"><span>RALLIVIO / WORLD</span><b>● LIVE INTELLIGENCE FIELD</b></div>
      <div className="rvWorldCenter"><strong>RALLIVIO</strong><span>GLOBAL DISCOVERY INTELLIGENCE</span></div>
      <div className="rvWorldCursor" style={{left:cursor.x,top:cursor.y}}/>
      <div className="rvWorldBottom"><span>SCROLL TO TRAVEL THROUGH THE FIELD</span><i>FIELD {String(Math.round(progress*100)).padStart(2,"0")}%</i></div>
    </div>
  </div>;
}
