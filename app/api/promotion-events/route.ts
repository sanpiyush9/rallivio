import { NextResponse } from "next/server";

const SB=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path:string,init:RequestInit={}) {
  if(!SB||!KEY) throw new Error("Supabase configuration missing");
  return fetch(`${SB}/rest/v1/${path}`,{...init,headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,"Content-Type":"application/json",...(init.headers||{})},cache:"no-store"});
}

function host(req:Request){
  const o=req.headers.get("origin")||req.headers.get("referer")||"";
  try{return new URL(o).hostname.replace(/^www\./,"").toLowerCase()||"direct"}catch{return "direct"}
}

export async function POST(req:Request){
  try{
    const body=await req.json() as {campaignId?:string;eventType?:string;publisherHost?:string;publisherPath?:string;referrer?:string};
    if(!body.campaignId||!/^[0-9a-f-]{20,80}$/i.test(body.campaignId)) return NextResponse.json({ok:false},{status:400});
    if(body.eventType!=="impression"&&body.eventType!=="click") return NextResponse.json({ok:false},{status:400});
    const response=await sb("rpc/record_promotion_event",{method:"POST",body:JSON.stringify({
      p_campaign_id:body.campaignId,p_event_type:body.eventType,
      p_publisher_host:(body.publisherHost||host(req)).slice(0,253),
      p_publisher_path:(body.publisherPath||"").slice(0,1000),
      p_referrer:(body.referrer||req.headers.get("referer")||"").slice(0,2000),
      p_user_agent:(req.headers.get("user-agent")||"").slice(0,1000)
    })});
    const data=await response.json().catch(()=>({}));
    return NextResponse.json(data,{status:response.ok?200:500,headers:{"Access-Control-Allow-Origin":"*"}});
  }catch(e){console.error("promotion event failed",e);return NextResponse.json({ok:false},{status:500,headers:{"Access-Control-Allow-Origin":"*"}})}
}