import { CONFIG, AppState } from '../../config/constants.js'; 

// === REST helpers: только linear (фьючерсы) ===
export async function by(path, params = {}){
  const url = new URL(CONFIG.BYBIT.API_BASE + path);
  url.search = new URLSearchParams({ category: 'linear', ...params }).toString();
  const r = await fetch(url);
  if(!r.ok) throw new Error(await r.text());
  const j = await r.json();
  if(j.retCode !== 0) throw new Error(j.retMsg || 'Bybit API error');
  return j.result;
}

export async function loadSymbols(){
  const res = await by(CONFIG.ENDPOINTS.TICKERS);
  return (res.list || []).map(x => x.symbol).filter(s => s.endsWith('USDT'));
}

export function normalizeSymbol(input){
  if(!input) return 'BTCUSDT';
  const s = input.replace(/\s+/g,'').toUpperCase();
  if(/^[A-Z]{2,}$/.test(s) && !s.endsWith('USDT')) return s + 'USDT';
  return s;
}

// === TradingView чарт только с Bybit ===
export function mountTV(symbol, container_id = 'tv'){
  if(typeof TradingView === 'undefined') return;
  const widget = new TradingView.widget({
    autosize: true,
    symbol: `BYBIT:${symbol}`,
    interval: '15',
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    container_id,
    library_path: 'https://s3.tradingview.com/',
    studies: ['RSI@tv-basicstudies','MACD@tv-basicstudies','MAExp@tv-basicstudies','MAExp@tv-basicstudies']
  });
  return widget;
}
