"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Line, OrbitControls } from "@react-three/drei";
import Link from "next/link";
import RallivioField from "./RallivioField";
import { useEffect, useMemo, useRef, useState } from "react";
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
  metadata?: {
    signal?: string;
    momentum_score?: number;
    subscriber_count?: number | null;
  };
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

function Field({ items, active, onSelect, scene }: { items: Item[]; active: Item | null; onSelect: (x: Item) => void; scene: number }) {
  const group = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line>(null);
  const nodes = useMemo(() => {
    const source = items.slice(0, 18);
    return source.map((item, i) => {
      const a = (i / Math.max(source.length, 1)) * Math.PI * 2 + scene * 0.22;
      const r = 2.1 + (i % 5) * 0.48;
      return { item, position: [Math.cos(a) * r, Math.sin(a * 1.7) * 1.45, Math.sin(a) * 2.2 - 1.5] as [number,number,number], scale: 0.72 + (i % 4) * 0.12 };
    });
  }, [items, scene]);

  const orbit = useMemo(() => Array.from({ length: 64 }, (_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 4.5, Math.sin(a) * 1.6, Math.sin(a) * 3.2);
  }), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.035;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  return (
    <group ref={group}>
      <Line points={orbit} color="#8defff" transparent opacity={0.16} lineWidth={1} />
      <Line points={orbit.map(p => new THREE.Vector3(p.x * 0.72, p.y * 0.7 + 1.1, p.z * 0.72))} color="#a678ff" transparent opacity={0.12} lineWidth={1} />
      <mesh>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshStandardMaterial color="#071725" emissive="#3bdcff" emissiveIntensity={3.2} metalness={0.55} roughness={0.2} transparent opacity={0.95} />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[0.82, 24, 24]} />
        <meshBasicMaterial color="#49dfff" transparent opacity={0.035} wireframe />
      </mesh>
      {nodes.map(({ item, position, scale }, i) => (
        <Float key={item.id + i} speed={1 + i * 0.035} rotationIntensity={0.12} floatIntensity={0.28}>
          <group position={position} scale={active?.id === item.id ? scale * 1.25 : scale} onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
            <mesh>
              <sphereGeometry args={[0.13 + (i % 3) * 0.035, 18, 18]} />
              <meshStandardMaterial color={active?.id === item.id ? "#fff" : i % 3 === 0 ? "#b77cff" : "#5ee9ff"} emissive={active?.id === item.id ? "#fff" : "#39cfff"} emissiveIntensity={4} />
            </mesh>
            <Html distanceFactor={9} center>
              <button className="rmw-node" onClick={(e) => { e.stopPropagation(); onSelect(item); }}>
                <span>{item.metadata?.signal || "SIGNAL"}</span>
                <b>{item.title}</b>
                <small>{item.channel_title} · {item.topic || "WORLD"}</small>
              </button>
            </Html>
          </group>
        </Float>
      ))}
      <Html position={[0, 0, 1.05]} center>
        <div className="rmw-core-label"><b>RALLIVIO</b><span>ATTENTION FIELD</span></div>
      </Html>
    </group>
  );
}

function Atmosphere({ scene }: { scene: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      a[i * 3] = (Math.random() - 0.5) * 30;
      a[i * 3 + 1] = (Math.random() - 0.5) * 18;
      a[i * 3 + 2] = -Math.random() * 20;
    }
    return a;
  }, []);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.z += delta * 0.004;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });
  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight position={[0, 1, 5]} intensity={24} color="#54eaff" distance={20} />
      <pointLight position={[-6, 3, -2]} intensity={16} color="#8f5cff" distance={17} />
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.018} color="#8eefff" transparent opacity={0.5} />
      </points>
      <mesh position={[0,0,-5]} rotation={[0.2,0.2,0]}>
        <sphereGeometry args={[6.8, 48, 48]} />
        <meshBasicMaterial color="#123c58" transparent opacity={0.055} wireframe />
      </mesh>
      <group position={[0, 0, scene * 0.18]}>
        <Field items={[]} active={null} onSelect={() => {}} scene={scene} />
      </group>
    </>
  );
}

