
import { fmt } from './formatters.js';
import { renderTopMovers } from '../components/top-movers.js';
import { addAlert, loadAlerts, removeAlert } from './storage.js';
import { CONFIG } from '../../config/constants.js';

export function generateDrawerContent(module) {
  // Returns { title, render(container) }
  switch (module) {
    case 'movers':
      return {
        title: 'Топ рост / падение (фьючерсы Bybit)',
        async render(container) {
          // header buttons
          container.innerHTML = `
            <div class="row" style="gap:6px;margin-bottom:8px;">
              <button class="btn" id="mvGainers">Топ роста</button>
              <button class="btn" id="mvLosers">Топ падения</button>
            </div>
            <div id="mvContainer" class="scroll" style="max-height:60vh;overflow:auto;"></div>
          `;
          const mv = container.querySelector('#mvContainer');
          await renderTopMovers(mv, 'gainers');
          container.querySelector('#mvGainers').addEventListener('click', async ()=>{ await renderTopMovers(mv,'gainers'); });
          container.querySelector('#mvLosers').addEventListener('click', async ()=>{ await renderTopMovers(mv,'losers'); });
        }
      };
    case 'alerts':
      return {
        title: 'Алерты по цене',
        render(container) {
          container.innerHTML = `
            <div class="row" style="gap:8px;margin-bottom:8px;">
              <input id="alertSym" class="input" placeholder="Напр. BTCUSDT"/>
              <input id="alertPrice" class="input" placeholder="Цена" type="number" step="0.0001"/>
              <select id="alertType" class="input">
                <option value="above">Выше или =</option>
                <option value="below">Ниже или =</option>
              </select>
              <button class="btn" id="alertCreate">Создать</button>
            </div>
            <div class="mini">Активные алерты:</div>
            <div id="activeAlertsList" class="scroll" style="max-height:50vh;overflow:auto;"></div>
          `;
          const listEl = container.querySelector('#activeAlertsList');
          const renderList = () => {
            const list = loadAlerts();
            listEl.innerHTML = list.length ? list.map(a => `
              <div class="row" style="justify-content:space-between;border:1px solid var(--border);border-radius:10px;padding:6px;margin:6px 0;">
                <div>${a.symbol} — ${a.type==='above'?'≥':'≤'} ${fmt(a.target,6)}</div>
                <button class="btn btn-sm" data-id="${a.id}">Удалить</button>
              </div>
            `).join('') : '<div class="mini">Нет активных алертов</div>';
            listEl.querySelectorAll('button[data-id]').forEach(b=>{
              b.addEventListener('click', ()=>{ removeAlert(b.dataset.id); renderList(); });
            });
          };
          renderList();
          container.querySelector('#alertCreate').addEventListener('click', ()=>{
            const s = container.querySelector('#alertSym').value.trim().toUpperCase();
            const p = +container.querySelector('#alertPrice').value;
            const t = container.querySelector('#alertType').value;
            if(!s || !p) return alert('Укажите символ и цену');
            addAlert({ symbol: s, target: p, type: t });
            renderList();
          });
        }
      };
    default:
      return {
        title: 'Раздел в разработке',
        render(container){ container.innerHTML = '<div class="mini">Скоро здесь появится функционал.</div>'; }
      };
  }
}

// Реальный прайс-поллинг для алертов
let alertsTimer = null;
async function fetchPrice(symbol) {
  const url = new URL(CONFIG.BYBIT.API_BASE + '/v5/market/tickers');
  url.search = new URLSearchParams({ category:'linear', symbol }).toString();
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  if (j.retCode !== 0) return null;
  const item = (j.result.list || [])[0];
  return item ? +item.lastPrice : null;
}

function notify(text) {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') new Notification(text);
      else if (Notification.permission !== 'denied') Notification.requestPermission().then(p=>{ if(p==='granted') new Notification(text); });
    }
  } catch {}
  // Fallback
  alert(text);
}

export function ensureAlertsWatcher() {
  if (alertsTimer) return;
  alertsTimer = setInterval(async () => {
    const list = loadAlerts();
    if (!list.length) return;
    // group by symbol to reduce requests
    const bySym = {};
    for (const a of list) { (bySym[a.symbol] ||= []).push(a); }
    for (const [sym, arr] of Object.entries(bySym)) {
      const price = await fetchPrice(sym);
      if (price == null) continue;
      const left = [];
      for (const a of arr) {
        const hit = (a.type === 'above' && price >= a.target) || (a.type === 'below' && price <= a.target);
        if (hit) notify(`🔔 ${sym} ${a.type==='above'?'≥':'≤'} ${a.target} (текущая ${price})`);
        else left.push(a);
      }
      // merge back
      const others = loadAlerts().filter(x => x.symbol !== sym);
      const merged = others.concat(left);
      // save
      localStorage.setItem('byagent:alerts', JSON.stringify(merged));
    }
  }, 5000); // check every 5s
}
