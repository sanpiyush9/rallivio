"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

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

function formatPublished(iso: string) {
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function signalClass(signal: string) {
  return signal.toLowerCase().replaceAll(" ", "-");
}

export default function Home() {
  const [active, setActive] = useState("All signals");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [touchX, setTouchX] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [activity, setActivity] = useState(0);
  const heroRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!autoplay || visible.length < 2) return;
    const timer = window.setInterval(() => {
      setSelectedId((current) => {
        const index = visible.findIndex((item) => item.id === current);
        return visible[(index + 1) % visible.length]?.id ?? null;
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, [autoplay, visible]);

  useEffect(() => {
    if (!selected) return;
    setActivity((selected.metadata?.momentum_score ?? 0) / 100);
  }, [selected]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTouchX(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    setTouchY(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const handlePointerLeave = () => {
    setTouchX(0);
    setTouchY(0);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span>RALL<span className="brandAccent">IVIO</span></span></div>
        <nav aria-label="Primary"><a className="active" href="#discover">Discover</a><a href="#watch">Watch</a><a href="#creators">Creators</a><a href="#explore">Explore</a></nav>
        <button className="search" type="button" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>⌕ <span>Search creators, topics...</span></button>
      </header>

      <section className="hero" id="discover">
        <div><p className="eyebrow">DISCOVER · YOUTUBE · INDIA · TECHNOLOGY</p><h1>What is moving <em>right now?</em></h1><p className="lede">Watch real signals. Discover creators. Follow opportunities.</p></div>
        <div className="journey">Discover <span>→</span> Watch <span>→</span> Follow <span>→</span> Collaborate <span>→</span> Grow</div>
      </section>

      <div className="filters" aria-label="Discovery filters">
        <div className="filterGroup"><span>Signal</span>{signals.map((signal) => <button key={signal} type="button" className={active === signal ? "selected" : ""} onClick={() => { setActive(signal); setSelectedId(null); }}>{signal}</button>)}</div>
        <div className="selectFilters"><label>Topic <select defaultValue="Technology"><option>Technology</option><option>Gaming</option><option>Fitness</option><option>Finance</option></select></label><label>Region <select defaultValue="India"><option>India</option><option>Worldwide</option></select></label><label>Format <select defaultValue="All"><option>All</option><option>Video</option><option>Short-form</option></select></label></div>
      </div>

      {state ? (
        <section className="emptyState"><p className="eyebrow">TRUTHFUL EMPTY STATE</p><h2>Real discovery data is not available yet.</h2><p>{state === "CONFIGURATION_REQUIRED" ? "The deployment is waiting for the YouTube and Supabase server configuration. No fake creators or metrics are shown." : "The discovery pool could not be read. No fallback data is being invented."}</p></section>
      ) : (
        <>
          <section className="discoveryStage" id="watch" ref={heroRef} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
            <div className="stageGlow" aria-hidden="true" />
            <div className="featured" style={{ transform: `perspective(1100px) rotateY(${touchX * -1.3}deg) rotateX(${touchY * 0.8}deg)` }}>
              <div className="videoFrame">
                {selected?.embeddable ? <iframe title={selected.title} src={`https://www.youtube.com/embed/${selected.id}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : selected ? <img src={selected.thumbnail} alt="" /> : <div className="videoPlaceholder">Waiting for verified discovery</div>}
                {selected && <div className={`signalBadge ${signalClass(nodeSignal(selected))}`}>{nodeSignal(selected)}</div>}
                <div className="playerBar"><span className="playDot">▶</span><div className="progress"><i style={{ width: `${Math.max(8, activity * 100)}%` }} /></div><span>LIVE SIGNAL</span><span>⚙</span><span>⛶</span></div>
              </div>
              {selected && <div className="featuredMeta"><div className="titleBlock"><p className="eyebrow">{selected.topic} · {nodeSignal(selected)}</p><h2>{selected.title}</h2><p>{selected.channel_title} · {formatCount(selected.views)} views · {formatPublished(selected.published_at)}</p></div><div className="actionRow"><button type="button">Subscribe</button><button type="button" aria-label="Like">♡</button><button type="button" aria-label="Share">↗</button><a href={selected.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div></div>}
            </div>

            <aside className="upNext">
              <div className="queueHead"><div><p className="eyebrow">UP NEXT</p><strong>{visible.length} signals</strong></div><label><input type="checkbox" checked={autoplay} onChange={(event) => setAutoplay(event.target.checked)} /> Autoplay</label></div>
              <div className="queue">
                {visible.slice(0, 6).map((item) => <button type="button" className={`queueItem ${selected?.id === item.id ? "chosen" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><div className="queueThumb"><img src={item.thumbnail} alt="" /><span>{nodeSignal(item)}</span></div><div><strong>{item.title}</strong><small>{item.channel_title} · {formatCount(item.views)} views</small><small>{formatPublished(item.published_at)}</small></div><b>⋮</b></button>)}
                {!visible.length && <div className="queueEmpty">No verified videos in this signal.</div>}
              </div>
            </aside>

            <aside className="insights">
              <div className="insightPanel">
                <div className="panelTitle"><h3>Why is this moving?</h3><span>AI INSIGHTS</span></div>
                {selected ? <><div className="score"><span>RALLIVIO Momentum Score</span><strong>{selected.metadata?.momentum_score ?? "—"}</strong></div><div className="scoreBar"><i style={{ width: `${Math.min(100, selected.metadata?.momentum_score ?? 0)}%` }} /></div><ul><li><b>{formatCount(selected.views)}</b> YouTube views observed</li><li><b>{formatCount(selected.likes)}</b> YouTube likes observed</li><li><b>{formatCount(selected.comments)}</b> YouTube comments observed</li><li><b>{selected.metadata?.subscriber_count ? formatCount(selected.metadata.subscriber_count) : "—"}</b> subscriber audience context</li></ul></> : <p className="muted">Select a verified signal to inspect its evidence.</p>}
              </div>
              {selected && <div className="creatorPanel" id="creators"><p className="eyebrow">CREATOR</p><div className="creatorIdentity"><img src={selected.thumbnail} alt="" /><div><strong>{selected.channel_title}</strong><small>Verified YouTube channel</small></div><button type="button">Follow</button></div><div className="chips"><span>{selected.topic}</span><span>India</span><span>YouTube</span></div></div>}
              <div className="nextPanel"><p className="eyebrow">WHAT&apos;S NEXT?</p><button type="button" onClick={() => setActive("All signals")}>Explore more like this <span>→</span></button><button type="button" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>Find similar creators <span>→</span></button></div>
            </aside>
          </section>

          <section className="lowerSection" id="explore">
            <div className="sectionHead"><div><p className="eyebrow">MORE TO DISCOVER</p><h2>Follow the movement</h2></div><span>{loading ? "Syncing" : formatAge(lastSync ?? undefined)}</span></div>
            <div className="cards">
              {visible.slice(0, 6).map((item) => <button type="button" className={`creatorCard ${selected?.id === item.id ? "chosen" : ""}`} key={item.id} onClick={() => { setSelectedId(item.id); document.getElementById("watch")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><img className="avatarImage" src={item.thumbnail} alt="" /><div className="creatorText"><strong>{item.channel_title}</strong><span>{item.title}</span><small>{formatCount(item.views)} views · {nodeSignal(item)}</small></div><b>{item.metadata?.momentum_score ?? "—"}</b></button>)}
            </div>
          </section>
        </>
      )}

      <footer><span>RALLIVIO · Real signal-first discovery</span><span>{items.length} verified records · refreshed automatically</span></footer>
    </main>
  );
}