export default function RallivioMotionWorld() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [source, setSource] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const [signal, setSignal] = useState("ALL");
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState({ pool: 0, signals: 0, creators: 0, topics: 0 });
  const [promote, setPromote] = useState(false);
  const [scene, setScene] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/discovery?limit=100", { cache: "no-store" });
        const b: Record<string, unknown> = await r.json();
        if (!alive || !r.ok || b.ok !== true) return;
        setItems(Array.isArray(b.items) ? b.items as Item[] : []);
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
    const onScroll = () => {
      const y = window.scrollY;
      const h = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      setScene(Math.min(4, Math.floor((y / h) * 5)));
    };
    const onMove = (e: MouseEvent) => setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { alive = false; clearInterval(id); window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMove); };
  }, []);

  const filtered = useMemo(() => items.filter(x => {
    const hay = (x.title + " " + x.channel_title + " " + (x.topic || "")).toLowerCase();
    const sourceMatch = source === "ALL" || (x.metadata as Record<string, unknown> | undefined)?.source?.toString().toUpperCase() === source;
    return (topic === "ALL" || x.topic === topic) &&
      (signal === "ALL" || x.metadata?.signal === signal) &&
      sourceMatch &&
      (!query || hay.includes(query.toLowerCase()));
  }), [items, source, topic, signal, query]);

  const display = filtered.length ? filtered : items;
  const heroItems = display.slice(0, 18);

  return (
    <main className="rmw">
      <div className="rmw-backdrop" style={{ transform: `translate3d(${mouse.x * -10}px,${mouse.y * -7}px,0)` }} />
      <div className="rmw-grid" />
      <div className="rmw-canvas rmw-living-field" aria-label="Rallivio living signal field">
        <RallivioField />
      </div>

      <header className="rmw-header">
        <Link href="/" className="rmw-logo">RALL<span>IVIO</span></Link>
        <nav>
          <a href="#discover">Discover</a><a href="#promote">Promote</a><a href="#creators">Creators</a><a href="#opportunities">Brands & Opportunities</a><a href="#community">Community</a><a href="#about">About</a>
        </nav>
        <button className="rmw-header-action" onClick={() => setPromote(true)}>PROMOTE ↗</button>
      </header>

      <div className="rmw-scroll-progress"><i style={{ transform: `scaleX(${Math.min(1, (scene + 1) / 5)})` }} /></div>

      <section id="discover" className="rmw-section rmw-hero">
        <div className="rmw-hero-copy">
          <span className="rmw-kicker"><i /> THE LIVING INTERNET / {new Date().getFullYear()}</span>
          <h1>SEE WHAT<br /><em>IS MOVING.</em></h1>
          <p>Discover what is moving across YouTube, Instagram, TikTok, X, Reddit and more. Promote what matters. Find creators. Find opportunities.</p>
          <div className="rmw-hero-actions"><button onClick={() => document.getElementById("signals")?.scrollIntoView({ behavior: "smooth" })}>ENTER THE FIELD ↓</button><button className="ghost" onClick={() => setPromote(true)}>PASTE A LINK ↗</button></div>
        </div>
        <div className="rmw-hero-meta"><span>WORLDWIDE</span><b>LIVE</b><small>{stats.signals.toLocaleString()} signals · {stats.pool.toLocaleString()} discovered</small></div>
        <div className="rmw-scroll-hint">SCROLL TO MOVE <span>↓</span></div>
      </section>

      <section id="signals" className="rmw-section rmw-scene">
        <div className="rmw-scene-heading"><span>01 / SIGNALS</span><h2>Attention<br /><em>has velocity.</em></h2><p>Every signal is a change in momentum. RALLIVIO surfaces the movement before it becomes obvious.</p></div>
        <div className="rmw-console">
          <div className="rmw-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the living internet" /><button onClick={() => setPromote(true)}>PROMOTE</button></div>
          <div className="rmw-filter-line">{SOURCES.map(s => <button key={s} className={source === s ? "active" : ""} onClick={() => setSource(s)}>{s}</button>)}<i />{SIGNALS.map(s => <button key={s} className={signal === s ? "active" : ""} onClick={() => setSignal(signal === s ? "ALL" : s)}>{s}</button>)}</div>
        </div>
        <div className="rmw-stats"><div><b>{stats.pool.toLocaleString()}</b><span>DISCOVERY POOL</span></div><div><b>{stats.signals.toLocaleString()}</b><span>LIVE SIGNALS</span></div><div><b>{stats.creators.toLocaleString()}</b><span>CREATOR NODES</span></div><div><b>{stats.topics.toLocaleString()}</b><span>ACTIVE TOPICS</span></div></div>
        <div className="rmw-signal-strip">
          {display.slice(0, 7).map((x, i) => <button key={x.id} onClick={() => setSelected(x)}><span>{String(i + 1).padStart(2,"0")}</span><div><small>{x.metadata?.signal || "SIGNAL"} · {x.topic || "WORLD"}</small><b>{x.title}</b><em>{x.channel_title}</em></div><strong>{compact(x.views)}</strong></button>)}
        </div>
      </section>

      <section id="promote" className="rmw-section rmw-topics">
        <div className="rmw-scene-heading"><span>02 / PROMOTE</span><h2>Put your<br /><em>content in motion.</em></h2><p>Promote a video, post, product, website or creator profile through RALLIVIO.</p></div>
        <div className="rmw-promo-steps"><div><span>01</span><b>PASTE A LINK</b><small>YouTube · Instagram · TikTok · X · Web</small></div><div><span>02</span><b>RALLIVIO DISCOVERS</b><small>Signal · topic · audience · movement</small></div><div><span>03</span><b>GET DISCOVERED</b><small>Put the right content in front of the right attention.</small></div></div>
        <button className="rmw-primary" onClick={() => setPromote(true)}>START PROMOTING ↗</button>
      </section>

      <section id="creators" className="rmw-section rmw-creators">
        <div className="rmw-scene-heading"><span>03 / CREATOR NETWORK</span><h2>People become<br /><em>nodes.</em></h2><p>Content travels through creators, topics and audiences. The network is the product.</p></div>
        <div className="rmw-network">
          <div className="rmw-network-core"><i /><b>{compact(stats.creators)}</b><span>CREATOR NODES</span></div>
          {display.slice(0, 9).map((x, i) => <button key={x.id + i} className="rmw-creator-node" style={{ "--i": i } as React.CSSProperties} onClick={() => setSelected(x)}><img src={x.thumbnail} alt="" /><span>{x.channel_title}</span><b>{x.topic || "WORLD"}</b></button>)}
        </div>
      </section>

      <section id="opportunities" className="rmw-section rmw-opportunities">
        <div><span>04 / BRANDS & OPPORTUNITIES</span><h2>Brands need.<br /><em>Creators deliver.</em></h2><p>Brands publish requirements. Creators discover opportunities. RALLIVIO connects both sides and takes a 10% commission when a deal is completed through the platform.</p></div>
        <div className="rmw-market-grid"><div className="rmw-market-card"><span>FOR BRANDS</span><h3>Find the right creator.</h3><p>Define audience, niche, platform and campaign need.</p><button className="rmw-primary">POST A REQUIREMENT ↗</button></div><div className="rmw-market-card"><span>FOR CREATORS</span><h3>Find the right opportunity.</h3><p>Browse brand requirements and apply for work that fits.</p><button className="rmw-primary">VIEW OPPORTUNITIES ↗</button></div><div className="rmw-commission"><b>10%</b><span>RALLIVIO DEAL COMMISSION</span></div></div>
      </section>

      <section id="community" className="rmw-section rmw-simple-section"><div className="rmw-scene-heading"><span>05 / COMMUNITY</span><h2>People behind<br /><em>the attention.</em></h2><p>Creators, brands and people building, discovering and sharing what is moving.</p></div><div className="rmw-simple-grid"><div><b>DISCUSS</b><span>Talk about trends and creator growth.</span></div><div><b>SHOWCASE</b><span>Share your work and discoveries.</span></div><div><b>CONNECT</b><span>Meet creators and brands.</span></div></div></section>

      <section id="about" className="rmw-section rmw-simple-section"><div className="rmw-scene-heading"><span>06 / ABOUT RALLIVIO</span><h2>The platform for<br /><em>moving attention.</em></h2><p>RALLIVIO discovers what is moving across the internet, helps people promote what matters, connects brands and creators, and turns attention into opportunity.</p></div><div className="rmw-about-words"><span>DISCOVER</span><span>PROMOTE</span><span>CONNECT</span><span>CREATE</span><span>GROW</span></div></section>

      <section id="creator-pro" className="rmw-section rmw-simple-section rmw-pro-section"><div className="rmw-scene-heading"><span>07 / CREATOR PRO</span><h2>Grow inside<br /><em>the creator pool.</em></h2><p>Creator Pro is ₹99/month. Annual billing is ₹594/year — 50% off the normal annual price.</p></div><div className="rmw-pro-card"><b>₹99</b><span>PER MONTH</span><small>YEARLY · 50% OFF</small><strong>₹594 / YEAR</strong><ul><li>Creator Pool profile</li><li>Enhanced visibility</li><li>Advanced analytics</li><li>Priority opportunity matching</li><li>Featured creator placement</li></ul><a href="/pricing">VIEW CREATOR PRO ↗</a></div></section>

      <footer className="rmw-footer"><strong>RALL<span>IVIO</span></strong><div>DISCOVER / MOVE / CONNECT</div><small>THE LIVING INTERNET</small></footer>

      {selected && <div className="rmw-modal" onClick={() => setSelected(null)}><div className="rmw-modal-card" onClick={e => e.stopPropagation()}><button className="rmw-close" onClick={() => setSelected(null)}>×</button><img src={selected.thumbnail} alt="" /><div><span>{selected.metadata?.signal || "SIGNAL"} · {selected.topic || "WORLD"} · {selected.region || "GLOBAL"}</span><h3>{selected.title}</h3><p>{selected.channel_title}</p><small>{compact(selected.views)} views · momentum {selected.metadata?.momentum_score ?? "—"}</small><a href={selected.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a></div></div></div>}

      {promote && <div className="rmw-modal" onClick={() => setPromote(false)}><div className="rmw-promote" onClick={e => e.stopPropagation()}><button className="rmw-close" onClick={() => setPromote(false)}>×</button><span>RALLIVIO / PROMOTE</span><h3>Put content into the attention field.</h3><p>Paste a public content URL to begin the discovery workflow.</p><input autoFocus placeholder="https://youtube.com/... / instagram.com/..." /><button onClick={() => setPromote(false)}>ANALYZE CONTENT ↗</button></div></div>}
    </main>
  );
}
