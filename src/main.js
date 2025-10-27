// === Imports ===
import { connectPublicWS } from './services/bybit-ws.js';
import { mountTV, normalizeSymbol, by, loadSymbols } from './services/bybit-api.js';
import { spawnTopMovers } from './components/top-movers.js';
import { spawnSetups } from './components/setups.js';
import { spawnAnomalies } from './components/anomalies.js';
import { AppState, CONFIG } from '../config/constants.js';
import { loadFavorites, setAlert, loadAlerts } from './utils/storage.js';
import { spawnAgent, setActiveSeg } from './components/agent-analytics.js';
import { spawnOI, refreshOI } from './components/open-interest.js';
import { generateDrawerContent, setupAlertsModal } from './utils/helpers.js';

// === DOM Elements ===
const $ = (id) => document.getElementById(id);
const symInput = $('sym');
const btnFind = $('btnFind');
const drawer = $('drawer');
const drawerTitle = $('drawerTitle');
const drawerBody = $('drawerBody');
const drawerClose = $('drawerClose');

// === Initialization ===
async function init() {
  await loadSymbols();
  connectPublicWS();

  // Set initial symbol and start modules
  const initialSym = AppState.currentSymbol;
  symInput.value = initialSym;
  selectSymbol(initialSym);

  // Event Listeners
  btnFind.addEventListener('click', handleFindClick);
  symInput.addEventListener('keydown', handleSymInputKeydown);

  // Auto timing buttons for Agent
  document.querySelectorAll('#autoSeg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      AppState.agentPeriodSec = +btn.dataset.sec;
      setActiveSeg(document.getElementById('autoSeg'), btn);
      spawnAgent();
    });
  });

  // OI interval buttons
  document.querySelectorAll('#oiSeg button').forEach((btn) => {
    btn.addEventListener('click', () => {
      AppState.oiInterval = btn.dataset.int;
      setActiveSeg(document.getElementById('oiSeg'), btn);
      refreshOI(); // refresh immediately on interval change
    });
  });

  // Drawer buttons (Wallet, Alerts, Top/Setups/Anomalies)
  document
    .querySelectorAll('.neon-wrap .btn, .btn-group-top .btn')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.textContent.trim();
        drawerTitle.textContent = title;
        drawerBody.innerHTML = generateDrawerContent(title);
        drawer.classList.add('show');

        // Alerts modal setup
        if (title === 'Алерты') {
          setTimeout(() => setupAlertsModal(drawer), 0);
        }

        // Scroll to chart
        setTimeout(() => {
          const chart = document.getElementById('chartWrap');
          if (chart) chart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      });
    });

  drawerClose.addEventListener('click', () =>
    drawer.classList.remove('show')
  );
}

// === Event Handlers ===
function handleFindClick() {
  const raw = symInput.value.trim();
  const norm = normalizeSymbol(raw);
  if (!norm) {
    alert('Введите тикер');
    return;
  }
  symInput.value = norm;
  selectSymbol(norm);
}

function handleSymInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    btnFind.click();
  }
}

// === Sync everything: Agent + Chart + OI ===
export function selectSymbol(sym) {
  AppState.currentSymbol = sym;
  const el = (id) => document.getElementById(id);
  const ids = ['agentSym', 'oiTitleSym', 'chartSym'];
  ids.forEach((id) => {
    const node = el(id);
    if (node) node.textContent = sym;
  });

  spawnAgent();
  spawnOI();
  mountTV(sym);
}

// === Global Event Listeners ===
document.addEventListener('DOMContentLoaded', init);

document.addEventListener(
  'ui:selectSymbol',
  (e) => {
    const sym = e.detail.symbol;
    if (!sym) return;
    selectSymbol(sym);
  },
  { passive: true }
);

document.addEventListener(
  'alerts:add',
  (e) => {
    const { symbol, price } = e.detail || {};
    if (!symbol || !price) return;
    setAlert(symbol, { price: +price, dir: 'cross' });
    alert(`Алерт создан: ${symbol} @ ${price}`);
  },
  { passive: true }
);
