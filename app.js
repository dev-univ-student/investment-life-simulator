const stocks={
 AAPL:{name:"Apple",ticker:"AAPL",currency:"$",price:3.69,drift:.00025,vol:.018,divYield:.50,divPerShare:.02,per:25.0},
 MSFT:{name:"Microsoft",ticker:"MSFT",currency:"$",price:53,drift:.0002,vol:.017,divYield:.80,divPerShare:.42,per:32.0},
 AMZN:{name:"Amazon",ticker:"AMZN",currency:"$",price:4,drift:.00035,vol:.025,divYield:0,divPerShare:0,per:70.0},
 NVDA:{name:"NVIDIA",ticker:"NVDA",currency:"$",price:.89,drift:.00045,vol:.032,divYield:.05,divPerShare:.0004,per:45.0},
 TM:{name:"トヨタ自動車",ticker:"7203",currency:"¥",price:620,drift:.00018,vol:.017,divYield:2.1,divPerShare:13,per:12.0},
 SONY:{name:"ソニー",ticker:"6758",currency:"¥",price:10400,drift:.0002,vol:.02,divYield:.70,divPerShare:73,per:18.0},
 NTDOY:{name:"任天堂",ticker:"7974",currency:"¥",price:7600,drift:.00018,vol:.019,divYield:1.2,divPerShare:91,per:20.0}
};
const $=id=>document.getElementById(id), yen=n=>"¥"+Math.round(n).toLocaleString("ja-JP"), fx=()=>106, val=s=>s.currency==="¥"?s.price:s.price*fx();
let state=null,selected="AAPL",toastTimer=null;

document.querySelectorAll(".capital").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".capital").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");
 $("customArea").classList.add("hidden");$("chosen").textContent="初期資金："+yen(+btn.dataset.capital);
 $("startGame").disabled=false;$("startGame").dataset.capital=btn.dataset.capital;
});
$("customButton").onclick=()=>{
 document.querySelectorAll(".capital").forEach(x=>x.classList.remove("selected"));
 $("customButton").classList.add("selected");
 $("customArea").classList.remove("hidden");
 $("chosen").textContent="自由入力の金額で開始";
 $("startGame").disabled=false;
 $("startGame").dataset.capital="custom";
};
$("customCapital").addEventListener("input",()=>{
 if($("customButton").classList.contains("selected")){
   const n=Number($("customCapital").value);
   $("chosen").textContent=n>=10000?"初期資金："+yen(n):"1万円以上を入力してください";
 }
});
$("startGame").onclick=()=>{
 const capital=$("startGame").dataset.capital==="custom"?Number($("customCapital").value):Number($("startGame").dataset.capital);
 if(!Number.isFinite(capital)||capital<10000){alert("1万円以上を入力してください。");return}
 state={cash:capital,initial:capital,date:new Date("2000-01-03"),holdings:{},prevTotal:capital,history:{}};
 Object.keys(stocks).forEach(k=>state.history[k]=[stocks[k].price]);
 $("startScreen").classList.add("hidden");$("game").classList.remove("hidden");render();
});

function invested(){return Object.entries(state.holdings).reduce((a,[k,q])=>a+val(stocks[k])*q,0)}
function total(){return state.cash+invested()}
function render(){
 $("gameDate").textContent=state.date.toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"short"});
 const weekend=[0,6].includes(state.date.getDay());$("marketStatus").textContent=weekend?"市場休場":"市場営業日";
 const t=total(),i=invested(),d=t-state.prevTotal,o=t-state.initial,r=o/state.initial*100;
 $("total").textContent=yen(t);$("cash").textContent=yen(state.cash);$("invested").textContent=yen(i);
 setPnl($("daily"),d);setPnl($("overall"),o);setPnl($("returnRate"),r,true);
 $("portfolioTotal").textContent=yen(i);
 const s=stocks[selected];$("stockName").textContent=s.name;$("ticker").textContent=s.ticker;
 $("price").textContent=s.currency+(s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2));
 const h=state.history[selected],ch=(h[h.length-1]/h[Math.max(0,h.length-2)]-1)*100;setPnl($("stockChange"),ch,true);
 $("dividendYield").textContent=s.divYield.toFixed(2)+"%";
 $("dividendPerShare").textContent=s.currency+(s.currency==="¥"?s.divPerShare.toLocaleString():s.divPerShare.toFixed(2));
 $("per").textContent=s.per.toFixed(1)+"倍";
 $("owned").textContent=(state.holdings[selected]||0)+"株";
 renderStocks();renderHoldings();drawChart();
}
function setPnl(el,n,percent=false){el.textContent=(n>=0?"+":"")+n.toFixed(percent?2:0)+(percent?"%":"");if(!percent&&el.id==="daily")el.textContent=(n>=0?"+":"")+yen(Math.abs(n));if(!percent&&el.id==="overall")el.textContent=(n>=0?"+":"-")+yen(Math.abs(n));el.className=n>=0?"up":"down"}
function renderStocks(){
 const box=$("stockList");box.innerHTML="";
 Object.entries(stocks).forEach(([k,s])=>{
   const d=document.createElement("div");
   d.className="stock"+(k===selected?" selected":"");
   const h=state.history[k]||[s.price];
   const prev=h.length>1?h[h.length-2]:s.price;
   const change=(s.price/prev-1)*100;
   const price=s.currency==="¥"?"¥"+Math.round(s.price).toLocaleString():s.currency+s.price.toFixed(2);
   const changeText=(change>=0?"+":"")+change.toFixed(2)+"%";
   d.innerHTML=`<div><b>${s.name}</b><small>${s.ticker}</small></div><div class="list-price"><strong>${price}</strong><small class="${change>=0?"up":"down"}">${changeText}</small></div>`;
   d.onclick=()=>openStock(k);
   box.appendChild(d)
 })
}
function openStock(k){
 selected=k;
 $("stockChooser").classList.add("hidden");
 $("stockDetail").classList.remove("hidden");
 render();
 window.scrollTo({top:0,behavior:"smooth"});
}
$("backToStocks").onclick=()=>{
 $("stockDetail").classList.add("hidden");
 $("stockChooser").classList.remove("hidden");
 renderStocks();
 window.scrollTo({top:0,behavior:"smooth"});
};

