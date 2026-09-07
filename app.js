const stocks={
 AAPL:{name:"Apple",ticker:"AAPL",currency:"$",price:3.69,drift:.00025,vol:.018},
 MSFT:{name:"Microsoft",ticker:"MSFT",currency:"$",price:53.00,drift:.00020,vol:.017},
 AMZN:{name:"Amazon",ticker:"AMZN",currency:"$",price:4.00,drift:.00035,vol:.025},
 NVDA:{name:"NVIDIA",ticker:"NVDA",currency:"$",price:0.89,drift:.00045,vol:.032},
 TM:{name:"トヨタ自動車",ticker:"7203",currency:"¥",price:620,drift:.00018,vol:.017},
 SONY:{name:"ソニー",ticker:"6758",currency:"¥",price:10400,drift:.00020,vol:.020},
 NTDOY:{name:"任天堂",ticker:"7974",currency:"¥",price:7600,drift:.00018,vol:.019}
};

let state=null;

function yen(n){return "¥"+Math.round(n).toLocaleString("ja-JP")}
function pct(n){return (n>=0?"+":"")+n.toFixed(2)+"%"}
function isWeekend(d){return d.getDay()===0||d.getDay()===6}
function isMarketOpen(){return !isWeekend(state.date)}
function fx(){return 106}
function valueOf(s){return s.currency==="¥"?s.price:s.price*fx()}
function totalInvested(){return Object.entries(state.holdings).reduce((a,[k,q])=>a+stocks[k].price*q*(stocks[k].currency==="¥"?1:fx()),0)}
function totalAssets(){return state.cash+totalInvested()}

function setupGame(initialCapital){
 state={
   date:new Date("2000-01-03T00:00:00"),
   cash:initialCapital,
   initialCapital,
   holdings:{},
   selected:"AAPL",
   history:{},
   prevTotal:initialCapital
 };
 Object.keys(stocks).forEach(k=>state.history[k]=[stocks[k].price]);
 document.getElementById("startScreen").classList.add("hidden");
 document.getElementById("game").classList.remove("hidden");
 render();
}

function render(){
 const dateEl=document.getElementById("date");
 dateEl.textContent=state.date.toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"});
 const open=isMarketOpen();
 const status=document.getElementById("marketStatus");
 status.textContent=open?"市場営業日":"市場休場";
 status.style.background=open?"#183829":"#242b3d";

 const invested=totalInvested(), total=state.cash+invested;
 document.getElementById("totalAssets").textContent=yen(total);
 document.getElementById("cash").textContent=yen(state.cash);
 document.getElementById("invested").textContent=yen(invested);

 const dp=total-state.prevTotal;
 const daily=document.getElementById("dailyPnl");
 daily.textContent=yen(dp);
 daily.className=dp>=0?"up":"down";

 const overall=total-state.initialCapital;
 const overallRate=(overall/state.initialCapital)*100;
 const overallEl=document.getElementById("overallPnl");
 const badge=document.getElementById("overallBadge");
 const rateEl=document.getElementById("overallReturn");
 overallEl.textContent=(overall>=0?"+":"-")+yen(Math.abs(overall)).replace("¥","¥");
 rateEl.textContent=pct(overallRate);
 overallEl.className="overall-value "+(overall>=0?"up":"down");
 rateEl.className="overall-sub "+(overall>=0?"up":"down");
 badge.textContent=(overall>=0?"+":"")+yen(Math.abs(overall));
 badge.className="result-badge "+(overall>=0?"up":"down");

 const s=stocks[state.selected];
 document.getElementById("selectedName").textContent=s.name;
 document.getElementById("selectedPrice").textContent=s.currency+(s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2));
 document.getElementById("orderAsset").textContent="選択中: "+s.name;
 document.getElementById("orderPrice").textContent=document.getElementById("selectedPrice").textContent;
 const hist=state.history[state.selected];
 const ch=(hist[hist.length-1]/hist[Math.max(0,hist.length-2)]-1)*100;
 const selectedChange=document.getElementById("selectedChange");
 selectedChange.textContent=pct(ch);
 selectedChange.className=ch>=0?"up":"down";

 document.getElementById("portfolioValue").textContent=yen(invested);
 renderStocks();
 renderHoldings();
 drawChart();
}

function renderStocks(){
 const list=document.getElementById("stockList"); list.innerHTML="";
 Object.entries(stocks).forEach(([k,s])=>{
   const h=state.history[k], ch=(s.price/h[Math.max(0,h.length-2)]-1)*100;
   const d=document.createElement("div");
   d.className="stock";
   d.onclick=()=>{state.selected=k;render()};
   d.innerHTML=`<div><b>${s.name}</b><div class="ticker">${s.ticker}</div></div><div class="p">${s.currency}${s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2)}</div><div class="${ch>=0?"up":"down"}">${pct(ch)}</div>`;
   list.appendChild(d);
 });
}

