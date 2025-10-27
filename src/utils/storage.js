const FAV_KEY = 'byagent:favorites'; 
const ALERTS_KEY = 'byagent:alerts';

export function loadFavorites(){
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); }
}
export function saveFavorites(set){
  localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set)));
}
export function toggleFavorite(sym){
  const favs = loadFavorites();
  if(favs.has(sym)) favs.delete(sym); else favs.add(sym);
  saveFavorites(favs);
  return favs.has(sym);
}
export function isFavorite(sym){ return loadFavorites().has(sym); }

export function loadAlerts(){
  try { return new Map(JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]')); } catch { return new Map(); }
}
export function saveAlerts(map){
  localStorage.setItem(ALERTS_KEY, JSON.stringify(Array.from(map.entries())));
}
export function setAlert(sym, payload){
  const m = loadAlerts();
  m.set(sym, payload);
  saveAlerts(m);
  return m.get(sym);
}
export function removeAlert(sym){
  const m = loadAlerts();
  m.delete(sym);
  saveAlerts(m);
}
