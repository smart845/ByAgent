// === Global App Configuration & Runtime State ===

// Detect environment (Local / Cloud)
export const IS_LOCAL =
  typeof window !== 'undefined' &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

// === Configuration ===
export const CONFIG = {
  BYBIT: {
    // В DEV используем Vite proxy (/bybit), в PROD — прямой Bybit API.
    API_BASE: IS_LOCAL ? '/bybit' : 'https://api.bybit.com',

    // Только фьючерсы (linear)
    MARKET_CATEGORY: 'linear',

    // WebSocket (только linear)
    WS_PUBLIC: 'wss://stream.bybit.com/v5/public/linear',
    WS_PRIVATE: 'wss://stream.bybit.com/v5/private'
  },

  // Rest endpoints
  ENDPOINTS: {
    TICKERS: '/v5/market/tickers',
    KLINE: '/v5/market/kline',
    ORDERBOOK: '/v5/market/orderbook',
    FUNDING_HISTORY: '/v5/market/funding/history',
    OI: '/v5/market/open-interest',
    LONG_SHORT_RATIO: '/v5/market/account-ratio',
    TRADES: '/v5/market/recent-trade'
  },

  // UI / Behaviour
  UI: {
    moversLimit: 200,
    setupsMinNotional24h: 2e6,
    anomaliesZScore: 3,
    wsReconnectMs: 4500,
    oiInterval: '5min',
    agentPeriodSec: 5,
    logLevel: 'info'
  }
};

// Удобный хелпер для REST: собирает полный URL с category=linear
export function buildApiUrl(endpoint, params = {}) {
  const url = new URL((CONFIG.BYBIT.API_BASE || 'https://api.bybit.com') + endpoint);
  const search = new URLSearchParams({ category: CONFIG.BYBIT.MARKET_CATEGORY, ...params });
  url.search = search.toString();
  return url.toString();
}

// === Reactive App State ===
export const AppState = {
  currentSymbol: 'BTCUSDT',   // всегда фьючерсный тикер, например BTCUSDT

  favorites: new Set(),
  alerts: new Map(),

  ws: null,
  wsConnected: false,

  realTime: new Map(),        // { SYMBOL -> { price, change24h, funding, oi, ... } }

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

// Логгер (включается CONFIG.UI.logLevel = 'debug')
export function log(...args) {
  if (CONFIG.UI.logLevel === 'debug') {
    console.log('[ByAgent]', ...args);
  }
}
