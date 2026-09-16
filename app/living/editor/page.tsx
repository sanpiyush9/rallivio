"use client";

import { useMemo, useRef, useState } from "react";

const PLATFORMS = [
  ["YouTube", "youtube", 50, 8],
  ["Instagram", "instagram", 29, 13.6],
  ["TikTok", "tiktok", 71, 13.6],
  ["X", "x", 13.6, 29],
  ["LinkedIn", "linkedin", 86.4, 29],
  ["Facebook", "facebook", 8, 50],
  ["Reddit", "reddit", 92, 50],
  ["Twitch", "twitch", 13.6, 71],
  ["Discord", "discord", 86.4, 71],
  ["Spotify", "spotify", 29, 86.4],
  ["Pinterest", "pinterest", 50, 92],
  ["Snapchat", "snapchat", 71, 86.4],
] as const;

type P = { name: string; kind: string; x: number; y: number };

const icon = (kind: string) => {
  const common = { width: 30, height: 30, viewBox: "0 0 32 32", fill: "none" };
  switch (kind) {
    case "youtube": return <svg {...common}><rect x="3" y="7" width="26" height="18" rx="5" fill="currentColor"/><path d="M13 11.5 22 16l-9 4.5v-9Z" fill="#0b0d20"/></svg>;
    case "instagram": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="6" stroke="currentColor" strokeWidth="3"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="3"/><circle cx="23" cy="9" r="1.7" fill="currentColor"/></svg>;
    case "tiktok": return <svg {...common}><path d="M19 5c.4 3.3 2.1 5.2 5 5.7v4.2c-2.2-.1-4-.8-5.6-2v7.3a6.1 6.1 0 1 1-5.2-6v4.2a2 2 0 1 0 1 1.8V5H19Z" fill="currentColor"/></svg>;
    case "x": return <svg {...common}><path d="M7 6h5.1l4.1 5.8L21.1 6H25l-7 8.1L25.4 26h-5.1l-4.9-6.8L9.4 26H5.5l7.4-8.5L7 6Z" fill="currentColor"/></svg>;
    case "linkedin": return <svg {...common}><rect x="5" y="5" width="22" height="22" rx="3" fill="currentColor"/><circle cx="10" cy="11" r="1.7" fill="#0b0d20"/><path d="M8.7 14h2.7v9H8.7v-9Zm4.5 0h2.6v1.2c.8-1 1.8-1.6 3.4-1.6 2.7 0 3.9 1.7 3.9 4.6V23h-2.7v-4.4c0-1.4-.5-2.3-1.7-2.3-1.3 0-1.8 1-1.8 2.4V23h-2.7v-9Z" fill="#0b0d20"/></svg>;
    case "spotify": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M10 13c4.4-1.1 8.2-.7 11.7.9M10.8 17c3.6-.8 6.8-.5 9.7.7M12 20.5c2.5-.5 4.8-.2 6.8.6" stroke="#0b0d20" strokeWidth="2" strokeLinecap="round"/></svg>;
    case "twitch": return <svg {...common}><path d="M5 5h22v16l-5 5h-6l-4 3v-3H5V5Z" fill="currentColor"/><path d="M10 10h3v7h-3v-7Zm7 0h3v7h-3v-7Z" fill="#0b0d20"/></svg>;
    case "facebook": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M18 10h2V6.5c-.7-.1-1.6-.2-2.7-.2-3.1 0-5.2 1.9-5.2 5.4v2.9H9v3.8h3.1V26h3.9v-7.6h3.2l.5-3.8H16v-2.4c0-1.1.3-2.2 2-2.2Z" fill="#0b0d20"/></svg>;
    case "pinterest": return <svg {...common}><circle cx="16" cy="16" r="12" fill="currentColor"/><path d="M14 24c.7-2 1-3.1 1.4-4.8-.9-.8-1.4-2-1.4-3.5 0-2.7 1.8-4.9 4.2-4.9 2 0 3.4 1.5 3.4 3.5 0 2.3-1.1 5.1-3.1 5.1-1 0-1.8-.8-1.6-1.9l.6-2.5c.3-1 .1-1.8-.8-1.8-1 0-1.7 1-1.7 2.3 0 .9.3 1.5.3 1.5l-1.1 4.5c-.3 1.2-.1 2.7 0 3.5Z" fill="#0b0d20"/></svg>;
    case "reddit": return <svg {...common}><circle cx="16" cy="17" r="9" fill="currentColor"/><path d="M11.5 16.5h.1m8.8 0h.1M13 20c1.8 1.4 4.2 1.4 6 0M19.5 11l1-3 3 .7" stroke="#0b0d20" strokeWidth="1.8" strokeLinecap="round"/></svg>;
    case "discord": return <svg {...common}><path d="M6.5 8.5c4.2-2.2 14.8-2.2 19 0l2 13c-3.4 2.5-6.6 3.4-9.5 3.6l-1.5-2.1c1.5-.4 2.7-1 3.7-1.7-4 .9-5.9.9-10 0 1 .7 2.2 1.3 3.7 1.7L12.4 25c-2.9-.2-6.1-1.1-9.5-3.6l2-13Z" fill="currentColor"/><circle cx="12" cy="16" r="1.7" fill="#0b0d20"/><circle cx="20" cy="16" r="1.7" fill="#0b0d20"/></svg>;
    case "snapchat": return <svg {...common}><path d="M16 4.8c-4.2 0-6.7 3-6.7 7.2v2.3c0 .7-.4 1.2-1.2 1.7-.7.4-1.3.7-1.3 1.3 0 .7 1.2 1 2.1 1.2.7.2 1.2.5 1.4 1.1.2.8.5 1.2 1.3 1.2 1.1 0 1.8-.7 2.9-.7.9 0 1.7.8 3.5.8s2.6-.8 3.5-.8c1.1 0 1.8.7 2.9.7.8 0 1.1-.4 1.3-1.2.2-.6.7-.9 1.4-1.1.9-.2 2.1-.5 2.1-1.2 0-.6-.6-.9-1.3-1.3-.8-.5-1.2-1-1.2-1.7V12c0-4.2-2.5-7.2-6.7-7.2Z" fill="currentColor"/></svg>;
    default: return null;
  }
};

