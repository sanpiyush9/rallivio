import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";

export async function GET(_req:Request,{params}:{params:Promise<{campaignId:string}>}){
  void _req;
  const {campaignId}=await params;
  if(!/^[0-9a-f-]{20,80}$/i.test(campaignId)) return NextResponse.json({ok:false},{status:400});
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({ok:false,state:"AUTH_REQUIRED"},{status:401});

  const {data:campaign,error}=await supabase.from("promotion_campaigns")
    .select("id,source_url,source_host,content_type,title,status,distribution_mode,trial_started_at,trial_ends_at,created_at,impressions,clicks,youtube_video_id")
    .eq("id",campaignId).eq("user_id",user.id).single();
  if(error||!campaign) return NextResponse.json({ok:false,state:"CAMPAIGN_NOT_FOUND"},{status:404});

  const {data:events}=await supabase.from("promotion_distribution_events")
    .select("event_type,publisher_host,publisher_path,referrer,created_at")
    .eq("campaign_id",campaignId).order("created_at",{ascending:false}).limit(5000);

  const rows=events||[];
  const impressions=Number(campaign.impressions||0), clicks=Number(campaign.clicks||0);
  const publishers=new Map<string,{host:string;impressions:number;clicks:number;lastSeen:string|null}>();
  for(const e of rows){
    const host=String(e.publisher_host||"direct");
    const x=publishers.get(host)||{host,impressions:0,clicks:0,lastSeen:null};
    if(e.event_type==="impression") x.impressions++;
    if(e.event_type==="click") x.clicks++;
    if(!x.lastSeen||String(e.created_at)>x.lastSeen)x.lastSeen=String(e.created_at);
    publishers.set(host,x);
  }
  const timeline=new Map<string,{impressions:number;clicks:number}>();
  for(const e of rows){
    const day=String(e.created_at).slice(0,10);
    const x=timeline.get(day)||{impressions:0,clicks:0};
    if(e.event_type==="impression")x.impressions++; else x.clicks++;
    timeline.set(day,x);
  }
  return NextResponse.json({ok:true,campaign,summary:{
    impressions,clicks,ctr:impressions?Number(((clicks/impressions)*100).toFixed(2)):0,
    publishers:publishers.size
  },publishers:[...publishers.values()].sort((a,b)=>b.clicks-a.clicks||b.impressions-a.impressions),
  timeline:[...timeline.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,v])=>({date,...v}))});
}