// src/components/top-movers.js — DROP-IN REPLACEMENT
import { AppState, CONFIG } from '../../config/constants.js';
import { loadFavorites, toggleFavorite, isFavorite } from '../utils/storage.js';
import { connectPublicWS } from '../services/bybit-ws.js';

const $ = (s) => document.querySelector(s);

function rowHTML(item){
  const fav = isFavorite(item.symbol) ? '⭐' : '☆';
  const ch = (item.change24h ?? 0) * 100;
  const chStr = (ch>=0?'+':'') + ch.toFixed(2) + '%';
  const funding = (item.funding ?? 0) * 100;
  const fundingStr = (funding>=0?'+':'') + funding.toFixed(4) + '%';
  return `
    <div class="coin-row" data-sym="${item.symbol}">
      <button class="fav" data-sym="${item.symbol}" title="В избранное">${fav}</button>
      <span class="sym">${item.symbol}</span>
      <span class="price">${item.price?.toFixed(4) ?? '-'}</span>
      <span class="chg ${ch>=0?'up':'down'}">${chStr}</span>
      <span class="funding">${fundingStr}</span>
      <button class="add-alert" data-sym="${item.symbol}">⏰</button>
    </div>
  `;
}

function mountStyles(){
  if(document.getElementById('movers-css')) return;
  const style = document.createElement('style');
  style.id = 'movers-css';
  style.textContent = `
    #moversWrap{ max-height:360px; overflow:auto; border:1px solid var(--border); border-radius:12px; }
    .coin-row{ display:grid; grid-template-columns: 42px 1fr 1fr 1fr 1fr 42px; gap:8px; padding:8px 10px; align-items:center; border-bottom:1px dashed rgba(255,255,255,.06); }
    .coin-row:hover{ background:rgba(255,255,255,.03); }
    .coin-row .sym{ font-weight:600; }
    .coin-row .chg.up{ color:#1ecb7d; } .coin-row .chg.down{ color:#ff6b6b; }
    .coin-row button.fav{ background:transparent; border:none; font-size:16px; cursor:pointer; }
    .coin-row button.add-alert{ background:transparent; border:1px solid var(--border); border-radius:8px; cursor:pointer; padding:4px 6px; }
  `;
  document.head.appendChild(style);
}

export function spawnTopMovers(){
  mountStyles();
  connectPublicWS();

  const container = document.getElementById('drawerBody');
  container.innerHTML = `
    <div id="moversWrap"></div>
  `;

  function render(){
    const all = Array.from(AppState.realTime.entries()).map(([symbol, d]) => ({ symbol, ...d }));
    const withChange = all.filter(x => Number.isFinite(x.change24h));
    // сортируем по %
    const topUp = withChange.sort((a,b)=> (b.change24h||0) - (a.change24h||0)).slice(0,50);
    const topDn = withChange.sort((a,b)=> (a.change24h||0) - (b.change24h||0)).slice(0,50);
    const merged = [...topUp, ...topDn].slice(0, CONFIG.UI.moversLimit);

    const html = merged.map(rowHTML).join('');
    const wrap = document.getElementById('moversWrap');
    wrap.innerHTML = html;

    wrap.querySelectorAll('.coin-row .sym').forEach(el=>{
      el.addEventListener('click', ()=> {
        const sym = el.parentElement.dataset.sym;
        document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
      });
    });
    wrap.querySelectorAll('.coin-row .fav').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const sym = btn.dataset.sym;
        const on = toggleFavorite(sym);
        btn.textContent = on ? '⭐' : '☆';
      });
    });
    wrap.querySelectorAll('.coin-row .add-alert').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const sym = btn.dataset.sym;
        const p = AppState.realTime.get(sym)?.price;
        const target = prompt(`Создать алерт по ${sym}. Текущая: ${p}. Введите цену:`);
        if(!target) return;
        document.dispatchEvent(new CustomEvent('alerts:add', { detail:{ symbol:sym, price:+target } }));
      });
    });
  }

  render();
  document.addEventListener('rt:update', render, { passive:true });
}
