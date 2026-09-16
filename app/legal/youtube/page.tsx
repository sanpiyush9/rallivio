import Link from "next/link";

const policyLinks = [
  ["YouTube API Services Policies", "https://developers.google.com/youtube/terms/developer-policies"],
  ["YouTube API Services Terms", "https://developers.google.com/youtube/terms/api-services-terms-of-service"],
  ["YouTube Branding Guidelines", "https://developers.google.com/youtube/terms/branding-guidelines"],
  ["YouTube Terms of Service", "https://www.youtube.com/t/terms"],
];

export default function YouTubeCompliancePage() {
  return (
    <main className="legal">
      <style>{css}</style>
      <header>
        <Link href="/" className="brand">RALL<span>IVIO</span></Link>
        <Link href="/platform/youtube" className="back">← YouTube discovery</Link>
      </header>

      <section className="hero">
        <div className="eyebrow">CONTENT & SOURCE POLICY</div>
        <h1>Built to discover.<br/><em>Not to copy.</em></h1>
        <p>RALLIVIO is designed as an independent discovery and creator-connection layer. When content comes from YouTube, YouTube remains the source and host of that content.</p>
        <div className="notice"><b>Important:</b> This page documents our product safeguards and links to the governing platform policies. It is not a legal opinion or a guarantee that every future feature will be compliant without review.</div>
      </section>

      <section className="grid">
        <article><span>01</span><h2>Original content stays with its source</h2><p>RALLIVIO does not download, re-host, sell, or provide offline copies of YouTube audiovisual content. Playback, when available, uses YouTube&apos;s embedded player.</p></article>
        <article><span>02</span><h2>Clear source attribution</h2><p>YouTube content is explicitly labelled as YouTube content. Users are given a direct link to the original YouTube watch page and creator.</p></article>
        <article><span>03</span><h2>No scraping</h2><p>RALLIVIO uses supported APIs and embedded playback rather than scraping YouTube pages or bypassing technical restrictions.</p></article>
        <article><span>04</span><h2>Embeddability is respected</h2><p>RALLIVIO only offers embedded playback when the returned video status permits embedding. If embedding is unavailable, the user is directed to YouTube.</p></article>
        <article><span>05</span><h2>No artificial engagement</h2><p>RALLIVIO does not buy, incentivize, manufacture, or manipulate YouTube views, likes, subscribers, or other platform engagement.</p></article>
        <article><span>06</span><h2>Fresh data, limited retention</h2><p>For non-authorized YouTube data, our architecture is intentionally request-oriented and avoids building a permanent copy of YouTube&apos;s data. Any future persistence will be designed against the then-current API policy and applicable permissions.</p></article>
        <article><span>07</span><h2>Independent discovery value</h2><p>RALLIVIO adds discovery, organization and creator-connection functionality rather than presenting itself as YouTube or attempting to reproduce YouTube&apos;s product experience.</p></article>
        <article><span>08</span><h2>Privacy and consent</h2><p>RALLIVIO documents its use of third-party APIs in its privacy policy. Authorized data, if introduced later, will be accessed only for disclosed purposes and with the required user consent.</p></article>
      </section>

      <section className="data">
        <div><div className="eyebrow">OUR YOUTUBE DATA RULES</div><h2>What we do with YouTube data</h2></div>
        <ul>
          <li><b>Discovery:</b> public YouTube results may be requested to help users find relevant creators and videos.</li>
          <li><b>Playback:</b> audiovisual playback is delegated to the official YouTube embedded player where embedding is permitted.</li>
          <li><b>Attribution:</b> YouTube remains clearly identified as the source, with a direct path to the original content.</li>
          <li><b>No audiovisual copies:</b> RALLIVIO does not store downloadable copies of YouTube videos or make them available offline.</li>
          <li><b>No scraping:</b> RALLIVIO does not use page scraping as a substitute for supported YouTube APIs.</li>
          <li><b>No derived YouTube metrics:</b> we do not turn YouTube API statistics into proprietary scores or rankings by mathematically combining YouTube statistics. Independent RALLIVIO signals must be clearly identified as RALLIVIO signals.</li>
          <li><b>Policy changes:</b> platform policies can change. Features using YouTube data will be reviewed before material changes are released.</li>
        </ul>
      </section>

      <section className="sources">
        <div><div className="eyebrow">PRIMARY SOURCES</div><h2>Read the rules directly</h2><p>These are the platform documents that govern our YouTube integration. If a policy changes, the official source controls.</p></div>
        <div className="links">{policyLinks.map(([label,url])=><a key={url} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>
      </section>

      <footer><span>RALLIVIO · CONTENT & SOURCE POLICY</span><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/platform/youtube">YouTube</Link></nav></footer>
    </main>
  );
}

const css = `
:root{--bg:#070814;--text:#f8f7ff;--muted:#aaa8bd;--line:#ffffff16;--accent:#a868ff}.legal{min-height:100vh;background:radial-gradient(circle at 75% 0,#ff00331c,transparent 30%),radial-gradient(circle at 15% 10%,#7c42ff1d,transparent 32%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.legal *{box-sizing:border-box}.legal a{color:inherit}.legal header{height:72px;padding:0 42px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#080a19dd;backdrop-filter:blur(18px);z-index:5}.brand{text-decoration:none;font-size:28px;font-weight:950;letter-spacing:-1.5px}.brand span{color:var(--accent)}.back{text-decoration:none;border:1px solid var(--line);padding:9px 14px;border-radius:999px;color:#c8c5d8}.hero,.grid,.data,.sources,footer{max-width:1200px;margin:auto}.hero{padding:92px 30px 65px}.eyebrow{font-size:10px;letter-spacing:1.6px;font-weight:900;color:#bd8aff}.hero h1{font-size:clamp(55px,7vw,94px);line-height:.9;letter-spacing:-4px;margin:16px 0}.hero h1 em{font-style:normal;color:#b979ff}.hero p{max-width:800px;font-size:19px;line-height:1.65;color:#c4c1d2}.notice{margin-top:28px;max-width:850px;padding:16px 18px;border:1px solid #bd8aff35;background:#bd8aff0b;border-radius:14px;color:#bdb9cd;line-height:1.55}.notice b{color:#fff}.grid{padding:20px 30px 70px;display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.grid article{padding:28px;border:1px solid var(--line);border-radius:20px;background:#ffffff06}.grid span{font-size:11px;color:#bd8aff;font-weight:900}.grid h2{font-size:23px;line-height:1.1;margin:12px 0}.grid p,.data li,.sources p{color:var(--muted);line-height:1.65}.data{margin:0 30px 70px;padding:35px;border:1px solid var(--line);border-radius:24px;background:#ffffff05;display:grid;grid-template-columns:.7fr 1.3fr;gap:50px}.data h2,.sources h2{font-size:34px;letter-spacing:-1.3px;margin:9px 0}.data ul{margin:0;padding-left:20px}.data li{margin:0 0 13px}.data li b{color:#fff}.sources{padding:0 30px 80px;display:grid;grid-template-columns:.8fr 1.2fr;gap:50px}.links{display:flex;flex-direction:column;gap:8px}.links a{padding:14px 16px;border:1px solid var(--line);border-radius:13px;text-decoration:none;background:#ffffff05;font-weight:750}.links a:hover{background:#ffffff0b}.legal footer{border-top:1px solid var(--line);padding:25px 30px 40px;display:flex;justify-content:space-between;color:#77758a;font-size:10px;letter-spacing:1px}.legal footer nav{display:flex;gap:18px}.legal footer a{text-decoration:none;color:#aaa8bd}.legal footer a:hover{color:#fff}@media(max-width:760px){.legal header{padding:0 18px}.hero,.grid,.sources{padding-left:18px;padding-right:18px}.grid,.data,.sources{grid-template-columns:1fr}.data{margin-left:18px;margin-right:18px;padding:24px;gap:10px}.hero{padding-top:60px}.hero h1{letter-spacing:-2.5px}.legal footer{margin:0 18px;padding-left:0;padding-right:0;gap:20px;flex-direction:column}}
`;
