import Link from "next/link";

const code = `<script src="https://rallivio.com/rallivio-network.js" data-limit="5" data-theme="auto" async></script>`;

export default function DistributionPage() {
  return (
    <main style={{minHeight:"100vh",background:"radial-gradient(circle at 20% 0%,#182b55,#060a13 58%)",color:"#edf5ff",fontFamily:"Inter,system-ui,sans-serif",padding:"48px 24px"}}>
      <div style={{maxWidth:1040,margin:"0 auto"}}>
        <Link href="/embed" style={{color:"#66dcff",fontSize:13,textDecoration:"none"}}>← RALLIVIO Embed</Link>
        <div style={{marginTop:36,fontSize:11,letterSpacing:3,color:"#66dcff",fontWeight:800}}>RALLIVIO DISTRIBUTION NETWORK</div>
        <h1 style={{fontSize:"clamp(38px,7vw,76px)",lineHeight:1.01,margin:"8px 0 18px",maxWidth:850}}>Install once.<br/>RALLIVIO distributes only promotions.</h1>
        <p style={{maxWidth:760,color:"#9eabc4",fontSize:18,lineHeight:1.6}}>The network does not automatically circulate RALLIVIO Discovery content. It distributes only active promotions submitted by registered RALLIVIO users through the Promote flow.</p>

        <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16,marginTop:34}}>
          {[
            ["01","Register & promote","A registered RALLIVIO user submits the specific video, product, brand, article or link they want promoted."],
            ["02","Campaign eligibility","Only an active RALLIVIO promotion with the authorized distribution mode enters the external network."],
            ["03","Automatic distribution","Authorized publisher surfaces receive the currently eligible promoted content without manual feed updates."],
            ["04","Tracked redirect","Clicks pass through RALLIVIO before reaching the promoted destination."],
          ].map(([n,t,d])=><div key={n} style={{background:"rgba(13,21,40,.86)",border:"1px solid #273653",borderRadius:18,padding:20}}><div style={{color:"#66dcff",fontWeight:800,fontSize:12}}>{n}</div><h2 style={{fontSize:18,margin:"10px 0 8px"}}>{t}</h2><p style={{color:"#8190aa",fontSize:13,lineHeight:1.55,margin:0}}>{d}</p></div>)}
        </section>

        <section style={{marginTop:18,background:"rgba(13,21,40,.9)",border:"1px solid #273653",borderRadius:18,padding:22}}>
          <h2 style={{fontSize:18,margin:"0 0 10px"}}>Universal promotion-distribution tag</h2>
          <p style={{color:"#8190aa",fontSize:13}}>Install this once on a website you control or are authorized to manage. The network then refreshes the active RALLIVIO promotion feed automatically.</p>
          <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",background:"#070c18",border:"1px solid #243451",borderRadius:12,padding:16,color:"#d8e7ff",fontSize:12,lineHeight:1.5}}>{code}</pre>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:12}}>
            <a href="/rallivio-network.js" style={{padding:"11px 16px",borderRadius:10,background:"#55d8ff",color:"#07111d",fontWeight:800,textDecoration:"none"}}>Network script</a>
            <a href="/api/distribution" style={{padding:"11px 16px",borderRadius:10,border:"1px solid #30405f",color:"#d8e7ff",fontWeight:700,textDecoration:"none"}}>Network manifest</a>
            <a href="/promote" style={{padding:"11px 16px",borderRadius:10,border:"1px solid #30405f",color:"#d8e7ff",fontWeight:700,textDecoration:"none"}}>Promote content</a>
          </div>
        </section>

        <section style={{marginTop:18,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {["Custom HTML / JavaScript","WordPress","Shopify","Webflow","CMS / blog","Owned or authorized partner sites"].map(x=><div key={x} style={{padding:15,border:"1px solid #243451",borderRadius:12,color:"#b8c5da",fontSize:13}}>{x}</div>)}
        </section>

        <p style={{marginTop:24,color:"#71809a",fontSize:12,lineHeight:1.6}}>Discovery content is not automatically syndicated. A browser cannot silently modify unrelated websites; publishers must provide an authorized integration point.</p>
      </div>
    </main>
  );
}