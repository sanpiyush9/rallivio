"use client";

/**
 * RALLIVIO — Living Signal Field
 *
 * A canvas-rendered spatial environment driven entirely by /api/discovery.
 * Canvas 2D rather than WebGL: loads instantly, no textures to fail, no
 * three.js bundle, and depth is simulated convincingly with scale + alpha.
 *
 * Two things this fixes:
 *   1. API parsing — reads the exact response shape the endpoint returns
 *   2. Continuous motion — the field never stops moving, even when idle
 */

import { useEffect, useRef, useState, useCallback } from "react";

/* ───────────────────────── API shape (exact) ───────────────────────── */

type DiscoveryItem = {
  id: string;
  title: string;
  channel_title: string;
  channel_id: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  url: string;
  topic: string;
  format: string;
  region: string;
  published_at: string;
  metadata: {
    primary_signal: string;
    signal: string;
    signals: string[];
    momentum_score: number;
    subscriber_count: number;
  };
};

type DiscoveryResponse = {
  ok: boolean;
  refreshedAt: string | null;
  apiUsageLatestAt: string | null;
  poolCount: number;
  verifiedSignalCount: number;
  trackedCreators: number;
  risingCreators: number;
  activeTopics: number;
  regions: string[];
  signalCounts: Record<string, number>;
  topicCounts: Record<string, number>;
  items: DiscoveryItem[];
};

/* ───────────────────────── Signal styling ───────────────────────── */

const SIGNAL_COLOR: Record<string, string> = {
  "Now Moving": "#22d3ee",
  "Breaking Out": "#f59e0b",
  "On the Rise": "#34d399",
  "Under the Radar": "#a78bfa",
  "Just Dropped": "#f472b6",
  Live: "#ef4444",
  Observed: "#475569",
};

const SIGNAL_ORDER = [
  "Now Moving",
  "Breaking Out",
  "On the Rise",
  "Under the Radar",
  "Just Dropped",
  "Live",
];

/* ───────────────────────── Node model ───────────────────────── */

type Node = {
  item: DiscoveryItem;
  /** stable position on a unit sphere, clustered by topic */
  theta: number;
  phi: number;
  radius: number;
  /** projected each frame */
  sx: number;
  sy: number;
  sz: number;
  size: number;
  color: string;
  /** independent breathing offset so nothing pulses in sync */
  phase: number;
};

/** deterministic hash so a video always lands in the same place */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function buildNodes(items: DiscoveryItem[], topics: string[]): Node[] {
  const topicIndex = new Map(topics.map((t, i) => [t, i]));

  return items.map((item) => {
    const ti = topicIndex.get(item.topic) ?? 0;
    const spread = topics.length || 1;

    // cluster by topic around the sphere, jitter within the cluster
    const baseTheta = (ti / spread) * Math.PI * 2;
    const theta = baseTheta + (hash(item.id) - 0.5) * 0.9;
    const phi = Math.acos(2 * hash(item.id + "p") - 1);

    const momentum = item.metadata?.momentum_score ?? 50;
    const signal = item.metadata?.primary_signal ?? "Observed";

    return {
      item,
      theta,
      phi,
      radius: 0.75 + hash(item.id + "r") * 0.45,
      sx: 0,
      sy: 0,
      sz: 0,
      size: 1.6 + (momentum / 100) * 3.4,
      color: SIGNAL_COLOR[signal] ?? SIGNAL_COLOR.Observed,
      phase: hash(item.id + "ph") * Math.PI * 2,
    };
  });
}

/* ───────────────────────── Component ───────────────────────── */