function renderHoldings(){
 const box=document.getElementById("holdings");
 const entries=Object.entries(state.holdings).filter(([,q])=>q>0);
 document.getElementById("holdingCount").textContent=entries.length+"銘柄";
 if(!entries.length){box.className="empty";box.textContent="まだ銘柄を保有していません。";return}
 box.className="";box.innerHTML="";
 entries.forEach(([k,q])=>{
   const s=stocks[k];
   const marketValue=valueOf(s)*q;
   const h=state.history[k];
   const currentPerShare=valueOf(s);
   const d=document.createElement("div");
   d.className="holding";
   d.innerHTML=`<div><b>${s.name}</b><div class="ticker">${q.toLocaleString()}株</div></div>
   <div class="holding-right"><strong>${yen(marketValue)}</strong><small>${s.currency}${s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2)}</small></div>`;
   box.appendChild(d);
 });
}

function buy(){
 const s=stocks[state.selected],q=Math.max(1,parseInt(document.getElementById("qty").value||1));
 const cost=valueOf(s)*q;
 if(state.cash<cost){alert("現金が足りません。");return}
 state.cash-=cost;
 state.holdings[state.selected]=(state.holdings[state.selected]||0)+q;
 render();
}

function sell(){
 const s=stocks[state.selected],q=Math.max(1,parseInt(document.getElementById("qty").value||1)),have=state.holdings[state.selected]||0;
 if(have<q){alert("保有数量が足りません。");return}
 state.cash+=valueOf(s)*q;
 state.holdings[state.selected]-=q;
 render();
}

function randn(){
 let u=0,v=0;
 while(!u)u=Math.random();
 while(!v)v=Math.random();
 return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

function advance(days){
 state.prevTotal=totalAssets();
 for(let i=0;i<days;i++){
   state.date.setDate(state.date.getDate()+1);
   if(isWeekend(state.date))continue;
   Object.entries(stocks).forEach(([k,s])=>{
     const r=s.drift+s.vol*randn();
     s.price=Math.max(s.price*(1+r),0.01);
     state.history[k].push(s.price);
   });
 }
 const headlines=[
   "市場は静かな一日を終えました。",
   "企業業績への関心が高まっています。",
   "投資家の間で景気見通しを巡る議論が続いています。",
   "株式市場では銘柄ごとの値動きが目立ちました。"
 ];
 document.getElementById("newsText").textContent=headlines[Math.floor(Math.random()*headlines.length)];
 render();
}

function drawChart(){
 const c=document.getElementById("chart");
 const ctx=c.getContext("2d");
 const dpr=devicePixelRatio||1,w=c.clientWidth,h=190;
 c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const data=state.history[state.selected].slice(-90);
 const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
 ctx.beginPath();
 data.forEach((v,i)=>{
   const x=i*(w-4)/(data.length-1)+2;
   const y=h-15-(v-min)/range*(h-30);
   i?ctx.lineTo(x,y):ctx.moveTo(x,y);
 });
 ctx.strokeStyle="#6f9cff";ctx.lineWidth=2;ctx.stroke();
 ctx.strokeStyle="#29344d";ctx.lineWidth=1;
 for(let i=1;i<4;i++){const y=i*h/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
}

document.querySelectorAll(".capital-btn").forEach(btn=>{
 btn.addEventListener("click",()=>{
   document.querySelectorAll(".capital-btn").forEach(b=>b.classList.remove("selected"));
   btn.classList.add("selected");
   if(btn.dataset.custom){
     document.getElementById("customWrap").classList.remove("hidden");
     document.getElementById("startBtn").disabled=false;
     document.getElementById("startBtn").dataset.mode="custom";
   }else{
     document.getElementById("customWrap").classList.add("hidden");
     document.getElementById("startBtn").disabled=false;
     document.getElementById("startBtn").dataset.mode="fixed";
     document.getElementById("startBtn").dataset.capital=btn.dataset.capital;
   }
 });
});

document.getElementById("startBtn").onclick=()=>{
 let capital;
 if(document.getElementById("startBtn").dataset.mode==="custom"){
   capital=parseInt(document.getElementById("customCapital").value||0);
   if(!Number.isFinite(capital)||capital<10000){alert("1万円以上の金額を入力してください。");return}
 }else{
   capital=parseInt(document.getElementById("startBtn").dataset.capital);
 }
 setupGame(capital);
};

document.querySelectorAll(".nav-btn").forEach(btn=>{
 btn.onclick=()=>{
   const page=btn.dataset.page;
   document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
   document.getElementById("page-"+page).classList.add("active");
   document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
   btn.classList.add("active");
   if(page==="trade")setTimeout(drawChart,0);
 };
});

document.getElementById("buyBtn").onclick=buy;
document.getElementById("sellBtn").onclick=sell;
document.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>advance(+b.dataset.step));
document.getElementById("resetBtn").onclick=()=>{
 if(confirm("ゲームを終了して初期資金の選択に戻りますか？")){
   location.reload();
 }
};

window.addEventListener("resize",drawChart);
