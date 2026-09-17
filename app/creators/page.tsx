"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const platforms = ["All Platforms", "YouTube", "Instagram", "TikTok", "X (Twitter)", "LinkedIn"];
const periods = ["7D", "30D", "90D", "1Y"];

const content = [
  { title: "Hidden Places That Will Change How You See Travel", platform: "YouTube", views: "248K", engagement: "8.6%", growth: "+320%", date: "3 days ago" },
  { title: "How Remote Work Changed My Life", platform: "YouTube", views: "98K", engagement: "7.8%", growth: "+180%", date: "5 days ago" },
  { title: "Top 5 Underrated Destinations in Asia", platform: "YouTube", views: "54K", engagement: "6.1%", growth: "+140%", date: "7 days ago" },
  { title: "Bali Street Food Paradise", platform: "Instagram", views: "81K", engagement: "8.4%", growth: "+120%", date: "9 days ago" },
  { title: "Quick Travel Tips", platform: "TikTok", views: "62K", engagement: "7.2%", growth: "+260%", date: "11 days ago" },
];

const platformStats = [
  { name: "YouTube", followers: "12.4K", reach: "248K", engagement: "8.6%", growth: "+42%", connected: true },
  { name: "Instagram", followers: "28.1K", reach: "186K", engagement: "7.4%", growth: "+28%", connected: true },
  { name: "TikTok", followers: "8.6K", reach: "92K", engagement: "6.1%", growth: "+56%", connected: true },
  { name: "X (Twitter)", followers: "4.2K", reach: "64K", engagement: "4.2%", growth: "+18%", connected: false },
  { name: "LinkedIn", followers: "2.8K", reach: "28K", engagement: "3.8%", growth: "+12%", connected: false },
];

const intelligence = [
  ["High engagement on travel content", "Your recent travel content is performing above your creator baseline."],
  ["Growing interest in budget travel", "Budget travel is showing stronger audience response across connected platforms."],
  ["Cross-platform momentum", "Recent content is gaining traction on multiple connected platforms."],
  ["Global audience opportunity", "Audience activity is expanding across Southeast Asia and other regions."],
];

const opportunities = [
  ["Brand collaboration", "5 relevant opportunities"],
  ["Create similar content", "Budget Travel is gaining interest"],
  ["Expand to new regions", "Growing audience interest in SEA"],
  ["Collaboration matches", "12 relevant creators"],
];

function Logo({ name }: { name: string }) {
  const marks: Record<string, string> = { YouTube: "▶", Instagram: "◎", TikTok: "♪", "X (Twitter)": "𝕏", LinkedIn: "in" };
  return <span className={`rv-logo rv-${name.toLowerCase().replace(/[^a-z]/g, "")}`}>{marks[name] ?? "◆"}</span>;
}

function Lock({ children }: { children: React.ReactNode }) {
  return <span className="rv-lock">🔒 {children}</span>;
}

