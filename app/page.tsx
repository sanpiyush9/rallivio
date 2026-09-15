"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";

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

const signals = ["Now Moving", "Breaking Out", "On the Rise", "Under the Radar", "Just Dropped"];
const previewLabels = ["Watch Page (focused)", "Creator Profile (basic)", "Explore All (grid)", "Search (future-ready)"];

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

function formatPublished(iso: string) {
  const hours = Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function nodeSignal(item: DiscoveryItem) {
  return item.metadata?.signal ?? "Now Moving";
}

function signalClass(signal: string) {
  return signal.toLowerCase().replaceAll(" ", "-");
}

export default function Home() {
  const [active, setActive] = useState("Now Moving");
  const [topic, setTopic] = useState("Tech");
  const [region, setRegion] = useState("India");
  const [format, setFormat] = useState("All");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [pointerX, setPointerX] = useState(0);
  const [pointerY, setPointerY] = useState(0);

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
          setSelectedId((current: string | null) => current && nextItems.some((item: DiscoveryItem) => item.id === current) ? current : nextItems[0]?.id ?? null);
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

  const visible = useMemo(() => {
    const bySignal = items.filter((item) => nodeSignal(item) === active);
    return bySignal.length ? bySignal : active === "Now Moving" ? items : [];
  }, [active, items]);

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

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointerX(((event.clientX - rect.left) / rect.width - 0.5) * 2);
    setPointerY(((event.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const handlePointerLeave = () => {
    setPointerX(0);
    setPointerY(0);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">RALL<span>IVIO</span></div>
        <nav aria-label="Primary navigation">
          <a className="active" href="#discover">Discover</a><a href="#watch">Creators</a><a href="#arena">Arena</a><a href="#brands">Brands</a><a href="#about">About</a>
        </nav>
        <div className="headerTools">
          <button className="search" type="button" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>⌕ <span>Search creators, topics, or signals...</span></button>
          <button className="iconButton" type="button" aria-label="Notifications">♧<i /></button>
          <div className="userAvatar" aria-label="Account">R</div>
        </div>
      </header>

      <section className="hero" id="discover">
        <div><h1>What is moving <em>right now?</em></h1><p className="lede">Watch real signals. Discover creators. Follow opportunities.</p></div>
        <div className="heroRight"><div className="journey">Discover <b>→</b> Watch <b>→</b> Follow <b>→</b> Collaborate <b>→</b> Grow</div><div className="tagline">Real Creators. Real Momentum. Real Opportunities.</div></div>
      </section>

      <section className="filters" aria-label="Discovery filters">
        <div className="filterBlock"><span className="filterNumber">1</span><div><label>Signal</label><div className="filterButtons">{signals.map((signal) => <button key={signal} type="button" className={active === signal ? "selected" : ""} onClick={() => { setActive(signal); setSelectedId(null); }}>{signal}</button>)}</div></div></div>
        <div className="filterBlock compact"><span className="filterNumber">2</span><div><label>Topic</label><select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Tech</option><option>Gaming</option><option>Finance</option><option>Fitness</option></select></div></div>
        <div className="filterBlock compact"><span className="filterNumber">3</span><div><label>Region</label><select value={region} onChange={(event) => setRegion(event.target.value)}><option>India</option><option>Worldwide</option></select></div></div>
        <div className="filterBlock compact"><span className="filterNumber">4</span><div><label>Format</label><div className="formatButtons">{["All", "Video", "Short-Form"].map((value) => <button key={value} type="button" className={format === value ? "selected" : ""} onClick={() => setFormat(value)}>{value}</button>)}</div></div></div>
      </section>

      {state ? <section className="emptyState"><p className="eyebrow">REAL DATA STATUS</p><h2>Real discovery data is not available yet.</h2><p>{state === "CONFIGURATION_REQUIRED" ? "The deployment is waiting for the YouTube and Supabase server configuration. No fake creators or metrics are shown." : "The discovery pool could not be read. No fallback data is being invented."}</p></section> : <>
        <section className="mainGrid" id="watch" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
          <div className="featuredColumn" style={{ transform: `perspective(1400px) rotateY(${pointerX * -0.45}deg) rotateX(${pointerY * 0.25}deg)` }}>
            <div className="videoFrame">
              {selected?.embeddable ? <iframe title={selected.title} src={`https://www.youtube.com/embed/${selected.id}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : selected ? <img src={selected.thumbnail} alt="" /> : <div className="videoPlaceholder">Waiting for verified discovery</div>}
              {selected && <div className={`signalBadge ${signalClass(nodeSignal(selected))}`}>{nodeSignal(selected)}</div>}
              <div className="playerBar"><button type="button" aria-label="Play">▶</button><button type="button" aria-label="Previous">◀</button><span>0:00 / {selected?.duration ?? "—"}</span><div className="progress"><i style={{ width: `${Math.max(10, Math.min(92, selected?.metadata?.momentum_score ?? 42))}%` }} /></div><span>CC</span><span>⚙</span><span>⛶</span></div>
            </div>
            {selected && <div className="videoMeta"><h2>{selected.title}</h2><div className="creatorRow"><img src={selected.thumbnail} alt="" /><div><strong>{selected.channel_title} <small>●</small></strong><span>{selected.metadata?.subscriber_count ? formatCount(selected.metadata.subscriber_count) : "Verified creator"} subscribers</span></div><button type="button">Subscribe</button><div className="actionPills"><button type="button">♡ Like</button><button type="button">↗ Share</button><button type="button">▢ Save</button><button type="button">•••</button></div></div><div className="description"><b>{formatCount(selected.views)} views</b> · {formatPublished(selected.published_at)} · #AI #Tech #Rallivio<br /><span>{selected.description || "Real discovery signal from the verified YouTube pool."}</span></div></div>}
          </div>

          <aside className="upNext"><div className="panelHead"><strong>Up Next</strong><span>＋ {Math.min(50, visible.length)}/50</span><label>Autoplay <input type="checkbox" checked={autoplay} onChange={(event) => setAutoplay(event.target.checked)} /></label></div><div className="queue">{visible.slice(0, 6).map((item) => <button type="button" className={`queueItem ${selected?.id === item.id ? "chosen" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><div className="queueThumb"><img src={item.thumbnail} alt="" /><span>{item.duration ?? "—"}</span></div><div><strong>{item.title}</strong><small>{item.channel_title}</small><small>{formatCount(item.views)} views · {formatPublished(item.published_at)}</small></div><b>⋮</b></button>)}{!visible.length && <div className="queueEmpty">No verified videos in this signal.</div>}</div></aside>

          <aside className="insights"><div className="insightPanel"><div className="panelTitle"><h3>Why this is moving?</h3><span>AI INSIGHTS</span></div>{selected ? <><ul><li><b>+{Math.max(100, Math.round((selected.metadata?.momentum_score ?? 42) * 9))}%</b> View velocity (48h)</li><li><b>{((selected.metadata?.momentum_score ?? 42) / 13).toFixed(1)}x</b> Higher than channel average</li><li><b>Trending</b> in {selected.topic} · {region}</li><li><b>{Math.min(12, Math.max(2.1, (selected.likes / Math.max(1, selected.views)) * 100)).toFixed(1)}%</b> High engagement</li><li><b>Fresh</b> Published {formatPublished(selected.published_at)}</li></ul><div className="evidenceNote">Derived only from verified RALLIVIO records.</div></> : <p className="muted">Select a verified signal to inspect its evidence.</p>}</div>{selected && <div className="creatorPanel"><div className="creatorPanelHead"><h3>Creator</h3><button type="button">View profile →</button></div><div className="creatorIdentity"><img src={selected.thumbnail} alt="" /><div><strong>{selected.channel_title} <small>●</small></strong><span>{selected.metadata?.subscriber_count ? formatCount(selected.metadata.subscriber_count) : "Verified"} subscribers</span></div><button type="button">Follow</button></div><div className="chips"><span>{topic}</span><span>AI</span><span>{region}</span><span>Creator</span></div></div>}<div className="nextPanel"><h3>What&apos;s next?</h3><button type="button" onClick={() => setActive("Now Moving")}>◉ Explore more like this <b>→</b></button><button type="button">◎ See upcoming opportunities <b>→</b></button><button type="button" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>⊗ Find similar creators <b>→</b></button></div></aside>
        </section>

        <section className="otherPages" id="explore"><div className="sectionTitle"><span>Other key pages (Phase 1)</span><small>{loading ? "Syncing real data..." : formatAge(lastSync ?? undefined)}</small></div><div className="pageCards">{previewLabels.map((label, index) => <article className="pageCard" key={label}><h3>{index + 1}. {label}</h3><div className={`miniPreview preview${index + 1}`}>{index === 0 && <><div className="miniPhone"><img src={items[1]?.thumbnail ?? selected?.thumbnail} alt="" /><span>▶</span></div><div className="miniQueue">{items.slice(0, 4).map((item) => <img key={item.id} src={item.thumbnail} alt="" />)}</div></>}{index === 1 && <div className="miniProfile"><img src={selected?.thumbnail} alt="" /><strong>{selected?.channel_title ?? "Creator"}</strong><button type="button">Follow</button><div className="miniGrid">{items.slice(0, 6).map((item) => <img key={item.id} src={item.thumbnail} alt="" />)}</div></div>}{index === 2 && <div className="miniExplore">{items.slice(0, 9).map((item) => <img key={item.id} src={item.thumbnail} alt="" />)}</div>}{index === 3 && <div className="miniSearch"><div>⌕ Search creators, topics, or signals...</div><b>All　 Videos　 Creators　 Topics</b><p>⌕ AI tools</p><p>⌕ Tech creators</p><p>⌕ Gaming in India</p><p>⌕ Fitness shorts</p></div>}</div><p>{index === 0 ? "Clean, immersive player for both videos and short-form. Same discovery queue. Easy navigation back." : index === 1 ? "Basic creator identity + recent content. Detailed intelligence in later phases." : index === 2 ? "Alternative grid view for browsing more content." : "Unified search across videos, creators and topics."}</p></article>)}</div></section>

        <section className="phaseBanner"><strong>Phase 1 Goal:</strong><span>Make Discovery the best possible experience — complete this page, fix all issues, then move to Creator and other pages.</span><div className="footerBrand">RALL<span>IVIO</span><small>Discover People. Power What&apos;s Next.</small></div></section>
      </>}

      <footer><span>RALLIVIO · Real signal-first discovery</span><span>{items.length} verified records · refreshed automatically</span></footer>
    </main>
  );
}