export default function RallivioField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [hovered, setHovered] = useState<DiscoveryItem | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rotation = useRef(0);
  const rafRef = useRef<number>(0);

  /* ── fetch ── */
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/discovery?limit=120", { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      const json: DiscoveryResponse = await res.json();

      // Guard: if the shape is wrong we want to know loudly, not render zeros.
      if (typeof json.poolCount !== "number" || !Array.isArray(json.items)) {
        throw new Error(
          `Unexpected response shape. Keys: ${Object.keys(json).join(", ")}`
        );
      }

      setData(json);
      setError(null);
      nodesRef.current = buildNodes(json.items, Object.keys(json.topicCounts ?? {}));
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  /* ── render loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // pause when offscreen
    const io = new IntersectionObserver(
      ([e]) => {
        running = e.isIntersecting;
        if (running) rafRef.current = requestAnimationFrame(frame);
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    // ambient dust — always present, so the field is never still
    const dust = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      s: 0.3 + Math.random() * 0.9,
      v: 0.00004 + Math.random() * 0.00012,
    }));

    let last = performance.now();
    let acc = 0;
    const STEP = 1000 / 30; // cap at 30fps

    function frame(now: number) {
      if (!running) return;
      rafRef.current = requestAnimationFrame(frame);

      acc += now - last;
      last = now;
      if (acc < STEP) return;
      acc = 0;

      const r = canvas!.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.36;

      ctx!.clearRect(0, 0, W, H);

      // eased cursor parallax
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.045;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.045;

      if (!reduced) rotation.current += 0.0011;
      const rot = rotation.current;
      const px = pointer.current.x * 26;
      const py = pointer.current.y * 18;

      /* ── dust layer ── */
      for (const d of dust) {
        if (!reduced) {
          d.y -= d.v * 1000;
          if (d.y < 0) d.y = 1;
        }
        const depth = 0.4 + d.z * 0.6;
        ctx!.globalAlpha = 0.10 + d.z * 0.22;
        ctx!.fillStyle = "#7dd3fc";
        ctx!.beginPath();
        ctx!.arc(
          d.x * W + px * depth * 0.6,
          d.y * H + py * depth * 0.6,
          d.s * depth,
          0,
          Math.PI * 2
        );
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      /* ── project nodes ── */
      const nodes = nodesRef.current;
      const visible: Node[] = [];

      for (const n of nodes) {
        if (activeSignal && n.item.metadata?.primary_signal !== activeSignal) continue;
        if (activeTopic && n.item.topic !== activeTopic) continue;

        const t = n.theta + rot;
        const x = Math.sin(n.phi) * Math.cos(t) * n.radius;
        const y = Math.cos(n.phi) * n.radius * 0.72;
        const z = Math.sin(n.phi) * Math.sin(t) * n.radius;

        const depth = (z + 1.3) / 2.6; // 0 back … 1 front
        n.sx = cx + x * R + px * depth;
        n.sy = cy + y * R + py * depth;
        n.sz = depth;
        visible.push(n);
      }

      visible.sort((a, b) => a.sz - b.sz);

      /* ── connections between same-topic neighbours ── */
      ctx!.lineWidth = 0.6;
      for (let i = 0; i < visible.length; i++) {
        const a = visible[i];
        if (a.sz < 0.45) continue;
        for (let j = i + 1; j < Math.min(i + 5, visible.length); j++) {
          const b = visible[j];
          if (a.item.topic !== b.item.topic) continue;
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const d2 = dx * dx + dy * dy;
          if (d2 > 26000) continue;
          ctx!.globalAlpha = 0.16 * a.sz * (1 - d2 / 26000);
          ctx!.strokeStyle = a.color;
          ctx!.beginPath();
          ctx!.moveTo(a.sx, a.sy);
          ctx!.lineTo(b.sx, b.sy);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = 1;

      /* ── core ── */
      const breathe = reduced ? 1 : 1 + Math.sin(now / 1900) * 0.03;
      const coreR = R * 0.3 * breathe;
      const core = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.4);
      core.addColorStop(0, "rgba(186,230,253,0.55)");
      core.addColorStop(0.28, "rgba(56,189,248,0.22)");
      core.addColorStop(0.7, "rgba(37,99,235,0.07)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = core;
      ctx!.beginPath();
      ctx!.arc(cx, cy, coreR * 2.4, 0, Math.PI * 2);
      ctx!.fill();

      /* ── nodes ── */
      for (const n of visible) {
        const pulse = reduced ? 1 : 1 + Math.sin(now / 900 + n.phase) * 0.16;
        const rad = n.size * (0.45 + n.sz * 0.9) * pulse;
        const alpha = 0.22 + n.sz * 0.78;

        // halo
        ctx!.globalAlpha = alpha * 0.3;
        ctx!.fillStyle = n.color;
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, rad * 2.8, 0, Math.PI * 2);
        ctx!.fill();

        // body
        ctx!.globalAlpha = alpha;
        ctx!.beginPath();
        ctx!.arc(n.sx, n.sy, rad, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [activeSignal, activeTopic]);

  /* ── pointer ── */
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;

    // hit test the nearest front-facing node
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best: Node | null = null;
    let bestD = 22 * 22;
    for (const n of nodesRef.current) {
      if (n.sz < 0.35) continue;
      const d = (n.sx - mx) ** 2 + (n.sy - my) ** 2;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    setHovered(best ? best.item : null);
  };

  const onClick = () => {
    if (hovered) window.open(hovered.url, "_blank", "noopener");
  };

  /* ── HUD ── */
  const fmt = (n: number | undefined) =>
    n == null ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <section className="relative w-full h-[92vh] overflow-hidden bg-[#03060f]">
      <canvas
        ref={canvasRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: hovered ? "pointer" : "default" }}
      />

      {/* top-left: identity */}
      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="text-[10px] tracking-[0.3em] text-cyan-300/70">
          GLOBAL SIGNAL FIELD
        </div>
        <h1 className="mt-3 text-5xl font-bold text-white leading-[1.05]">
          The internet
          <br />
          <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
            is moving.
          </span>
        </h1>
        {error && (
          <div className="mt-4 text-xs text-red-400 max-w-sm">
            Field offline — {error}
          </div>
        )}
      </div>

      {/* top-right: live counters, straight from the API */}
      <div className="absolute top-8 right-8 text-right pointer-events-none">
        <div className="text-[10px] tracking-[0.3em] text-cyan-300/70 mb-3">
          {data?.refreshedAt ? "LIVE" : "CONNECTING"}
        </div>
        {[
          ["pool", data?.poolCount],
          ["signals", data?.verifiedSignalCount],
          ["creators", data?.trackedCreators],
          ["regions", data?.regions?.length],
        ].map(([label, value]) => (
          <div key={label as string} className="mb-2">
            <div className="text-2xl font-semibold text-white tabular-nums">
              {fmt(value as number)}
            </div>
            <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
              {label as string}
            </div>
          </div>
        ))}
      </div>

      {/* bottom: signal filters, real counts */}
      <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSignal(null)}
          className={`px-3 py-1.5 rounded-full text-xs border transition ${
            !activeSignal
              ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-200"
              : "border-white/10 text-white/50 hover:text-white/80"
          }`}
        >
          ALL
        </button>
        {SIGNAL_ORDER.map((s) => {
          const count = data?.signalCounts?.[s] ?? 0;
          return (
            <button
              key={s}
              onClick={() => setActiveSignal(activeSignal === s ? null : s)}
              disabled={count === 0}
              className={`px-3 py-1.5 rounded-full text-xs border transition flex items-center gap-2 ${
                activeSignal === s
                  ? "border-white/40 text-white"
                  : count === 0
                  ? "border-white/5 text-white/20 cursor-not-allowed"
                  : "border-white/10 text-white/60 hover:text-white"
              }`}
              style={
                activeSignal === s
                  ? { background: `${SIGNAL_COLOR[s]}22`, borderColor: `${SIGNAL_COLOR[s]}66` }
                  : undefined
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: SIGNAL_COLOR[s], opacity: count ? 1 : 0.25 }}
              />
              {s}
              <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* hover inspector */}
      {hovered && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[440px] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-4 flex gap-3">
          <img
            src={hovered.thumbnail}
            alt=""
            className="w-28 h-16 object-cover rounded-lg flex-shrink-0"
          />
          <div className="min-w-0">
            <div
              className="text-[10px] tracking-[0.2em] mb-1"
              style={{ color: SIGNAL_COLOR[hovered.metadata?.primary_signal] ?? "#94a3b8" }}
            >
              {hovered.metadata?.primary_signal?.toUpperCase()} · {hovered.region} ·{" "}
              {hovered.topic}
            </div>
            <div className="text-sm text-white font-medium line-clamp-2 leading-snug">
              {hovered.title}
            </div>
            <div className="text-xs text-white/50 mt-1">
              {hovered.channel_title} · {fmt(hovered.views)} views ·{" "}
              {hovered.metadata?.momentum_score} momentum
            </div>
          </div>
        </div>
      )}
    </section>
  );
}