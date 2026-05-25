// Client-side persistence for things the backend does not store.
// Submission titles are keyed by submission hash; the backend only keeps
// { hash, createdAt }, so the chosen file name lives here in the browser.

const TITLES_KEY = "backtest.titles";

function readMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(key: string, map: Record<string, string>) {
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function getTitle(hash: string): string | null {
  return readMap(TITLES_KEY)[hash] ?? null;
}

export function setTitle(hash: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;
  const map = readMap(TITLES_KEY);
  map[hash] = trimmed;
  writeMap(TITLES_KEY, map);
}
