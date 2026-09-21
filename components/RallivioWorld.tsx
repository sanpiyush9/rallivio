"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Float, Line, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

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

const SIGNALS = ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped"];
const SOURCES = ["ALL", "YOUTUBE", "INSTAGRAM", "TIKTOK", "X", "REDDIT"];
const TOPICS = ["AI & Tech","Gaming","Music","Sports","Entertainment","Food","News","Pets","Beauty","Travel","Business","Finance","Fitness","Fashion","Science","Education","Automotive"];

function compact(n?: number) {
  if (!n) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toLocaleString();
}

function Spiral({ items, selected, onSelect }: { items: Item[]; selected: Item | null; onSelect: (x: Item) => void }) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const count = Math.max(items.length, 28);
    return Array.from({ length: count }, (_, i) => {
      const t = i / Math.max(1, count - 1);
      const angle = t * Math.PI * 7.5;
      const radius = 1.2 + t * 7.2;
      return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.58, -t * 7);
    });
  }, [items.length]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.z += delta * 0.035;
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.08;
  });

  return (
    <group ref={group}>
      <Line points={points} color="#62eaff" transparent opacity={0.22} lineWidth={1} />
      {points.map((p, i) => {
        const item = items[i % Math.max(1, items.length)];
        if (!item) return null;
        const scale = selected?.id === item.id ? 1.22 : 1;
        return (
          <Float key={i} speed={1.2 + (i % 4) * 0.2} rotationIntensity={0.15} floatIntensity={0.25}>
            <group position={p} scale={scale} onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
              <mesh>
                <sphereGeometry args={[0.11 + (i % 5) * 0.025, 16, 16]} />
                <meshStandardMaterial color={selected?.id === item.id ? "#ffffff" : i % 5 === 0 ? "#b66cff" : "#5fe2ff"} emissive={selected?.id === item.id ? "#ffffff" : "#1685b5"} emissiveIntensity={2.5} />
              </mesh>
              <Html distanceFactor={11} center transform sprite>
                <button className="rv3-node" onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
                  <span>{item.metadata?.signal || "SIGNAL"}</span>
                  <b>{item.title}</b>
                  <small>{item.channel_title} · {item.topic || "WORLD"}</small>
                </button>
              </Html>
            </group>
          </Float>
        );
      })}
      <mesh position={[0, 0, -7.5]}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color="#0b2d42" emissive="#1f9dca" emissiveIntensity={2.8} transparent opacity={0.9} />
      </mesh>
      <Html position={[0, 0, -6.6]} center>
        <div className="rv3-core">
          <strong>RALLIVIO</strong>
          <span>LIVE ATTENTION FIELD</span>
        </div>
      </Html>
    </group>
  );
}

function World({ items, selected, onSelect }: { items: Item[]; selected: Item | null; onSelect: (x: Item) => void }) {
  const stars = useMemo(() => Array.from({ length: 700 }, () => [
    (Math.random() - 0.5) * 34,
    (Math.random() - 0.5) * 20,
    -Math.random() * 26
  ] as [number, number, number]), []);

  const starRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (starRef.current) starRef.current.rotation.z += delta * 0.006;
  });

  return (
    <>
      <ambientLight intensity={0.28} />
      <pointLight position={[0, 0, 3]} intensity={20} color="#5fe2ff" distance={18} />
      <pointLight position={[7, 3, -4]} intensity={12} color="#9b62ff" distance={15} />
      <points ref={starRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(stars.flat()), 3]} count={stars.length} array={new Float32Array(stars.flat())} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#8defff" transparent opacity={0.6} />
      </points>
      <Spiral items={items} selected={selected} onSelect={onSelect} />
    </>
  );
}

