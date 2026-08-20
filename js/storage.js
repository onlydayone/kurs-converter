const HISTORY_KEY = 'kurs_history';
const FAV_KEY = 'kurs_fav';

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function getFavorite() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveFavorite(fav) {
  localStorage.setItem(FAV_KEY, JSON.stringify(fav));
}
