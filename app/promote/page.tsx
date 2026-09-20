"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function PromotionPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("url") || "";
  const [url, setUrl] = useState(initial);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [campaign, setCampaign] = useState<{id:string;title:string;content_type:string;trial_ends_at:string;source_url:string} | null>(null);

  useEffect(() => { setUrl(initial); }, [initial]);

  async function start() {
    setNotice("");
    if (!url.trim()) { setNotice("Paste a content, video, brand, product or website link first."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/login?next=" + encodeURIComponent("/promote?url=" + url)); return; }
      const response = await fetch("/api/campaigns", {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ url, title }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) { setNotice(result.state || "Could not start the campaign."); return; }
      setCampaign(result.campaign);
    } catch { setNotice("Could not start the campaign. Please try again."); }
    finally { setBusy(false); }
  }

  return <main className="promo">
    <style>{`
      .promo{min-height:100vh;background:radial-gradient(circle at 70% 10%,#321b65 0,transparent 35%),#050713;color:#f4f2ff;padding:56px 20px;font-family:Inter,system-ui}
      .promoBox{max-width:820px;margin:0 auto;border:1px solid #ffffff18;border-radius:24px;background:linear-gradient(145deg,#10152c,#080b19);padding:32px;box-shadow:0 30px 100px #0008}
      .brand{border:0;background:none;color:#fff;font-size:28px;font-weight:900;cursor:pointer}.brand span{color:#9f65ff}
      h1{font-size:clamp(34px,6vw,62px);line-height:.98;letter-spacing:-2px;margin:48px 0 14px}.lead{color:#9ea5c1;font-size:15px;line-height:1.7;max-width:680px}
      .field{margin-top:28px;display:flex;gap:10px}.field input{flex:1;min-width:0;border:1px solid #ffffff25;border-radius:14px;background:#ffffff08;color:#fff;padding:17px;font-size:15px;outline:none}.field input:focus{border-color:#9d6cff}
      .title{margin-top:10px}.title input{width:100%;box-sizing:border-box}
      button.start{margin-top:14px;border:0;border-radius:14px;padding:16px 22px;background:linear-gradient(135deg,#8e56ff,#4f8cff);color:#fff;font-weight:900;cursor:pointer}.start:disabled{opacity:.55}
      .notice{margin-top:15px;color:#ff8298}.plan{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:28px}.plan div{border:1px solid #ffffff10;border-radius:14px;padding:15px;background:#ffffff05}.plan b{display:block;font-size:11px}.plan small{display:block;margin-top:6px;color:#777f9e;line-height:1.45}
      .success{margin-top:28px;border:1px solid #46dfa066;border-radius:18px;padding:22px;background:#46dfa00b}.success b{color:#5df0b0}.success p{color:#a6b0c9;line-height:1.6}.link{word-break:break-all;color:#8ec7ff}
      .back{margin-top:20px;border:1px solid #ffffff18;background:#ffffff06;color:#dbe4ff;border-radius:12px;padding:11px 14px;cursor:pointer}
      @media(max-width:700px){.promo{padding:24px 12px}.promoBox{padding:22px}.field{flex-direction:column}.plan{grid-template-columns:1fr 1fr}}
    `}</style>
    <div className="promoBox">
      <button className="brand" type="button" onClick={() => router.push("/")}>RALL<span>IVIO</span></button>
      <h1>Paste it. Start RALLIVIO.</h1>
      <p className="lead">Give RALLIVIO the video, channel, website, product, brand, article, music or app you want discovered. RALLIVIO creates a real campaign and begins with RALLIVIO-owned discovery distribution. The first 30 days are a controlled trial; results are measured before any paid expansion.</p>
      <div className="field"><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." aria-label="Content URL"/><button className="start" type="button" disabled={busy} onClick={start}>{busy ? "STARTING…" : "START RALLIVIO →"}</button></div>
      <div className="title"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Optional campaign name (e.g. Vietnam Travel Video)" aria-label="Campaign name"/></div>
      <div className="plan">
        <div><b>01 · Understand</b><small>Classify the submitted source and campaign intent.</small></div>
        <div><b>02 · Distribute</b><small>Start with RALLIVIO-owned discovery surfaces.</small></div>
        <div><b>03 · Measure</b><small>Capture campaign performance as real data becomes available.</small></div>
        <div><b>04 · Optimize</b><small>Shift future distribution toward measured relevance.</small></div>
      </div>
      {notice && <div className="notice">{notice}</div>}
      {campaign && <div className="success"><b>CAMPAIGN ACTIVE</b><p><strong>{campaign.title}</strong><br/>Type: {campaign.content_type}<br/>30-day trial ends: {new Date(campaign.trial_ends_at).toLocaleDateString()}</p><div className="link">{campaign.source_url}</div><button className="back" type="button" onClick={()=>router.push("/living")}>Open RALLIVIO Discover →</button></div>}
    </div>
  </main>;
}

export default function PromotePage() {
  return <Suspense fallback={<main style={{padding:40}}>Loading…</main>}><PromotionPageInner /></Suspense>;
}