export default function LivingPositionEditor() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<P[]>(PLATFORMS.map(([name, kind, x, y]) => ({ name, kind, x, y })));
  const [selected, setSelected] = useState("YouTube");
  const [dragging, setDragging] = useState<string | null>(null);

  const begin = (e: React.PointerEvent, name: string) => {
    const stage = stageRef.current; if (!stage) return;
    e.currentTarget.setPointerCapture(e.pointerId); setDragging(name); setSelected(name);
    const move = (ev: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const x = Math.max(3, Math.min(97, ((ev.clientX - r.left) / r.width) * 100));
      const y = Math.max(3, Math.min(97, ((ev.clientY - r.top) / r.height) * 100));
      setPositions(prev => prev.map(p => p.name === name ? { ...p, x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) } : p));
    };
    const end = () => { setDragging(null); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", end);
  };

  const output = useMemo(() => positions.map(p => `  { id: '${p.kind}', name: '${p.name}', x: ${p.x}, y: ${p.y} },`).join("\n"), [positions]);

  return <main className="editor"><style>{`*{box-sizing:border-box}body{margin:0;background:#07091a;color:#f7f6ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.editor{min-height:100vh;padding:28px;background:radial-gradient(circle at 50% 45%,#713cff20,transparent 42%),linear-gradient(135deg,#090b21,#07081a)}.head{max-width:1100px;margin:0 auto 18px;display:flex;justify-content:space-between;gap:20px;align-items:end}.head h1{margin:0;font-size:28px}.head p{margin:6px 0 0;color:#aaa9c2;font-size:12px}.back{color:#c28aff;text-decoration:none;font-size:12px}.stage{position:relative;width:min(100%,900px);aspect-ratio:1/1;margin:0 auto;border:1px solid #ffffff22;border-radius:24px;background:radial-gradient(circle at 50% 50%,#5136a31c,transparent 38%),#080a19;overflow:hidden;touch-action:none}.ring{position:absolute;left:50%;top:50%;border:1px solid #8d5aff35;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.r1{width:34%;height:34%}.r2{width:52%;height:52%}.r3{width:72%;height:72%}.core{position:absolute;left:50%;top:50%;width:27%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%);display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#4751b5,#11152f 55%,#070a18 80%);border:1px solid #b18aff88;box-shadow:0 0 70px #7548ff55;z-index:2;font-size:clamp(18px,3vw,34px);font-weight:900}.badge{position:absolute;transform:translate(-50%,-50%);width:96px;min-height:82px;padding:9px 5px;border-radius:18px;border:1px solid #ffffff25;background:#151934;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;z-index:4;cursor:grab;touch-action:none;user-select:none}.badge:hover,.badge.selected{border-color:#b16cff;box-shadow:0 0 30px #8b4fff55;transform:translate(-50%,-50%) scale(1.06)}.badge:active{cursor:grabbing}.badge svg{width:30px;height:30px}.badge b{font-size:10px}.coord{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);font:10px ui-monospace,monospace;color:#aaa9c2;white-space:nowrap;background:#080a19cc;padding:6px 9px;border-radius:9px}.tools{max-width:900px;margin:14px auto 0;display:flex;gap:8px;flex-wrap:wrap}.tools button{border:1px solid #ffffff20;background:#ffffff08;color:#ddd;padding:9px 12px;border-radius:10px}.tools button.active{border-color:#b16cff;background:#713cff2c}.output{max-width:900px;margin:12px auto 0;padding:14px;border:1px solid #ffffff16;border-radius:14px;background:#080a19;font:11px/1.6 ui-monospace,monospace;color:#c9c4df;white-space:pre-wrap}.note{max-width:900px;margin:10px auto 0;color:#777b99;font-size:11px}`}</style><div className="head"><div><h1>RALLIVIO — Platform Position Editor</h1><p>Drag any platform anywhere. The coordinates below update live.</p></div><a className="back" href="/living">← Back to Living</a></div><div ref={stageRef} className="stage"><div className="ring r1"/><div className="ring r2"/><div className="ring r3"/><div className="core">RALL<span style={{color:"#a868ff"}}>IVIO</span></div>{positions.map(p => <button key={p.name} className={`badge ${selected === p.name ? "selected" : ""}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onPointerDown={e => begin(e,p.name)} onClick={() => setSelected(p.name)} aria-label={`Drag ${p.name}`}>{icon(p.kind)}<b>{p.name}</b></button>)}<div className="coord">{selected}: {positions.find(p=>p.name===selected)?.x}% / {positions.find(p=>p.name===selected)?.y}%</div></div><div className="tools">{positions.map(p => <button type="button" className={selected===p.name?"active":""} key={p.name} onClick={()=>setSelected(p.name)}>{p.name}</button>)}<button type="button" onClick={()=>setPositions(PLATFORMS.map(([name,kind,x,y])=>({name,kind,x,y})))}>Reset</button></div><pre className="output">{`const PLATFORMS = [\n${output}\n];`}</pre><div className="note">Send me the final coordinates when you are happy. Checkpoint 2 remains untouched.</div></main>;
}
