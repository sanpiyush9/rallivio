/* eslint-disable */
 // @ts-nocheck
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Signal = { id:string; region?:string; topic?:string; signal?:string; momentum?:number };

const REGION_COORDS:Record<string,[number,number]>={
  AE:[24.5,54.4],AR:[-34.6,-58.4],AU:[-25.3,133.8],BR:[-14.2,-51.9],CA:[56.1,-106.3],
  CL:[-33.4,-70.7],CO:[4.6,-74.1],DE:[51.2,10.4],EG:[26.8,30.8],ES:[40.4,-3.7],
  FR:[46.2,2.2],GB:[55.4,-3.4],IN:[20.6,78.9],IT:[41.9,12.6],JP:[36.2,138.3],
  KE:[0.2,37.9],KR:[36.5,127.9],MX:[23.6,-102.6],NG:[9.1,8.7],PE:[-9.2,-75],
  SA:[23.9,45.1],SG:[1.35,103.8],TR:[38.9,35.2],US:[39.8,-98.6],ZA:[-30.6,22.9]
};
const COLORS:Record<string,number>={
  "Breaking Out":0xffc86b,"Now Moving":0x63f0b0,"On the Rise":0x64dfff,
  "Under the Radar":0xb477ff,"Just Dropped":0xff8068,"Live Now":0xff5f82ff
};
const TOPIC_COLORS:Record<string,number>={
  "AI & Tech":0x67e7ff,Entertainment:0xff77cfb5,Gaming:0xa982ff,Sports:0xffcf7b67,
  Music:0xff78a9ff,News:0xffc5d36d,Automotive:0xffe19a66,Science:0x77d8d2
};
const geo=(lat:number,lon:number,r=1.08)=>{
  const p=(90-lat)*Math.PI/180,t=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));
};

function Stars(){
  const ref=useRef<THREE.Points>(null);
  const geometry=useMemo(()=>{
    const n=1800, a=new Float32Array(n*3), s=new Float32Array(n);
    for(let i=0;i<n;i++){
      const r=5.5+Math.random()*10, u=Math.random()*2-1, t=Math.random()*Math.PI*2, q=Math.sqrt(1-u*u);
      a[i*3]=r*q*Math.cos(t); a[i*3+1]=r*u; a[i*3+2]=r*q*Math.sin(t); s[i]=Math.random();
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.BufferAttribute(a,3));
    g.setAttribute("aSize",new THREE.BufferAttribute(s,1));
    return g;
  },[]);
  useFrame((_,d)=>{if(ref.current)ref.current.rotation.y+=d*.004});
  return <points ref={ref} geometry={geometry}><pointsMaterial color={0xb9eaff} size={.018} transparent opacity={.5} sizeAttenuation/></points>;
}

function Atmosphere(){
  const material=useMemo(()=>new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{color:{value:new THREE.Color(0x55e6ff)}},
    vertexShader:"varying vec3 v;void main(){v=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:"uniform vec3 color;varying vec3 v;void main(){float f=pow(1.-max(dot(v,vec3(0,0,1)),0.),3.0);gl_FragColor=vec4(color,f*.9);}"
  }),[]);
  return <mesh scale={1.075}><sphereGeometry args={[1.08,64,64]}/><primitive object={material} attach="material"/></mesh>;
}

