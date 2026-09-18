import { NextResponse } from "next/server";

const SB = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YT_KEY = process.env.YOUTUBE_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export const REGIONS = ["IN","US","GB","CA","AU","DE","BR","JP","KR","SG"];
export const CATEGORIES = ["10","17","20","22","24"];
const n = (v: unknown) => { const x = Number(v ?? 0); return Number.isFinite(x) ? x : 0; };

export function auth(request: Request) {
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ ok: false, state: "UNAUTHORIZED" }, { status: 401 });
  }
  return null;
}
function config() {
  const missing = [!SB && "SUPABASE_URL", !SB_KEY && "SUPABASE_SERVICE_ROLE_KEY", !YT_KEY && "YOUTUBE_API_KEY", !CRON_SECRET && "CRON_SECRET"].filter(Boolean);
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(", ")}`);
}
export async function sb(path: string, init: RequestInit = {}) {
  if (!SB || !SB_KEY) throw new Error("Supabase configuration missing");
  return fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) }, cache: "no-store" });
}
export async function yt(path: string) {
  if (!YT_KEY) throw new Error("YOUTUBE_API_KEY missing");
  const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(YT_KEY)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`YouTube API ${r.status}: ${(await r.text()).slice(0,300)}`);
  return r.json();
}
async function usage(endpoint: string, metadata: Record<string, unknown>) {
  const r = await sb("api_usage", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ service:"youtube", endpoint, units:1, metadata }) });
  if (!r.ok) throw new Error(`api_usage write failed: ${r.status}`);
}
type Video = { id:string; snippet?:{channelId?:string;channelTitle?:string;title?:string;description?:string;publishedAt?:string;categoryId?:string;liveBroadcastContent?:string;thumbnails?:{high?:{url?:string};medium?:{url?:string};default?:{url?:string}}}; contentDetails?:{duration?:string}; statistics?:{viewCount?:string;likeCount?:string;commentCount?:string}; status?:{embeddable?:boolean} };
type Snap = {video_id:string;captured_at:string;views:number;likes:number;comments:number};

export function score(v: Video, subscriberCount:number, history:Snap[]) {
  const views=n(v.statistics?.viewCount), likes=n(v.statistics?.likeCount), comments=n(v.statistics?.commentCount);
  const published=v.snippet?.publishedAt ?? new Date().toISOString(), age=Math.max((Date.now()-Date.parse(published))/36e5,.1);
  const vph=views/age, engagement=((likes+comments)/Math.max(views,1))*100, efficiency=views/Math.max(subscriberCount,1);
  const fresh=Math.max(0,100-age*4); let velocity=Math.min(100,Math.log10(1+vph)*18), acceleration=0;
  if(history.length){const last=[...history].sort((a,b)=>Date.parse(a.captured_at)-Date.parse(b.captured_at)).at(-1)!; const oldAge=Math.max((Date.parse(last.captured_at)-Date.parse(published))/36e5,.1); acceleration=Math.min(100,Math.max(0,vph/Math.max(last.views/oldAge,1))*30);}
  const e=Math.min(100,engagement*20), eff=Math.min(100,Math.log10(1+Math.max(efficiency,0))*50);
  const momentum=Math.round(fresh*.2+velocity*.35+e*.15+eff*.2+acceleration*.1);
  let signal="Just Dropped"; if(v.snippet?.liveBroadcastContent==="live") signal="Live"; else if(history.length>=2&&acceleration>=45) signal="Breaking Out"; else if(history.length>=2&&velocity>=35) signal="On the Rise"; else if(subscriberCount<=500000&&eff>=55) signal="Under the Radar"; else if(momentum>=55) signal="Now Moving";
  return { momentum, signal, evidence:{velocity:Math.round(velocity),acceleration:Math.round(acceleration),engagement:Math.round(e),audienceEfficiency:Math.round(eff),historyAvailable:history.length>=2,subscriberCount,observedViews:views} };
}
export async function acquire() {
  config(); const now=new Date().toISOString();
  const jobs=REGIONS.flatMap(region=>CATEGORIES.map(category=>({region,category})));
  const results=await Promise.all(jobs.map(async ({region,category})=>{const p=new URLSearchParams({part:"snippet,contentDetails,statistics,status",chart:"mostPopular",regionCode:region,videoCategoryId:category,maxResults:"50"}); const x=await yt(`videos?${p}`) as {items?:Video[]}; await usage("videos.list:mostPopular",{phase:"acquire",region,category}); return {region,items:x.items??[]};}));
  const seen=new Map<string,{v:Video;region:string}>(); for(const r of results) for(const v of r.items) if(v.id) seen.set(v.id,{v,region:r.region});
  const rows=[...seen.values()].slice(0,2500).map(({v,region})=>({id:v.id,title:v.snippet?.title??"Untitled video",channel_title:v.snippet?.channelTitle??"Unknown channel",channel_id:v.snippet?.channelId??"",published_at:v.snippet?.publishedAt??now,thumbnail:v.snippet?.thumbnails?.high?.url??v.snippet?.thumbnails?.medium?.url??`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,description:v.snippet?.description??"",views:n(v.statistics?.viewCount),likes:n(v.statistics?.likeCount),comments:n(v.statistics?.commentCount),duration:v.contentDetails?.duration??null,category_id:v.snippet?.categoryId??null,url:`https://www.youtube.com/watch?v=${v.id}`,embeddable:v.status?.embeddable!==false,live_broadcast_content:v.snippet?.liveBroadcastContent??null,topic:"All",format:"all",region,source:"youtube",verified_at:now,fetched_at:now,last_seen_at:now,expires_at:new Date(Date.now()+36*36e5).toISOString(),metadata:{subscriber_count:null,signal:score(v,0,[]).signal,momentum_score:score(v,0,[]).momentum},topic_tags:["All"],acquired_at:now,stats_refreshed_at:null,language:null,language_confidence:null,relevance_score:1,relevance_confidence:.8}));
  const w=await sb("youtube_discovery_pool?on_conflict=id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)}); if(!w.ok) throw new Error(`Pool write failed: ${w.status} ${await w.text()}`);
  return {inserted:rows.length,youtubeCalls:jobs.length};
}
export async function refresh() {
  config(); const r=await sb("youtube_discovery_pool?select=id&order=views.desc&limit=2500"); if(!r.ok) throw new Error(`Pool read failed: ${r.status}`); const pool=await r.json() as {id:string}[]; const now=new Date().toISOString();
  const batches=Array.from({length:Math.ceil(pool.length/50)},(_,i)=>pool.slice(i*50,i*50+50));
  await Promise.all(batches.map(async (b,i)=>{if(!b.length)return;const p=new URLSearchParams({part:"snippet,statistics,status",id:b.map(x=>x.id).join(",")});const x=await yt(`videos?${p}`) as {items?:Video[]};await usage("videos.list:statistics",{phase:"refresh",batch:i});const items=x.items??[];const rows=items.map(v=>({id:v.id,views:n(v.statistics?.viewCount),likes:n(v.statistics?.likeCount),comments:n(v.statistics?.commentCount),fetched_at:now,last_seen_at:now,stats_refreshed_at:now,verified_at:now,updated_at:now}));const w=await sb("youtube_discovery_pool?on_conflict=id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});if(!w.ok)throw new Error(`Pool refresh failed: ${w.status}`);const s=await sb("video_stats_snapshots",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(items.map(v=>({video_id:v.id,captured_at:now,views:n(v.statistics?.viewCount),likes:n(v.statistics?.likeCount),comments:n(v.statistics?.commentCount)})))});if(!s.ok)throw new Error(`Snapshot write failed: ${s.status}`);}));
  return {refreshed:pool.length,youtubeCalls:batches.length};
}
export async function signals() {
  config(); const p=await sb("youtube_discovery_pool?select=id,channel_id,views,likes,comments,published_at,live_broadcast_content,metadata,region,topic&order=views.desc&limit=2500"); if(!p.ok)throw new Error(`Pool read failed: ${p.status}`); const pool=await p.json() as Record<string,unknown>[];
  const ids=pool.map(x=>String(x.id)); if(!ids.length)return {signals:0,eligibleVideos:0,suppressedVideos:0};
  const s=await sb(`video_stats_snapshots?select=video_id,captured_at,views,likes,comments&video_id=in.(${ids.join(",")})&order=captured_at.desc&limit=10000`);if(!s.ok)throw new Error(`Snapshot read failed: ${s.status}`);
  const grouped=new Map<string,Snap[]>();for(const x of await s.json() as Snap[]){const a=grouped.get(x.video_id)??[];if(a.length<5)a.push(x);grouped.set(x.video_id,a);}
  const ready=pool.filter(x=>(grouped.get(String(x.id))?.length??0)>=2), now=new Date().toISOString();
  const d=await sb("discovery_signals?signal_type=not.is.null",{method:"DELETE"});if(!d.ok)throw new Error(`Signal cleanup failed: ${d.status}`);
  const rows=ready.map(x=>{const m=(x.metadata??{}) as Record<string,unknown>;const q=score({id:String(x.id),snippet:{publishedAt:String(x.published_at),liveBroadcastContent:x.live_broadcast_content?String(x.live_broadcast_content):undefined},statistics:{viewCount:String(x.views??0),likeCount:String(x.likes??0),commentCount:String(x.comments??0)}},n(m.subscriber_count),grouped.get(String(x.id))??[]);return{channel_id:String(x.channel_id),video_id:String(x.id),signal_type:q.signal,momentum_score:q.momentum,evidence:q.evidence,cell_key:`${String(x.region??"WORLDWIDE")}:${String(x.topic??"All")}:all`,observed_at:now,expires_at:new Date(Date.now()+36*36e5).toISOString()};});
  for(let i=0;i<rows.length;i+=500){const w=await sb("discovery_signals",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(rows.slice(i,i+500))});if(!w.ok)throw new Error(`Signal write failed: ${w.status}`);}
  return {signals:rows.length,eligibleVideos:ready.length,suppressedVideos:pool.length-ready.length};
}
