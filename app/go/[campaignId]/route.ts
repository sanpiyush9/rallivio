import { NextResponse } from "next/server";

const SB = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path:string, init:RequestInit={}) {
  if (!SB || !KEY) throw new Error("Supabase configuration missing");
  return fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
}

function source(req:Request) {
  const q = new URL(req.url).searchParams.get("src");
  if (q) return q.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].slice(0,253);
  const r = req.headers.get("referer");
  if (r) try { return new URL(r).hostname.toLowerCase().slice(0,253); } catch {}
  return "direct";
}

export async function GET(req:Request,{params}:{params:Promise<{campaignId:string}>}) {
  const {campaignId} = await params;
  if (!/^[0-9a-f-]{20,80}$/i.test(campaignId)) return new Response("Not Found",{status:404});

  try {
    const now = new Date().toISOString();
    const response = await sb([
      "promotion_campaigns",
      "select=id,source_url,status,distribution_mode,trial_ends_at,clicks",
      `id=eq.${encodeURIComponent(campaignId)}`,
      "status=eq.active",
      "distribution_mode=eq.rallivio_owned",
      `trial_ends_at=gt.${encodeURIComponent(now)}`,
      "limit=1"
    ].join("?"));

    if (!response.ok) return new Response("Not Found",{status:404});
    const rows = await response.json() as Array<{id:string;source_url:string;status:string;distribution_mode:string;trial_ends_at:string;clicks:number}>;
    const campaign = rows[0];
    if (!campaign?.source_url) return new Response("Not Found",{status:404});

    const nextClicks = Number(campaign.clicks || 0) + 1;
    await sb("rpc/record_promotion_event",{method:"POST",body:JSON.stringify({p_campaign_id:campaign.id,p_event_type:"click",p_publisher_host:source(req),p_publisher_path:new URL(req.url).pathname,p_referrer:req.headers.get("referer")||"",p_user_agent:req.headers.get("user-agent")||""})});
    const update = await sb(`promotion_campaigns?id=eq.${encodeURIComponent(campaign.id)}`, {
      method:"PATCH",
      headers:{Prefer:"return=minimal"},
      body:JSON.stringify({
        clicks: nextClicks,
        last_distributed_at: new Date().toISOString()
      })
    });
    if (!update.ok) console.error("promotion click update failed", update.status, await update.text());

    const target = new URL(campaign.source_url);
    if (!target.protocol.match(/^https?:$/)) return new Response("Not Found",{status:404});

    return NextResponse.redirect(target.toString(),302);
  } catch (error) {
    console.error("promotion redirect failed", error);
    return new Response("Not Found",{status:404});
  }
}