function Earth(){
  const earth=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_day_4096.jpg"),[]);
  const night=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_lights_2048.png"),[]);
  const clouds=useMemo(()=>new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_clouds_2048.png"),[]);
  const root=useRef<THREE.Group>(null),cloud=useRef<THREE.Mesh>(null);
  useEffect(()=>{earth.colorSpace=THREE.SRGBColorSpace;night.colorSpace=THREE.SRGBColorSpace;clouds.colorSpace=THREE.SRGBColorSpace},[earth,night,clouds]);
  useFrame((_,d)=>{
    if(root.current){root.current.rotation.y+=d*Math.PI*2/105;root.current.rotation.z=THREE.MathUtils.degToRad(23.4)}
    if(cloud.current)cloud.current.rotation.y+=d*Math.PI*2/62;
  });
  return <group ref={root}>
    <mesh><sphereGeometry args={[1.08,96,96]}/><meshStandardMaterial map={earth} roughness={.78} metalness={.02}/></mesh>
    <mesh scale={1.003}><sphereGeometry args={[1.08,96,96]}/><meshBasicMaterial map={night} transparent opacity={.22} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
    <mesh ref={cloud} scale={1.096}><sphereGeometry args={[1.08,64,64]}/><meshStandardMaterial map={clouds} transparent opacity={.17} depthWrite={false}/></mesh>
    <Atmosphere/>
  </group>;
}

function SignalField({signals,selected,setSelected}:{signals:Signal[];selected:string|null;setSelected:(id:string)=>void}){
  const mesh=useRef<THREE.InstancedMesh>(null), pulse=useRef<THREE.InstancedMesh>(null);
  const data=useMemo(()=>signals.slice(0,220).flatMap(s=>{
    const c=REGION_COORDS[(s.region||"").toUpperCase()]; if(!c)return [];
    const p=geo(c[0],c[1],1.095);
    return [{...s,pos:p,color:COLORS[s.signal||"Now Moving"]||0x65ddff,size:.012+Math.min(1,Number(s.momentum||0)/100)*.026}];
  }),[signals]);
  useEffect(()=>{
    if(!mesh.current)return;
    const o=new THREE.Object3D();
    data.forEach((p,i)=>{o.position.copy(p.pos);o.scale.setScalar(p.size);o.updateMatrix();mesh.current!.setMatrixAt(i,o.matrix);mesh.current!.setColorAt(i,new THREE.Color(p.color))});
    mesh.current.count=data.length;mesh.current.instanceMatrix.needsUpdate=true;mesh.current.instanceColor!.needsUpdate=true;
  },[data]);
  useEffect(()=>{
    if(!pulse.current)return;
    const o=new THREE.Object3D();
    data.forEach((p,i)=>{o.position.copy(p.pos);o.scale.setScalar(p.size*3.4);o.updateMatrix();pulse.current!.setMatrixAt(i,o.matrix);pulse.current!.setColorAt(i,new THREE.Color(p.color))});
    pulse.current.count=data.length;pulse.current.instanceMatrix.needsUpdate=true;pulse.current.instanceColor!.needsUpdate=true;
  },[data]);
  useFrame((state)=>{
    const t=state.clock.elapsedTime;
    if(pulse.current)for(let i=0;i<data.length;i++){
      const p=data[i],o=new THREE.Object3D();o.position.copy(p.pos);
      const k=1+(.55+.45*Math.sin(t*2.2+i*.37))*1.5;
      o.scale.setScalar(p.size*2.2*k);o.updateMatrix();pulse.current.setMatrixAt(i,o.matrix);
    }
    if(pulse.current)pulse.current.instanceMatrix.needsUpdate=true;
  });
  return <>
    <instancedMesh ref={pulse} args={[undefined as any,undefined as any,Math.max(1,data.length)]}
      onPointerDown={(e)=>{e.stopPropagation();const i=(e as any).instanceId;if(i!=null&&data[i])setSelected(data[i].id)}}>
      <sphereGeometry args={[1,6,6]}/><meshBasicMaterial vertexColors transparent opacity={.055} blending={THREE.AdditiveBlending}/>
    </instancedMesh>
    <instancedMesh ref={mesh} args={[undefined as any,undefined as any,Math.max(1,data.length)]}
      onPointerDown={(e)=>{e.stopPropagation();const i=(e as any).instanceId;if(i!=null&&data[i])setSelected(data[i].id)}}>
      <sphereGeometry args={[1,8,8]}/><meshBasicMaterial vertexColors transparent opacity={.95}/>
    </instancedMesh>
  </>;
}

function Network({signals}:{signals:Signal[]}){
  const geometry=useMemo(()=>{
    const by=new Map<string,THREE.Vector3[]>();
    signals.forEach(s=>{const c=REGION_COORDS[(s.region||"").toUpperCase()];if(!c)return;const a=by.get(s.topic||"Other")||[];if(a.length<7)a.push(geo(c[0],c[1],1.1));by.set(s.topic||"Other",a)});
    const pts:number[]=[];by.forEach((arr,topic)=>{
      for(let i=1;i<arr.length;i++){
        const a=arr[i-1],b=arr[i],color=new THREE.Color(TOPIC_COLORS[topic]||0x58dfff);
        for(let j=0;j<12;j++){const q=j/11,p=a.clone().lerp(b,q);p.normalize().multiplyScalar(1.105+Math.sin(Math.PI*q)*.18);pts.push(p.x,p.y,p.z,color.r,color.g,color.b)}
      }
    });
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pts.filter((_,i)=>i%6<3),3));
    return g;
  },[signals]);
  return <lineSegments geometry={geometry}><lineBasicMaterial color={0x5bdfff} transparent opacity={.28} blending={THREE.AdditiveBlending}/></lineSegments>;
}

