"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, Preload, Text } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

type DiscoveryItem = {
  id: string;
  title: string;
  channel_title: string;
  topic?: string;
  region?: string;
  thumbnail?: string;
  url?: string;
  views?: number;
  metadata?: {
    signal?: string;
    momentum_score?: number;
    subscriber_count?: number | null;
  };
};

type WorldNode =
  | { kind: "signal"; id: string; position: THREE.Vector3; color: number; label: string; item: DiscoveryItem }
  | { kind: "topic"; id: string; position: THREE.Vector3; color: number; label: string; count: number }
  | { kind: "creator"; id: string; position: THREE.Vector3; color: number; label: string; item: DiscoveryItem }
  | { kind: "platform"; id: string; position: THREE.Vector3; color: number; label: string; connected: boolean };

type Selection = WorldNode | null;

const REGION_COORDS: Record<string, [number, number]> = {
  AE:[24.5,54.4], AR:[-34.6,-58.4], AU:[-25.3,133.8], BR:[-14.2,-51.9], CA:[56.1,-106.3],
  CL:[-33.4,-70.7], CO:[4.6,-74.1], DE:[51.2,10.4], EG:[26.8,30.8], ES:[40.4,-3.7],
  FR:[46.2,2.2], GB:[55.4,-3.4], IN:[20.6,78.9], IT:[41.9,12.6], JP:[36.2,138.3],
  KE:[0.2,37.9], KR:[36.5,127.9], MX:[23.6,-102.6], NG:[9.1,8.7], PE:[-9.2,-75],
  SA:[23.9,45.1], SG:[1.35,103.8], TR:[38.9,35.2], US:[39.8,-98.6], ZA:[-30.6,22.9],
};

const SIGNAL_COLORS: Record<string, number> = {
  "Breaking Out": 0xffd166,
  "Now Moving": 0x61e6b0,
  "On the Rise": 0x67dfff,
  "Under the Radar": 0xb46cff,
  "Just Dropped": 0xff8a65,
  "Live Now": 0xff557b,
};

const TOPIC_COLORS = [0x63ddff, 0x8d7aff, 0x62e6b7, 0xff9b6a, 0xd982ff, 0x5fafff];

function geo(lat: number, lon: number, radius = 1.08) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function hashAngle(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function useWorldData() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [verified, setVerified] = useState(0);
  const [creators, setCreators] = useState(0);
  const [topics, setTopics] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await fetch("/api/discovery?limit=100", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body?.ok) throw new Error("discovery unavailable");
      setItems(Array.isArray(body.items) ? body.items : []);
      setCounts(body.signalCounts && typeof body.signalCounts === "object" ? body.signalCounts : {});
      setVerified(Number(body.verifiedSignalCount || 0));
      setCreators(Number(body.trackedCreators || 0));
      setTopics(Number(body.activeTopics || 0));
    } catch {
      // Keep the last verified world visible if a refresh is unavailable.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return { items, counts, verified, creators, topics, loading };
}

