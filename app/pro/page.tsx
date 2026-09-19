import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { compactNumber } from "@/lib/server/formatters";

export const dynamic = "force-dynamic";

type CreatorRadarRow = {
  channel_id: string;
  video_count: number | null;
  signal_count: number | null;
  current_velocity: number | null;
  current_acceleration: number | null;
  momentum_score: number | null;
  breakout_state: string | null;
};

export default async function ProPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pro");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id,status,current_period_end,cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub || sub.plan_id !== "pro" || !["active", "trialing"].includes(sub.status)) {
    redirect("/pricing?required=pro");
  }

  const [d24, d7, d30, creators] = await Promise.all([
    supabase.from("discovery_signal_events").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("discovery_signal_events").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from("discovery_signal_events").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from("discovery_creator_intelligence").select("channel_id,video_count,signal_count,current_velocity,current_acceleration,momentum_score,breakout_state").order("momentum_score", { ascending: false }).limit(8),
  ]);

  const creatorRows = (creators.data ?? []) as CreatorRadarRow[];

  return <main className="pro-page">
    <header><Link href="/living" className="logo">RALLIVIO</Link><div className="right"><span>PRO INTELLIGENCE</span><Link href="/account">Account</Link></div></header>
    <section className="hero"><span className="eyebrow">VERIFIED SIGNAL INTELLIGENCE</span><h1>Your paid discovery workspace.</h1><p>These metrics are computed from RALLIVIO&apos;s persisted observation and signal history. They are activity measures, not invented audience estimates.</p></section>
    <section className="metrics">
      <article><span>LAST 24 HOURS</span><strong>{compactNumber(d24.count || 0)}</strong><small>signal transitions observed</small></article>
      <article><span>LAST 7 DAYS</span><strong>{compactNumber(d7.count || 0)}</strong><small>signal transitions observed</small></article>
      <article><span>LAST 30 DAYS</span><strong>{compactNumber(d30.count || 0)}</strong><small>signal transitions observed</small></article>
    </section>
    <section className="panel"><div className="panel-head"><div><span className="eyebrow">CREATOR RADAR</span><h2>Creators with current momentum</h2></div><Link href="/living">Open Discover →</Link></div><div className="creator-grid">{creatorRows.map((c, i) => <article key={c.channel_id}><div className="rank">{String(i + 1).padStart(2, "0")}</div><div><strong>{c.channel_id}</strong><small>{c.breakout_state || "Observed"} · {c.signal_count || 0} active signals · {c.video_count || 0} videos</small></div><b>{Number(c.momentum_score || 0).toFixed(1)}</b></article>)}</div></section>
    <section className="notice"><strong>Pro access is live.</strong><span>Your membership unlocks this intelligence layer while the public Discover field remains available for exploration.</span></section>
    <style>{`
      .pro-page{min-height:100vh;background:radial-gradient(circle at 50% 0%,#8d4dff28,transparent 35%),#060817;color:#fff;padding:28px 22px 80px}.pro-page header{max-width:1080px;margin:auto;display:flex;justify-content:space-between;align-items:center}.logo{color:#fff;text-decoration:none;font-size:22px;font-weight:950}.right{display:flex;gap:18px;align-items:center}.right span,.right a{font-size:9px;color:#aaa7ba;text-decoration:none;font-weight:800;letter-spacing:1px}.hero{max-width:820px;margin:95px auto 45px;text-align:center}.eyebrow{font-size:8px;letter-spacing:2px;color:#b17aff;font-weight:900}.hero h1{font-size:clamp(38px,6vw,64px);line-height:1;letter-spacing:-3px;margin:14px 0}.hero p{color:#858296;font-size:12px;line-height:1.7}.metrics{max-width:1080px;margin:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.metrics article{padding:25px;border:1px solid #ffffff12;border-radius:18px;background:#0b0e1e}.metrics span{font-size:8px;color:#777489;letter-spacing:1.4px;font-weight:900}.metrics strong{display:block;font-size:38px;margin:12px 0 2px}.metrics small{color:#777489;font-size:10px}.panel{max-width:1080px;margin:18px auto;padding:25px;border:1px solid #ffffff12;border-radius:20px;background:#0b0e1e}.panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.panel-head h2{margin:5px 0 0;font-size:20px}.panel-head a{color:#b98aff;text-decoration:none;font-size:10px;font-weight:900}.creator-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.creator-grid article{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:13px;border:1px solid #ffffff0d;border-radius:12px;background:#080a16}.rank{color:#7654aa;font-size:9px;font-weight:900}.creator-grid strong{font-size:11px;display:block;overflow:hidden;text-overflow:ellipsis}.creator-grid small{color:#777489;font-size:9px;display:block;margin-top:4px}.creator-grid b{font-size:13px}.notice{max-width:1080px;margin:18px auto;padding:16px 18px;border:1px solid #65d9a022;border-radius:14px;background:#65d9a008;display:flex;gap:12px;font-size:10px}.notice strong{color:#8ee5bd}.notice span{color:#777489}@media(max-width:700px){.metrics,.creator-grid{grid-template-columns:1fr}.hero{margin-top:70px}.hero h1{letter-spacing:-2px}.panel-head{align-items:flex-start;gap:10px;flex-direction:column}}
    `}</style>
  </main>;
}