export default function CreatorPage() {
  const router = useRouter();
  const [plus, setPlus] = useState(true);
  const [platform, setPlatform] = useState("All Platforms");
  const [period, setPeriod] = useState("30D");
  const [showPlans, setShowPlans] = useState(false);
  const [theme, setTheme] = useState(false);

  const visibleContent = useMemo(() => platform === "All Platforms" ? content : content.filter((item) => item.platform === platform), [platform]);

  return (
    <main className={`creator-shell ${theme ? "light-preview" : ""}`}>
      <header className="creator-header">
        <button className="brand" onClick={() => router.push("/")} aria-label="RALLIVIO home">
          <span className="brand-mark">▷</span><span>RALLI<span>VIO</span></span>
          <small>Discover. Organize. Grow.</small>
        </button>
        <nav>
          <button onClick={() => router.push("/")}>Discover</button>
          <button className="active">Creators</button>
          <button>Brands &amp; Opportunities</button>
          <button>Community</button>
          <button>About</button>
        </nav>
        <div className="header-actions">
          <label className="search"><span>⌕</span><input placeholder="Search creators, topics, or ideas..." /></label>
          <button className="header-plan" onClick={() => setShowPlans(true)}>♛ RALLIVIO+</button>
          <button className="icon-button" onClick={() => setTheme(!theme)} title="Toggle theme">◐</button>
          <button className="profile-button"><span className="avatar small">S</span> Santosh⌄</button>
        </div>
      </header>

      <section className="creator-layout">
        <aside className="creator-sidebar">
          <div className="profile-mini">
            <div className="avatar large">A</div>
            <strong>Travel with Alex</strong>
            <span>@travelwithalex</span>
            <button>Follow</button>
          </div>
          {[
            ["⌂", "Overview"], ["▣", "Content"], ["▥", "Analytics"], ["♟", "Audience"], ["◈", "Platform Performance"], ["◷", "Historical Data"], ["✦", "RALLIVIO Intelligence"], ["♡", "Opportunities"], ["♧", "Collaboration"], ["▤", "Brand Matches"], ["♧", "Alerts & Notifications"], ["⚙", "Settings"],
          ].map(([icon, label], index) => <button key={label} className={`side-item ${index === 0 ? "selected" : ""}`}><span>{icon}</span>{label}{label === "Opportunities" && <em>New</em>}</button>)}
          <div className="side-plus">
            <strong>♛ RALLIVIO+</strong>
            {plus ? <><p>You’re on RALLIVIO+</p><ul><li>Full analytics access</li><li>Cross-platform insights</li><li>AI recommendations</li><li>Opportunity matching</li><li>Advanced filters</li></ul><button onClick={() => setShowPlans(true)}>Manage Plan</button></> : <><p>Unlock creator intelligence.</p><button onClick={() => setShowPlans(true)}>View Plans</button></>}
          </div>
        </aside>

        <div className="creator-main">
          <section className="creator-hero card">
            <div className="cover"><div className="cover-glow" /></div>
            <div className="creator-identity">
              <div className="avatar creator-avatar">A</div>
              <div><h1>Travel with Alex <span className="verified">✓</span></h1><p>@travelwithalex</p><p>Exploring hidden places, food and real travel experiences.</p><div className="chips"><span>Travel</span><span>Adventure</span><span>Lifestyle</span></div></div>
              <button className="edit-profile">Edit Profile</button>
              <div className="hero-metrics"><b>12.4K<small>Followers</small></b><b>248K<small>Total Views</small></b><b>8.6%<small>Eng. Rate</small></b></div>
            </div>
          </section>

          <section className="platform-tabs card">
            {platforms.map((name) => <button key={name} className={platform === name ? "active" : ""} onClick={() => setPlatform(name)}>{name !== "All Platforms" && <Logo name={name} />}{name}</button>)}
            <button className="connect">＋ Connect Platform</button>
            <div className="periods">{periods.map((p) => <button key={p} className={period === p ? "active" : ""} onClick={() => setPeriod(p)}>{p}</button>)}</div>
          </section>

          <section className="stat-grid">
            {[["◉", "Total Views", "248K", "+42%"], ["♟", "Total Followers", "12.4K", "+38%"], ["♡", "Engagement Rate", "8.6%", "+21%"], ["●", "Profile Visits", "6.8K", "+36%"], ["▶", "Content Published", "68", "+12%"]].map(([icon, label, value, change]) => <div className="metric card" key={label}><span className="metric-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>↑ {change}</em></div></div>)}
          </section>

          <section className="dashboard-grid">
            <div className="card growth-card"><div className="section-title"><h2>Growth Overview</h2><select defaultValue={period}><option>Last 30 days</option><option>Last 90 days</option><option>Last year</option></select></div><div className="chart-tabs"><button className="active">Views</button><button>Followers</button><button>Engagement</button><button>Profile Visits</button></div><div className="line-chart"><div className="axis">300K<br/><br/>200K<br/><br/>100K<br/><br/>0</div><svg viewBox="0 0 720 230" preserveAspectRatio="none" aria-label="Growth chart"><path d="M0 180 C90 170 110 155 160 162 S260 140 320 146 S410 105 470 120 S560 78 610 92 S680 58 720 45" /><path className="secondary" d="M0 200 C100 190 120 182 170 188 S270 170 320 178 S420 148 470 155 S560 130 620 138 S690 112 720 108" /></svg></div></div>
            <div className="card platform-performance"><div className="section-title"><h2>Platform Performance</h2><span>{period}</span></div><div className="platform-table">{platformStats.map((s) => <div className="platform-row" key={s.name}><Logo name={s.name} /><strong>{s.name}</strong><span>{s.followers}</span><span>{s.reach}</span><span>{s.engagement}</span><em>{s.growth}</em>{!s.connected && <button onClick={() => setShowPlans(true)}>Connect</button>}</div>)}</div></div>
            <div className="card audience"><div className="section-title"><h2>Audience Insights</h2><span>By Region</span></div><div className="donut"><div><strong>248K</strong><small>Total Audience</small></div></div><ul><li>India <b>42%</b></li><li>SEA <b>18%</b></li><li>US <b>12%</b></li><li>UK <b>8%</b></li><li>Others <b>20%</b></li></ul></div>
          </section>

          <section className="three-grid">
            <div className="card content-performance"><div className="section-title"><h2>Top Performing Content</h2><button>View all →</button></div><div className="content-list">{visibleContent.map((item) => <div className="content-row" key={item.title}><div className="thumb" /><div className="content-name"><strong>{item.title}</strong><small>{item.platform} · {item.date}</small></div><span>{item.views}</span><span>{item.engagement}</span><em>↑ {item.growth}</em></div>)}</div></div>
            <div className="card intelligence"><div className="section-title"><h2>RALLIVIO Intelligence</h2><span>Subscriber</span></div>{plus ? intelligence.map(([title, body]) => <div className="insight" key={title}><span>✦</span><div><strong>{title}</strong><p>{body}</p></div><b>›</b></div>) : <div className="locked-panel"><div>🔒</div><h3>Unlock RALLIVIO Intelligence</h3><p>Understand why content moves, where audiences are changing, and what to explore next.</p><button onClick={() => setShowPlans(true)}>Unlock with RALLIVIO+</button></div>}</div>
            <div className="card opportunities"><div className="section-title"><h2>Opportunities for You</h2><button>View all →</button></div>{plus ? opportunities.map(([title, body]) => <div className="opportunity" key={title}><span>◆</span><div><strong>{title}</strong><small>{body}</small></div><b>›</b></div>) : <div className="locked-panel"><div>🔒</div><h3>Creator opportunities</h3><p>Unlock collaboration, content and brand opportunity matching.</p><button onClick={() => setShowPlans(true)}>View Plans</button></div>}</div>
          </section>

          <section className="history-grid">
            <div className="card history"><div className="section-title"><h2>Content History</h2>{plus ? <span>{period}</span> : <Lock>RALLIVIO+</Lock>}</div>{plus ? <><div className="history-tabs"><button className="active">Views</button><button>Likes</button><button>Comments</button><button>Engagement</button></div><div className="bar-chart">{Array.from({ length: 28 }).map((_, i) => <i key={i} style={{ height: `${28 + ((i * 17) % 68)}%` }} />)}</div></> : <div className="locked-wide"><span>🔒</span><strong>Historical performance</strong><p>Track how every connected platform and content item changes over time.</p><button onClick={() => setShowPlans(true)}>Unlock history</button></div>}</div>
            <div className="card activity"><div className="section-title"><h2>Recent Activity</h2><span>All Platforms</span></div>{["New video published: Hidden Places in Vietnam", "Reached 12.4K total followers", "+320% views on latest video", "New collaboration opportunity", "Trending in Travel category"].map((x, i) => <div className="activity-row" key={x}><i className={`dot d${i}`} /><span>{x}</span><small>{i + 2} days ago</small></div>)}</div>
            <div className="card upcoming"><div className="section-title"><h2>Upcoming Opportunities</h2><span>New</span></div>{["Southeast Asia Travel Campaign", "Travel Gear Brand Collaboration", "Adventure Series"].map((x) => <div className="upcoming-row" key={x}><div className="mini-image" /><strong>{x}</strong><button onClick={() => setShowPlans(true)}>View Details</button></div>)}</div>
          </section>

          <section className="plan-strip card">
            <div><span className="crown">♛</span><div><h2>{plus ? "You’re on RALLIVIO+" : "Creator Intelligence is locked"}</h2><p>{plus ? "Full cross-platform analytics, history and opportunity intelligence." : "Explore the ecosystem free; unlock deeper creator intelligence with RALLIVIO+."}</p></div></div>
            <button onClick={() => setShowPlans(true)}>{plus ? "Manage Plan →" : "View Plans →"}</button>
            <button className="preview-toggle" onClick={() => setPlus(!plus)}>Preview {plus ? "Free" : "Subscriber"} view</button>
          </section>
        </div>
      </section>

      {showPlans && <div className="modal-backdrop" onClick={() => setShowPlans(false)}><div className="plans-modal" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setShowPlans(false)}>×</button><p className="eyebrow">RALLIVIO PLANS</p><h2>Choose how deep you want to go.</h2><p>Free gives everyone real discovery. RALLIVIO+ unlocks deeper intelligence, history and opportunities.</p><div className="plan-cards"><div className="plan"><h3>Free</h3><strong>$0</strong><small>forever</small><ul><li>Browse and watch</li><li>Basic creator profiles</li><li>Follow creators</li><li>Basic discovery signals</li><li>Limited saves</li></ul><button onClick={() => { setPlus(false); setShowPlans(false); }}>Continue Free</button></div><div className="plan plus-plan"><span>Most useful</span><h3>RALLIVIO+</h3><strong>$9.99</strong><small>/month</small><ul><li>Everything in Free</li><li>Advanced analytics</li><li>Historical data</li><li>Audience intelligence</li><li>Cross-platform insights</li><li>Opportunity matching</li><li>Alerts and notifications</li></ul><button onClick={() => { setPlus(true); setShowPlans(false); }}>Unlock RALLIVIO+</button></div><div className="plan creator-plan"><h3>Creator / Brand</h3><strong>Coming later</strong><small>custom</small><ul><li>Creator growth tools</li><li>Brand discovery</li><li>Campaign intelligence</li><li>Team access</li><li>Advanced opportunity workflows</li></ul><button>Join Waitlist</button></div></div></div></div>}

      <style jsx>{`
        :global(*){box-sizing:border-box}:global(body){margin:0;background:#030914;color:#eef4ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}:global(button),:global(input),:global(select){font:inherit}.creator-shell{min-height:100vh;background:radial-gradient(circle at 50% -20%,#111a42 0,#030914 42%,#020711 100%);--line:#17304d;--muted:#93a6bf;--panel:#061321;--panel2:#071a2b;--blue:#4c62ff;--purple:#7d2cff;--pink:#e43cff;--cyan:#23d9ff}.creator-shell.light-preview{filter:saturate(.85);background:#0a1420}.creator-header{height:66px;display:flex;align-items:center;gap:26px;padding:0 22px;border-bottom:1px solid #17304d;background:#030a14ee;position:sticky;top:0;z-index:20;backdrop-filter:blur(16px)}.brand{position:relative;border:0;background:none;color:#f7f9ff;font-size:25px;font-weight:900;letter-spacing:-1.5px;padding:0 70px 13px 0;cursor:pointer}.brand>span span{color:#9d35ff}.brand-mark{color:#52a8ff;margin-right:6px}.brand small{position:absolute;left:0;bottom:0;font-size:9px;color:#9eb0c5;font-weight:500;letter-spacing:0}.creator-header nav{display:flex;align-items:center;gap:22px;flex:1}.creator-header nav button,.profile-button,.icon-button{border:0;background:none;color:#d8e3f3;cursor:pointer;font-size:12px;white-space:nowrap}.creator-header nav button.active{color:#fff;border-bottom:2px solid #7248ff;padding:23px 0 21px}.header-actions{display:flex;align-items:center;gap:10px}.search{width:250px;height:34px;border:1px solid #24415e;border-radius:18px;display:flex;align-items:center;padding:0 12px;color:#8da2bc;background:#071525}.search input{border:0;outline:0;background:none;color:#eaf2ff;width:100%;font-size:11px}.header-plan{border:1px solid #7544ff;background:linear-gradient(90deg,#4313c8,#7d20ff);color:#fff;border-radius:9px;padding:8px 12px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 0 18px #702bff55}.icon-button{font-size:17px}.profile-button{display:flex;align-items:center;gap:7px}.avatar{display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#f2c6a1,#31587c);color:#fff;font-weight:900;border:2px solid #2d4d72}.avatar.small{width:30px;height:30px;font-size:11px}.avatar.large{width:72px;height:72px;font-size:27px}.creator-layout{display:grid;grid-template-columns:180px minmax(0,1fr);min-height:calc(100vh - 66px)}.creator-sidebar{border-right:1px solid #17304d;background:#04101c;padding:16px 8px;position:sticky;top:66px;height:calc(100vh - 66px);overflow:auto}.profile-mini{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:4px 4px 18px;border-bottom:1px solid #15304b;margin-bottom:8px}.profile-mini .avatar{width:58px;height:58px;font-size:20px}.profile-mini strong{font-size:13px}.profile-mini span{font-size:10px;color:#8fa2ba}.profile-mini button,.edit-profile,.connect,.locked-panel button,.locked-wide button,.plan button{border:1px solid #8b43ff;background:linear-gradient(90deg,#3910b8,#8a2bff);color:white;border-radius:7px;padding:7px 12px;font-size:10px;cursor:pointer}.side-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px 8px;border:0;background:none;color:#b5c4d8;text-align:left;border-radius:7px;font-size:10px;cursor:pointer}.side-item.selected{background:linear-gradient(90deg,#4d16d7,#721dff);color:#fff}.side-item em{margin-left:auto;background:#7b2cff;color:#fff;border-radius:8px;padding:2px 5px;font-style:normal;font-size:8px}.side-plus{margin-top:14px;padding:12px;border:1px solid #6537c9;border-radius:9px;background:linear-gradient(145deg,#130f32,#071528)}.side-plus strong{font-size:12px;color:#d7a9ff}.side-plus p{font-size:9px;color:#a7b8cb;line-height:1.4}.side-plus ul{padding-left:15px;color:#c7d3e4;font-size:8px;line-height:1.8}.side-plus button{width:100%;border:0;border-radius:6px;background:#6522f0;color:#fff;padding:7px;font-size:9px;cursor:pointer}.creator-main{padding:10px 14px 40px;max-width:1600px;width:100%;margin:auto}.card{background:linear-gradient(145deg,#061625,#06111e);border:1px solid #173653;border-radius:8px;box-shadow:0 8px 25px #0005}.creator-hero{overflow:hidden}.cover{height:160px;background:linear-gradient(135deg,#183b62,#0c1d34 45%,#263d72 70%,#080e1c);position:relative}.cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,#05101d 100%)}.cover-glow{position:absolute;width:320px;height:160px;right:10%;background:radial-gradient(circle,#3b82f655,transparent 70%);filter:blur(15px)}.creator-identity{display:grid;grid-template-columns:85px 1fr auto auto;gap:14px;align-items:center;padding:0 18px 16px;margin-top:-30px;position:relative;z-index:2}.creator-avatar{width:76px;height:76px;font-size:28px}.creator-identity h1{margin:0;font-size:21px}.creator-identity p{margin:3px 0;color:#94a9c0;font-size:10px}.verified{display:inline-grid;place-items:center;background:#2c8fff;color:#fff;width:15px;height:15px;border-radius:50%;font-size:9px}.chips{display:flex;gap:6px;margin-top:7px}.chips span,.rv-lock{font-size:9px;border:1px solid #29435d;border-radius:10px;padding:4px 8px;color:#b9cbe0}.hero-metrics{display:flex;gap:24px}.hero-metrics b{font-size:17px}.hero-metrics small{display:block;font-size:8px;color:#8298b1;font-weight:500}.platform-tabs{margin-top:9px;padding:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}.platform-tabs button,.chart-tabs button,.history-tabs button{border:1px solid #203c58;background:#071625;color:#b7c8db;border-radius:7px;padding:7px 10px;font-size:9px;cursor:pointer}.platform-tabs button.active,.chart-tabs button.active,.history-tabs button.active{background:#4014ba;border-color:#9149ff;color:#fff;box-shadow:0 0 14px #702bff55}.platform-tabs .connect{margin-left:auto}.periods{display:flex;gap:4px;margin-left:4px}.periods button{padding:6px 8px}.rv-logo{display:inline-grid;place-items:center;width:18px;height:18px;margin-right:5px;border-radius:5px;font-size:9px;font-weight:900;background:#e91e25;color:#fff}.rv-instagram{background:#dd3a86}.rv-tiktok{background:#05080d}.rv-xtwitter{background:#000}.rv-linkedin{background:#0a66c2}.stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:9px}.metric{padding:13px;display:flex;align-items:center;gap:10px}.metric-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:8px;background:#132c72;color:#b7c5ff;font-size:18px}.metric small{display:block;color:#8ca2ba;font-size:9px}.metric strong{display:block;font-size:19px}.metric em{font-style:normal;color:#20e8a5;font-size:9px}.dashboard-grid{display:grid;grid-template-columns:1.65fr 1fr .9fr;gap:8px;margin-top:9px}.growth-card,.platform-performance,.audience,.content-performance,.intelligence,.opportunities,.history,.activity,.upcoming{padding:12px;min-width:0}.section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.section-title h2{font-size:14px;margin:0}.section-title button,.section-title span,.section-title select{border:0;background:none;color:#c45cff;font-size:9px}.section-title select{color:#c0cede;background:#071625}.chart-tabs,.history-tabs{display:flex;gap:5px;margin-bottom:8px}.line-chart{height:220px;display:flex;gap:8px}.axis{width:35px;color:#607a97;font-size:8px;line-height:1.2;text-align:right}.line-chart svg{width:calc(100% - 45px);height:100%;overflow:visible}.line-chart svg path{fill:none;stroke:#d62fff;stroke-width:3}.line-chart svg .secondary{stroke:#388eff;stroke-width:2}.platform-table{font-size:9px}.platform-row{display:grid;grid-template-columns:20px 1.4fr .6fr .7fr .6fr .6fr auto;gap:6px;align-items:center;border-top:1px solid #142b42;padding:9px 0;color:#b8c7d9}.platform-row strong{color:#edf4ff}.platform-row em{color:#20e8a5;font-style:normal}.platform-row button{border:1px solid #6941d4;background:#160d37;color:#d5b8ff;border-radius:5px;padding:3px 6px;font-size:8px}.audience{display:grid;grid-template-columns:1fr 1fr;gap:8px}.audience .section-title{grid-column:1/-1}.donut{width:135px;height:135px;border-radius:50%;margin:auto;background:conic-gradient(#2a8fff 0 42%,#23d9ff 42% 60%,#ff5ca8 60% 72%,#8c4dff 72% 80%,#26d6aa 80%);display:grid;place-items:center}.donut>div{width:82px;height:82px;border-radius:50%;background:#071321;display:grid;place-items:center}.donut strong{font-size:18px}.donut small{font-size:7px;color:#839ab4}.audience ul{padding:0;margin:0;list-style:none;font-size:9px;color:#9db0c5;display:flex;flex-direction:column;justify-content:center;gap:9px}.audience li{display:flex;justify-content:space-between}.audience li b{color:#eef4ff}.three-grid{display:grid;grid-template-columns:1.4fr 1fr .9fr;gap:8px;margin-top:9px}.content-row{display:grid;grid-template-columns:42px 1fr 45px 45px 55px;gap:7px;align-items:center;padding:8px 0;border-top:1px solid #142b42}.thumb,.mini-image{width:42px;height:28px;border-radius:4px;background:linear-gradient(135deg,#1d527a,#183050,#7b306d)}.content-name{min-width:0}.content-name strong{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.content-name small{display:block;color:#7189a4;font-size:7px;margin-top:2px}.content-row>span{font-size:8px;color:#c1cedc}.content-row em{font-style:normal;color:#20e8a5;font-size:8px}.insight,.opportunity{display:grid;grid-template-columns:28px 1fr 12px;gap:8px;align-items:center;padding:10px 0;border-top:1px solid #142b42}.insight>span,.opportunity>span{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#182e78;color:#a98aff}.insight strong,.opportunity strong{font-size:9px}.insight p{font-size:8px;color:#8398af;margin:3px 0;line-height:1.4}.insight>b,.opportunity>b{color:#a5b6ca}.opportunity small{display:block;font-size:8px;color:#7f95ad;margin-top:2px}.locked-panel{text-align:center;padding:28px 10px;color:#93a6bb}.locked-panel>div{font-size:30px}.locked-panel h3{color:#eef4ff;font-size:13px;margin:8px 0}.locked-panel p{font-size:9px;line-height:1.5}.locked-panel button{margin-top:8px}.history-grid{display:grid;grid-template-columns:1.35fr 1fr .85fr;gap:8px;margin-top:9px}.history-tabs{margin-bottom:8px}.bar-chart{height:125px;display:flex;align-items:flex-end;gap:3px;padding:4px;border-bottom:1px solid #23405b}.bar-chart i{flex:1;background:linear-gradient(180deg,#a52cff,#4c27e6);border-radius:3px 3px 0 0;min-width:2px}.activity-row{display:grid;grid-template-columns:8px 1fr auto;gap:7px;align-items:center;padding:8px 0;border-top:1px solid #142b42;font-size:8px}.activity-row small{color:#6f87a1}.dot{width:7px;height:7px;border-radius:50%;background:#2de4a8}.upcoming-row{display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #142b42}.upcoming-row strong{font-size:8px}.upcoming-row button{grid-column:2;border:1px solid #633fd2;background:#140d34;color:#cdbaff;border-radius:5px;padding:5px;font-size:8px}.plan-strip{margin-top:9px;padding:14px;display:flex;align-items:center;justify-content:space-between;border-color:#5d35a8;background:linear-gradient(90deg,#100e2d,#081426)}.plan-strip>div{display:flex;align-items:center;gap:10px}.crown{font-size:28px;color:#b574ff}.plan-strip h2{font-size:13px;margin:0}.plan-strip p{font-size:9px;color:#8da1b8;margin:4px 0}.plan-strip>button{border:1px solid #7f43ff;background:#4d16d5;color:#fff;border-radius:7px;padding:9px 13px;font-size:9px;cursor:pointer}.plan-strip .preview-toggle{background:#091b2d;border-color:#294765}.modal-backdrop{position:fixed;inset:0;background:#000a;display:grid;place-items:center;z-index:50;padding:20px}.plans-modal{position:relative;width:min(1050px,96vw);background:#061322;border:1px solid #6940d6;border-radius:14px;padding:26px;box-shadow:0 25px 80px #000b}.plans-modal .close{position:absolute;right:15px;top:10px;background:none;border:0;color:#b8c8da;font-size:24px;cursor:pointer}.eyebrow{font-size:9px;color:#c45cff;letter-spacing:2px}.plans-modal h2{font-size:25px;margin:5px 0}.plans-modal>p{color:#8fa3bb;font-size:10px}.plan-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.plan{position:relative;border:1px solid #1d3854;border-radius:10px;padding:16px;background:#071625}.plan h3{margin:0 0 7px;font-size:14px}.plan>strong{font-size:27px;display:block}.plan>small{color:#8398b1;font-size:9px}.plan ul{padding-left:16px;color:#b6c6d9;font-size:9px;line-height:2}.plan button{width:100%;margin-top:7px}.plus-plan{border-color:#7b3bdf;background:linear-gradient(145deg,#120c2d,#071625)}.plus-plan>span{position:absolute;right:12px;top:12px;background:#7c2cff;color:#fff;padding:3px 6px;border-radius:6px;font-size:7px}.creator-plan>strong{font-size:16px;margin:18px 0}.creator-plan button{background:#b8c8da;color:#071321;border:0}.rv-lock{color:#d6baff;border-color:#7142cc;background:#170e33}.light-preview .creator-header,.light-preview .creator-sidebar{background:#08121f}.light-preview .card{background:#081a29}
        @media(max-width:1180px){.creator-header nav{gap:10px}.search{width:180px}.dashboard-grid,.three-grid,.history-grid{grid-template-columns:1fr 1fr}.audience{grid-column:1/-1}.stat-grid{grid-template-columns:repeat(3,1fr)}.creator-identity{grid-template-columns:80px 1fr auto}.hero-metrics{grid-column:2/-1}.creator-sidebar{width:180px}.creator-layout{grid-template-columns:180px minmax(0,1fr)}}
        @media(max-width:820px){.creator-header{height:auto;min-height:64px;flex-wrap:wrap;padding:10px 12px}.creator-header nav{order:3;width:100%;overflow:auto}.creator-header nav button.active{padding:8px 0}.header-actions{margin-left:auto}.search{display:none}.creator-layout{grid-template-columns:1fr}.creator-sidebar{display:none}.creator-main{padding:8px}.stat-grid,.dashboard-grid,.three-grid,.history-grid{grid-template-columns:1fr}.creator-identity{grid-template-columns:65px 1fr}.edit-profile{grid-column:2}.hero-metrics{grid-column:1/-1}.platform-tabs{overflow:auto;flex-wrap:nowrap}.platform-tabs .connect{margin-left:0}.plan-cards{grid-template-columns:1fr}.plan-strip{flex-wrap:wrap;gap:10px}}
      `}</style>
    </main>
  );
}