function World({signals,progress,selected,setSelected}:{signals:Signal[];progress:number;selected:string|null;setSelected:(id:string)=>void}){
  const {camera}=useThree(), group=useRef<THREE.Group>(null);
  const anchors=useMemo(()=>[
    new THREE.Vector3(.1,.15,5.1),new THREE.Vector3(1.2,.4,4.0),new THREE.Vector3(2.2,.8,3.2),
    new THREE.Vector3(-.8,2.0,4.3),new THREE.Vector3(0,2.8,5.7)
  ],[]);
  useFrame((state,d)=>{
    const x=Math.min(.999,Math.max(0,progress))*4,i=Math.min(3,Math.floor(x)),t=x-i;
    const target=anchors[i].clone().lerp(anchors[i+1],t);
    target.x+=state.pointer.x*.22;target.y+=state.pointer.y*.14;
    camera.position.lerp(target,1-Math.exp(-d*3.4));
    camera.lookAt(Math.sin(progress*Math.PI)*.12,progress*.22,0);
    if(group.current)group.current.rotation.y=Math.sin(state.clock.elapsedTime*.06)*.04;
  });
  return <group ref={group}>
    <Earth/><Network signals={signals}/><SignalField signals={signals} selected={selected} setSelected={setSelected}/>
    {[1.17,1.22,1.28].map((r,i)=><mesh key={r} rotation={[Math.PI/(2.1+i*.7),i*.5,i*.8]}><torusGeometry args={[r,.0045,5,128]}/><meshBasicMaterial color={[0x63e4ff,0x9d7aff,0x69e3b5][i]} transparent opacity={.3} blending={THREE.AdditiveBlending}/></mesh>)}
    <mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[1.42,.012,6,128]}/><meshBasicMaterial color={0x54dcff} transparent opacity={.08} blending={THREE.AdditiveBlending}/></mesh>
  </group>;
}

function Scene({signals,progress,selected,setSelected}:{signals:Signal[];progress:number;selected:string|null;setSelected:(id:string)=>void}){
  return <Canvas camera={{position:[.1,.15,5.1],fov:30}} dpr={[1,1.5]} gl={{alpha:true,antialias:true,powerPreference:"high-performance"}} frameloop="always">
    <color attach="background" args={["#020611"]}/>
    <fog attach="fog" args={["#020611",7,17]}/>
    <ambientLight intensity={.2} color={0x28455d}/>
    <directionalLight position={[-4,4,5]} intensity={3.6} color={0xd8f6ff}/>
    <pointLight position={[2,-1,3]} intensity={5} distance={8} color={0x49dfff}/>
    <Stars/><World signals={signals} progress={progress} selected={selected} setSelected={setSelected}/><Preload all/>
  </Canvas>;
}

export default function DiscoverGlobe(){
  const [signals,setSignals]=useState<Signal[]>([]),[progress,setProgress]=useState(0),[low,setLow]=useState(false),[selected,setSelected]=useState<string|null>(null);
  const [cursor,setCursor]=useState({x:0,y:0});
  const selectedSignal=signals.find(s=>s.id===selected);
  useEffect(()=>{
    const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,weak=(navigator.hardwareConcurrency||8)<=4;
    setLow(reduced||weak);
    const scroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);setProgress(Math.min(1,scrollY/max))};
    const move=(e:MouseEvent)=>setCursor({x:e.clientX,y:e.clientY});
    addEventListener("scroll",scroll,{passive:true});addEventListener("mousemove",move,{passive:true});scroll();
    const load=async()=>{try{const r=await fetch("/api/discovery?limit=100",{cache:"no-store"});const b=await r.json();if(b?.ok)setSignals((b.items||[]).map((x:any)=>({id:x.id,region:x.region,topic:x.topic,signal:x.metadata?.signal,momentum:x.metadata?.momentum_score})));}catch{}};
    void load();const timer=setInterval(load,60000);
    return()=>{removeEventListener("scroll",scroll);removeEventListener("mousemove",move);clearInterval(timer)};
  },[]);
  if(low)return <div className="globeFallback3d" aria-hidden="true"><div/></div>;
  return <div className="globeStage3d" aria-label="RALLIVIO immersive discovery world">
    <Scene signals={signals} progress={progress} selected={selected} setSelected={setSelected}/>
    <div className="rvWorldHud" aria-hidden="true">
      <div className="rvWorldTop"><span>RALLIVIO / WORLD</span><b>● LIVE INTELLIGENCE FIELD</b></div>
      <div className="rvWorldCenter"><strong>RALLIVIO</strong><span>GLOBAL DISCOVERY INTELLIGENCE</span></div>
      <div className="rvWorldCursor" style={{left:cursor.x,top:cursor.y}}/>
      <div className="rvWorldBottom"><span>SCROLL TO TRAVEL</span><i>FIELD {String(Math.round(progress*100)).padStart(2,"0")}%</i></div>
      {selectedSignal&&<div className="rvWorldSelection"><small>SIGNAL DETECTED</small><b>{selectedSignal.topic||"DISCOVERY"}</b><span>{selectedSignal.signal||"VERIFIED"} · MOMENTUM {selectedSignal.momentum??"—"}</span></div>}
    </div>
  </div>;
}
