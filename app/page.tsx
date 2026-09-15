"use client";

import { useEffect, useMemo, useState } from "react";

type DiscoveryItem = {
  id: string;
  title: string;
  channel_title: string;
  channel_id: string;
  published_at: string;
  thumbnail: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  duration: string | null;
  url: string;
  embeddable: boolean;
  live_broadcast_content: string | null;
  topic: string;
  region: string;
  metadata?: { subscriber_count?: number | null; signal?: string; momentum_score?: number };
  stats_refreshed_at?: string;
};

const signals = ["All signals", "Trending", "Rising", "Breaking Out", "Under the Radar", "Just Dropped"];

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatAge(iso?: string) {
  if (!iso) return "Waiting for first refresh";
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "Updated less than an hour ago";
  if (hours < 24) return `Updated ${Math.floor(hours)}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

function nodeSignal(item: DiscoveryItem) {
  return item.metadata?.signal ?? "Discovery";
}

export default function Home() {
  const [active, setActive] = useState("All signals");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/discovery", { cache: "no-store" })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) throw new Error(body.state ?? "DATA_UNAVAILABLE");
          return body;
        })
        .then((body) => {
          if (cancelled) return;
          const nextItems = body.items ?? [];
          setItems(nextItems);
          setLastSync(body.refreshedAt ?? null);
          setState(null);
          setSelectedId((current) => current && nextItems.some((item: DiscoveryItem) => item.id === current) ? current : nextItems[0]?.id ?? null);
        })
        .catch((error: Error) => {
          if (!cancelled) setState(error.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const visible = useMemo(
    () => active === "All signals" ? items : items.filter((item) => nodeSignal(item) === active),
    [active, items],
  );
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const fieldItems = visible.slice(0, 9);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">R</span><span>RALLIVIO</span></div>
        <nav><a className="active">Discover</a><a>Watch</a><a>Creators</a><a>Explore</a></nav>
        <button className="search" type="button">⌕ <span>Search creators, topics...</span></button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">LIVING DISCOVERY · YOUTUBE · INDIA · TECHNOLOGY</p>
          <h1>What is moving <em>right now?</em></h1>
          <p className="lede">Real signals become a living discovery environment. Watch it move, then dive into what caused the movement.</p>
        </div>
        <div className="pulse"><span /> {loading ? "Syncing verified pool" : state ? state : "Verified discovery pool"}</div>
      </section>

      <div className="filters">
        {signals.map((signal) => <button key={signal} type="button" className={active === signal ? "selected" : ""} onClick={() => { setActive(signal); setSelectedId(null); }}>{signal}</button>)}
        <button type="button">India</button><button type="button">YouTube</button><button type="button">Technology</button>
      </div>

      {state ? (
        <section className="emptyState">
          <p className="eyebrow">TRUTHFUL EMPTY STATE</p>
          <h2>Real discovery data is not available yet.</h2>
          <p>{state === "CONFIGURATION_REQUIRED" ? "The deployment is waiting for the YouTube and Supabase server configuration. No fake creators or metrics are shown." : "The discovery pool could not be read. No fallback data is being invented."}</p>
        </section>
      ) : (
        <>
          <section className="livingWorld" aria-label="Living discovery environment">
            <div className="worldHead">
              <div><p className="eyebrow">LIVING FIELD</p><h2>{active === "All signals" ? "The discovery world" : active}</h2></div>
              <div className="worldMeta"><span className="liveDot" /> {fieldItems.length} verified nodes · {formatAge(lastSync ?? undefined)}</div>
            </div>
            <div className="worldCanvas">
              <div className="worldCore">
                <span className="coreKicker">RALLIVIO</span>
                <strong>{selected ? selected.channel_title : "Discover"}</strong>
                <small>{selected ? nodeSignal(selected) : "Waiting for verified signals"}</small>
              </div>
              {fieldItems.map((item, index) => {
                const angle = (index / Math.max(fieldItems.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = index % 2 === 0 ? 30 : 42;
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius * 0.62;
                const momentum = Math.max(0, Math.min(100, item.metadata?.momentum_score ?? 0));
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`worldNode ${selected?.id === item.id ? "active" : ""}`}
                    style={{ left: `${x}%`, top: `${y}%`, ["--node-delay" as string]: `${index * -0.8}s`, ["--node-size" as string]: `${44 + momentum * 0.28}px` }}
                    onClick={() => setSelectedId(item.id)}
                    aria-label={`Select ${item.title} by ${item.channel_title}`}
                  >
                    <img src={item.thumbnail} alt="" />
                    <span className="nodePulse" />
                    <span className="nodeInfo"><strong>{item.channel_title}</strong><small>{nodeSignal(item)} · {item.metadata?.momentum_score ?? "—"}</small></span>
                  </button>
                );
              })}
              {fieldItems.length > 1 && <div className="worldOrbit orbitOne" />}
              {fieldItems.length > 4 && <div className="worldOrbit orbitTwo" />}
            </div>
            <p className="simulationNote">Motion is presentation only. Position, prominence and selection are derived from verified RALLIVIO records; no activity is fabricated.</p>
          </section>

          <section className="grid">
            <div className="mainColumn">
              <div className="sectionHead"><div><p className="eyebrow">SIGNAL FEED</p><h2>{active === "All signals" ? "Creators breaking through" : active}</h2></div><span>{formatAge(selected?.stats_refreshed_at)}</span></div>

              {selected ? (
                <div className="videoCard">
                  <div className="video">
                    {selected.embeddable ? <iframe title={selected.title} src={`https://www.youtube.com/embed/${selected.id}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <img src={selected.thumbnail} alt="" />}
                    <div className="videoLabel">{nodeSignal(selected)}</div>
                  </div>
                  <div className="videoMeta"><div><p className="eyebrow">{selected.topic} · {nodeSignal(selected)}</p><h2>{selected.title}</h2><p>{selected.channel_title} · {formatCount(selected.views)} views · {formatCount(selected.likes)} likes · {formatCount(selected.comments)} comments</p></div><a className="watch" href={selected.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>
                </div>
              ) : (
                <div className="emptyState"><h2>No verified videos in this signal.</h2><p>RALLIVIO will not fill the slot with unrelated content.</p></div>
              )}

              <div className="sectionHead lower"><div><p className="eyebrow">UP NEXT</p><h2>Follow the movement</h2></div></div>
              <div className="cards">
                {visible.slice(0, 6).map((item) => <button type="button" className={`creatorCard ${selected?.id === item.id ? "chosen" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><img className="avatarImage" src={item.thumbnail} alt="" /><div className="creatorText"><strong>{item.channel_title}</strong><span>{item.title}</span><small>{formatCount(item.views)} views · {nodeSignal(item)}</small></div><b>{item.metadata?.momentum_score ?? "—"}</b></button>)}
              </div>
            </div>

            <aside className="side">
              {selected ? <div className="insight"><p className="eyebrow">WHY THIS IS MOVING</p><h3>{selected.channel_title}</h3><div className="metric"><span>RALLIVIO Momentum Score</span><strong>{selected.metadata?.momentum_score ?? "—"}</strong></div><div className="bar"><i style={{ width: `${Math.min(100, selected.metadata?.momentum_score ?? 0)}%` }} /></div><ul><li>{formatCount(selected.views)} YouTube views observed</li><li>{formatCount(selected.likes)} YouTube likes observed</li><li>{selected.metadata?.subscriber_count ? `${formatCount(selected.metadata.subscriber_count)} YouTube subscribers used as audience context` : "Subscriber count unavailable; not inferred"}</li></ul><a className="outline" href={selected.url} target="_blank" rel="noreferrer">View on YouTube ↗</a></div> : null}
              <div className="next"><p className="eyebrow">LIVING PRINCIPLE</p><h3>Real data. Responsive world.</h3><p>The environment changes when verified discovery state changes. Motion helps you understand relationships; it never invents evidence.</p></div>
            </aside>
          </section>
        </>
      )}

      <footer><span>RALLIVIO · Living signal-first discovery</span><span>REAL DATA · DYNAMIC PRESENTATION</span></footer>
    </main>
  );
}
