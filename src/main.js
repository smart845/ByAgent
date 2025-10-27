// === Core Imports ===
import { connectPublicWS } from './services/bybit-ws.js';
import { mountTV, normalizeSymbol } from './services/bybit-api.js';
import { spawnTopMovers } from './components/top-movers.js';
import { spawnSetups } from './components/setups.js';
import { spawnAnomalies } from './components/anomalies.js';
import { CONFIG, AppState } from './config/constants.js';
import { loadFavorites, setAlert, loadAlerts } from './utils/storage.js';
import { spawnAgent, setActiveSeg } from './components/agent-analytics.js';
import { spawnOI, refreshOI } from './components/open-interest.js';
import { generateDrawerContent, setupAlertsModal } from './utils/helpers.js';

// === DOM Shortcut ===
const $ = (id) => document.getElementById(id);

// === Initialization ===
async function init() {
  console.log('[ByAgent] Initialization started');

  // Wait until DOM is fully ready
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  // --- Elements ---
  const symInput = $('sym');
  const btnFind = $('btnFind');
  const drawer = $('drawer');
  const drawerTitle = $('drawerTitle');
  const drawerBody = $('drawerBody');
  const drawerClose = $('drawerClose');

  if (!symInput || !btnFind) {
    console.error('[ByAgent] Critical: missing #sym or #btnFind in DOM');
    return;
  }

  await loadFavorites();
  await loadAlerts();

  const initialSym = AppState.currentSymbol || 'BTCUSDT';
  symInput.value = initialSym;
  selectSymbol(initialSym);

  // --- Search input and button ---
  btnFind.addEventListener('click', handleFindClick);
  symInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleFindClick();
  });

  // --- Agent timing buttons ---
  document.querySelectorAll('#autoSeg button').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.agentPeriodSec = Number(btn.dataset.sec);
      setActiveSeg(document.getElementById('autoSeg'), btn);
      spawnAgent();
    });
  });

  // --- Open Interest interval buttons ---
  document.querySelectorAll('#oiSeg button').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.oiInterval = btn.dataset.int;
      setActiveSeg(document.getElementById('oiSeg'), btn);
      refreshOI();
    });
  });

  // --- Drawer / modal buttons (Favorites, Alerts, Setups, etc.) ---
  document.querySelectorAll('.neon-wrap .btn, .btn-group-top .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.textContent.trim();
      drawerTitle.textContent = title;
      drawerBody.innerHTML = generateDrawerContent(title);
      drawer.classList.add('show');

      // Alerts modal setup
      if (title === 'Алерты') {
        setTimeout(() => setupAlertsModal(drawer), 0);
      }

      // Smooth scroll to chart
      setTimeout(() => {
        const chartWrap = document.getElementById('chartWrap');
        if (chartWrap) chartWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });
  });

  if (drawerClose)
    drawerClose.addEventListener('click', () => drawer.classList.remove('show'));

  // --- Initialize modules ---
  try {
    spawnTopMovers();
    spawnSetups();
    spawnAnomalies();
    spawnAgent();
    spawnOI();
    connectPublicWS();
  } catch (e) {
    console.error('[ByAgent] Module init error:', e);
  }

  console.log('[ByAgent] UI fully initialized ✅');
}

// === Event Handlers ===
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

// === Symbol Selection ===
export function selectSymbol(sym) {
  if (!sym) return;
  AppState.currentSymbol = sym;

  const agentSym = $('agentSym');
  const oiTitleSym = $('oiTitleSym');
  if (agentSym) agentSym.textContent = sym;
  if (oiTitleSym) oiTitleSym.textContent = sym;

  // Sync modules
  mountTV(sym);
  spawnAgent();
  spawnOI();
}

// === Auto Init ===
document.addEventListener('DOMContentLoaded', init);
