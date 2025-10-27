import { connectPublicWS } from './services/bybit-ws.js';
import { mountTV, normalizeSymbol } from './services/bybit-api.js';
import { spawnTopMovers } from './components/top-movers.js';
import { spawnSetups } from './components/setups.js';
import { spawnAnomalies } from './components/anomalies.js';
import { loadFavorites, setAlert, loadAlerts } from './utils/storage.js';
import { CONFIG, AppState } from '../config/constants.js'; 
import { by, loadSymbols, normalizeSymbol, mountTV } from './services/bybit-api.js';
import { spawnAgent, setActiveSeg } from './components/agent-analytics.js';
import { spawnOI, refreshOI } from './components/open-interest.js';
import { generateDrawerContent, setupAlertsModal } from './utils/helpers.js';

// === DOM Elements ===
const $ = (id) => document.getElementById(id);
const symInput = $('sym'), symList = $('symList'), btnFind = $('btnFind');
const drawer = $('drawer');
const drawerTitle = $('drawerTitle');
const drawerBody = $('drawerBody');
const drawerClose = $('drawerClose');

// === Initialization ===
async function init() {
  await loadSymbols();
  
  // Set initial symbol and start modules
  const initialSym = AppState.currentSymbol;
  symInput.value = initialSym;
  selectSymbol(initialSym);
  
  // Event Listeners
  btnFind.addEventListener('click', handleFindClick);
  symInput.addEventListener('keydown', handleSymInputKeydown);
  
  // Auto timing buttons for Agent
  document.querySelectorAll('#autoSeg button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      AppState.agentPeriodSec = +btn.dataset.sec;
      setActiveSeg(document.getElementById('autoSeg'), btn);
      spawnAgent();
    });
  });
  
  // OI interval buttons
  document.querySelectorAll('#oiSeg button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      AppState.oiInterval = btn.dataset.int;
      setActiveSeg(document.getElementById('oiSeg'), btn);
      refreshOI(); // refresh immediately on interval change
    });
  });
  
  // Drawer buttons (Wallet, Alerts, and neon-wrap buttons)
  document.querySelectorAll('.neon-wrap .btn, .btn-group-top .btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const title = btn.textContent.trim();
      drawerTitle.textContent = title;
      drawerBody.innerHTML = generateDrawerContent(title);
      drawer.classList.add('show');
      
      // Call setup function for the Alerts modal after content is injected
      if (title === 'Алерты') {
        // Wait for the next tick to ensure the new HTML is in the DOM
        setTimeout(() => setupAlertsModal(drawer), 0);
      }
      
      // Auto-scroll to the modal
      setTimeout(() => {
        document.getElementById('chartWrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  });
  
  drawerClose.addEventListener('click', ()=>drawer.classList.remove('show'));
}

// === Event Handlers ===
function handleFindClick() {
  const raw = symInput.value.trim();
  const norm = normalizeSymbol(raw);
  if(!norm){ alert('Введите тикер'); return; }
  symInput.value = norm; // autosuffix USDT if needed
  selectSymbol(norm);
}

function handleSymInputKeydown(e) {
  if(e.key==='Enter'){ e.preventDefault(); btnFind.click(); }
}

// sync everything: agent + chart + OI
export function selectSymbol(sym){
  window.selectSymbol = selectSymbol;
  AppState.currentSymbol = sym;
  $('agentSym').textContent = sym;
  $('oiTitleSym').textContent = sym;
  
  // Refresh all modules now
  spawnAgent();
  spawnOI();
  mountTV(sym);
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('ui:selectSymbol', (e)=>{
  const sym = e.detail.symbol;
  if(!sym) return;
  AppState.currentSymbol = sym;
  const chartSym = document.getElementById('chartSym'); if(chartSym) chartSym.textContent = sym;
  const agentSym = document.getElementById('agentSym'); if(agentSym) agentSym.textContent = sym;
  const oiTitleSym = document.getElementById('oiTitleSym'); if(oiTitleSym) oiTitleSym.textContent = sym;
  mountTV(sym);
}, { passive:true });

document.addEventListener('alerts:add', (e)=>{
  const { symbol, price } = e.detail || {};
  if(!symbol || !price) return;
  setAlert(symbol, { price:+price, dir: 'cross' });
  alert(`Алерт создан: ${symbol} @ ${price}`);
}, { passive:true });

connectPublicWS();
