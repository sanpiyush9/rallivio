"use client";

import { useMemo, useState } from "react";

const creators = [
  { name: "Tech Burner", handle: "@techburner", followers: "4.2M", growth: "+18.4%", topic: "Tech" },
  { name: "Beebom", handle: "@beebomco", followers: "3.8M", growth: "+14.1%", topic: "Tech" },
  { name: "Geeky Ranjit", handle: "@geekyranjit", followers: "3.1M", growth: "+11.8%", topic: "Reviews" },
  { name: "Mrwhosetheboss", handle: "@Mrwhosetheboss", followers: "20.8M", growth: "+9.7%", topic: "Tech" },
];

const filters = ["All signals", "Rising fast", "Breakout", "Fresh voices"];

export default function Home() {
  const [active, setActive] = useState("All signals");
  const [selected, setSelected] = useState(creators[0]);
  const visible = useMemo(() => (active === "All signals" ? creators : creators.filter((creator) => creator.growth !== "")), [active]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">R</span><span>RALLIVIO</span></div>
        <nav><a className="active">Discover</a><a>Watch</a><a>Creators</a><a>Explore</a></nav>
        <button className="search">⌕ <span>Search creators, topics...</span></button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">LIVE DISCOVERY · INDIA</p>
          <h1>What is moving <em>right now?</em></h1>
          <p className="lede">Find creators gaining real momentum before everyone else notices.</p>
        </div>
        <div className="pulse"><span /> Signals updated continuously</div>
      </section>

      <div className="filters">
        {filters.map((filter) => <button key={filter} className={active === filter ? "selected" : ""} onClick={() => setActive(filter)}>{filter}</button>)}
        <button>India ▾</button><button>YouTube ▾</button><button>All topics ▾</button>
      </div>

      <section className="grid">
        <div className="mainColumn">
          <div className="sectionHead"><div><p className="eyebrow">SIGNAL FEED</p><h2>Creators breaking through</h2></div><span>Updated 2 min ago</span></div>
          <div className="videoCard">
            <div className="video"><div className="play">▶</div><div className="videoLabel">NOW MOVING</div><div className="fakeVideo">THE FUTURE OF AI PHONES</div></div>
            <div className="videoMeta"><div><p className="eyebrow">TECH · BREAKOUT</p><h2>Why this creator is moving right now</h2><p>Momentum is accelerating across views, engagement and recent publishing velocity.</p></div><button className="watch">Watch on YouTube ↗</button></div>
          </div>

          <div className="sectionHead lower"><div><p className="eyebrow">UP NEXT</p><h2>More signals worth watching</h2></div></div>
          <div className="cards">
            {visible.slice(0, 3).map((creator) => <button className={`creatorCard ${selected.name === creator.name ? "chosen" : ""}`} key={creator.name} onClick={() => setSelected(creator)}><div className="avatar">{creator.name[0]}</div><div className="creatorText"><strong>{creator.name}</strong><span>{creator.handle}</span><small>{creator.followers} · {creator.topic}</small></div><b>{creator.growth}</b></button>)}
          </div>
        </div>

        <aside className="side">
          <div className="insight"><p className="eyebrow">WHY THIS IS MOVING</p><h3>{selected.name}</h3><div className="metric"><span>Momentum</span><strong>{selected.growth}</strong></div><div className="bar"><i /></div><ul><li>Recent views accelerating</li><li>Engagement above creator baseline</li><li>Fresh uploads attracting new viewers</li></ul><button className="outline">View creator profile ↗</button></div>
          <div className="next"><p className="eyebrow">WHAT'S NEXT</p><h3>Follow the signal</h3><p>Save this creator and return when the next momentum update lands.</p><button className="save">＋ Save signal</button></div>
        </aside>
      </section>

      <footer><span>RALLIVIO · Signal-first creator discovery</span><span>QA BUILD · UI PREVIEW</span></footer>
    </main>
  );
}
