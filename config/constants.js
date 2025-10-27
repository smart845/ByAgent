// AUTO-ADDED: config/constants.js
export const CONFIG = {
  BYBIT: {
    API_BASE: (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
      ? '/bybit'
      : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BYBIT_API_BASE) || 'https://api.bybit.com',
    WS_PUBLIC: 'wss://stream.bybit.com/v5/public/linear',
    WS_PRIVATE: 'wss://stream.bybit.com/v5/private'
  },
  ENDPOINTS: {
    TICKERS: '/v5/market/tickers',
    KLINE: '/v5/market/kline',
    ORDERBOOK: '/v5/market/orderbook',
    FUNDING_HISTORY: '/v5/market/funding/history',
    OI: '/v5/market/open-interest',
    LONG_SHORT_RATIO: '/v5/market/account-ratio',
    TRADES: '/v5/market/recent-trade'
  },
  UI: {
    moversLimit: 200,
    setupsMinNotional24h: 2e6,
    anomaliesZScore: 3,
    wsReconnectMs: 4500,
    oiInterval: '5min',
    agentPeriodSec: 5
  }
};
export const AppState = {
  currentSymbol: 'BTCUSDT',
  favorites: new Set(),
  alerts: new Map(),
  ws: null,
  wsConnected: false,
  realTime: new Map(),
  lastSnapshots: { movers: [], setups: [], anomalies: [] }
};
