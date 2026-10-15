import { useSyncExternalStore } from "react";

/**
 * Distritos favoritos sin login: se guardan en el navegador (localStorage)
 * y se sincronizan entre componentes y pestañas.
 */
const KEY = "aeroforo-favoritos";
const EMPTY: number[] = [];
const listeners = new Set<() => void>();
let cache: number[] | null = null;

function read(): number[] {
  if (cache === null) {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      cache = Array.isArray(parsed) ? parsed.filter((n) => Number.isInteger(n)) : [];
    } catch {
      cache = [];
    }
  }
  return cache!;
}

function write(next: number[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFavorites(): number[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function toggleFavorite(id: number) {
  const cur = read();
  write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
}
