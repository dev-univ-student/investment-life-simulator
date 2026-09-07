const stocks={
 AAPL:{name:"Apple",ticker:"AAPL",currency:"$",price:3.69,drift:.00025,vol:.018},
 MSFT:{name:"Microsoft",ticker:"MSFT",currency:"$",price:53,drift:.0002,vol:.017},
 AMZN:{name:"Amazon",ticker:"AMZN",currency:"$",price:4,drift:.00035,vol:.025},
 NVDA:{name:"NVIDIA",ticker:"NVDA",currency:"$",price:.89,drift:.00045,vol:.032},
 TM:{name:"トヨタ自動車",ticker:"7203",currency:"¥",price:620,drift:.00018,vol:.017},
 SONY:{name:"ソニー",ticker:"6758",currency:"¥",price:10400,drift:.0002,vol:.02},
 NTDOY:{name:"任天堂",ticker:"7974",currency:"¥",price:7600,drift:.00018,vol:.019}
};
let state=null,selected="AAPL";
const $=id=>document.getElementById(id);
const yen=n=>"¥"+Math.round(n).toLocaleString("ja-JP");
const fx=()=>106;
const value=s=>s.currency==="¥"?s.price:s.price*fx();

document.querySelectorAll(".capital").forEach(btn=>{
 btn.onclick=()=>{
  document.querySelectorAll(".capital").forEach(x=>x.classList.remove("selected"));
  btn.classList.add("selected");
  $("customArea").classList.add("hidden");
  $("chosen").textContent="初期資金："+yen(+btn.dataset.capital);
  $("startGame").disabled=false;
  $("startGame").dataset.capital=btn.dataset.capital;
 };
});
$("customButton").onclick=()=>{
 document.querySelectorAll(".capital").forEach(x=>x.classList.remove("selected"));
 $("customButton").classList.add("selected");
 $("customArea").classList.remove("hidden");
 $("chosen").textContent="自由入力の金額で開始";
 $("startGame").disabled=false;
 $("startGame").dataset.capital="custom";
};
$("startGame").onclick=()=>{
 let capital=$("startGame").dataset.capital==="custom"?Number($("customCapital").value):Number($("startGame").dataset.capital);
 if(!Number.isFinite(capital)||capital<10000){alert("1万円以上を入力してください。");return}
 state={cash:capital,initial:capital,date:new Date("2000-01-03"),holdings:{},prevTotal:capital};
 $("startScreen").classList.add("hidden");$("game").classList.remove("hidden");render();
};
function invested(){return Object.entries(state.holdings).reduce((sum,[k,q])=>sum+value(stocks[k])*q,0)}
function total(){return state.cash+invested()}
function render(){
 $("gameDate").textContent=state.date.toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit"});
 $("marketStatus").textContent=[0,6].includes(state.date.getDay())?"市場休場":"市場営業日";
 $("total").textContent=yen(total());$("cash").textContent=yen(state.cash);$("invested").textContent=yen(invested());
 let d=total()-state.prevTotal,o=total()-state.initial,r=o/state.initial*100;
 $("daily").textContent=(d>=0?"+":"")+yen(Math.abs(d));$("daily").className=d>=0?"up":"down";
 $("overall").textContent=(o>=0?"+":"-")+yen(Math.abs(o));$("overall").className=o>=0?"up":"down";
 $("returnRate").textContent=(r>=0?"+":"")+r.toFixed(2)+"%";$("returnRate").className=r>=0?"up":"down";
 $("portfolioTotal").textContent=yen(invested());
 const s=stocks[selected];$("stockName").textContent=s.name;$("ticker").textContent=s.ticker;
 $("price").textContent=s.currency+(s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2));
 renderStocks();renderHoldings();
}
function renderStocks(){
 const box=$("stockList");box.innerHTML="";
 Object.entries(stocks).forEach(([k,s])=>{
  const div=document.createElement("div");div.className="stock"+(k===selected?" selected":"");
  div.onclick=()=>{selected=k;render()};
  div.innerHTML=`<div><b>${s.name}</b><small>${s.ticker}</small></div><strong>${s.currency}${s.currency==="¥"?Math.round(s.price).toLocaleString():s.price.toFixed(2)}</strong>`;
  box.appendChild(div);
 });
}
function renderHoldings(){
 const box=$("holdings");box.innerHTML="";
 const entries=Object.entries(state.holdings).filter(([,q])=>q>0);
 if(!entries.length){box.innerHTML='<p class="muted">まだ銘柄を保有していません。</p>';return}
 entries.forEach(([k,q])=>{
  const s=stocks[k],d=document.createElement("div");d.className="holding";
  d.innerHTML=`<div><b>${s.name}</b><small>${q}株</small></div><div class="holding-right"><b>${yen(value(s)*q)}</b></div>`;
  box.appendChild(d);
 });
}
$("buy").onclick=()=>{
 const q=Math.max(1,parseInt($("quantity").value)||1),s=stocks[selected],cost=value(s)*q;
 if(state.cash<cost){alert("現金が足りません。");return}
 state.cash-=cost;state.holdings[selected]=(state.holdings[selected]||0)+q;render();
};
$("sell").onclick=()=>{
 const q=Math.max(1,parseInt($("quantity").value)||1),s=stocks[selected],have=state.holdings[selected]||0;
 if(have<q){alert("保有数量が足りません。");return}
 state.cash+=value(s)*q;state.holdings[selected]-=q;render();
};
document.querySelectorAll(".nav").forEach(btn=>{
 btn.onclick=()=>{
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(btn.dataset.target).classList.add("active");
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 };
});
renderStocks();
