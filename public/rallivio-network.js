(function(){try{"use strict";
var s=document.currentScript,b=new URL(s&&s.src||"https://rallivio.com/rallivio-network.js").origin;
function esc(v){return String(v==null?"":v).replace(/[&<>\\"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function boot(){
 var host=document.createElement("div");host.setAttribute("data-rallivio-network-mounted","1");
 var topic=s&&s.getAttribute("data-topic")||"",region=s&&s.getAttribute("data-region")||"";
 var limit=Math.min(20,Math.max(1,parseInt(s&&s.getAttribute("data-limit")||"5",10)||5)),theme=s&&s.getAttribute("data-theme")||"auto";
 host.style.cssText="display:block;width:100%;margin:24px 0";
 if(s&&s.parentNode)s.parentNode.insertBefore(host,s.nextSibling);else(document.body||document.documentElement).appendChild(host);
 var root=host.attachShadow({mode:"closed"});
 root.innerHTML='<style>:host{all:initial;display:block;font-family:Inter,system-ui,sans-serif}.w{box-sizing:border-box;width:100%;padding:14px;border:1px solid #dbe3ef;border-radius:16px;background:#fff;color:#172033}.dark,.auto{background:#0b1020;color:#eef5ff;border-color:#26334d}.head{display:flex;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:9px}.grid{display:grid;gap:7px}.item{display:grid;grid-template-columns:112px 1fr;gap:10px;padding:7px;border-radius:11px;text-decoration:none;color:inherit}.item:hover{background:#71809a18}.thumb{width:112px;height:63px;object-fit:cover;border-radius:8px}.title{font-size:13px;line-height:1.25;font-weight:750}.meta{margin-top:5px;font-size:10px;color:#71809a;display:flex;gap:7px;flex-wrap:wrap}.badge{font-weight:800;color:#4e8cff}.foot{margin-top:9px;text-align:right;font-size:10px}.foot a{color:#5b62ff;text-decoration:none}.empty,.loading{padding:18px;text-align:center;font-size:12px;color:#71809a}@media(prefers-color-scheme:dark){.auto{background:#0b1020;color:#eef5ff;border-color:#26334d}.auto .meta{color:#9aa9c0}}</style><div class="w '+esc(theme)+'"><div class="head"><span>RALLIVIO PROMOTED</span><span>DISTRIBUTED</span></div><div class="grid"><div class="loading">Loading RALLIVIO promotions…</div></div><div class="foot"><a href="'+b+'" target="_blank" rel="noopener">Powered by RALLIVIO</a></div></div>';
 var grid=root.querySelector(".grid");
 function impression(items){
   try{items.forEach(function(i){
     if(!i.campaignId)return;
     fetch(b+"/api/promotion-events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
       campaignId:i.campaignId,eventType:"impression",publisherHost:location.hostname,publisherPath:location.pathname,referrer:document.referrer
     }),keepalive:true}).catch(function(){});
   })}catch(_){}
 }
 function load(){var q=new URLSearchParams();if(topic)q.set("topic",topic);if(region)q.set("region",region);q.set("limit",String(limit));
   fetch(b+"/api/distribution/feed?"+q,{mode:"cors",credentials:"omit",cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){
     var items=d.items||[];impression(items);
     grid.innerHTML=items.length?items.map(function(i){return'<a class="item" href="'+esc(i.url)+'" target="_blank" rel="noopener"><img class="thumb" src="'+esc(i.thumbnail)+'" alt="" loading="lazy"><div><div class="title">'+esc(i.title)+'</div><div class="meta"><span>'+esc(i.channel)+'</span><span class="badge">'+esc(i.tier||"PROMOTED")+'</span><span>'+esc(i.contentType||"link")+'</span></div></div></a>'}).join(""):'<div class="empty">No active RALLIVIO promotion is available for this filter yet.</div>'
   }).catch(function(){grid.innerHTML=""})}
 load();setInterval(load,300000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
}catch(_){}})();