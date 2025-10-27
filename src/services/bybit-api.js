// === Bybit API for Futures (Linear) ===

import { CONFIG, AppState } from '../../config/constants.js';
// === Load all tradable futures symbols ===
export async function loadSymbols() {
  try {
    const url = `${CONFIG.BYBIT_API}/v5/market/instruments-info?category=linear`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.retCode !== 0) throw new Error(data?.retMsg || 'Bybit symbols fetch failed');

    AppState.symbols = data.result.list.map((i) => ({
      symbol: i.symbol,
      baseCoin: i.baseCoin,
      quoteCoin: i.quoteCoin,
      status: i.status,
      pricePrecision: i.pricePrecision,
      volumePrecision: i.volumePrecision,
    }));

    console.log(`Loaded ${AppState.symbols.length} Bybit Futures symbols`);
    return AppState.symbols;
  } catch (err) {
    console.error('Error loading Bybit futures symbols:', err);
    return [];
  }
}

// === Normalize symbol to correct Bybit format (always *USDT futures) ===
export function normalizeSymbol(input) {
  if (!input) return '';
  let sym = input.trim().toUpperCase();
  if (!sym.endsWith('USDT')) sym += 'USDT';
  return sym;
}

// === Load historical klines (candles) ===
export async function fetchKlines(symbol, interval = '1') {
  try {
    const url = `${CONFIG.BYBIT_API}/v5/market/kline?category=linear&symbol=${symbol}&interval=${interval}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data?.retCode !== 0) {
      console.error('Bybit Klines error:', data);
      return [];
    }

    // Map to normalized candle objects
    return data.result.list.map((i) => ({
      openTime: +i[0],
      open: +i[1],
      high: +i[2],
      low: +i[3],
      close: +i[4],
      volume: +i[5],
    }));
  } catch (err) {
    console.error('fetchKlines error', err);
    return [];
  }
}

// === Simple REST helper (fetch generic endpoint) ===
export async function by(endpoint, params = '') {
  try {
    const res = await fetch(`${CONFIG.BYBIT_API}${endpoint}${params}`);
    return await res.json();
  } catch (e) {
    console.error('Bybit API error:', e);
    return null;
  }
}

// === Mount TradingView chart with Bybit data ===
export function mountTV(symbol) {
  try {
    const container = document.getElementById('chartWrap');
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.onload = () => {
      new TradingView.widget({
        autosize: true,
        symbol: `BYBIT:${symbol}`,
        interval: '15',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'ru',
        toolbar_bg: '#1e222d',
        enable_publishing: false,
        container_id: 'chartWrap',
      });
    };
    container.appendChild(script);
  } catch (err) {
    console.error('mountTV error', err);
  }
}
