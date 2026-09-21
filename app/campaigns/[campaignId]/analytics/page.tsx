"use client";

import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";

type Campaign={id:string;source_url:string;source_host:string|null;content_type:string|null;title:string|null;status:string;distribution_mode:string;trial_started_at:string|null;trial_ends_at:string|null;created_at:string;impressions:number|null;clicks:number|null;youtube_video_id:string|null};\ntype Analytics={campaign:Campaign;summary:{impressions:number;clicks:number;ctr:number;publishers:number};publishers:Array<{host:string;impressions:number;clicks:number;lastSeen:string|null}>;timeline:Array<{date:string;impressions:number;clicks:number}>};

export default function CampaignAnalytics(){
 // Campaign analytics route redeploy marker: keep this page on the feature branch preview.
 const params=useParams<{campaignId:string}>(),router=useRouter();
 const [data,setData]=useState<Analytics|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 async function load(){try{const r=await fetch("/api/campaigns/"+params.campaignId+"/analytics",{cache:"no-store"});const j=await r.json();if(!r.ok||!j.ok)throw new Error(j.state||"Unable to load analytics");setData(j)}catch(e){setError(e instanceof Error?e.message:"Unable to load analytics")}finally{setLoading(false)}}
 useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t)},[params.campaignId]);
 if(loading)return <main style={shell}><div style={box}>Loading campaign analytics…</div></main>;
 if(error)return <main style={shell}><div style={box}><h1>Campaign analytics</h1><p>{error}</p><button onClick={()=>router.push("/promote")} style={button}>Back to Promote</button></div></main>;
 const c=data!.campaign,s=data!.summary;
 return <main style={shell}><div style={{maxWidth:1120,margin:"0 auto"}}>
  <button onClick={()=>router.push("/promote")} style={back}>← Promote</button>
  <div style={eyebrow}>RALLIVIO CAMPAIGN ANALYTICS</div>
  <h1 style={title}>{c.title}</h1>
  <p style={muted}>{c.source_url}</p>
  <div style={grid}>
   <Metric label="Impressions" value={s.impressions.toLocaleString()} sub="times shown across authorized publisher placements"/>
   <Metric label="Clicks" value={s.clicks.toLocaleString()} sub="outbound clicks through RALLIVIO"/>
   <Metric label="CTR" value={s.ctr+"%"} sub="clicks ÷ impressions"/>
   <Metric label="Publisher sites" value={String(s.publishers)} sub="unique websites showing the promotion"/>
  </div>
  <section style={section}><h2 style={h2}>Where RALLIVIO is promoting it</h2><p style={muted}>Publisher domains that actually requested and displayed this campaign.</p>
   <div style={table}><div style={thead}><span>Publisher</span><span>Impressions</span><span>Clicks</span><span>CTR</span></div>
   {data!.publishers.length?data!.publishers.map(p=><div style={tr} key={p.host}><span style={{fontWeight:800}}>{p.host}</span><span>{p.impressions.toLocaleString()}</span><span>{p.clicks.toLocaleString()}</span><span>{p.impressions?((p.clicks/p.impressions)*100).toFixed(2):"0.00"}%</span></div>):<div style={empty}>No publisher impressions recorded yet.</div>}</div>
  </section>
  <section style={section}><h2 style={h2}>Traffic & activity</h2><div style={chart}>{data!.timeline.length?data!.timeline.map(d=><div key={d.date} style={{minWidth:64,textAlign:"center"}}><div style={{height:150,display:"flex",alignItems:"end",justifyContent:"center",gap:4}}><div title={d.impressions+" impressions"} style={{height:Math.max(4,Math.min(150,d.impressions/Math.max(1,s.impressions)*150)),width:18,background:"#55d8ff",borderRadius:"5px 5px 0 0"}}/><div title={d.clicks+" clicks"} style={{height:Math.max(4,Math.min(150,d.clicks/Math.max(1,s.impressions)*150)),width:18,background:"#9b6cff",borderRadius:"5px 5px 0 0"}}/></div><small>{d.date.slice(5)}</small></div>):<div style={empty}>Traffic will appear here as the network receives impressions and clicks.</div>}</div></section>
  <section style={section}><h2 style={h2}>What RALLIVIO can and cannot measure</h2><div style={notes}><div>✓ RALLIVIO can measure publisher placement impressions, publisher domains, outbound clicks, campaign CTR and click timestamps.</div><div>✓ For the destination website, RALLIVIO can measure visits that pass through its tracked redirect.</div><div>• Actual downstream sessions, conversions, sales or watch-time on the destination require destination-side analytics or a callback/integration. UTM parameters can connect those visits back to the campaign.</div></div></section>
 </div></main>
}
function Metric({label,value,sub}:{label:string;value:string;sub:string}){return <div style={metric}><div style={eyebrow}>{label}</div><strong style={{fontSize:32}}>{value}</strong><small style={muted}>{sub}</small></div>}
const shell={minHeight:"100vh",background:"radial-gradient(circle at 70% 0%,#281454,#050713 55%)",color:"#f5f2ff",padding:"42px 20px",fontFamily:"Inter,system-ui,sans-serif"} as const;
const box={maxWidth:700,margin:"80px auto",padding:30,border:"1px solid #ffffff18",borderRadius:20,background:"#0e1428"} as const;
const section={marginTop:18,padding:22,border:"1px solid #ffffff12",borderRadius:18,background:"#0d1325"} as const;
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginTop:24} as const;
const metric={padding:18,border:"1px solid #ffffff12",borderRadius:16,background:"#10172c",display:"grid",gap:8} as const;
const table={border:"1px solid #ffffff10",borderRadius:12,overflow:"hidden"} as const;
const thead={display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,padding:12,background:"#151d34",color:"#8794b2",fontSize:11,fontWeight:800} as const;
const tr={display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,padding:14,borderTop:"1px solid #ffffff08",fontSize:13} as const;
const chart={display:"flex",gap:16,overflowX:"auto",padding:"20px 8px",alignItems:"end",minHeight:190} as const;
const notes={display:"grid",gap:10,color:"#a8b3ca",fontSize:13,lineHeight:1.6} as const;
const empty={padding:20,color:"#71809a",fontSize:13} as const;
const h2={margin:"0 0 7px",fontSize:18} as const;
const muted={color:"#8794b2",fontSize:13,lineHeight:1.55} as const;
const eyebrow={color:"#66dcff",fontSize:11,letterSpacing:2,fontWeight:900} as const;
const title={fontSize:"clamp(34px,6vw,58px)",lineHeight:1,margin:"8px 0"} as const;
const back={background:"transparent",border:0,color:"#9db0d3",cursor:"pointer",padding:0,marginBottom:30} as const;
const button={marginTop:15,padding:"11px 16px",border:0,borderRadius:10,background:"#55d8ff",fontWeight:800,cursor:"pointer"} as const;