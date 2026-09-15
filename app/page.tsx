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

export default function Home() {
  const [active, setActive] = useState("All signals");
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.state ?? "DATA_UNAVAILABLE");
        return body;
      })
      .then((body) => {
        if (cancelled) return;
        setItems(body.items ?? []);
        setState(null);
        setSelectedId(body.items?.[0]?.id ?? null);
      })
      .catch((error: Error) => {
        if (!cancelled) setState(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(
    () => active === "All signals" ? items : items.filter((item) => item.metadata?.signal === active),
    [active, items],
  );
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? items[0] ?? null;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">R</span><span>RALLIVIO</span></div>
        <nav><a className="active">Discover</a><a>Watch</a><a>Creators</a><a>Explore</a></nav>
        <button className="search">⌕ <span>Search creators, topics...</span></button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">YOUTUBE DISCOVERY · INDIA · TECHNOLOGY</p>
          <h1>What is moving <em>right now?</em></h1>
          <p className="lede">Real YouTube data, ranked by RALLIVIO signals instead of subscriber size alone.</p>
        </div>
        <div className="pulse"><span /> {loading ? "Loading verified pool" : state ? state : "Served from RALLIVIO discovery pool"}</div>
      </section>

      <div className="filters">
        {signals.map((signal) => <button key={signal} className={active === signal ? "selected" : ""} onClick={() => setActive(signal)}>{signal}</button>)}
        <button>India</button><button>YouTube</button><button>Technology</button>
      </div>

      {state ? (
        <section className="emptyState">
          <p className="eyebrow">TRUTHFUL EMPTY STATE</p>
          <h2>Real discovery data is not available yet.</h2>
          <p>{state === "CONFIGURATION_REQUIRED" ? "The deployment is waiting for the YouTube and Supabase server configuration. No fake creators or metrics are shown." : "The discovery pool could not be read. No fallback data is being invented."}</p>
        </section>
      ) : (
        <section className="grid">
          <div className="mainColumn">
            <div className="sectionHead"><div><p className="eyebrow">SIGNAL FEED</p><h2>{active === "All signals" ? "Creators breaking through" : active}</h2></div><span>{formatAge(selected?.stats_refreshed_at)}</span></div>

            {selected ? (
              <div className="videoCard">
                <div className="video">
                  {selected.embeddable ? <iframe title={selected.title} src={`https://www.youtube.com/embed/${selected.id}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <img src={selected.thumbnail} alt="" />}
                  <div className="videoLabel">{selected.metadata?.signal ?? "DISCOVERY"}</div>
                </div>
                <div className="videoMeta"><div><p className="eyebrow">{selected.topic} · {selected.metadata?.signal ?? "SIGNAL"}</p><h2>{selected.title}</h2><p>{selected.channel_title} · {formatCount(selected.views)} views · {formatCount(selected.likes)} likes · {formatCount(selected.comments)} comments</p></div><a className="watch" href={selected.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>
              </div>
            ) : (
              <div className="emptyState"><h2>No verified videos in this signal.</h2><p>RALLIVIO will not fill the slot with unrelated content.</p></div>
            )}

            <div className="sectionHead lower"><div><p className="eyebrow">UP NEXT</p><h2>More signals worth watching</h2></div></div>
            <div className="cards">
              {visible.slice(0, 6).map((item) => <button className={`creatorCard ${selected?.id === item.id ? "chosen" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}><img className="avatarImage" src={item.thumbnail} alt="" /><div className="creatorText"><strong>{item.channel_title}</strong><span>{item.title}</span><small>{formatCount(item.views)} views · {item.metadata?.signal ?? "Signal"}</small></div><b>{item.metadata?.momentum_score ?? "—"}</b></button>)}
            </div>
          </div>

          <aside className="side">
            {selected ? <div className="insight"><p className="eyebrow">WHY THIS IS MOVING</p><h3>{selected.channel_title}</h3><div className="metric"><span>RALLIVIO Momentum Score</span><strong>{selected.metadata?.momentum_score ?? "—"}</strong></div><div className="bar"><i style={{ width: `${Math.min(100, selected.metadata?.momentum_score ?? 0)}%` }} /></div><ul><li>{formatCount(selected.views)} YouTube views observed</li><li>{formatCount(selected.likes)} YouTube likes observed</li><li>{selected.metadata?.subscriber_count ? `${formatCount(selected.metadata.subscriber_count)} YouTube subscribers used as audience context` : "Subscriber count unavailable; not inferred"}</li></ul><a className="outline" href={selected.url} target="_blank" rel="noreferrer">View on YouTube ↗</a></div> : null}
            <div className="next"><p className="eyebrow">RANKING PRINCIPLE</p><h3>Fair opportunity</h3><p>RALLIVIO considers freshness, velocity, engagement and performance relative to audience size. Subscriber count alone does not determine the signal.</p></div>
          </aside>
        </section>
      )}

      <footer><span>RALLIVIO · Signal-first creator discovery</span><span>REAL DATA VERTICAL SLICE</span></footer>
    </main>
  );
}