function renderHoldings(){
 const box=$("holdings");box.innerHTML="";const e=Object.entries(state.holdings).filter(([,q])=>q>0);
 if(!e.length){box.innerHTML='<p class="muted">まだ銘柄を保有していません。</p>';return}
 e.forEach(([k,q])=>{const s=stocks[k],d=document.createElement("div");d.className="holding";d.innerHTML=`<div><b>${s.name}</b><small>${q}株</small></div><div class="holding-right"><b>${yen(val(s)*q)}</b></div>`;box.appendChild(d)})
}
function showToast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),1800)}
function showTradeMessage(msg,error=false){
 const el=$("tradeMessage");
 el.textContent=(error?"⚠️ ":"✓ ")+msg;
 el.className="trade-message"+(error?" error":"");
 el.classList.remove("hidden");
}
$("buy").onclick=()=>{
 const q=Math.max(1,parseInt($("quantity").value)||1),s=stocks[selected],cost=val(s)*q;
 if(state.cash<cost){showTradeMessage("現金が足りません",true);showToast("現金が足りません");return}
 state.cash-=cost;state.holdings[selected]=(state.holdings[selected]||0)+q;render();showTradeMessage(`${s.name}を${q}株購入しました`);showToast(`${s.name}を${q}株購入しました`);
};
$("sell").onclick=()=>{
 const q=Math.max(1,parseInt($("quantity").value)||1),s=stocks[selected],have=state.holdings[selected]||0;
 if(have<q){showTradeMessage("保有数量が足りません",true);showToast("保有数量が足りません");return}
 state.cash+=val(s)*q;state.holdings[selected]-=q;render();showTradeMessage(`${s.name}を${q}株売却しました`);showToast(`${s.name}を${q}株売却しました`);
};
function nextDay(){
 state.prevTotal=total();state.date.setDate(state.date.getDate()+1);
 if(![0,6].includes(state.date.getDay())){
  Object.entries(stocks).forEach(([k,s])=>{let u=Math.random(),v=Math.random();while(!u)u=Math.random();while(!v)v=Math.random();let z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v),r=s.drift+s.vol*z;s.price=Math.max(.01,s.price*(1+r));state.history[k].push(s.price)})
  $("news").textContent=["市場は静かな一日を終えました。","企業業績への関心が高まっています。","株式市場では銘柄ごとの値動きが目立ちました。"][Math.floor(Math.random()*3)];
 }
 render();
}
$("nextDay").onclick=nextDay;
document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(btn.dataset.target).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");setTimeout(drawChart,0)});

function drawChart(){
 if(!state)return;const c=$("chart");const ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=190;c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const data=state.history[selected]||[stocks[selected].price],min=Math.min(...data),max=Math.max(...data),range=max-min||1;
 ctx.strokeStyle="#29344d";ctx.lineWidth=1;for(let i=1;i<4;i++){const y=i*h/4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 ctx.beginPath();data.forEach((v,i)=>{const x=2+i*(w-4)/Math.max(1,data.length-1),y=h-15-(v-min)/range*(h-30);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle="#6f9cff";ctx.lineWidth=2;ctx.stroke();
}
window.addEventListener("resize",drawChart);
