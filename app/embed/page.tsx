"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const topics=["AI & Tech","Travel","Food","Gaming","Fitness","Podcasts","Lifestyle","Music","Fashion","Education","Business","Finance","Sports","Comedy","Science","Automotive","Beauty","Entertainment","DIY & Home","News","Pets"];
const regions=["IN","US","GB","CA","AU","DE","BR","JP","KR","SG","FR","ES","IT","MX","AR","CO","CL","PE","ZA","NG","KE","EG","AE","SA","TR","NL","SE","NO","DK","FI","PL","PT","ID","MY","TH","PH","VN","NZ","IE","CH","AT","BE","GR","CZ","RO","HU","IL","PK","BD","LK"];

export default function EmbedPage(){
 const [topic,setTopic]=useState("AI & Tech"),[region,setRegion]=useState("IN"),[limit,setLimit]=useState(5),[theme,setTheme]=useState("auto");
 const snippet=useMemo(()=>`<div class="rallivio-feed" data-topic="${topic}" data-region="${region}" data-limit="${limit}" data-theme="${theme}"></div>
<script src="https://rallivio.com/embed.js" async></script>`,[topic,region,limit,theme]);
 const networkSnippet=useMemo(()=>`<script src="https://rallivio.com/rallivio-network.js" data-limit="${limit}" data-theme="${theme}" async></script>`,[limit,theme]);
 return <main style={{minHeight:"100vh",padding:"48px 24px",background:"radial-gradient(circle at top,#18254d,#070b16 55%)",color:"#edf5ff",fontFamily:"Inter,system-ui,sans-serif"}}>
  <div style={{maxWidth:980,margin:"0 auto"}}>
   <div style={{fontSize:11,letterSpacing:3,color:"#66dcff",fontWeight:800}}>RALLIVIO DISTRIBUTION</div>
   <h1 style={{fontSize:"clamp(34px,6vw,64px)",lineHeight:1.02,margin:"8px 0 14px"}}>Promote with RALLIVIO.<br/>Distribute the promotion.</h1>
   <p style={{maxWidth:700,color:"#9eabc4",lineHeight:1.6}}>The external distribution network does not circulate all RALLIVIO Discovery content. It only distributes active promotions submitted by registered RALLIVIO users.</p>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"18px 0 28px"}}><Link href="/promote" style={linkButton}>Promote your content</Link><Link href="/distribution" style={secondaryButton}>Open Distribution Network</Link></div>
   <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"30px 0"}}>
    <label>Discovery topic<select value={topic} onChange={e=>setTopic(e.target.value)} style={input}>{topics.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Discovery region<select value={region} onChange={e=>setRegion(e.target.value)} style={input}>{regions.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Items<select value={limit} onChange={e=>setLimit(Number(e.target.value))} style={input}>{[1,2,3,4,5,6,7,8,9,10].map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Theme<select value={theme} onChange={e=>setTheme(e.target.value)} style={input}>{["auto","dark","light"].map(x=><option key={x}>{x}</option>)}</select></label>
   </section>
   <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
    <div style={card}><h2 style={h2}>Discovery embed preview</h2><div style={{background:"#eef2f8",padding:18,borderRadius:14}}><div className="rallivio-feed" data-topic={topic} data-region={region} data-limit={limit} data-theme={theme}/><script src="/embed.js" async /></div><p style={{color:"#8190aa",fontSize:12,lineHeight:1.5,marginBottom:0}}>This discovery widget is separate from the external promotion network.</p></div>
    <div style={card}><h2 style={h2}>Promotion network installer</h2><textarea readOnly value={networkSnippet} style={{...input,minHeight:120,fontFamily:"ui-monospace,monospace",fontSize:12}}/><button onClick={()=>navigator.clipboard.writeText(networkSnippet)} style={button}>Copy installer</button><p style={{color:"#8190aa",fontSize:12,lineHeight:1.5}}>After one-time installation, the network refreshes only active RALLIVIO promotions every 5 minutes.</p></div>
   </section>
   <section style={{...card,marginTop:18}}><h2 style={h2}>Manual discovery embed</h2><textarea readOnly value={snippet} style={{...input,minHeight:120,fontFamily:"ui-monospace,monospace",fontSize:12}}/><button onClick={()=>navigator.clipboard.writeText(snippet)} style={button}>Copy discovery embed</button></section>
   <p style={{marginTop:18,color:"#71809a",fontSize:12,lineHeight:1.6}}>RALLIVIO can automate external distribution after a publisher installs or authorizes the integration. It cannot silently modify unrelated websites that RALLIVIO does not control.</p>
  </div>
 </main>
}
const input={display:"block",width:"100%",marginTop:7,padding:"11px 12px",borderRadius:10,border:"1px solid #30405f",background:"#10192d",color:"#fff"} as const;
const card={background:"rgba(13,21,40,.86)",border:"1px solid #273653",borderRadius:18,padding:20} as const;
const h2={fontSize:16,margin:"0 0 14px"} as const;
const button={marginTop:10,padding:"11px 16px",border:0,borderRadius:10,background:"#55d8ff",color:"#07111d",fontWeight:800,cursor:"pointer"} as const;
const linkButton={display:"inline-block",padding:"11px 16px",borderRadius:10,background:"#55d8ff",color:"#07111d",fontWeight:800,textDecoration:"none"} as const;
const secondaryButton={display:"inline-block",padding:"11px 16px",borderRadius:10,border:"1px solid #30405f",color:"#d8e7ff",fontWeight:700,textDecoration:"none"} as const;