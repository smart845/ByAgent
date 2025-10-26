import { CONFIG, AppState } from '../../config/constants.js';

// === API Helpers ===
export const by = async (path, params = {}) => {
  const url = new URL(CONFIG.BYBIT.API_BASE + path);
  url.search = new URLSearchParams(params).toString();
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  if (j.retCode !== 0 && j.retMsg && j.retMsg !== 'OK') throw new Error(j.retMsg || 'API error');
  return j.result;
};

export async function byF(path, params = {}) {
  return by(path, { category: 'linear', ...params });
}

// === Symbols ===
let _symbols = [];
export async function loadSymbols() {
  try {
    const res = await byF('/v5/market/tickers');
    _symbols = (res.list || []).map(x => x.symbol);
  } catch {
    _symbols = ['BTCUSDT','ETHUSDT'];
  }
  return _symbols;
}
export function normalizeSymbol(raw) {
  if (!raw) return null;
  let s = raw.toUpperCase().replace(/\s/g,'');
  if (!s.endsWith('USDT')) s += 'USDT';
  return s;
}

// === Klines ===
export async function fetchKlines(symbol, interval='15', limit=200) {
  // interval like '15' -> 15m per bybit expects '15'
  const res = await byF('/v5/market/kline', { symbol, interval, limit });
  const list = res.list || [];
  // Return as arrays [open, high, low, close]
  return list
    .map(k => ({
      ts: +k[0],
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5]
    }))
    .sort((a,b)=> a.ts - b.ts);
}

// === TradingView mount (best-effort) ===
export function mountTV(symbol, containerId='tv_chart_container') {
  if (typeof TradingView === 'undefined') return;
  const elId = containerId;
  try {
    new TradingView.widget({
      autosize: true,
      symbol: 'BYBIT:' + symbol.replace('USDT','USDT.P'),
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'ru',
      toolbar_bg: '#000000',
      enable_publishing: false,
      allow_symbol_change: false,
      container_id: elId,
    });
  } catch(e) {
    console.warn('TV mount error', e);
  }
}

