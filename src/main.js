import { CONFIG, AppState } from '../config/constants.js';
import { mountTV, normalizeSymbol } from './services/bybit-api.js';
import { connectPublicWS } from './services/bybit-ws.js';
import { spawnTopMovers } from './components/top-movers.js';
import { spawnSetups } from './components/setups.js';
import { spawnAnomalies } from './components/anomalies.js';
import { loadFavorites, setAlert, loadAlerts } from './utils/storage.js';

let tvWidget = null;
const drawer = document.getElementById('drawer');
const drawerTitle = document.getElementById('drawerTitle');
const drawerBody = document.getElementById('drawerBody');
document.getElementById('drawerClose').onclick = () => drawer.classList.remove('show');

const search = document.getElementById('search');
search.addEventListener('keydown', (e)=>{
  if(e.key==='Enter'){
    const sym = normalizeSymbol(search.value);
    document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
  }
});

document.querySelectorAll('.btn-group-top .btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.modal;
    drawer.classList.add('show');
    if(type==='movers'){ drawerTitle.textContent = 'Топ рост/падение'; spawnTopMovers(); }
    else if(type==='setups'){ drawerTitle.textContent = 'Сетапы'; spawnSetups(); }
    else if(type==='anomalies'){ drawerTitle.textContent = 'Аномалии'; spawnAnomalies(); }
    else if(type==='favorites'){
      drawerTitle.textContent = '⭐ Избранное';
      const favs = Array.from(loadFavorites());
      const html = favs.map(s=>`<div class="coin-row"><span class="sym">${s}</span></div>`).join('') || '<div>Пусто</div>';
      drawerBody.innerHTML = `<div id="favWrap">${html}</div>`;
      drawerBody.querySelectorAll('.sym').forEach(el=> el.addEventListener('click', ()=>{
        const sym = el.textContent.trim();
        document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
      }));
    } else if(type==='alerts'){
      drawerTitle.textContent = '⏰ Алерты';
      const items = Array.from(loadAlerts().entries());
      drawerBody.innerHTML = items.length
        ? items.map(([sym,a])=>`<div class="coin-row"><span class="sym">${sym}</span><span>${a.dir||'cross'} @ ${a.price}</span></div>`).join('')
        : '<div>Пока нет алертов</div>';
      drawerBody.querySelectorAll('.sym').forEach(el=> el.addEventListener('click', ()=>{
        const sym = el.textContent.trim();
        document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol:sym } }));
      }));
    }
  });
});

document.addEventListener('ui:selectSymbol', (e)=>{
  const sym = e.detail.symbol; if(!sym) return;
  AppState.currentSymbol = sym;
  document.getElementById('agentSym').textContent = sym;
  document.getElementById('oiTitleSym').textContent = sym;
  document.getElementById('chartSym').textContent = sym;
  if(tvWidget && tvWidget.remove) tvWidget.remove();
  tvWidget = mountTV(sym);
}, { passive:true });

document.addEventListener('alerts:add', (e)=>{
  const { symbol, price } = e.detail || {}; if(!symbol || !price) return;
  setAlert(symbol, { price:+price, dir: 'cross' });
  alert(`Алерт создан: ${symbol} @ ${price}`);
}, { passive:true });

document.addEventListener('rt:update', ()=>{
  const d = AppState.realTime.get(AppState.currentSymbol); if(!d) return;
  const oiEl = document.getElementById('oiBox'); const agEl = document.getElementById('agentBox');
  const chg = ((d.change24h||0)*100).toFixed(2); const fund = ((d.funding||0)*100).toFixed(4);
  oiEl.innerHTML = `ОИ: <b>${(d.oi||0).toLocaleString()}</b><br>Фандинг: <b>${fund}%</b>`;
  agEl.innerHTML = `Цена: <b>${(d.price||0).toFixed(4)}</b> | 24ч: <b>${chg}%</b> | Turnover24h: <b>${(d.turnover24h||0).toFixed(0)}</b>`;
}, { passive:true });

function init(){ connectPublicWS(); document.dispatchEvent(new CustomEvent('ui:selectSymbol', { detail:{ symbol: AppState.currentSymbol } })); }
init();