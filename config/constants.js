// === Global App Configuration & Runtime State ===

// Detect environment (Local / Cloud)
export const IS_LOCAL =
  typeof window !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

// === Configuration ===
export const CONFIG = {
  BYBIT: {
    // В DEV используем Vite proxy (/bybit), в PROD — прямой Bybit API
   API_BASE: IS_LOCAL ? '/bybit' : '/api/bybit-proxy',

    // Только фьючерсы (linear)
    MARKET_CATEGORY: 'linear',

    // WebSocket (только linear)
    WS_PUBLIC: 'wss://stream.bybit.com/v5/public/linear',
    WS_PRIVATE: 'wss://stream.bybit.com/v5/private'
  },

  // REST endpoints
  ENDPOINTS: {
    TICKERS: '/v5/market/tickers',
    KLINE: '/v5/market/kline',
    ORDERBOOK: '/v5/market/orderbook',
    FUNDING_HISTORY: '/v5/market/funding/history',
    OI: '/v5/market/open-interest',
    LONG_SHORT_RATIO: '/v5/market/account-ratio',
    TRADES: '/v5/market/recent-trade'
  },

  // UI behaviour
  UI: {
    moversLimit: 200,           // лимит монет в топах
    setupsMinNotional24h: 2e6,  // минимальный объем для "сетапов"
    anomaliesZScore: 3,         // коэффициент для аномалий
    wsReconnectMs: 4500,        // интервал переподключения WS
    oiInterval: '5min',         // интервал по умолчанию
    agentPeriodSec: 5,          // автообновление агента
    logLevel: 'info'            // уровень логов
  }
};

// === Хелпер для REST: добавляет category=linear ===
export function buildApiUrl(endpoint, params = {}) {
  const base = CONFIG.BYBIT.API_BASE || 'https://api.bybit.com';
  const url = new URL(base + endpoint);
  const search = new URLSearchParams({
    category: CONFIG.BYBIT.MARKET_CATEGORY,
    ...params
  });
  url.search = search.toString();
  return url.toString();
}

// === Runtime State ===
export const AppState = {
  currentSymbol: 'BTCUSDT', // всегда фьючерсный тикер

  favorites: new Set(),
  alerts: new Map(),

  ws: null,
  wsConnected: false,

  realTime: new Map(), // { SYMBOL -> { price, change24h, funding, oi, ... } }

  lastSnapshots: {
    movers: [],
    setups: [],
    anomalies: []
  },

  lastUpdated: null,
  updateCounters: {
    tickers: 0,
    oi: 0,
    funding: 0
  }
};

// === Логгер ===
export function log(...args) {
  if (CONFIG.UI.logLevel === 'debug') {
    console.log('[ByAgent]', ...args);
  }
}
