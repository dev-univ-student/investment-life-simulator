const stocks={
 AAPL:{name:"Apple",ticker:"AAPL",currency:"$",price:3.69,drift:.00025,vol:.018},
 MSFT:{name:"Microsoft",ticker:"MSFT",currency:"$",price:53.00,drift:.00020,vol:.017},
 AMZN:{name:"Amazon",ticker:"AMZN",currency:"$",price:4.00,drift:.00035,vol:.025},
 NVDA:{name:"NVIDIA",ticker:"NVDA",currency:"$",price:0.89,drift:.00045,vol:.032},
 TM:{name:"トヨタ自動車",ticker:"7203",currency:"¥",price:620,drift:.00018,vol:.017},
 SONY:{name:"ソニー",ticker:"6758",currency:"¥",price:10400,drift:.00020,vol:.020},
 NTDOY:{name:"任天堂",ticker:"7974",currency:"¥",price:7600,drift:.00018,vol:.019}
};
let state={date:new Date("2000-01-03T00:00:00"),cash:500000,holdings:{},selected:"AAPL",history:{},prevTotal:500000};

Object.keys(stocks).forEach(k=>state.history[k]=[stocks[k].price]);

function yen(n){return "¥"+Math.round(n).toLocaleString("ja-JP")}
function pct(n){return (n>=0?"+":"")+n.toFixed(2)+"%"}
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
function isMarketOpen(){return !isWeekend(state.date)}
function fx(){return 106 + Math.sin((state.date-state.date)/86400000)*0}
function valueOf(s){return s.currency==="¥"?s.price:s.price*106}
function totalInvested(){return Object.entries(state.holdings).reduce((a,[k,q])=>a+stocks[k].price*q* (stocks[k].currency==="¥"?1:106),0)}
function render(){
 document.getElementById("date").textContent=state.date.toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"});
 const open=isMarketOpen(); document.getElementById("marketStatus").textContent=open?"市場営業日":"市場休場";
 document.getElementById("marketStatus").style.background=open?"#183829":"#242b3d";
 const invested=totalInvested(), total=state.cash+invested;
 document.getElementById("totalAssets").textContent=yen(total);
 document.getElementById("cash").textContent=yen(state.cash);
 document.getElementById("invested").textContent=yen(invested);
 const dp=total-state.prevTotal; const el=document.getElementById("dailyPnl"); el.textContent=yen(dp); el.className=dp>=0?"up":"down";
 const s=stocks[state.selected]; document.getElementById("selectedName").textContent=s.name;
 document.getElementById("selectedPrice").textContent=s.currency+(s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2));
 const hist=state.history[state.selected], ch=(hist[hist.length-1]/hist[Math.max(0,hist.length-2)]-1)*100;
 document.getElementById("selectedChange").textContent=pct(ch); document.getElementById("selectedChange").className=ch>=0?"up":"down";
 renderStocks();renderHoldings();drawChart();
}
function renderStocks(){
 const list=document.getElementById("stockList"); list.innerHTML="";
 Object.entries(stocks).forEach(([k,s])=>{
  const h=state.history[k], ch=(s.price/h[Math.max(0,h.length-2)]-1)*100;
  const d=document.createElement("div"); d.className="stock"; d.onclick=()=>{state.selected=k;render()};
  d.innerHTML=`<div><b>${s.name}</b><div class="ticker">${s.ticker}</div></div><div class="p">${s.currency}${s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2)}</div><div class="${ch>=0?"up":"down"}">${pct(ch)}</div>`;
  list.appendChild(d);
 });
}
function renderHoldings(){
 const box=document.getElementById("holdings"); const entries=Object.entries(state.holdings).filter(([,q])=>q>0);
 document.getElementById("holdingCount").textContent=entries.length+"銘柄";
 if(!entries.length){box.className="empty";box.textContent="まだ銘柄を保有していません。";return}
 box.className="";box.innerHTML="";
 entries.forEach(([k,q])=>{const s=stocks[k];const d=document.createElement("div");d.className="holding";d.innerHTML=`<div><b>${s.name}</b><div class="ticker">${q.toLocaleString()}株</div></div><strong>${yen(valueOf(s)*q)}</strong>`;box.appendChild(d)})
}
function buy(){
 const s=stocks[state.selected],q=Math.max(1,parseInt(document.getElementById("qty").value||1));
 const cost=valueOf(s)*q;if(state.cash<cost){alert("現金が足りません。");return}
 state.cash-=cost;state.holdings[state.selected]=(state.holdings[state.selected]||0)+q;render();
}
function sell(){
 const s=stocks[state.selected],q=Math.max(1,parseInt(document.getElementById("qty").value||1)),have=state.holdings[state.selected]||0;
 if(have<q){alert("保有数量が足りません。");return}
 state.cash+=valueOf(s)*q;state.holdings[state.selected]-=q;render();
}
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function advance(days){
 state.prevTotal=state.cash+totalInvested();
 for(let i=0;i<days;i++){
  state.date.setDate(state.date.getDate()+1);
  if(isWeekend(state.date))continue;
  Object.entries(stocks).forEach(([k,s])=>{
   const r=s.drift+s.vol*randn();
   s.price=Math.max(s.price*(1+r),0.01);
   state.history[k].push(s.price);
  });
 }
 const headlines=["市場は静かな一日を終えました。","企業業績への関心が高まっています。","投資家の間で景気見通しを巡る議論が続いています。","株式市場では銘柄ごとの値動きが目立ちました。"];
 document.getElementById("newsText").textContent=headlines[Math.floor(Math.random()*headlines.length)];
 render();
}
document.getElementById("buyBtn").onclick=buy;document.getElementById("sellBtn").onclick=sell;
document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>advance(+b.dataset.step));
document.getElementById("resetBtn").onclick=()=>{if(confirm("最初からやり直しますか？"))location.reload()};

function drawChart(){
 const c=document.getElementById("chart"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=190;
 c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
 const data=state.history[state.selected].slice(-90),min=Math.min(...data),max=Math.max(...data),range=max-min||1;
 ctx.beginPath();data.forEach((v,i)=>{const x=i*(w-4)/(data.length-1)+2,y=h-15-(v-min)/(range)*(h-30);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle="#6f9cff";ctx.lineWidth=2;ctx.stroke();
 ctx.strokeStyle="#29344d";ctx.lineWidth=1;for(let i=1;i<4;i++){const y=i*h/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
}
window.addEventListener("resize",drawChart);render();
