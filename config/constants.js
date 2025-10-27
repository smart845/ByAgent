// === Global App Configuration & Runtime State ===

// Detect environment (Local / Vercel / Other)
const isLocal = typeof window !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

// === Configuration ===
export const CONFIG = {
  BYBIT: {
    // REST API endpoint — auto-switch between local proxy (/bybit) and direct Bybit API
    API_BASE: isLocal
      ? '/bybit'
      : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BYBIT_API_BASE)
        || 'https://api.bybit.com',

    // WebSocket endpoints (linear only — futures)
    WS_PUBLIC: 'wss://stream.bybit.com/v5/public/linear',
    WS_PRIVATE: 'wss://stream.bybit.com/v5/private'
  },

  // === REST Endpoints (for internal services) ===
  ENDPOINTS: {
    TICKERS: '/v5/market/tickers',
    KLINE: '/v5/market/kline',
    ORDERBOOK: '/v5/market/orderbook',
    FUNDING_HISTORY: '/v5/market/funding/history',
    OI: '/v5/market/open-interest',
    LONG_SHORT_RATIO: '/v5/market/account-ratio',
    TRADES: '/v5/market/recent-trade'
  },

  // === UI / App behaviour ===
  UI: {
    moversLimit: 200,           // сколько монет отображать в топах роста/падения
    setupsMinNotional24h: 2e6,  // минимальный дневной объем для "сетапов"
    anomaliesZScore: 3,         // коэффициент для аномалий (z-score)
    wsReconnectMs: 4500,        // интервал переподключения WebSocket
    oiInterval: '5min',         // дефолтный интервал OI
    agentPeriodSec: 5,          // автообновление агента (сек)
    logLevel: 'info'            // уровень логов (info | debug | none)
  }
};

// === Reactive App State ===
export const AppState = {
  // текущий тикер
  currentSymbol: 'BTCUSDT',

  // избранное (тикеры)
  favorites: new Set(),

  // алерты (Map: {symbol -> {price, dir, ...}})
  alerts: new Map(),

  // WebSocket
  ws: null,
  wsConnected: false,

  // Runtime live data cache
  realTime: new Map(),

  // Последние снимки данных (для модалок)
  lastSnapshots: {
    movers: [],     // топ роста/падения
    setups: [],     // лучшие интрадей сетапы
    anomalies: []   // монеты с аномальной активностью
  },

  // Тайминги, состояния обновлений и UI-переменные
  lastUpdated: null,
  updateCounters: {
    tickers: 0,
    oi: 0,
    funding: 0,
  }
};

// === Logging helper ===
export function log(...args) {
  if (CONFIG.UI.logLevel === 'debug') {
    console.log('[ByAgent]', ...args);
  }
}
