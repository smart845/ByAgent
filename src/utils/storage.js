
// src/utils/storage.js
const FAV_KEY = 'byagent:favorites'; 
const ALERTS_KEY = 'byagent:alerts';

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
export function saveFavorites(set) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...set])); } catch {}
}
export function toggleFavorite(sym) {
  const favs = loadFavorites();
  if (favs.has(sym)) favs.delete(sym); else favs.add(sym);
  saveFavorites(favs);
  return favs;
}
export function isFavorite(sym) {
  return loadFavorites().has(sym);
}

// Alerts: { id, symbol, target, type: 'above'|'below', createdAt }
export function loadAlerts() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]'); } catch { return []; }
}
export function saveAlerts(list) {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(list)); } catch {}
}
export function addAlert(a) {
  const list = loadAlerts();
  list.push({ id: crypto.randomUUID(), createdAt: Date.now(), ...a });
  saveAlerts(list);
  return list;
}
export function removeAlert(id) {
  const list = loadAlerts().filter(x => x.id !== id);
  saveAlerts(list);
  return list;
}
