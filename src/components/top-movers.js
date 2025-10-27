import { AppState } from '../../config/constants.js';
import { toggleFavorite, isFavorite } from '../utils/storage.js';
function rowHTML(item){
  const fav = isFavorite(item.symbol) ? '⭐' : '☆';
  const ch = (item.change24h ?? 0) * 100;
  const chStr = (ch>=0?'+':'') + ch.toFixed(2) + '%';
  const funding = (item.funding ?? 0) * 100;
  const fundingStr = (funding>=0?'+':'') + funding.toFixed(4) + '%';
  return `<div class="coin-row" data-sym="${item.symbol}">
      <button class="fav" data-sym="${item.symbol}" title="В избранное">${fav}</button>
      <span class="sym">${item.symbol}</span>
      <span class="price">${item.price?.toFixed(4) ?? '-'}</span>
      <span class="chg ${ch>=0?'up':'down'}">${chStr}</span>
      <span class="funding">${fundingStr}</span>
      <button class="add-alert" data-sym="${item.symbol}">⏰</button>
    </div>`;
}
export function spawnTopMovers(){
  const wrap = document.getElementById('drawerBody');
  function render(){
    const all = Array.from(AppState.realTime.entries()).map(([symbol, d]) => ({ symbol, ...d }));
    const withChange = all.filter(x => Number.isFinite(x.change24h));
    const topUp = [...withChange].sort((a,b)=> (b.change24h||0) - (a.change24h||0)).slice(0,50);
    const topDn = [...withChange].sort((a,b)=> (a.change24h||0) - (b.change24h||0)).slice(0,50);
    const merged = [...topUp, ...topDn];
    wrap.innerHTML = `<div id="moversWrap">${merged.map(rowHTML).join('')}</div>`;
    wrap.querySelectorAll('.coin-row .sym').forEach(el=> el.addEventListener('click', ()=> {
      const sym = el.parentElement.dataset.sym;
      document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
    }));
    wrap.querySelectorAll('.coin-row .fav').forEach(btn=> btn.addEventListener('click', ()=>{
      const sym = btn.dataset.sym;
      const on = toggleFavorite(sym);
      btn.textContent = on ? '⭐' : '☆';
    }));
    wrap.querySelectorAll('.coin-row .add-alert').forEach(btn=> btn.addEventListener('click', ()=>{
      const sym = btn.dataset.sym;
      const p = AppState.realTime.get(sym)?.price;
      const target = prompt(`Создать алерт по ${sym}. Текущая: ${p}. Введите цену:`);
      if(!target) return;
      document.dispatchEvent(new CustomEvent('alerts:add', { detail:{ symbol:sym, price:+target } }));
    }));
  }
  render();
  document.addEventListener('rt:update', render, { passive:true });
}