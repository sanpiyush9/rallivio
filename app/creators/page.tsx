"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "../components/SiteHeader";

type Video = {
  id: string; title: string; publishedAt: string; thumbnail: string;
  views: number; likes: number; comments: number; engagement: number;
  velocity: number; url: string; embeddable: boolean;
  signal?: string; why?: string; momentumScore?: number;
  viewsPerHour?: number; creatorStage?: string;
};
type CreatorData = { channel: { id: string; title: string; handle: string; description: string; avatar: string; subscribers: number; totalViews: number; videos: number }; items: Video[]; fetchedAt: string };
type TrendResponse = { ok?: boolean; items?: Video[]; state?: string };

const platforms = ["YouTube", "Instagram", "TikTok", "X", "LinkedIn"];
const periods = ["7D", "30D", "90D", "1Y"];
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K` : `${n}`;
const ago = (d: string) => { const h = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 36e5)); return h < 24 ? `${h}h ago` : h < 720 ? `${Math.floor(h / 24)}d ago` : `${Math.floor(h / 720)}mo ago`; };

export default function CreatorPage() {
  const router = useRouter();
  const [query, setQuery] = useState("Travel with Alex");
  const [input, setInput] = useState("Travel with Alex");
  const [platform, setPlatform] = useState("YouTube");
  const [period, setPeriod] = useState("30D");
  const [data, setData] = useState<CreatorData | null>(null);
  const [trends, setTrends] = useState<Video[]>([]);
  const [selected, setSelected] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [followed, setFollowed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");

  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };

  const loadCreator = async (q: string) => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/youtube/creator?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.state || "YOUTUBE_UNAVAILABLE");
      setData(j);
    } catch (e) { setError(e instanceof Error ? e.message : "YOUTUBE_UNAVAILABLE"); }
    finally { setLoading(false); }
  };

  const loadTrends = async (search = "") => {
    setTrendLoading(true); setTrendError("");
    try {
      const params = new URLSearchParams({ limit: "24" });
      if (search.trim()) params.set("q", search.trim());
      const r = await fetch(`/api/youtube/catalog?${params.toString()}`, { cache: "force-cache" });
      const j: TrendResponse = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.state || "CATALOG_UNAVAILABLE");
      const catalogItems = Array.isArray(j.items) ? j.items as unknown as Array<{
        id: string; title: string; publishedAt: string; thumbnail: string;
        views: number; likes: number; comments: number; url: string;
        embeddable: boolean; signal?: string; momentumScore?: number;
      }> : [];
      setTrends(catalogItems.map(v => ({
        id: v.id, title: v.title, publishedAt: v.publishedAt, thumbnail: v.thumbnail,
        views: v.views || 0, likes: v.likes || 0, comments: v.comments || 0,
        engagement: v.views ? ((v.likes + v.comments) / Math.max(v.views, 1)) * 100 : 0,
        velocity: 0, url: v.url, embeddable: v.embeddable !== false,
        signal: v.signal, momentumScore: v.momentumScore,
      })));
    } catch (e) { setTrendError(e instanceof Error ? e.message : "CATALOG_UNAVAILABLE"); }
    finally { setTrendLoading(false); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "Travel with Alex";
    const p = params.get("platform");
    const videoId = params.get("video");
    setQuery(q); setInput(q); if (p?.toLowerCase() === "youtube") setPlatform("YouTube");
    void loadCreator(q);
    void loadTrends(q);
    if (videoId) {
      setSelected({ id: videoId, title: "Selected YouTube video", publishedAt: new Date().toISOString(), thumbnail: "", views: 0, likes: 0, comments: 0, engagement: 0, velocity: 0, url: `https://www.youtube.com/watch?v=${videoId}`, embeddable: true });
    }
  }, []);

  const creatorVideos = useMemo(() => {
    const days = period === "7D" ? 7 : period === "90D" ? 90 : period === "1Y" ? 365 : 30;
    return (data?.items || []).filter(v => new Date(v.publishedAt).getTime() >= Date.now() - days * 864e5);
  }, [data, period]);

  useEffect(() => {
    const id = selected?.id;
    if (!id || id === "Selected YouTube video") return;
    const full = [...trends, ...(data?.items || [])].find(v => v.id === id);
    if (full) setSelected(full);
  }, [selected?.id, trends, data]);

  const mainVideo = selected || trends[0] || creatorVideos[0] || null;
  const embedOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = input.trim() || "Travel with Alex";
    setQuery(q); setPlatform("YouTube");
    router.push(`/creators?platform=youtube&q=${encodeURIComponent(q)}`);
    void loadCreator(q);
    void loadTrends(q);
  };

  const choosePlatform = (name: string) => {
    if (name === "YouTube") setPlatform(name);
    else notify(`${name} is coming. YouTube is live now.`);
  };

  return <main className="creator-page">
    <SiteHeader />
    <div className="creator-shell">
      <aside className="creator-sidebar">
        <div className="side-profile">
          <div className="avatar">{data?.channel.avatar ? <img src={data.channel.avatar} alt="" /> : "YT"}</div>
          <strong>{data?.channel.title || "YouTube Creator"}</strong>
          <small>{data?.channel.handle || "Public creator profile"}</small>
          <button type="button" onClick={() => setFollowed(v => !v)}>{followed ? "Following" : "Follow"}</button>
        </div>
        <div className="side-label">Creator</div>
        {[["Overview", "⌂"], ["History", "◷"], ["Playlists", "▤"], ["Saved", "☆"], ["Following", "♡"]].map(([label, icon], index) => <button key={label} type="button" className={index === 0 ? "selected" : ""} onClick={() => index === 0 ? document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" }) : notify("Log in to use your RALLIVIO library.")}><span>{icon}</span>{label}{index > 0 && <small>Login</small>}</button>)}
        <div className="side-label premium-label">Creator workspace</div>
        {[["Analytics","View creator performance data and trends."],["Content Intelligence","Understand momentum, engagement and content patterns."],["Promotion & Discovery","See where RALLIVIO discovery can surface your content."],["Brand Opportunities","Explore relevant brand and campaign opportunities."],["Collaboration","Find relevant creators for collaboration."],["Alerts","Track meaningful changes and discovery signals."]].map(([label, text]) => <button key={label} type="button" className="premium-link" onClick={() => notify(text)}><span>✦</span>{label}</button>)}
      </aside>

      <section className="creator-main" id="overview">
        <section className="creator-head">
          <div><span className="eyebrow">CREATOR</span><h1>{data?.channel.title || query}</h1><p>{data?.channel.handle || "YouTube creator profile"}</p></div>
          <div className="creator-actions"><button type="button" className={followed ? "active" : ""} onClick={() => setFollowed(v => !v)}>{followed ? "Following" : "Follow"}</button><button type="button" onClick={() => { setSaved(v => !v); notify(saved ? "Removed from Saved." : "Saved to RALLIVIO."); }}>{saved ? "★ Saved" : "☆ Save"}</button></div>
        </section>

        <section className="platform-switcher"><div><span>PLATFORM</span><small>One creator profile. One native platform layer.</small></div><div className="switch-tabs">{platforms.map(name => <button key={name} type="button" className={platform === name ? "active" : ""} onClick={() => choosePlatform(name)}>{name}{name !== "YouTube" && <em>Coming</em>}</button>)}</div></section>

        {platform === "YouTube" && <>
          <section className="youtube-workspace">
            <div className="video-column">
              <div className="search-row"><form className="youtube-search" onSubmit={submitSearch}><span>⌕</span><input value={input} onChange={e => setInput(e.target.value)} placeholder="Search YouTube creators or videos" aria-label="Search YouTube"/><button type="submit">Search</button></form><div className="periods">{periods.map(p => <button type="button" key={p} className={period === p ? "active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div></div>
              <div className="player-card">
                {mainVideo ? <><div className="player-wrap">{mainVideo.embeddable ? <iframe src={`https://www.youtube.com/embed/${mainVideo.id}?rel=0${embedOrigin ? `&origin=${encodeURIComponent(embedOrigin)}` : ""}`} title={mainVideo.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/> : <div className="embed-fallback">Preview unavailable<a href={mainVideo.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>}</div><div className="video-info"><span className="signal">{mainVideo.signal || "YouTube"}</span><h2>{mainVideo.title}</h2><p>{fmt(mainVideo.views)} views · {fmt(mainVideo.likes)} likes · {fmt(mainVideo.comments)} comments · {ago(mainVideo.publishedAt)}</p><div className="video-links"><a href={mainVideo.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a><button type="button" onClick={() => { setSaved(true); notify("Saved to RALLIVIO."); }}>{saved ? "★ Saved" : "☆ Save"}</button></div></div></> : <div className="player-empty">{loading || trendLoading ? "Loading live YouTube…" : "Search for a creator or select a video."}</div>}
              </div>
            </div>
            <aside className="queue-card"><div className="queue-head"><div><span className="eyebrow">RALLIVIO DISCOVERY</span><h2>Trending</h2></div><span className="live-dot">● LIVE</span></div>{trendError && <div className="inline-error">{trendError}<button type="button" onClick={() => void loadTrends()}>Retry</button></div>}<div className="queue">{(trends.length ? trends : creatorVideos).slice(0, 8).map(video => <button type="button" key={video.id} className={`queue-item ${mainVideo?.id === video.id ? "active" : ""}`} onClick={() => setSelected(video)}><img src={video.thumbnail} alt=""/><span><strong>{video.title}</strong><small>{video.signal || "Observed"} · {fmt(video.views)} views</small></span></button>)}{!trendLoading && !trends.length && !creatorVideos.length && <div className="empty">No verified videos available.</div>}</div></aside>
          </section>

          <section className="why-grid"><div className="why-card"><div className="section-title"><div><span className="eyebrow">RALLIVIO INTELLIGENCE</span><h2>Why this is moving</h2></div><b>{mainVideo?.signal || "Observed"}</b></div><p>{mainVideo?.why || "RALLIVIO explains movement only when verified observations support it."}</p><div className="evidence-grid"><Metric label="Momentum" value={mainVideo?.momentumScore != null ? String(Math.round(mainVideo.momentumScore)) : "—"}/><Metric label="Velocity" value={mainVideo?.viewsPerHour != null ? `${fmt(Math.round(mainVideo.viewsPerHour))}/h` : "—"}/><Metric label="Engagement" value={mainVideo ? `${mainVideo.engagement.toFixed(1)}%` : "—"}/><Metric label="Stage" value={mainVideo?.creatorStage || "—"}/></div><small className="method">RALLIVIO-derived values are separate from YouTube-reported numbers. Historical acceleration appears after snapshot history is established.</small></div><div className="profile-card"><span className="eyebrow">YOUTUBE PROFILE</span><div className="profile-row"><div className="avatar large">{data?.channel.avatar ? <img src={data.channel.avatar} alt=""/> : "YT"}</div><div><h2>{data?.channel.title || query}</h2><p>{data?.channel.handle || ""}</p></div></div><div className="profile-stats"><Metric label="Subscribers" value={fmt(data?.channel.subscribers || 0)}/><Metric label="Total views" value={fmt(data?.channel.totalViews || 0)}/><Metric label="Videos" value={fmt(data?.channel.videos || 0)}/></div></div></section>

          <section className="content-section"><div className="section-title"><div><span className="eyebrow">CREATOR CONTENT</span><h2>Recent videos</h2></div><span>{creatorVideos.length} in {period}</span></div><div className="video-grid">{creatorVideos.slice(0, 6).map(video => <button type="button" key={video.id} onClick={() => setSelected(video)}><img src={video.thumbnail} alt=""/><span><strong>{video.title}</strong><small>{fmt(video.views)} views · {ago(video.publishedAt)}</small></span></button>)}</div></section>

          <section className="creator-workspace"><div className="workspace-head"><div><span className="eyebrow">FOR CREATORS</span><h2>Creator workspace — free for now</h2><p>All Creator + YouTube features are available free while we build and validate the complete RALLIVIO experience. Subscription plans will come later.</p></div></div><div className="workspace-grid"><WorkspaceCard title="Promotion & Discovery" text="Featured appearances, signal history and verified clicks RALLIVIO sends to your channel."/><WorkspaceCard title="Content Intelligence" text="Momentum, velocity, performance against your own baseline and niche observations."/><WorkspaceCard title="Brand Opportunities" text="Brand-fit opportunities when the opportunity system has verified creator and audience data."/><WorkspaceCard title="Collaboration" text="Relevant creators and collaboration opportunities from the RALLIVIO creator graph."/><WorkspaceCard title="Analytics" text="Owner-only watch time, retention, CTR, traffic sources and audience data after YouTube OAuth."/><WorkspaceCard title="History & Alerts" text="7D, 30D, 90D and 1Y snapshots plus alerts for meaningful changes."/></div></section>
        </>}
      </section>
    </div>

    {notice && <div className="toast">{notice}</div>}

    <style jsx global>{`
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#07091a;color:#f5f6fa;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.creator-page{min-height:100vh;background:radial-gradient(circle at 72% 18%,#7b42ff12,transparent 30%),#07091a;color:#f5f6fa}.creator-shell{display:grid;grid-template-columns:210px minmax(0,1fr);max-width:1500px;margin:0 auto}.creator-sidebar{position:sticky;top:68px;height:calc(100vh - 68px);padding:20px 11px;border-right:1px solid #ffffff12;background:#090b19aa;overflow:auto}.side-profile{padding:8px 8px 17px;border-bottom:1px solid #ffffff10;margin-bottom:12px}.side-profile .avatar{margin-bottom:8px}.side-profile strong,.side-profile small{display:block}.side-profile strong{font-size:12px}.side-profile small{font-size:9px;color:#77748b;margin-top:3px}.side-profile button{margin-top:9px;width:100%;height:30px;border:1px solid #ffffff18;background:#ffffff08;border-radius:8px;color:#fff;font-size:10px}.side-label{padding:7px 8px;color:#666379;font-size:8px;letter-spacing:1.2px;text-transform:uppercase}.premium-label{margin-top:16px}.creator-sidebar>button{width:100%;display:flex;align-items:center;gap:9px;padding:9px 8px;border:0;background:transparent;color:#9d9aad;border-radius:8px;text-align:left;font-size:10px}.creator-sidebar>button span{width:17px;color:#9a70dc}.creator-sidebar>button:hover,.creator-sidebar>button.selected{background:#8d4dff18;color:#fff}.creator-sidebar>button small{margin-left:auto;color:#656276;font-size:7px}.premium-link small{color:#a26eff!important}.creator-main{min-width:0;padding:26px 30px 70px}.creator-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:18px}.eyebrow{font-size:8px;letter-spacing:1.3px;color:#9e6cff;font-weight:850}.creator-head h1{font-size:28px;letter-spacing:-.9px;margin:5px 0 3px}.creator-head p{font-size:10px;color:#77748b;margin:0}.creator-actions{display:flex;gap:7px}.creator-actions button,.workspace-head button,.plan-modal .primary{border:1px solid #ffffff18;background:#ffffff08;color:#fff;border-radius:8px;padding:8px 12px;font-size:10px}.creator-actions button.active,.workspace-head button,.plan-modal .primary{background:#8d4dff;border-color:#a66cff}.platform-switcher{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:11px 13px;border:1px solid #ffffff12;background:#0b0e1d;border-radius:10px;margin-bottom:14px}.platform-switcher>div:first-child span,.platform-switcher>div:first-child small{display:block}.platform-switcher>div:first-child span{font-size:8px;color:#6e6b80;letter-spacing:1px}.platform-switcher>div:first-child small{font-size:9px;color:#7f7c90;margin-top:2px}.switch-tabs{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.switch-tabs button{border:1px solid #ffffff10;background:#ffffff05;color:#aaa8b8;border-radius:7px;padding:7px 9px;font-size:9px}.switch-tabs button.active{background:#8d4dff;color:#fff;border-color:#a66cff}.switch-tabs em{font-style:normal;color:#666276;font-size:6px;margin-left:4px}.youtube-workspace{display:grid;grid-template-columns:minmax(0,1fr) 310px;gap:14px}.video-column{min-width:0}.search-row{display:flex;gap:7px;margin-bottom:9px}.youtube-search{height:38px;display:flex;align-items:center;gap:7px;flex:1;border:1px solid #ffffff12;border-radius:8px;background:#0b0e1d;padding-left:10px}.youtube-search span{color:#77748b}.youtube-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:10px}.youtube-search button{height:30px;margin-right:4px;border:0;border-radius:6px;background:#8d4dff;color:#fff;padding:0 11px;font-size:9px}.periods{display:flex;gap:3px}.periods button{border:1px solid #ffffff10;background:#0b0e1d;color:#77748b;border-radius:6px;padding:0 8px;font-size:8px}.periods button.active{background:#24203b;border-color:#8d4dff;color:#fff}.player-card,.queue-card,.why-card,.profile-card,.content-section,.creator-workspace{border:1px solid #ffffff12;background:#0b0e1d;border-radius:11px}.player-card{overflow:hidden}.player-wrap{aspect-ratio:16/9;background:#02030a}.player-wrap iframe{width:100%;height:100%;border:0}.player-empty,.embed-fallback{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#6f6c7f;font-size:10px}.embed-fallback a,.video-links a{color:#b581ff;text-decoration:none;font-size:9px}.video-info{padding:12px 14px 14px}.signal{display:inline-block;padding:4px 6px;border-radius:4px;background:#8d4dff18;color:#b581ff;font-size:7px;text-transform:uppercase;letter-spacing:.7px}.video-info h2{font-size:14px;line-height:1.35;margin:7px 0 4px}.video-info p{font-size:9px;color:#77748b;margin:0 0 7px}.video-links{display:flex;align-items:center;gap:12px}.video-links button{border:0;background:transparent;color:#aaa8b8;font-size:9px;padding:0}.queue-card{padding:13px;min-width:0}.queue-head,.section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.queue-head h2,.section-title h2{font-size:13px;margin:4px 0 0}.live-dot{font-size:7px;color:#bd7aff}.queue{display:grid;gap:4px;margin-top:10px}.queue-item{display:grid;grid-template-columns:72px 1fr;gap:7px;width:100%;padding:5px;border:1px solid transparent;background:transparent;color:#fff;border-radius:7px;text-align:left}.queue-item:hover,.queue-item.active{background:#ffffff07;border-color:#ffffff10}.queue-item img{width:72px;height:41px;object-fit:cover;border-radius:4px}.queue-item strong{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:8px;line-height:1.35}.queue-item small{display:block;color:#77748b;font-size:7px;margin-top:3px}.inline-error{font-size:8px;color:#ff8c9f;background:#ff405f12;border-radius:6px;padding:7px;margin-top:8px}.inline-error button{border:0;background:transparent;color:#b581ff;font-size:8px}.why-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;margin-top:14px}.why-card,.profile-card{padding:15px}.section-title>b{font-size:7px;padding:4px 6px;border-radius:4px;background:#8d4dff18;color:#b581ff}.why-card>p{font-size:10px;color:#aaa7b7;line-height:1.5;margin:11px 0}.evidence-grid,.profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.metric{padding:8px;background:#ffffff05;border:1px solid #ffffff0b;border-radius:6px}.metric span,.metric strong{display:block}.metric span{font-size:7px;color:#6f6c7f}.metric strong{font-size:10px;margin-top:2px}.method{display:block;color:#656276;font-size:7px;line-height:1.4;margin-top:10px}.profile-row{display:flex;align-items:center;gap:9px;margin:11px 0}.avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#7045ff,#bd6cff);font-size:9px;font-weight:900}.avatar img{width:100%;height:100%;object-fit:cover}.avatar.large{width:44px;height:44px}.profile-row h2{font-size:13px;margin:0}.profile-row p{font-size:8px;color:#77748b;margin:2px 0}.profile-stats{grid-template-columns:repeat(3,1fr)}.profile-stats .metric{background:transparent}.content-section,.creator-workspace{padding:15px;margin-top:14px}.section-title>span{font-size:8px;color:#77748b}.video-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.video-grid button{display:block;text-align:left;border:1px solid #ffffff0d;background:#ffffff04;color:#fff;border-radius:7px;overflow:hidden;padding:0}.video-grid img{width:100%;aspect-ratio:16/9;object-fit:cover}.video-grid span{display:block;padding:8px}.video-grid strong,.video-grid small{display:block}.video-grid strong{font-size:8px;line-height:1.35}.video-grid small{font-size:7px;color:#77748b;margin-top:4px}.workspace-head{display:flex;justify-content:space-between;gap:15px}.workspace-head h2{font-size:17px;margin:4px 0}.workspace-head p{font-size:9px;line-height:1.5;color:#77748b;margin:0;max-width:700px}.workspace-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.workspace-card{padding:11px;border:1px solid #ffffff0d;border-radius:7px;background:#ffffff04}.workspace-card h3{font-size:9px;margin:0 0 5px}.workspace-card p{font-size:8px;line-height:1.45;color:#77748b;margin:0}.modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:#0009;padding:18px}.plan-modal{position:relative;width:min(620px,100%);padding:25px;border:1px solid #ffffff18;border-radius:14px;background:#0d1021}.close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:#aaa8b8;font-size:23px}.plan-modal h2{font-size:22px;margin:6px 0}.plan-modal>p{font-size:10px;line-height:1.55;color:#858294}.plan-columns{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:16px 0}.plan-columns>div{padding:13px;border:1px solid #ffffff10;border-radius:8px;background:#ffffff04}.plan-columns h3{font-size:11px;margin:0 0 7px}.plan-columns ul{margin:0;padding-left:16px;color:#9996a8;font-size:9px;line-height:1.8}.toast{position:fixed;right:18px;bottom:18px;z-index:300;padding:10px 13px;border:1px solid #ffffff18;border-radius:8px;background:#12152a;color:#dddbea;font-size:9px;box-shadow:0 12px 30px #0006}
      @media(max-width:1050px){.creator-shell{grid-template-columns:180px}.creator-main{padding:22px}.youtube-workspace{grid-template-columns:minmax(0,1fr) 275px}.site-nav button{font-size:10px}}
      @media(max-width:820px){.creator-shell{display:block}.creator-sidebar{position:static;height:auto;border-right:0;border-bottom:1px solid #ffffff12;display:flex;overflow:auto;gap:3px;padding:7px}.side-profile,.side-label{display:none}.creator-sidebar>button{width:auto;white-space:nowrap}.creator-sidebar>button small{display:none}.youtube-workspace,.why-grid{grid-template-columns:1fr}.queue-card{order:2}.video-grid,.workspace-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.creator-main{padding:15px 11px 45px}.creator-head,.platform-switcher,.workspace-head{flex-direction:column;align-items:flex-start}.switch-tabs{justify-content:flex-start}.search-row{flex-direction:column}.periods{height:32px}.video-grid,.workspace-grid,.plan-columns{grid-template-columns:1fr}.evidence-grid{grid-template-columns:repeat(2,1fr)}}
    `}</style>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function WorkspaceCard({ title, text }: { title: string; text: string }) { return <article className="workspace-card"><h3>{title}</h3><p>{text}</p></article>; }
