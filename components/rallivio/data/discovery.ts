export type SignalItem = {
 id:string; title:string; channel_title:string; channel_id?:string; published_at:string; thumbnail:string;
 description?:string; views:number; likes?:number; comments?:number; duration?:string|null; url:string;
 embeddable?:boolean; topic:string; region:string;
 metadata?:{subscriber_count?:number|null; signal?:string; momentum_score?:number};
};
export type DiscoveryState = {
 items:SignalItem[]; refreshedAt?:string|null; stats?:Record<string,unknown>;
 signalCounts?:Record<string,number>; topicCounts?:Record<string,number>; regions?:string[];
 trackedCreators?:number; poolCount?:number;
};
export async function getDiscovery():Promise<DiscoveryState>{
 const r=await fetch("/api/discovery?limit=120",{cache:"no-store"});
 const body=await r.json();
 if(!r.ok) throw new Error(body.state||"DATA_UNAVAILABLE");
 return {...body,items:Array.isArray(body.items)?body.items:[]};
}
export const signalColor=(signal?:string)=>{
 const s=(signal||"Observed").toLowerCase();
 if(s.includes("breaking"))return "#ffb84a"; if(s.includes("moving"))return "#31e7ff";
 if(s.includes("rise"))return "#55f5a5"; if(s.includes("radar"))return "#b68cff";
 if(s.includes("dropped"))return "#ff63b4"; if(s.includes("live"))return "#ff526d"; return "#66728d";
};
export const fmt=(n:number)=>n>=1e9?(n/1e9).toFixed(1)+"B":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":n.toLocaleString();
export const age=(iso?:string)=>{if(!iso)return "";const h=Math.max(0,(Date.now()-new Date(iso).getTime())/36e5);return h<1?"NOW":h<24?Math.floor(h)+"H":Math.floor(h/24)+"D";};
