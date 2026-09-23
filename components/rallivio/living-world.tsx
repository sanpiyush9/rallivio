"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";

type LivingWorldProps = { events?: Array<{ id?: string; score?: number; topic?: string; region?: string }> };
const points = [[51.5,-0.1],[40.7,-74],[37.8,-122.4],[35.7,139.7],[28.6,77.2],[1.35,103.8],[-33.9,151.2],[25.2,55.3],[48.8,2.3],[52.5,13.4],[19.4,-99.1],[-23.5,-46.6],[30,31.2],[6.5,3.4],[59.3,18.1]] as const;
function latLon(lat:number,lon:number,r:number){const p=(90-lat)*Math.PI/180;const t=(lon+180)*Math.PI/180;return{x:-r*Math.sin(p)*Math.cos(t),y:r*Math.cos(p),z:r*Math.sin(p)*Math.sin(t)}}

export default function LivingWorld({events=[]}:LivingWorldProps){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{let disposed=false;let cleanup:(()=>void)|undefined;
  (async()=>{const THREE:any=await import("three");if(disposed||!ref.current)return;const host=ref.current;
   const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,.05,4.35);
   const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
   const root=new THREE.Group();scene.add(root);
   const globe=new THREE.Mesh(new THREE.SphereGeometry(1.28,64,64),new THREE.MeshPhongMaterial({color:0x06233f,emissive:0x031426,shininess:80,transparent:true,opacity:.96}));root.add(globe);
   root.add(new THREE.Mesh(new THREE.SphereGeometry(1.285,32,20),new THREE.MeshBasicMaterial({color:0x25bfff,wireframe:true,transparent:true,opacity:.095})));
   root.add(new THREE.Mesh(new THREE.SphereGeometry(1.34,48,48),new THREE.MeshBasicMaterial({color:0x159eff,transparent:true,opacity:.065,side:THREE.BackSide})));
   const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=512;const ctx=canvas.getContext("2d")!;const g=ctx.createLinearGradient(0,0,0,512);g.addColorStop(0,"#061a30");g.addColorStop(.5,"#073254");g.addColorStop(1,"#031224");ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);ctx.strokeStyle="rgba(64,204,255,.14)";ctx.lineWidth=1;
   for(let x=0;x<1024;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke()}for(let y=0;y<512;y+=51){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1024,y);ctx.stroke()}
   const land=[[70,130,130,92,205,105,255,145,225,190,175,180,145,220,98,202,72,165],[260,245,315,255,340,310,310,365,275,390,255,345,270,300],[430,120,475,98,520,120,545,165,510,190,475,172,450,210,410,175],[515,220,570,195,650,210,710,250,685,295,625,305,590,350,545,330,525,285],[735,115,790,100,835,125,860,160,825,180,785,160,755,195,720,165],[830,260,885,250,925,285,910,330,860,325,835,300],[905,390,950,380,975,410,945,440,905,430]];
   ctx.fillStyle="rgba(31,156,164,.62)";ctx.shadowColor="#21c9ff";ctx.shadowBlur=10;land.forEach(poly=>{ctx.beginPath();for(let i=0;i<poly.length;i+=2){if(i===0)ctx.moveTo(poly[i],poly[i+1]);else ctx.lineTo(poly[i],poly[i+1])}ctx.closePath();ctx.fill()});
   const texture=new THREE.CanvasTexture(canvas);globe.material.map=texture;globe.material.needsUpdate=true;
   scene.add(new THREE.AmbientLight(0x5fbaff,1.25));const key=new THREE.DirectionalLight(0x8bdcff,2.2);key.position.set(3,2,4);scene.add(key);
   const pointGeo=new THREE.SphereGeometry(.025,8,8);const pointMats=[0x40e8ff,0xa86dff,0x4dffb4,0xffffff];const dots:any[]=[];
   points.forEach(([lat,lon],i)=>{const p=latLon(lat,lon,1.315);const dot=new THREE.Mesh(pointGeo,new THREE.MeshBasicMaterial({color:pointMats[i%pointMats.length]}));dot.position.set(p.x,p.y,p.z);root.add(dot);dots.push(dot)});
   const arcGroup=new THREE.Group();root.add(arcGroup);const makeArc=(a:readonly [number,number],b:readonly [number,number],color:number,lift:number)=>{const pa=latLon(a[0],a[1],1.31),pb=latLon(b[0],b[1],1.31);const va=new THREE.Vector3(pa.x,pa.y,pa.z),vb=new THREE.Vector3(pb.x,pb.y,pb.z);const mid=va.clone().add(vb).multiplyScalar(.5).normalize().multiplyScalar(1.31+lift);arcGroup.add(new THREE.Line(new THREE.QuadraticBezierCurve3(va,mid,vb),new THREE.LineBasicMaterial({color,transparent:true,opacity:.5})))};
   [[0,1],[1,2],[1,3],[3,4],[4,6],[5,8],[8,9],[7,10],[2,11],[6,12],[9,13]].forEach(([a,b],i)=>makeArc(points[a],points[b],i%2?0x9a63ff:0x24d8ff,.22+(i%3)*.08));
   const pulseGroup=new THREE.Group();root.add(pulseGroup);const pulseRings:any[]=[];points.slice(0,9).forEach(([lat,lon],i)=>{const p=latLon(lat,lon,1.325);const ring=new THREE.Mesh(new THREE.RingGeometry(.025,.032,24),new THREE.MeshBasicMaterial({color:pointMats[i%pointMats.length],transparent:true,opacity:.75,side:THREE.DoubleSide}));ring.position.set(p.x,p.y,p.z);ring.lookAt(0,0,0);pulseGroup.add(ring);pulseRings.push(ring)});
   const starGeo=new THREE.BufferGeometry();const starCount=420;const arr=new Float32Array(starCount*3);for(let i=0;i<starCount;i++){const r=3.1+Math.random()*3.4,a=Math.random()*Math.PI*2,z=Math.random()*2-1,s=Math.sqrt(1-z*z);arr[i*3]=r*s*Math.cos(a);arr[i*3+1]=r*z;arr[i*3+2]=r*s*Math.sin(a)}starGeo.setAttribute("position",new THREE.BufferAttribute(arr,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x7fdcff,size:.018,transparent:true,opacity:.65})));
   const clock=new THREE.Clock();let frame=0;const animate=()=>{if(disposed)return;frame=requestAnimationFrame(animate);const t=clock.getElapsedTime();root.rotation.y=t*.055;root.rotation.x=Math.sin(t*.11)*.035;dots.forEach((d:any,i:number)=>d.scale.setScalar(1+Math.sin(t*2.4+i)*.35));pulseRings.forEach((p:any,i:number)=>{const v=(t*.05+i*.17)%1;p.scale.setScalar(1+v*8);p.material.opacity=(1-v)*.55});renderer.render(scene,camera)};
   const resize=()=>{const w=host.clientWidth||500,h=host.clientHeight||400;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};resize();const ro=new ResizeObserver(resize);ro.observe(host);animate();
   cleanup=()=>{cancelAnimationFrame(frame);ro.disconnect();renderer.dispose();texture.dispose();if(host.contains(renderer.domElement))host.removeChild(renderer.domElement);scene.traverse((o:any)=>{const m=o.material;if(m&&!Array.isArray(m))m.dispose?.();o.geometry?.dispose?.()})};
  })();return()=>{disposed=true;cleanup?.()};
 },[events.length]);
 return <div ref={ref} className="living-world" aria-label="RALLIVIO live world visualization"/>;
}
