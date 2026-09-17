"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "../components/SiteHeader";

type Video = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
  velocity: number;
  url: string;
  embeddable: boolean;
};
type Data = {
  channel: {
    id: string;
    title: string;
    handle: string;
    description: string;
    avatar: string;
    subscribers: number;
    totalViews: number;
    videos: number;
  };
  items: Video[];
  fetchedAt: string;
};

type Trend = Video & {
  signal?: string;
  why?: string;
  momentumScore?: number;
  viewsPerHour?: number;
  viewsPerSubscriber?: number;
  creatorStage?: string;
};

type TrendResponse = { ok?: boolean; items?: Trend[]; state?: string };

const platforms = ["YouTube", "Instagram", "TikTok", "X", "LinkedIn"];
const periods = ["7D", "30D", "90D", "1Y"];
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}K` : `${n}`;
const ago = (d: string) => { const h = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 36e5)); return h < 24 ? `${h}h ago` : h < 720 ? `${Math.floor(h / 24)}d ago` : `${Math.floor(h / 720)}mo ago`; };

export default function CreatorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const urlQuery = params.get("q") || "Travel with Alex";
  const urlVideo = params.get("video");
  const [platform, setPlatform] = useState((params.get("platform") || "").toLowerCase() === "youtube" ? "YouTube" : "YouTube");
  const [period, setPeriod] = useState("30D");
  const [query, setQuery] = useState(urlQuery);
  const [input, setInput] = useState(urlQuery);
  const [data, setData] = useState<Data | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selected, setSelected] = useState<Trend | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [followed, setFollowed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plus, setPlus] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [notice, setNotice] = useState("");

  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };

  const loadCreator = async (q = query) => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/youtube/creator?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.state || "YOUTUBE_UNAVAILABLE");
      setData(j);
    } catch (e) { setError(e instanceof Error ? e.message : "YOUTUBE_UNAVAILABLE"); }
    finally { setLoading(false); }
  };

  const loadTrends = async (q = "") => {
    setTrendLoading(true); setTrendError("");
    try {
      const r = await fetch(`/api/youtube/trending?region=&q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const j: TrendResponse = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.state || "TRENDING_UNAVAILABLE");
      setTrends(Array.isArray(j.items) ? j.items : []);
    } catch (e) { setTrendError(e instanceof Error ? e.message : "TRENDING_UNAVAILABLE"); }
    finally { setTrendLoading(false); }
  };

  useEffect(() => { void loadCreator(urlQuery); }, [urlQuery]);
  useEffect(() => { if (platform === "YouTube") void loadTrends(""); }, [platform]);

  const creatorVideos = useMemo(() => {
    const days = period === "7D" ? 7 : period === "90D" ? 90 : period === "1Y" ? 365 : 30;
    return (data?.items || []).filter(v => new Date(v.publishedAt).getTime() >= Date.now() - days * 864e5);
  }, [data, period]);

  useEffect(() => {
    if (!urlVideo) return;
    const found = [...trends, ...(data?.items || [])].find(v => v.id === urlVideo);
    if (found) setSelected(found as Trend);
  }, [urlVideo, trends, data]);

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = input.trim() || "Travel with Alex";
    setQuery(q);
    router.push(`/creators?platform=youtube&q=${encodeURIComponent(q)}`);
    void loadCreator(q);
  };

  const choosePlatform = (name: string) => {
    if (name === "YouTube") { setPlatform(name); return; }
    notify(`${name} is coming. YouTube is live now.`);
  };

  const mainVideo = selected || trends[0] || creatorVideos[0] || null;
  const avgEngagement = creatorVideos.length ? creatorVideos.reduce((sum, v) => sum + v.engagement, 0) / creatorVideos.length : 0;

  return (
    <main className="creator-page">
      <SiteHeader />
      <div className="creator-shell">
        <aside className="creator-sidebar">
          <div className="side-profile">
            <div className="avatar">{data?.channel.avatar ? <img src={data.channel.avatar} alt="" /> : "YT"}</div>
            <div><strong>{data?.channel.title || "YouTube Creator"}</strong><small>{data?.channel.handle || "Public creator profile"}</small></div>
            <button type="button" onClick={() => setFollowed(v => !v)}>{followed ? "Following" : "Follow"}</button>
          </div>
          <div className="side-label">Creator</div>
          {[
            ["Overview", "overview", false],
            ["History", "history", true],
            ["Playlists", "playlists", true],
            ["Saved", "saved", true],
            ["Following", "following", true],
          ].map(([label, id, gated]) => (
            <button key={String(id)} type="button" className={id === "overview" ? "selected" : ""} onClick={() => gated ? notify("Log in to use your RALLIVIO library.") : document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })}>
              <span>{id === "history" ? "◷" : id === "playlists" ? "▤" : id === "saved" ? "☆" : id === "following" ? "♡" : "⌂"}</span>{label}
              {gated && <small>Login</small>}
            </button>
          ))}
          <div className="side-label premium-label">Creator workspace</div>
          {["Analytics", "Content Intelligence", "Promotion & Discovery", "Brand Opportunities", "Collaboration", "Alerts"].map(label => (
            <button key={label} type="button" className="premium-link" onClick={() => setShowPlans(true)}><span>✦</span>{label}<small>RALLIVIO+</small></button>
          ))}
        </aside>

        <section className="creator-main" id="overview">
          <section className="creator-head">
            <div>
              <span className="eyebrow">CREATOR</span>
              <h1>{data?.channel.title || query}</h1>
              <p>{data?.channel.handle || "YouTube creator profile"}</p>
            </div>
            <div className="creator-actions">
              <button type="button" className={followed ? "active" : ""} onClick={() => setFollowed(v => !v)}>{followed ? "Following" : "Follow"}</button>
              <button type="button" onClick={() => { setSaved(v => !v); notify(saved ? "Removed from Saved." : "Saved to RALLIVIO."); }}>{saved ? "★ Saved" : "☆ Save"}</button>
            </div>
          </section>

          <section className="platform-switcher">
            <div className="switch-copy"><span>PLATFORM</span><small>One creator. One profile. Native platform layer.</small></div>
            <div className="switch-tabs">
              {platforms.map(name => <button key={name} type="button" className={platform === name ? "active" : ""} onClick={() => choosePlatform(name)}>{name}{name !== "YouTube" && <em>Coming</em>}</button>)}
            </div>
          </section>

          {platform === "YouTube" ? (
            <>
              <section className="youtube-workspace">
                <div className="video-column">
                  <div className="search-row">
                    <form onSubmit={submitSearch} className="youtube-search">
                      <span>⌕</span><input value={input} onChange={e => setInput(e.target.value)} placeholder="Search YouTube creators or videos" aria-label="Search YouTube" /><button type="submit">Search</button>
                    </form>
                    <div className="periods">{periods.map(p => <button key={p} type="button" className={period === p ? "active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div>
                  </div>
                  <div className="player-card">
                    {mainVideo ? (
                      <div className="player-wrap">
                        {mainVideo.embeddable ? <iframe src={`https://www.youtube.com/embed/${mainVideo.id}?rel=0`} title={mainVideo.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : <div className="embed-fallback"><strong>Preview unavailable</strong><a href={mainVideo.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>}
                      </div>
                    ) : <div className="player-empty">{trendLoading ? "Loading live YouTube discovery…" : "Select a video to watch."}</div>}
                    {mainVideo && <div className="video-info"><span className="signal">{mainVideo.signal || "YouTube"}</span><h2>{mainVideo.title}</h2><p>{fmt(mainVideo.views)} views · {fmt(mainVideo.likes)} likes · {fmt(mainVideo.comments)} comments · {ago(mainVideo.publishedAt)}</p><a href={mainVideo.url} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>}
                  </div>
                </div>

                <aside className="queue-card">
                  <div className="queue-head"><div><span className="eyebrow">RALLIVIO DISCOVERY</span><h2>Trending now</h2></div><span className="live-dot">● LIVE</span></div>
                  {trendError && <div className="inline-error">{trendError}<button type="button" onClick={() => void loadTrends("")}>Retry</button></div>}
                  <div className="queue">
                    {(trends.length ? trends : creatorVideos).slice(0, 8).map(video => (
                      <button type="button" key={video.id} className={`queue-item ${mainVideo?.id === video.id ? "active" : ""}`} onClick={() => setSelected(video as Trend)}>
                        <img src={video.thumbnail} alt="" /><span><strong>{video.title}</strong><small>{video.signal || "Observed"} · {fmt(video.views)} views</small></span>
                      </button>
                    ))}
                    {!trendLoading && !trends.length && !creatorVideos.length && <div className="empty">No verified videos available.</div>}
                  </div>
                </aside>
              </section>

              <section className="why-grid">
                <div className="why-card">
                  <div className="section-title"><div><span className="eyebrow">RALLIVIO INTELLIGENCE</span><h2>Why this is moving</h2></div><b>{mainVideo?.signal || "Observed"}</b></div>
                  <p>{mainVideo?.why || "RALLIVIO explains movement only when verified source observations support it."}</p>
                  <div className="evidence-grid">
                    <Metric label="Momentum" value={mainVideo?.momentumScore != null ? String(Math.round(mainVideo.momentumScore)) : "—"} />
                    <Metric label="Velocity" value={mainVideo?.viewsPerHour != null ? `${fmt(Math.round(mainVideo.viewsPerHour))}/h` : "—"} />
                    <Metric label="Engagement" value={mainVideo ? `${mainVideo.engagement.toFixed(1)}%` : "—"} />
                    <Metric label="Stage" value={mainVideo?.creatorStage || "—"} />
                  </div>
                  <small className="method">RALLIVIO-derived values are separate from YouTube's reported numbers. Historical acceleration becomes available after snapshot history is established.</small>
                </div>
                <div className="profile-card">
                  <span className="eyebrow">YOUTUBE PROFILE</span>
                  <div className="profile-row"><div className="avatar large">{data?.channel.avatar ? <img src={data.channel.avatar} alt="" /> : "YT"}</div><div><h2>{data?.channel.title || query}</h2><p>{data?.channel.handle || ""}</p></div></div>
                  <div className="profile-stats"><Metric label="Subscribers" value={fmt(data?.channel.subscribers || 0)} /><Metric label="Total views" value={fmt(data?.channel.totalViews || 0)} /><Metric label="Videos" value={fmt(data?.channel.videos || 0)} /></div>
                  <p className="description">{data?.channel.description || "Public YouTube creator information is shown from the connected source."}</p>
                </div>
              </section>

              <section className="content-section">
                <div className="section-title"><div><span className="eyebrow">CREATOR CONTENT</span><h2>Recent videos</h2></div><span>{creatorVideos.length} in {period}</span></div>
                <div className="video-grid">
                  {creatorVideos.slice(0, 6).map(video => <button type="button" key={video.id} onClick={() => setSelected(video)}><img src={video.thumbnail} alt=""/><span><strong>{video.title}</strong><small>{fmt(video.views)} views · {ago(video.publishedAt)}</small></span></button>)}
                </div>
              </section>

              <section className="creator-workspace">
                <div className="workspace-head"><div><span className="eyebrow">FOR CREATORS</span><h2>Turn discovery into creator growth</h2><p>RALLIVIO+ is the deeper layer for creators who want measurable distribution, intelligence and opportunities.</p></div><button type="button" onClick={() => setShowPlans(true)}>Explore RALLIVIO+</button></div>
                <div className="workspace-grid">
                  <WorkspaceCard title="Promotion & Discovery" text="See when your content is featured, which RALLIVIO signal surfaced it, and the verified clicks RALLIVIO sent to your channel." />
                  <WorkspaceCard title="Content Intelligence" text="Compare content momentum, velocity, audience-relative performance and niche patterns from stored observations." />
                  <WorkspaceCard title="Brand Opportunities" text="Surface brand-fit opportunities using verified creator, audience and category data when the opportunity system is live." />
                  <WorkspaceCard title="Collaboration" text="Find relevant creators and collaboration opportunities from the RALLIVIO creator graph." />
                  <WorkspaceCard title="Audience & Analytics" text="Owner-only YouTube Analytics data such as watch time, retention, CTR and audience demographics after OAuth connection." />
                  <WorkspaceCard title="History & Alerts" text="Keep 7D, 30D, 90D and 1Y intelligence history and receive alerts when meaningful changes are detected." />
                </div>
              </section>
            </>
          ) : null}
        </section>
      </div>

      {showPlans && <div className="modal" onClick={() => setShowPlans(false)}><div className="plan-modal" onClick={e => e.stopPropagation()}><button type="button" className="close" onClick={() => setShowPlans(false)}>×</button><span className="eyebrow">RALLIVIO+</span><h2>Discovery stays open. Intelligence goes deeper.</h2><p>Free users can discover, watch, follow, save and explore creators. RALLIVIO+ adds history, personalization, creator analytics, distribution receipts and opportunity tools.</p><div className="plan-columns"><div><h3>Free</h3><ul><li>Discover &amp; watch</li><li>Basic creator profiles</li><li>Search &amp; categories</li><li>Follow &amp; save</li><li>Basic RALLIVIO signals</li></ul></div><div><h3>RALLIVIO+</h3><ul><li>Creator intelligence</li><li>Historical snapshots</li><li>Promotion &amp; discovery receipts</li><li>Brand opportunities</li><li>Collaboration matching</li><li>Alerts &amp; advanced tools</li></ul></div></div><button type="button" className="primary" onClick={() => { setPlus(true); setShowPlans(false); notify("RALLIVIO+ preview enabled."); }}>Continue with RALLIVIO+</button></div></div>}
      {notice && <div className="toast">{notice}</div>}

      <style jsx global>{`
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#07091a;color:#f5f6fa;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.creator-page{min-height:100vh;background:radial-gradient(circle at 70% 20%,#7b42ff12,transparent 28%),#07091a;color:#f5f6fa}.creator-shell{display:grid;grid-template-columns:210px minmax(0,1fr);max-width:1500px;margin:0 auto}.creator-sidebar{position:sticky;top:68px;height:calc(100vh - 68px);padding:22px 12px;border-right:1px solid #ffffff12;background:#090b19aa;overflow:auto}.side-profile{padding:10px 8px 18px;border-bottom:1px solid #ffffff10;margin-bottom:14px}.side-profile .avatar{width:46px;height:46px;margin-bottom:9px}.side-profile strong,.side-profile small{display:block}.side-profile strong{font-size:13px}.side-profile small{font-size:10px;color:#88869c;margin-top:3px}.side-profile button{margin-top:10px;width:100%;height:32px;border:1px solid #ffffff1b;background:#ffffff08;border-radius:9px;color:#fff;font-size:11px}.side-label{padding:7px 9px;color:#68667c;font-size:9px;letter-spacing:1.2px;text-transform:uppercase}.creator-sidebar>button{width:100%;display:flex;align-items:center;gap:10px;padding:10px 9px;border:0;background:transparent;color:#aaa8bc;border-radius:9px;text-align:left;font-size:11px}.creator-sidebar>button span{width:18px;color:#8d70c9}.creator-sidebar>button:hover,.creator-sidebar>button.selected{background:#8d4dff18;color:#fff}.creator-sidebar>button small{margin-left:auto;font-size:8px;color:#6d6a7d}.premium-label{margin-top:18px}.premium-link{font-size:10px!important}.premium-link small{color:#9d6dff!important}.creator-main{min-width:0;padding:28px 32px 70px}.creator-head{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:20px}.eyebrow{font-size:9px;letter-spacing:1.4px;color:#9f72ff;font-weight:850}.creator-head h1{font-size:30px;line-height:1.1;letter-spacing:-1px;margin:6px 0 4px}.creator-head p{margin:0;color:#858398;font-size:12px}.creator-actions{display:flex;gap:8px}.creator-actions button,.platform-switcher button,.workspace-head button,.plan-modal .primary{border:1px solid #ffffff18;background:#ffffff08;color:#fff;border-radius:9px;padding:9px 13px;font-size:11px}.creator-actions button.active{background:#8d4dff}.platform-switcher{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 15px;border:1px solid #ffffff12;background:#0c0f20;border-radius:12px;margin-bottom:16px}.switch-copy span,.switch-copy small{display:block}.switch-copy span{font-size:9px;letter-spacing:1.2px;color:#77748b}.switch-copy small{font-size:10px;color:#8d8a9e;margin-top:3px}.switch-tabs{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.switch-tabs button{position:relative;padding:8px 11px}.switch-tabs button.active{background:#8d4dff;border-color:#a76dff}.switch-tabs em{font-style:normal;font-size:7px;color:#77748c;margin-left:5px}.youtube-workspace{display:grid;grid-template-columns:minmax(0,1.55fr) 330px;gap:16px}.video-column{min-width:0}.search-row{display:flex;gap:8px;margin-bottom:10px}.youtube-search{height:40px;display:flex;align-items:center;gap:8px;flex:1;border:1px solid #ffffff12;border-radius:9px;background:#0c0f20;padding-left:12px}.youtube-search span{color:#77748b}.youtube-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#fff;font-size:11px}.youtube-search button{height:32px;margin-right:4px;border:0;border-radius:7px;background:#8d4dff;color:#fff;padding:0 12px;font-size:10px}.periods{display:flex;gap:3px}.periods button{border:1px solid #ffffff10;background:#0c0f20;color:#77748b;border-radius:7px;padding:0 9px;font-size:9px}.periods button.active{color:#fff;background:#24203b;border-color:#8d4dff}.player-card{border:1px solid #ffffff12;border-radius:12px;overflow:hidden;background:#0b0e1d}.player-wrap{aspect-ratio:16/9;background:#02030a}.player-wrap iframe{width:100%;height:100%;border:0}.player-empty,.embed-fallback{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#77748b;font-size:12px}.embed-fallback a,.video-info>a{color:#b783ff;text-decoration:none;font-size:10px}.video-info{padding:14px 16px 16px}.video-info .signal{display:inline-block;padding:4px 7px;border-radius:5px;background:#8d4dff20;color:#b783ff;font-size:8px;text-transform:uppercase;letter-spacing:.7px}.video-info h2{font-size:16px;line-height:1.3;margin:8px 0 5px}.video-info p{margin:0 0 8px;color:#88869a;font-size:10px}.queue-card,.why-card,.profile-card,.content-section,.creator-workspace{border:1px solid #ffffff12;background:#0b0e1d;border-radius:12px}.queue-card{padding:14px;min-width:0}.queue-head,.section-title{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.queue-head h2,.section-title h2{font-size:14px;margin:4px 0 0}.live-dot{font-size:8px;color:#c77cff}.queue{margin-top:12px;display:grid;gap:5px}.queue-item{display:grid;grid-template-columns:78px 1fr;gap:8px;width:100%;padding:6px;border:1px solid transparent;background:transparent;color:#fff;border-radius:8px;text-align:left}.queue-item:hover,.queue-item.active{background:#ffffff08;border-color:#ffffff12}.queue-item img{width:78px;height:44px;object-fit:cover;border-radius:5px}.queue-item strong,.queue-item small{display:block}.queue-item strong{font-size:9px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.queue-item small{font-size:8px;color:#77748b;margin-top:4px}.inline-error{font-size:9px;color:#ff8e9f;padding:8px;background:#ff406014;border-radius:7px;margin-top:10px}.inline-error button{border:0;background:transparent;color:#b783ff;margin-left:5px}.why-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-top:16px}.why-card,.profile-card{padding:17px}.section-title>b{font-size:8px;padding:5px 7px;border-radius:5px;background:#8d4dff18;color:#b783ff}.why-card>p{color:#b4b1c1;font-size:11px;line-height:1.5;margin:13px 0}.evidence-grid,.profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.metric{padding:10px;background:#ffffff06;border:1px solid #ffffff0d;border-radius:7px}.metric span,.metric strong{display:block}.metric span{font-size:8px;color:#747185}.metric strong{font-size:12px;margin-top:3px}.method{display:block;color:#666477;font-size:8px;line-height:1.4;margin-top:12px}.profile-row{display:flex;align-items:center;gap:10px;margin:13px 0}.avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7145ff,#bd6cff);overflow:hidden;font-size:10px;font-weight:900}.avatar img{width:100%;height:100%;object-fit:cover}.avatar.large{width:48px;height:48px}.profile-row h2{font-size:14px;margin:0}.profile-row p{font-size:9px;color:#77748b;margin:3px 0}.profile-stats{grid-template-columns:repeat(3,1fr)}.profile-stats .metric{background:transparent}.description{font-size:9px;line-height:1.5;color:#77748b;margin:12px 0 0}.content-section,.creator-workspace{padding:17px;margin-top:16px}.section-title>span{font-size:9px;color:#77748b}.video-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.video-grid button{display:block;text-align:left;border:1px solid #ffffff0d;background:#ffffff04;color:#fff;border-radius:8px;overflow:hidden;padding:0}.video-grid button:hover{border-color:#ffffff25}.video-grid img{width:100%;aspect-ratio:16/9;object-fit:cover}.video-grid span{display:block;padding:9px}.video-grid strong,.video-grid small{display:block}.video-grid strong{font-size:10px;line-height:1.35}.video-grid small{font-size:8px;color:#77748b;margin-top:5px}.workspace-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.workspace-head h2{font-size:18px;margin:5px 0}.workspace-head p{font-size:10px;color:#77748b;max-width:680px;line-height:1.5;margin:0}.workspace-head button{background:#8d4dff;border-color:#a66cff}.workspace-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.workspace-card{padding:13px;border:1px solid #ffffff0d;border-radius:8px;background:#ffffff04}.workspace-card h3{font-size:11px;margin:0 0 6px}.workspace-card p{font-size:9px;line-height:1.5;color:#77748b;margin:0}.modal{position:fixed;inset:0;z-index:200;display:grid;place-items:center;background:#0009;padding:20px}.plan-modal{position:relative;width:min(650px,100%);padding:28px;border:1px solid #ffffff18;border-radius:16px;background:#0d1021;box-shadow:0 30px 100px #0008}.close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#aaa8bc;font-size:24px}.plan-modal h2{font-size:24px;letter-spacing:-.6px;margin:7px 0}.plan-modal>p{font-size:11px;color:#8d8a9e;line-height:1.6}.plan-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0}.plan-columns>div{padding:15px;border:1px solid #ffffff12;border-radius:9px;background:#ffffff05}.plan-columns h3{margin:0 0 9px;font-size:13px}.plan-columns ul{margin:0;padding-left:17px;color:#aaa8b8;font-size:10px;line-height:1.9}.plan-modal .primary{background:#8d4dff;border-color:#a66cff}.toast{position:fixed;right:20px;bottom:20px;z-index:300;padding:11px 14px;border:1px solid #ffffff18;border-radius:9px;background:#12152a;color:#dddbea;font-size:10px;box-shadow:0 12px 35px #0006}
        @media(max-width:1100px){.creator-shell{grid-template-columns:180px}.youtube-workspace{grid-template-columns:minmax(0,1fr) 290px}.creator-main{padding:24px}.site-nav button{font-size:10px}}
        @media(max-width:850px){.creator-shell{display:block}.creator-sidebar{position:static;height:auto;border-right:0;border-bottom:1px solid #ffffff12;display:flex;gap:5px;overflow:auto;padding:8px}.side-profile,.side-label,.premium-label{display:none}.creator-sidebar>button{width:auto;white-space:nowrap}.creator-sidebar>button small{display:none}.youtube-workspace,.why-grid{grid-template-columns:1fr}.queue-card{order:2}.video-grid{grid-template-columns:repeat(2,1fr)}.workspace-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:650px){.creator-main{padding:16px 12px 50px}.creator-head,.platform-switcher,.workspace-head{align-items:flex-start;flex-direction:column}.switch-tabs{justify-content:flex-start}.search-row{flex-direction:column}.periods{height:34px}.periods button{padding:0 12px}.video-grid,.workspace-grid{grid-template-columns:1fr}.evidence-grid{grid-template-columns:repeat(2,1fr)}.plan-columns{grid-template-columns:1fr}.creator-head h1{font-size:24px}}
      `}</style>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function WorkspaceCard({ title, text }: { title: string; text: string }) {
  return <article className="workspace-card"><h3>{title}</h3><p>{text}</p></article>;
}