function Earth() {
  const earth = useMemo(() => new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_day_4096.jpg"), []);
  const night = useMemo(() => new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_lights_2048.png"), []);
  const clouds = useMemo(() => new THREE.TextureLoader().load("https://threejs.org/examples/textures/planets/earth_clouds_2048.png"), []);

  useEffect(() => {
    earth.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    clouds.colorSpace = THREE.SRGBColorSpace;
  }, [earth, night, clouds]);

  const root = useRef<THREE.Group>(null);
  const cloud = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (root.current) root.current.rotation.y += delta * Math.PI * 2 / 105;
    if (cloud.current) cloud.current.rotation.y += delta * Math.PI * 2 / 72;
  });

  return (
    <group ref={root}>
      <mesh>
        <sphereGeometry args={[1.08, 96, 96]} />
        <meshPhongMaterial map={earth} shininess={24} specular={new THREE.Color(0x8fd8ff)} />
      </mesh>
      <mesh scale={1.002}>
        <sphereGeometry args={[1.081, 96, 96]} />
        <meshBasicMaterial map={night} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={cloud} scale={1.095}>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshPhongMaterial map={clouds} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh scale={1.11}>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial color={0x55dfff} transparent opacity={0.035} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function StarField() {
  const positions = useMemo(() => {
    const values = new Float32Array(1600 * 3);
    for (let i = 0; i < 1600; i++) {
      const r = 18 + Math.random() * 18;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      values[i * 3] = r * Math.sin(b) * Math.cos(a);
      values[i * 3 + 1] = r * Math.cos(b);
      values[i * 3 + 2] = r * Math.sin(b) * Math.sin(a);
    }
    return values;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0x9adfff} size={0.025} transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[1.08, 64, 64]} />
      <meshBasicMaterial color={0x56dcff} transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function SignalObject({ node, onSelect }: { node: Extract<WorldNode, { kind: "signal" }>; onSelect: (node: WorldNode) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + hashAngle(node.id)) * 0.18;
    ref.current.scale.setScalar(pulse);
  });

  return (
    <group position={node.position}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onSelect(node); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
        <icosahedronGeometry args={[0.035, 1]} />
        <meshBasicMaterial color={node.color} />
      </mesh>
      <mesh scale={3.4}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.06} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function TopicZone({ node, onSelect }: { node: Extract<WorldNode, { kind: "topic" }>; onSelect: (node: WorldNode) => void }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.18 + hashAngle(node.id) * 0.001;
  });

  return (
    <group ref={group} position={node.position} onClick={(e) => { e.stopPropagation(); onSelect(node); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
      <mesh>
        <icosahedronGeometry args={[0.26, 1]} />
        <meshBasicMaterial color={node.color} wireframe transparent opacity={0.72} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.008, 6, 48]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <Text position={[0, 0.48, 0]} fontSize={0.08} color={0xdffaff} anchorX="center" anchorY="middle">
        {node.label.toUpperCase()}
      </Text>
    </group>
  );
}

function CreatorNode({ node, onSelect }: { node: Extract<WorldNode, { kind: "creator" }>; onSelect: (node: WorldNode) => void }) {
  return (
    <group position={node.position} onClick={(e) => { e.stopPropagation(); onSelect(node); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
      <mesh>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshBasicMaterial color={node.color} />
      </mesh>
      <mesh scale={2.5}>
        <sphereGeometry args={[0.065, 12, 12]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.06} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function PlatformGateway({ node, onSelect }: { node: Extract<WorldNode, { kind: "platform" }>; onSelect: (node: WorldNode) => void }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6 + hashAngle(node.id)) * 0.08;
  });

  return (
    <group ref={group} position={node.position} onClick={(e) => { e.stopPropagation(); onSelect(node); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = ""; }}>
      <mesh>
        <torusGeometry args={[0.24, 0.028, 8, 48]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.01, 6, 36]} />
        <meshBasicMaterial color={node.color} transparent opacity={0.55} />
      </mesh>
      <Text position={[0, -0.36, 0]} fontSize={0.07} color={0xb7dce8} anchorX="center">
        {node.label}
      </Text>
    </group>
  );
}

function WorldCamera({ progress, focus, pointer }: { progress: number; focus: THREE.Vector3 | null; pointer: { x: number; y: number } }) {
  const { camera } = useThree();
  const current = useRef(new THREE.Vector3(0, 0.35, 5.2));
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const angle = p * Math.PI * 2.2;
    const radius = THREE.MathUtils.lerp(5.2, 7.8, p);
    const base = new THREE.Vector3(
      Math.sin(angle) * radius * 0.18,
      THREE.MathUtils.lerp(0.35, 2.5, p) + pointer.y * 0.22,
      THREE.MathUtils.lerp(5.2, 9.2, p),
    );
    if (focus) {
      const focusCam = focus.clone().multiplyScalar(1.7);
      focusCam.z += 2.3;
      current.current.lerp(focusCam, 1 - Math.exp(-delta * 5));
      look.current.lerp(focus, 1 - Math.exp(-delta * 6));
    } else {
      current.current.lerp(base, 1 - Math.exp(-delta * 2.8));
      const target = new THREE.Vector3(pointer.x * 0.22, pointer.y * 0.16, 0);
      look.current.lerp(target, 1 - Math.exp(-delta * 3));
    }
    camera.position.copy(current.current);
    camera.lookAt(look.current);
  });

  return null;
}

