"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Item = {
  id: string;
  title: string;
  channel_title: string;
  published_at: string;
  thumbnail: string;
  description: string;
  views: number;
  url: string;
  embeddable: boolean;
  topic: string;
  metadata?: { signal?: string; momentum_score?: number; subscriber_count?: number | null };
};

const registry = {
  youtube: { name: "YouTube", icon: "youtube", connected: true, description: "Verified video discovery from the connected YouTube source." },
  instagram: { name: "Instagram", icon: "instagram", connected: false, description: "The Instagram environment is ready for its verified source adapter." },
  tiktok: { name: "TikTok", icon: "tiktok", connected: false, description: "The TikTok environment is ready for its verified source adapter." },
  x: { name: "X", icon: "x", connected: false, description: "The X environment is ready for its verified source adapter." },
  linkedin: { name: "LinkedIn", icon: "linkedin", connected: false, description: "The LinkedIn environment is ready for its verified source adapter." },
  spotify: { name: "Spotify", icon: "spotify", connected: false, description: "The Spotify environment is ready for its verified source adapter." },
  twitch: { name: "Twitch", icon: "twitch", connected: false, description: "The Twitch environment is ready for its verified source adapter." },
  facebook: { name: "Facebook", icon: "facebook", connected: false, description: "The Facebook environment is ready for its verified source adapter." },
  pinterest: { name: "Pinterest", icon: "pinterest", connected: false, description: "The Pinterest environment is ready for its verified source adapter." },
  reddit: { name: "Reddit", icon: "reddit", connected: false, description: "The Reddit environment is ready for its verified source adapter." },
  discord: { name: "Discord", icon: "discord", connected: false, description: "The Discord environment is ready for its verified source adapter." },
  snapchat: { name: "Snapchat", icon: "snapchat", connected: false, description: "The Snapchat environment is ready for its verified source adapter." },
} as const;

const iconUrl = (slug: string) => `https://cdn.simpleicons.org/${slug}/ffffff`;
const fmt = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString();

export default function PlatformEnvironment() {
  const params = useParams<{ platform: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const key = String(params.platform || "").toLowerCase() as keyof typeof registry;
  const platform = registry[key];
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!platform?.connected) return;
    setLoading(true);
    fetch("/api/discovery", { cache: "no-store" })
      .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.state || "DATA_UNAVAILABLE"); return b; })
      .then(b => setItems(Array.isArray(b.items) ? b.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [platform?.connected]);

  const q = search.get("q") || "";
  const video = search.get("video");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? items.filter(x => `${x.title} ${x.channel_title} ${x.description} ${x.topic}`.toLowerCase().includes(needle)) : items;
  }, [items, q]);

  if (!platform) return <main className="env"><div className="box"><h1>Platform not registered</h1><button onClick={() => router.push("/")}>Back to Discover</button></div></main>;

  return <main className="env">
    <style>{css}</style>
    <header><button className="back" onClick={() => router.push("/")}>← Discover</button><div className="identity"><img src={iconUrl(platform.icon)} alt=""/><strong>{platform.name}</strong></div><span className={platform.connected ? "connected" : "planned"}>{platform.connected ? "SOURCE CONNECTED" : "ADAPTER NOT CONNECTED"}</span></header>
    <section className="hero"><div><div className="kicker">RALLIVIO PLATFORM ENVIRONMENT</div><h1>{platform.name}</h1><p>{platform.description}</p>{q && <div className="query">Discovery query: <b>{q}</b></div>}</div><div className="orb"><img src={iconUrl(platform.icon)} alt=""/></div></section>
    {!platform.connected ? <section className="empty"><div className="emptyIcon"><img src={iconUrl(platform.icon)} alt=""/></div><h2>Environment ready. Data adapter next.</h2><p>RALLIVIO will not display invented activity here. When this platform is connected, its verified observations will flow into the shared discovery intelligence layer and this environment will respond to its own source data.</p><button onClick={() => router.push("/")}>Return to the living field</button></section> : <section className="grid">{loading && <div className="empty">Syncing verified observations…</div>}{!loading && !shown.length && <div className="empty"><h2>No matching observations</h2><p>Try another query or return to the living field.</p></div>}{shown.map(x => <article key={x.id} className={video === x.id ? "focus" : ""}><img src={x.thumbnail} alt=""/><div><span>{x.metadata?.signal || "Observed"}</span><h3>{x.title}</h3><p>{x.channel_title} · {fmt(x.views)} views · Score {Math.round(x.metadata?.momentum_score || 0)}</p><a href={x.url} target="_blank" rel="noreferrer">Open on YouTube ↗</a></div></article>)}</section>}
  </main>;
}

