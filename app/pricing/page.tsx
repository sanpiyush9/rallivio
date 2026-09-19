import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "See what RALLIVIO is detecting before you pay.",
    features: ["Verified discovery feed", "Current signal categories", "Basic creator discovery"],
  },
  {
    id: "pro",
    name: "RALLIVIO Pro",
    price: "$19",
    period: "/month",
    annual: "$190/year",
    description: "Turn verified movement into a repeatable discovery workflow.",
    features: ["Full verified discovery feed", "Advanced signal activity", "Creator intelligence", "Topic and region intelligence", "Early access to new intelligence features"],
  },
];

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <header><Link href="/living" className="logo">RALLIVIO <span>DISCOVER. WATCH. GROW.</span></Link><Link href="/account" className="account">Account</Link></header>
      <section className="hero"><span className="eyebrow">RALLIVIO MEMBERSHIP</span><h1>Find movement before it becomes obvious.</h1><p>RALLIVIO Pro is built around verified observations, not invented trend counts. Upgrade when you want deeper intelligence and a faster discovery workflow.</p></section>
      <section className="plans">{plans.map((plan) => <article key={plan.id} className={plan.id === "pro" ? "plan featured" : "plan"}><div className="plan-top"><span className="plan-name">{plan.name}</span>{plan.id === "pro" && <span className="pill">PRO</span>}</div><div className="price">{plan.price}<small>{plan.period}</small></div>{plan.annual && <div className="annual">{plan.annual}</div>}<p>{plan.description}</p><ul>{plan.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>{plan.id === "pro" ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="plan" value="pro" /><input type="hidden" name="interval" value="month" /><button type="submit">Start Pro</button></form> : <Link className="secondary" href="/living">Explore free</Link>}</article>)}</section>
      <section className="trust"><strong>Built on observed data.</strong><span>Current signals change as observations change. Historical activity is labeled separately. No artificial counters.</span></section>
      <style>{`
        .pricing-page{min-height:100vh;background:radial-gradient(circle at 50% 0%,#8d4dff2b,transparent 34%),#060817;color:#fff;padding:28px 22px 80px}.pricing-page header{max-width:1040px;margin:auto;display:flex;justify-content:space-between;align-items:center}.logo{font-weight:950;color:#fff;text-decoration:none;font-size:22px}.logo span{display:block;color:#77758b;font-size:7px;letter-spacing:1.7px;margin-top:2px}.account{color:#bfa1ff;text-decoration:none;font-size:11px;font-weight:800}.hero{max-width:780px;margin:100px auto 55px;text-align:center}.eyebrow{font-size:9px;letter-spacing:2px;color:#b07aff;font-weight:900}.hero h1{font-size:clamp(38px,7vw,68px);line-height:.98;letter-spacing:-3px;margin:15px 0}.hero p{max-width:620px;margin:auto;color:#9290a5;line-height:1.7;font-size:13px}.plans{max-width:900px;margin:auto;display:grid;grid-template-columns:1fr 1fr;gap:18px}.plan{padding:30px;border:1px solid #ffffff14;border-radius:24px;background:#0b0e1ee8;box-shadow:0 25px 80px #0004}.plan.featured{border-color:#a96cff66;background:linear-gradient(145deg,#17102d,#0b0e1e)}.plan-top{display:flex;justify-content:space-between}.plan-name{font-size:12px;font-weight:900}.pill{font-size:8px;background:#a96cff22;color:#d0b1ff;padding:5px 8px;border-radius:999px;font-weight:900}.price{font-size:52px;font-weight:950;letter-spacing:-3px;margin:25px 0 2px}.price small{font-size:12px;letter-spacing:0;color:#77758b;font-weight:700}.annual{color:#8ee5bd;font-size:10px;font-weight:800}.plan p{color:#8d8a9f;font-size:11px;line-height:1.6;min-height:38px}.plan ul{list-style:none;padding:0;margin:25px 0;display:grid;gap:11px;color:#b9b6c8;font-size:11px}.plan button,.secondary{width:100%;display:block;text-align:center;box-sizing:border-box;border:0;border-radius:11px;background:#8d4dff;color:#fff;padding:13px;font-weight:900;font-size:11px;text-decoration:none;cursor:pointer}.secondary{background:#ffffff0b;border:1px solid #ffffff14}.trust{max-width:900px;margin:18px auto 0;padding:18px;border:1px solid #ffffff10;border-radius:16px;background:#ffffff04;display:flex;gap:14px;align-items:center;font-size:10px}.trust strong{color:#fff}.trust span{color:#77758b}@media(max-width:700px){.plans{grid-template-columns:1fr}.hero{margin-top:70px}.hero h1{letter-spacing:-2px}.trust{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  );
}
