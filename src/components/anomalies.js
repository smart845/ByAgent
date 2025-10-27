import { AppState, CONFIG } from '../../config/constants.js';
import { isFavorite, toggleFavorite } from '../utils/storage.js';

function computeZ(vs){
  const n = vs.length; if(n<2) return 0;
  const m = vs.reduce((a,b)=>a+b,0)/n;
  const s = Math.sqrt(vs.reduce((a,b)=>a+(b-m)*(b-m),0)/ (n-1));
  const last = vs[vs.length-1];
  return s>0 ? (last - m)/s : 0;
}
const history = new Map();

function tpl(x, z){
  const fav = isFavorite(x.symbol) ? '⭐' : '☆';
  const ch = (x.change24h||0)*100;
  return `<div class="coin-row" data-sym="${x.symbol}">
    <button class="fav" data-sym="${x.symbol}">${fav}</button>
    <span class="sym">${x.symbol}</span>
    <span class="price">${x.price?.toFixed(4) ?? '-'}</span>
    <span class="chg ${ch>=0?'up':'down'}">${(ch>=0?'+':'')+ch.toFixed(2)}%</span>
    <span class="z">z=${z.toFixed(2)}</span>
    <button class="add-alert" data-sym="${x.symbol}">⏰</button>
  </div>`;
}

export function spawnAnomalies(){
  const el = document.getElementById('drawerBody');
  function render(){
    const arr = Array.from(AppState.realTime.entries()).map(([symbol, d])=>({symbol, ...d}));
    for(const x of arr){
      const h = history.get(x.symbol) || { chg:[] };
      h.chg.push((x.change24h||0)*100);
      if(h.chg.length>120) h.chg.shift();
      history.set(x.symbol, h);
    }
    const zlist = arr.map(x=>{
      const h = history.get(x.symbol);
      const z = computeZ(h?.chg || [0,0,0]);
      return { ...x, z };
    }).filter(x=> Math.abs(x.z) >= CONFIG.UI.anomaliesZScore)
      .sort((a,b)=> Math.abs(b.z) - Math.abs(a.z))
      .slice(0,100);

    el.innerHTML = `<div id="anomWrap">${zlist.map(x=> tpl(x, x.z)).join('')}</div>`;

    el.querySelectorAll('.sym').forEach(s=> s.addEventListener('click', ()=>{
      const sym = s.parentElement.dataset.sym;
      document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
    }));
    el.querySelectorAll('.fav').forEach(b=> b.addEventListener('click', ()=>{
      const sym = b.dataset.sym;
      const on = toggleFavorite(sym);
      b.textContent = on ? '⭐' : '☆';
    }));
    el.querySelectorAll('.add-alert').forEach(b=> b.addEventListener('click', ()=>{
      const sym = b.dataset.sym;
      const p = AppState.realTime.get(sym)?.price;
      const target = prompt(`Создать алерт по ${sym}. Текущая: ${p}. Введите цену:`);
      if(target) document.dispatchEvent(new CustomEvent('alerts:add', { detail:{ symbol:sym, price:+target } }));
    }));
  }
  render();
  document.addEventListener('rt:update', render, { passive:true });
}
