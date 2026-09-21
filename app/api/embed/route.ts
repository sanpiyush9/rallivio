import { NextResponse } from "next/server";

const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = (process.env.RALLIVIO_BASE_URL || "https://rallivio.com").replace(/\/$/, "");

const TOPICS = new Set(["AI & Tech","Travel","Food","Gaming","Fitness","Podcasts","Lifestyle","Music","Fashion","Education","Business","Finance","Sports","Comedy","Science","Automotive","Beauty","Entertainment","DIY & Home","News","Pets"]);
const REGIONS = new Set(["IN","US","GB","CA","AU","DE","BR","JP","KR","SG","FR","ES","IT","MX","AR","CO","CL","PE","ZA","NG","KE","EG","AE","SA","TR","NL","SE","NO","DK","FI","PL","PT","ID","MY","TH","PH","VN","NZ","IE","CH","AT","BE","GR","CZ","RO","HU","IL","PK","BD","LK"]);
const SIGNALS = new Map([["Now Moving","Now Moving"],["Breaking Out","Breaking Out"],["On the Rise","On the Rise"],["Under the Radar","Under the Radar"],["Just Dropped","Just Dropped"],["Live Now","Live"]]);

const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET, OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

async function sb(path:string, init:RequestInit={}) {
  if (!SB || !KEY) throw new Error("Supabase configuration missing");
  return fetch(`${SB}/rest/v1/${path}`, {...init, headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,"Content-Type":"application/json",...(init.headers||{})},cache:"no-store"});
}
function host(req:Request) {
  for (const v of [req.headers.get("origin"),req.headers.get("referer")]) {
    if (!v) continue;
    try { const h=new URL(v).hostname.toLowerCase(); if(h && !["rallivio.com","www.rallivio.com"].includes(h)) return h.slice(0,253); } catch {}
  }
  return "direct";
}
async function rate(h:string) {
  const r=await sb("rpc/consume_embed_request",{method:"POST",body:JSON.stringify({p_source_host:h})});
  if(!r.ok) return 0;
  return Number(await r.json())||0;
}
export async function OPTIONS(){return new Response(null,{status:204,headers:cors});}
export async function GET(req:Request){
  const q=new URL(req.url).searchParams;
  const topic=q.get("topic")?.trim()||null;
  const region=q.get("region")?.trim().toUpperCase()||null;
  const rawSignal=q.get("signal")?.trim()||null;
  const rawLimit=Number(q.get("limit")||"5");
  const limit=Number.isInteger(rawLimit)?Math.min(10,Math.max(1,rawLimit)):5;
  if(topic&&!TOPICS.has(topic)) return NextResponse.json({error:"Invalid topic"},{status:400,headers:cors});
  if(region&&!REGIONS.has(region)) return NextResponse.json({error:"Invalid region"},{status:400,headers:cors});
  if(rawSignal&&!SIGNALS.has(rawSignal)) return NextResponse.json({error:"Invalid signal"},{status:400,headers:cors});
  try {
    const count=await rate(host(req));
    if(count>1000) return NextResponse.json({error:"Rate limit exceeded"},{status:429,headers:{...cors,"Retry-After":"3600","Cache-Control":"no-store"}});
    const p=new URLSearchParams({select:"video_id,channel_id,signal_type,momentum_score,observed_at",order:"momentum_score.desc.nullslast,observed_at.desc",limit:String(limit)});
    if(topic)p.set("topic",`eq.${topic}`);
    if(region)p.set("region",`eq.${region}`);
    if(rawSignal)p.set("signal_type",`eq.${SIGNALS.get(rawSignal)}`);
    else p.set("signal_type","not.eq.Observed");
    const rr=await sb(`feed_rankings?${p}`);
    if(!rr.ok) throw new Error(`feed_rankings ${rr.status}`);
    const rankings=await rr.json() as Array<{video_id:string;channel_id:string;signal_type:string;momentum_score:number|null}>;
    const ids=[...new Set(rankings.map(x=>x.video_id))];
    let pool:Array<{id:string;title:string;thumbnail:string;channel_title:string;channel_id:string;views:number}>=[];
    if(ids.length){
      const pr=await sb(`youtube_discovery_pool?select=id,title,thumbnail,channel_title,channel_id,views&id=in.(${ids.join(",")})`);
      if(!pr.ok) throw new Error(`pool ${pr.status}`);
      pool=await pr.json();
    }
    const byId=new Map(pool.map(x=>[x.id,x]));
    const items=rankings.map(r=>{
      const x=byId.get(r.video_id); if(!x)return null;
      return {id:x.id,title:x.title,thumbnail:x.thumbnail,channel:x.channel_title,signal:r.signal_type==="Live"?"Live Now":r.signal_type,momentum:Math.round(Number(r.momentum_score)||0),views:Number(x.views)||0,url:`${BASE}/r/${encodeURIComponent(x.id)}?src={publisherHost}`};
    }).filter(Boolean);
    return NextResponse.json({items,poweredBy:BASE},{headers:{...cors,"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600","CDN-Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});
  } catch(e) {
    console.error("embed feed failed",e);
    return NextResponse.json({items:[],poweredBy:BASE},{headers:{...cors,"Cache-Control":"public, s-maxage=60, stale-while-revalidate=300"}});
  }
}