function World({ nodes, progress, selection, setSelection, pointer }: {
  nodes: WorldNode[];
  progress: number;
  selection: Selection;
  setSelection: (node: Selection) => void;
  pointer: { x: number; y: number };
}) {
  const focus = selection?.position ?? null;
  const signals = nodes.filter((n): n is Extract<WorldNode, { kind: "signal" }> => n.kind === "signal");
  const topics = nodes.filter((n): n is Extract<WorldNode, { kind: "topic" }> => n.kind === "topic");
  const creators = nodes.filter((n): n is Extract<WorldNode, { kind: "creator" }> => n.kind === "creator");
  const platforms = nodes.filter((n): n is Extract<WorldNode, { kind: "platform" }> => n.kind === "platform");

  return (
    <Canvas camera={{ position: [0, 0.35, 5.2], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={["#01040b"]} />
      <fog attach="fog" args={["#01040b", 9, 24]} />
      <ambientLight intensity={0.2} color={0x29445b} />
      <directionalLight position={[-4, 4, 6]} intensity={3.4} color={0xdaf8ff} />
      <pointLight position={[2, 1, 3]} intensity={18} distance={9} color={0x55ddff} />
      <StarField />
      <WorldCamera progress={progress} focus={focus} pointer={pointer} />

      <group position={[0, 0, 0]}>
        <Earth />
        <Atmosphere />
        {signals.map((n) => <SignalObject key={n.id} node={n} onSelect={setSelection} />)}
      </group>

      <group position={[0, 0, -2.5]}>
        {topics.map((n) => <TopicZone key={n.id} node={n} onSelect={setSelection} />)}
        {topics.length > 1 && topics.slice(1).map((n, i) => (
          <Line key={"line-" + n.id} points={[topics[0].position, n.position]} color={topics[0].color} transparent opacity={0.16} lineWidth={1} />
        ))}
      </group>

      <group position={[0, 0.3, -5.3]}>
        {creators.map((n) => <CreatorNode key={n.id} node={n} onSelect={setSelection} />)}
      </group>

      <group position={[0, 0, -7.8]}>
        {platforms.map((n) => <PlatformGateway key={n.id} node={n} onSelect={setSelection} />)}
      </group>

      {selection && (
        <Html position={selection.position} center distanceFactor={7}>
          <div style={{ pointerEvents: "none", width: 1, height: 1 }} />
        </Html>
      )}
      <Preload all />
    </Canvas>
  );
}

function buildNodes(items: DiscoveryItem[], topicCounts: Record<string, number>): WorldNode[] {
  const result: WorldNode[] = [];
  items.slice(0, 120).forEach((item, index) => {
    const [lat, lon] = REGION_COORDS[item.region || ""] || [0, (index * 137.5) % 360 - 180];
    const pos = geo(lat, lon, 1.16 + (index % 4) * 0.018);
    result.push({
      kind: "signal",
      id: "signal-" + item.id,
      position: pos,
      color: SIGNAL_COLORS[item.metadata?.signal || "Now Moving"] || 0x67dfff,
      label: item.title,
      item,
    });
  });

  const topicEntries = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  topicEntries.forEach(([topic, count], index) => {
    const angle = index / Math.max(topicEntries.length, 1) * Math.PI * 2;
    const radius = 1.35 + (index % 3) * 0.42;
    result.push({
      kind: "topic",
      id: "topic-" + topic,
      position: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle * 1.7) * 0.75, -0.3 - Math.sin(angle) * radius * 0.75),
      color: TOPIC_COLORS[index % TOPIC_COLORS.length],
      label: topic,
      count,
    });
  });

  const unique = new Map<string, DiscoveryItem>();
  items.forEach((item) => {
    if (item.channel_title && !unique.has(item.channel_title)) unique.set(item.channel_title, item);
  });
  Array.from(unique.values()).slice(0, 36).forEach((item, index) => {
    const a = index / 36 * Math.PI * 2;
    const r = 1.8 + (index % 4) * 0.42;
    result.push({
      kind: "creator",
      id: "creator-" + item.channel_title,
      position: new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 2.1) * 1.35, -Math.abs(Math.sin(a)) * 1.4),
      color: 0x67dfff,
      label: item.channel_title,
      item,
    });
  });

  const platforms = [
    ["YouTube", true, 0xff3b30], ["TikTok", false, 0xffffff], ["LinkedIn", false, 0x55aaff],
    ["Reddit", false, 0xff6a38], ["Discord", false, 0x8d7aff], ["Snapchat", false, 0xffe04b],
    ["Pinterest", false, 0xff5b72], ["Spotify", false, 0x67e89a], ["Twitch", false, 0x9d6cff],
    ["X", false, 0xffffff], ["Facebook", false, 0x4e8cff], ["Instagram", false, 0xff6fc8],
  ] as const;
  platforms.forEach(([label, connected, color], index) => {
    const a = index / platforms.length * Math.PI * 2;
    result.push({
      kind: "platform",
      id: "platform-" + label,
      position: new THREE.Vector3(Math.cos(a) * 2.4, Math.sin(a) * 1.5, -Math.abs(Math.cos(a)) * 1.2),
      color,
      label,
      connected,
    });
  });

  return result;
}

