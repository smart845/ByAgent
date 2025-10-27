import { AppState, CONFIG } from '../../config/constants.js';
import { isFavorite, toggleFavorite } from '../utils/storage.js';

const tpl = (x)=>{
  const fav = isFavorite(x.symbol) ? '⭐' : '☆';
  const ch = (x.change24h||0)*100;
  return `<div class="coin-row" data-sym="${x.symbol}">
    <button class="fav" data-sym="${x.symbol}">${fav}</button>
    <span class="sym">${x.symbol}</span>
    <span class="price">${x.price?.toFixed(4) ?? '-'}</span>
    <span class="turn">${(x.turnover24h||0).toFixed(0)}</span>
    <span class="chg ${ch>=0?'up':'down'}">${(ch>=0?'+':'')+ch.toFixed(2)}%</span>
    <button class="add-alert" data-sym="${x.symbol}">⏰</button>
  </div>`;
};

export function spawnSetups(){
  const el = document.getElementById('drawerBody');
  function score(x){
    const t = x.turnover24h||0;
    const v = x.volume24h||0;
    const c = Math.abs(x.change24h||0);
    return (t/1e6) + (v/1e3) + (c*100);
  }
  function render(){
    const arr = Array.from(AppState.realTime.entries()).map(([symbol, d])=>({symbol, ...d}));
    const filt = arr.filter(x => (x.turnover24h||0) >= CONFIG.UI.setupsMinNotional24h);
    const sorted = filt.sort((a,b)=> score(b)-score(a)).slice(0,200);
    el.innerHTML = `<div id="setupsWrap">${sorted.map(tpl).join('')}</div>`;

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