export default function RallivioWorld() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [source, setSource] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const [signal, setSignal] = useState("ALL");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ pool: 0, signals: 0, creators: 0, topics: 0 });
  const [promote, setPromote] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/discovery?limit=100", { cache: "no-store" });
        const b: Record<string, unknown> = await r.json();
        if (!alive || !r.ok || b.ok !== true) return;
        const next = Array.isArray(b.items) ? b.items as Item[] : [];
        setItems(next);
        setStats({
          pool: Number(b.poolCount ?? 0),
          signals: Number(b.verifiedSignalCount ?? 0),
          creators: Number(b.trackedCreators ?? 0),
          topics: Number(b.activeTopics ?? 0),
        });
      } catch {}
    };
    void load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const filtered = useMemo(() => items.filter(x =>
    (topic === "ALL" || x.topic === topic) &&
    (signal === "ALL" || x.metadata?.signal === signal) &&
    (!query || x.title.toLowerCase().includes(query.toLowerCase()) || x.channel_title.toLowerCase().includes(query.toLowerCase()))
  ), [items, topic, signal, query]);

  const spiralItems = filtered.length ? filtered.slice(0, 34) : items.slice(0, 34);

  return (
    <main className="rv3">
      <div className="rv3-canvas">
        <Canvas camera={{ position: [0, 0, 13], fov: 52 }} dpr={[1, 1.6]}>
          <World items={spiralItems} selected={selected} onSelect={setSelected} />
          <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.22} dampingFactor={0.04} enableDamping />
        </Canvas>
      </div>

      <div className="rv3-vignette" />
      <header className="rv3-header">
        <Link href="/" className="rv3-logo">RALL<span>IVIO</span></Link>
        <nav>
          <a className="active" href="#discover">DISCOVER</a>
          <a href="#trending">TRENDING</a>
          <a href="#topics">TOPICS</a>
          <a href="#creators">CREATORS</a>
          <a href="#opportunities">OPPORTUNITIES</a>
        </nav>
        <button className="rv3-search-trigger" onClick={() => document.getElementById("rv3-search")?.focus()}>⌕ SEARCH</button>
      </header>

      <section id="discover" className="rv3-hero">
        <div className="rv3-eyebrow"><i /> GLOBAL ATTENTION NETWORK · LIVE DATA</div>
        <h1>WATCH THE<br /><em>INTERNET MOVE.</em></h1>
        <p>Real content enters the field. Signals accelerate. Topics form worlds. Move through the network instead of browsing another static feed.</p>
        <div className="rv3-actions">
          <button onClick={() => setPromote(true)} className="rv3-primary">PASTE CONTENT / PROMOTE ↗</button>
          <a href="#trending" className="rv3-secondary">ENTER TRENDING ↓</a>
        </div>
      </section>

      <section className="rv3-console">
        <div className="rv3-searchbox">
          <span>⌕</span>
          <input id="rv3-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any content, creator or topic..." />
          <button onClick={() => setPromote(true)}>PROMOTE</button>
        </div>
        <div className="rv3-source-row">
          {SOURCES.map(s => <button key={s} className={source === s ? "on" : ""} onClick={() => setSource(s)}>{s}</button>)}
          <span className="rv3-separator" />
          {SIGNALS.map(s => <button key={s} className={signal === s ? "on" : ""} onClick={() => setSignal(signal === s ? "ALL" : s)}>{s}</button>)}
        </div>
      </section>

      <section className="rv3-overlay-stats">
        <div><b>{stats.pool.toLocaleString()}</b><span>DISCOVERY POOL</span></div>
        <div><b>{stats.signals.toLocaleString()}</b><span>LIVE SIGNALS</span></div>
        <div><b>{stats.creators.toLocaleString()}</b><span>CREATOR NODES</span></div>
        <div><b>{stats.topics.toLocaleString()}</b><span>ACTIVE TOPICS</span></div>
      </section>

      <section id="trending" className="rv3-panel-section">
        <div className="rv3-section-label">01 / TRENDING WORLDWIDE</div>
        <div className="rv3-section-title"><h2>Attention has <em>velocity.</em></h2><p>Real discovery signals become moving objects in the field above. Select one to inspect its source and momentum.</p></div>
        <div className="rv3-trend-grid">
          {filtered.slice(0, 8).map((x, i) => (
            <button key={x.id} className="rv3-trend-card" onClick={() => setSelected(x)}>
              <img src={x.thumbnail} alt="" />
              <div><span>{x.metadata?.signal || "SIGNAL"} · {x.topic || "WORLD"}</span><b>{x.title}</b><small>{x.channel_title} · {compact(x.views)} views</small></div>
              <strong>0{i + 1}</strong>
            </button>
          ))}
        </div>
      </section>

      <section id="topics" className="rv3-panel-section">
        <div className="rv3-section-label">02 / TOPIC WORLDS</div>
        <div className="rv3-section-title"><h2>Choose a <em>world.</em></h2><p>Topics are not folders. They are living attention fields.</p></div>
        <div className="rv3-topic-row">
          {TOPICS.map(t => {
            const count = items.filter(x => x.topic === t).length;
            return <button key={t} className={topic === t ? "selected" : ""} onClick={() => setTopic(topic === t ? "ALL" : t)}><span>{String(count).padStart(2, "0")}</span><b>{t}</b><i /></button>;
          })}
        </div>
      </section>

      <section id="creators" className="rv3-panel-section">
        <div className="rv3-section-label">03 / CREATOR NETWORK</div>
        <div className="rv3-section-title"><h2>People are <em>nodes.</em></h2><p>Creators sit inside the same attention network as their content, topics and signals.</p></div>
      </section>

      <section id="opportunities" className="rv3-opportunity">
        <div><span>04 / OPPORTUNITY LAYER</span><h2>From discovery<br />to <em>distribution.</em></h2></div>
        <div className="rv3-opportunity-card"><i /><b>CONTENT PROMOTION</b><p>Paste a piece of content and RALLIVIO can place it into the discovery workflow for analysis, signal tracking and future distribution products.</p><button onClick={() => setPromote(true)}>START WITH A LINK ↗</button></div>
      </section>

      <footer className="rv3-footer"><strong>RALL<span>IVIO</span></strong><small>THE OPERATING SYSTEM FOR GLOBAL ATTENTION</small></footer>

      {selected && <div className="rv3-modal" onClick={() => setSelected(null)}>
        <div className="rv3-modal-card" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelected(null)}>×</button>
          <img src={selected.thumbnail} alt="" />
          <div><span>{selected.metadata?.signal || "SIGNAL"} · {selected.topic || "WORLD"} · {selected.region || "GLOBAL"}</span><h3>{selected.title}</h3><p>{selected.channel_title}</p><small>{compact(selected.views)} views · momentum {selected.metadata?.momentum_score ?? "—"}</small><a href={selected.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></div>
        </div>
      </div>}

      {promote && <div className="rv3-modal" onClick={() => setPromote(false)}>
        <div className="rv3-promote" onClick={(e) => e.stopPropagation()}>
          <button className="rv3-x" onClick={() => setPromote(false)}>×</button>
          <span>RALLIVIO / PROMOTE</span><h3>Put content into the attention field.</h3><p>Paste a public content URL to begin the discovery workflow.</p>
          <input autoFocus placeholder="https://youtube.com/...  /  instagram.com/..." />
          <button className="rv3-primary">ANALYZE CONTENT ↗</button>
        </div>
      </div>}
    </main>
  );
}