const css = `.env{min-height:100vh;background:radial-gradient(circle at 70% 20%,rgba(119,70,255,.2),transparent 30%),#070918;color:#f8f7ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;padding-bottom:60px}.env header{height:72px;display:flex;align-items:center;gap:22px;padding:0 34px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(7,8,22,.78);backdrop-filter:blur(20px)}.back{border:0;background:transparent;color:#bdb9d0;font-weight:700}.identity{display:flex;align-items:center;gap:10px;font-size:19px;flex:1}.identity img{width:27px;height:27px}.connected,.planned{font-size:9px;letter-spacing:1px;padding:7px 10px;border-radius:999px}.connected{color:#6ee7b1;background:rgba(71,211,149,.1)}.planned{color:#bca8ff;background:rgba(145,81,255,.1)}.hero{max-width:1120px;margin:auto;padding:90px 28px 50px;display:flex;align-items:center;justify-content:space-between;gap:50px}.kicker{font-size:10px;letter-spacing:1.5px;color:#bc6cff;font-weight:850}.hero h1{font-size:clamp(55px,8vw,100px);letter-spacing:-5px;margin:12px 0}.hero p{max-width:620px;color:#aaa9bf;font-size:17px;line-height:1.6}.query{display:inline-block;margin-top:16px;padding:9px 12px;border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#9996ad;font-size:11px}.query b{color:#eee}.orb{width:230px;height:230px;flex:none;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 25%,#3e4cc2,#11132d 55%,#080a19);border:1px solid rgba(183,132,255,.65);box-shadow:0 0 80px rgba(131,69,255,.45);animation:pulse 2.2s ease-in-out infinite}.orb img{width:75px;height:75px}@keyframes pulse{50%{transform:scale(1.045)}}.empty,.grid{max-width:1120px;margin:0 auto;padding:28px}.empty{text-align:center;border:1px dashed rgba(255,255,255,.13);border-radius:20px;background:rgba(255,255,255,.025)}.emptyIcon{width:65px;height:65px;border-radius:17px;display:grid;place-items:center;margin:0 auto 15px;background:#11132b}.emptyIcon img{width:32px}.empty h2{margin:8px 0;font-size:22px}.empty p{max-width:650px;margin:10px auto 20px;color:#89869c;line-height:1.6;font-size:13px}.empty button{border:0;border-radius:999px;padding:10px 15px;background:linear-gradient(135deg,#7f47ff,#bf62ff);color:#fff;font-weight:750}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.grid article{display:grid;grid-template-columns:150px 1fr;gap:15px;padding:12px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.025)}.grid article.focus{border-color:#c169ff;box-shadow:0 0 30px rgba(169,86,255,.18)}.grid article>img{width:150px;height:95px;object-fit:cover;border-radius:10px}.grid article span{font-size:9px;color:#bd70ff;font-weight:800}.grid h3{font-size:13px;line-height:1.3;margin:6px 0}.grid p{font-size:9px;color:#878499}.grid a{font-size:9px;color:#c271ff;text-decoration:none}@media(max-width:760px){.env header{padding:0 16px}.hero{padding:55px 20px 35px;display:block}.orb{margin:40px auto 0;width:180px;height:180px}.grid{grid-template-columns:1fr;padding:20px}.grid article{grid-template-columns:110px 1fr}.grid article>img{width:110px;height:75px}}`;