export default function DiscoverGlobe() {
  const { items, counts, verified, creators, topics, loading } = useWorldData();
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<Selection>(null);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLowPower(reduce || (navigator.hardwareConcurrency || 8) <= 4);
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(window.scrollY / max);
    };
    const onPointer = (event: PointerEvent) => {
      setPointer({
        x: (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
        y: -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1),
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  const nodes = useMemo(() => buildNodes(items, Object.fromEntries(Object.entries(counts))), [items, counts]);

  const selectedLabel = selection?.kind === "signal" ? selection.item.title
    : selection?.kind === "creator" ? selection.label
    : selection?.kind === "topic" ? selection.label
    : selection?.kind === "platform" ? selection.label
    : "";

  return (
    <div className="rallivioWorld" aria-label="RALLIVIO interactive discovery world">
      <div className="rallivioWorldCanvas">
        <World nodes={nodes} progress={progress} selection={selection} setSelection={setSelection} pointer={pointer} />
      </div>

      <div className="rallivioWorldOverlay">
        <div className="worldTop">
          <div><b>RALLIVIO</b><span> / LIVING DISCOVERY SYSTEM</span></div>
          <div className="worldLive">● LIVE INTELLIGENCE FIELD</div>
        </div>

        <div className="worldCenter">
          <div className="worldBrand">RALLIVIO</div>
          <div>GLOBAL DISCOVERY INTELLIGENCE</div>
          <small>SCROLL · ENTER THE WORLD · CLICK ANY SIGNAL</small>
        </div>

        <div className="worldStats">
          <span><b>{verified.toLocaleString()}</b> VERIFIED SIGNALS</span>
          <span><b>{creators.toLocaleString()}</b> CREATORS</span>
          <span><b>{topics.toLocaleString()}</b> TOPIC ZONES</span>
          <span>FIELD <b>{Math.round(progress * 100)}%</b></span>
        </div>

        <div className="worldStageLabel">
          {progress < 0.25 ? "01 / ORBIT" : progress < 0.5 ? "02 / SIGNAL FIELD" : progress < 0.75 ? "03 / TOPIC NETWORK" : "04 / CREATOR + PLATFORM GATEWAYS"}
        </div>

        {selection && (
          <div className="worldSelection" role="dialog" aria-label="Selected world object">
            <button onClick={() => setSelection(null)} aria-label="Close selection">×</button>
            <small>{selection.kind.toUpperCase()} OBJECT</small>
            <strong>{selectedLabel}</strong>
            {selection.kind === "signal" && (
              <>
                <span>{selection.item.metadata?.signal || "Verified signal"} · momentum {selection.item.metadata?.momentum_score ?? "—"}</span>
                <span>{selection.item.region || "WORLDWIDE"} · {selection.item.views?.toLocaleString() || "—"} views</span>
                {selection.item.url && <a href={selection.item.url} target="_blank" rel="noreferrer">OPEN SOURCE ↗</a>}
              </>
            )}
            {selection.kind === "creator" && <span>Creator node derived from the live verified discovery pool.</span>}
            {selection.kind === "topic" && <span>{selection.count.toLocaleString()} verified signals in this topic.</span>}
            {selection.kind === "platform" && <span>{selection.connected ? "Connected live acquisition adapter: YouTube." : "Spatial gateway placeholder. No live metric is claimed for this platform."}</span>}
          </div>
        )}

        {loading && <div className="worldLoading">CONNECTING TO DISCOVERY FIELD…</div>}
      </div>

      <style jsx>{`
        .rallivioWorld{position:relative;width:100%;min-height:100vh;overflow:hidden;background:#01040b;color:#dff9ff}
        .rallivioWorldCanvas{position:fixed;inset:0;z-index:0}
        .rallivioWorldCanvas canvas{display:block;width:100%;height:100%}
        .rallivioWorldOverlay{position:fixed;inset:0;z-index:2;pointer-events:none;font-family:inherit}
        .worldTop{position:absolute;top:92px;left:28px;right:28px;display:flex;justify-content:space-between;gap:20px;font-size:9px;letter-spacing:2px;color:#7ea8bb;text-shadow:0 0 18px rgba(60,210,255,.35)}
        .worldTop b{color:#f2fdff;font-weight:900;letter-spacing:3px}.worldLive{color:#62e6bf}
        .worldCenter{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);text-align:center;opacity:.78;text-shadow:0 0 35px rgba(69,220,255,.35);letter-spacing:4px;font-size:9px}
        .worldBrand{font-size:clamp(48px,10vw,128px);line-height:.86;font-weight:950;letter-spacing:-7px;color:#effcff}
        .worldCenter small{display:block;margin-top:14px;font-size:7px;letter-spacing:3px;color:#70c9df}
        .worldStats{position:absolute;left:28px;bottom:28px;display:flex;gap:20px;flex-wrap:wrap;font-size:8px;letter-spacing:1.5px;color:#6c8da0}
        .worldStats b{color:#dffaff}.worldStageLabel{position:absolute;right:28px;bottom:28px;font-size:8px;letter-spacing:2px;color:#66dcff}
        .worldSelection{position:absolute;right:28px;top:145px;width:min(310px,calc(100vw - 56px));padding:18px;border:1px solid rgba(96,225,255,.28);border-radius:18px;background:rgba(2,12,22,.78);backdrop-filter:blur(18px);box-shadow:0 30px 100px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.08);display:grid;gap:8px;pointer-events:auto}
        .worldSelection button{position:absolute;right:10px;top:8px;border:0;background:none;color:#88b5c7;font-size:22px;cursor:pointer}.worldSelection small{font-size:7px;letter-spacing:2px;color:#61dcff}.worldSelection strong{font-size:20px;color:#f0fcff}.worldSelection span{font-size:9px;line-height:1.5;color:#8caaba}.worldSelection a{font-size:8px;color:#6be4ff;letter-spacing:1.5px;text-decoration:none;margin-top:4px}
        .worldLoading{position:absolute;top:50%;left:50%;transform:translate(-50%,80px);font-size:8px;letter-spacing:3px;color:#69dfff}
        @media(max-width:767px){.worldTop{top:78px;left:14px;right:14px}.worldTop span{display:none}.worldLive{font-size:7px}.worldCenter{top:43%}.worldBrand{font-size:56px;letter-spacing:-4px}.worldCenter small{letter-spacing:2px}.worldStats{left:14px;right:14px;bottom:16px;gap:10px}.worldStageLabel{right:14px;bottom:50px;font-size:7px}.worldSelection{left:12px;right:12px;top:auto;bottom:72px;width:auto}.rallivioWorldCanvas{position:fixed;inset:0}}
        @media(prefers-reduced-motion:reduce){.worldCenter{opacity:.55}}
      `}</style>
    </div>
  );
}
