// === Bybit WebSocket for Futures (Linear) ===

import { CONFIG, AppState } from '../../config/constants.js';

let ws = null;
let heartbeatTimer = null;
let reconnectTimer = null;

function sendSafe(message) {
  try {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } catch (err) {
    console.error('WS send error:', err);
  }
}

/**
 * Подключение к публичному WebSocket Bybit Futures (linear)
 */
export function connectPublicWS() {
  // Если уже есть активное подключение — не создаём заново
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  const WS_URL = CONFIG?.BYBIT?.WS_PUBLIC || 'wss://stream.bybit.com/v5/public/linear';
  ws = new WebSocket(WS_URL);
  AppState.ws = ws;

  console.log('🔌 Connecting to Bybit WS:', WS_URL);

  ws.onopen = () => {
    console.log('✅ Bybit WS connected');
    updateWSStatus(true);

    // Подписываемся на все нужные топики
    const topics = ['tickers.*', 'fundingRate.*', 'openInterest.*'];
    sendSafe({ op: 'subscribe', args: topics });

    // Пинг каждые 15 секунд
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => sendSafe({ op: 'ping' }), 15000);
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data || '{}');
      if (msg.op === 'pong') return;

      if (msg.topic && msg.data) {
        const topic = msg.topic;
        const data = Array.isArray(msg.data) ? msg.data[0] : msg.data;
        const sym = data.symbol;
        const prev = AppState.realTime.get(sym) || {};

        if (topic.startsWith('tickers.')) {
          AppState.realTime.set(sym, {
            ...prev,
            price: +data.lastPrice || prev.price,
            change24h: +data.price24hPcnt || prev.change24h,
            turnover24h: +data.turnover24h || prev.turnover24h,
            volume24h: +data.volume24h || prev.volume24h,
            ts: Date.now(),
          });
          document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol: sym, kind: 'ticker' } }));
        }

        else if (topic.startsWith('fundingRate.')) {
          AppState.realTime.set(sym, { ...prev, funding: +data.fundingRate });
          document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol: sym, kind: 'funding' } }));
        }

        else if (topic.startsWith('openInterest.')) {
          AppState.realTime.set(sym, { ...prev, oi: +data.openInterest });
          document.dispatchEvent(new CustomEvent('rt:update', { detail: { symbol: sym, kind: 'oi' } }));
        }
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  };

  ws.onclose = () => {
    console.warn('⚠️ WS closed, will reconnect...');
    updateWSStatus(false);
    cleanup();
    reconnectTimer = setTimeout(connectPublicWS, CONFIG?.UI?.wsReconnectMs || 5000);
  };

  ws.onerror = (err) => {
    console.error('❌ WS error:', err);
    try { ws.close(); } catch (_) {}
  };

  return ws;
}

/**
 * Очистка при разрыве соединения
 */
function cleanup() {
  clearInterval(heartbeatTimer);
  clearTimeout(reconnectTimer);
  heartbeatTimer = null;
  reconnectTimer = null;
}

/**
 * Отображает статус WS (online/offline) на UI
 */
function updateWSStatus(online) {
  try {
    const el = document.getElementById('wsStatus');
    if (el) {
      el.textContent = online ? 'online' : 'offline';
      el.style.color = online ? '#7CFC00' : '#FF5555';
    }
  } catch (err) {
    console.warn('WS status element not found');
  }
}
