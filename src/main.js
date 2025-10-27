import { connectPublicWS } from './services/bybit-ws.js';
import { mountTV, normalizeSymbol } from './services/bybit-api.js';
import { spawnTopMovers } from './components/top-movers.js';
import { spawnSetups } from './components/setups.js';
import { spawnAnomalies } from './components/anomalies.js';
import { AppState } from './config/constants.js';
import { loadFavorites, setAlert, loadAlerts } from './utils/storage.js';
import { CONFIG } from './config/constants.js';
import { spawnAgent, setActiveSeg } from './components/agent-analytics.js';
import { spawnOI, refreshOI } from './components/open-interest.js';
import { generateDrawerContent, setupAlertsModal } from './utils/helpers.js';

// ========== DOM Shortcuts ==========
const $ = (id) => document.getElementById(id);

// ========== Initialization ==========
async function init() {
  console.log('[ByAgent] init start');

  // Ensure all UI elements exist before binding
  const symInput = $('sym');
  const btnFind = $('btnFind');
  const drawer = $('drawer');
  const drawerTitle = $('drawerTitle');
  const drawerBody = $('drawerBody');
  const drawerClose = $('drawerClose');

  // Defensive check
  if (!symInput || !btnFind) {
    console.warn('UI not ready — missing key elements');
    return;
  }

  await loadFavorites();
  await loadAlerts();

  const initialSym = AppState.currentSymbol || 'BTCUSDT';
  symInput.value = initialSym;
  selectSymbol(initialSym);

  // === Events ===
  btnFind.addEventListener('click', handleFindClick);
  symInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleFindClick();
  });

  // === Agent timing buttons ===
  document.querySelectorAll('#autoSeg button').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.agentPeriodSec = +btn.dataset.sec;
      setActiveSeg(document.getElementById('autoSeg'), btn);
      spawnAgent();
    });
  });

  // === OI interval buttons ===
  document.querySelectorAll('#oiSeg button').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.oiInterval = btn.dataset.int;
      setActiveSeg(document.getElementById('oiSeg'), btn);
      refreshOI();
    });
  });

  // === Drawer buttons ===
  document.querySelectorAll('.neon-wrap .btn, .btn-group-top .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.textContent.trim();
      drawerTitle.textContent = title;
      drawerBody.innerHTML = generateDrawerContent(title);
      drawer.classList.add('show');

      if (title === 'Алерты') {
        setTimeout(() => setupAlertsModal(drawer), 0);
      }
      setTimeout(() => {
        document.getElementById('chartWrap')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  });

  if (drawerClose)
    drawerClose.addEventListener('click', () => drawer.classList.remove('show'));

  // === Modules ===
  spawnTopMovers();
  spawnSetups();
  spawnAnomalies();
  spawnAgent();
  spawnOI();
  connectPublicWS();

  console.log('[ByAgent] UI initialized');
}

// ========== Event Handlers ==========
function handleFindClick() {
  const symInput = $('sym');
  if (!symInput) return;

  const raw = symInput.value.trim();
  const norm = normalizeSymbol(raw);
  if (!norm) {
    alert('Введите тикер');
    return;
  }
  symInput.value = norm;
  selectSymbol(norm);
}

// ========== Symbol Switch ==========
export function selectSymbol(sym) {
  AppState.currentSymbol = sym;
  $('agentSym').textContent = sym;
  $('oiTitleSym').textContent = sym;
  mountTV(sym);
  spawnAgent();
  spawnOI();
}

// ========== Init after DOM ready ==========
document.addEventListener('DOMContentLoaded', init);

// ========== WebSocket connect ==========
connectPublicWS();
