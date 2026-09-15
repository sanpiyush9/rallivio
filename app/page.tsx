import { getPhase0Leaderboard } from "@/features/discovery/serving/leaderboard";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function momentumPercent(score: number) {
  const percent = (Math.exp(score) - 1) * 100;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

function ageLabel(iso: string | null) {
  if (!iso) return "not available";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function Home() {
  const data = await getPhase0Leaderboard();
  const featured = data.items[0];

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="brandMark">R</span><span>RALLIVIO</span></div>
        <nav><a className="active">Discover</a><a>Watch</a><a>Creators</a><a>Explore</a></nav>
        <span className="search">YOUTUBE · INDIA</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">PHASE 0 · WEEKLY LEADERBOARD</p>
          <h1>The fastest-rising <em>tech creators</em> in India.</h1>
          <p className="lede">Ranked from measured YouTube observations and compared with creators of similar audience size.</p>
        </div>
        <div className="pulse"><span /> {data.ready ? `Data updated ${ageLabel(data.updatedAt)}` : "Collecting observations"}</div>
      </section>

      {!data.ready ? (
        <section className="videoCard">
          <div className="video">
            <div className="videoLabel">REAL DATA PIPELINE</div>
            <div className="fakeVideo">BUILDING THE FIRST WEEK</div>
          </div>
          <div className="videoMeta">
            <div>
              <p className="eyebrow">NO PLACEHOLDERS</p>
              <h2>RALLIVIO is collecting YouTube observations.</h2>
              <p>{data.latest.length} real videos are currently in the discovery pool. A creator enters the ranking only after enough observations exist to calculate a defensible audience-relative signal.</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid">
          <div className="mainColumn">
            <div className="sectionHead">
              <div><p className="eyebrow">THIS WEEK · {data.week}</p><h2>Creators breaking through</h2></div>
              <span>{data.items.length} qualified creators</span>
            </div>

            {featured?.video && (
              <div className="videoCard">
                <div className="video">
                  <div className="videoLabel">#1 · RALLIVIO MOMENTUM</div>
                  <div className="fakeVideo">{featured.video.title}</div>
                </div>
                <div className="videoMeta">
                  <div>
                    <p className="eyebrow">{featured.creator}</p>
                    <h2>{momentumPercent(featured.momentum_score)} vs peer baseline</h2>
                    <p>{formatNumber(Number(featured.evidence.median_views ?? 0))} median recent views against a {formatNumber(Number(featured.evidence.peer_expected_views ?? 0))} peer baseline.</p>
                  </div>
                  <a className="watch" href={`/api/attribution?channel_id=${encodeURIComponent(featured.channel_id)}&video_id=${encodeURIComponent(featured.video.id)}&source_page=/`}>Watch on YouTube ↗</a>
                </div>
              </div>
            )}

            <div className="sectionHead lower"><div><p className="eyebrow">RANKED SIGNALS</p><h2>Top creators this week</h2></div></div>
            <div className="cards">
              {data.items.map((item) => (
                <article className="creatorCard" key={item.channel_id}>
                  <div className="avatar">{item.rank}</div>
                  <div className="creatorText">
                    <strong>{item.creator}</strong>
                    <span>{formatNumber(Number(item.evidence.subscriber_count ?? 0))} subscribers</span>
                    <small>{formatNumber(Number(item.evidence.median_views ?? 0))} median views · {Number(item.evidence.recent_video_count ?? 0)} recent videos</small>
                  </div>
                  <b>{momentumPercent(item.momentum_score)}</b>
                </article>
              ))}
            </div>
          </div>

          <aside className="side">
            {featured && (
              <div className="insight">
                <p className="eyebrow">WHY THIS IS RANKED #1</p>
                <h3>{featured.creator}</h3>
                <div className="metric"><span>RALLIVIO Momentum Score</span><strong>{momentumPercent(featured.momentum_score)}</strong></div>
                <div className="bar"><i /></div>
                <ul>
                  <li>{formatNumber(Number(featured.evidence.median_views ?? 0))} median recent views</li>
                  <li>{formatNumber(Number(featured.evidence.peer_expected_views ?? 0))} expected for its audience bucket</li>
                  <li>{Number(featured.evidence.recent_video_count ?? 0)} recent videos in the sample</li>
                </ul>
                <a className="outline" href={`/api/attribution?channel_id=${encodeURIComponent(featured.channel_id)}&source_page=/`}>View channel on YouTube ↗</a>
              </div>
            )}
            <div className="next">
              <p className="eyebrow">DATA STATUS</p>
              <h3>Measured, not fabricated.</h3>
              <p>RALLIVIO stores source observations separately from its derived score. If history is insufficient, the creator is not padded into the ranking.</p>
            </div>
          </aside>
        </section>
      )}

      <footer><span>RALLIVIO · Signal-first creator discovery</span><span>PHASE 0 · YOUTUBE DATA</span></footer>
    </main>
  );
}
