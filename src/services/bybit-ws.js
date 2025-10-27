import { CONFIG, AppState } from '../../config/constants.js';
let heartbeatTimer = null; let reconnectTimer = null;
function send(ws, obj){ try { ws.send(JSON.stringify(obj)); } catch(e){} }
export function connectPublicWS(){
  if(AppState.ws && AppState.ws.readyState === 1) return AppState.ws;
  const ws = new WebSocket(CONFIG.BYBIT.WS_PUBLIC); AppState.ws = ws;
  ws.onopen = () => { const topics = ['tickers.*','fundingRate.*','openInterest.*']; send(ws, { op: 'subscribe', args: topics }); heartbeatTimer = setInterval(()=> send(ws,{op:'ping'}), 15000); };
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data || '{}'); if(msg.op === 'pong') return;
    if(msg.topic && msg.data){
      const t = msg.topic;
      if(t.startsWith('tickers.')){ const d = Array.isArray(msg.data) ? msg.data[0] : msg.data; const sym = d.symbol; const prev = AppState.realTime.get(sym) || {};
        AppState.realTime.set(sym, { ...prev, price: +d.lastPrice || +d.price || +d.lastPrice24h || prev.price, change24h: +d.price24hPcnt || prev.change24h, turnover24h: +d.turnover24h || prev.turnover24h, volume24h: +d.volume24h || prev.volume24h, ts: Date.now() });
        document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol:sym, kind:'ticker' } }));
      } else if(t.startsWith('fundingRate.')){ const d = Array.isArray(msg.data) ? msg.data[0] : msg.data; const sym = d.symbol; const prev = AppState.realTime.get(sym) || {}; AppState.realTime.set(sym, { ...prev, funding: +d.fundingRate }); document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol:sym, kind:'funding' } })); }
      else if(t.startsWith('openInterest.')){ const d = Array.isArray(msg.data) ? msg.data[0] : msg.data; const sym = d.symbol; const prev = AppState.realTime.get(sym) || {}; AppState.realTime.set(sym, { ...prev, oi: +d.openInterest }); document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol:sym, kind:'oi' } })); }
    }
  };
  ws.onclose = () => { clearInterval(heartbeatTimer); clearTimeout(reconnectTimer); reconnectTimer = setTimeout(connectPublicWS, CONFIG.UI.wsReconnectMs); };
  ws.onerror = () => { try { ws.close(); } catch(e){} };
  return ws;
}