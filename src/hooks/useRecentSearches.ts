import { useCallback, useSyncExternalStore } from 'react';
import { formatCnpj } from '../utils/format';

const STORAGE_KEY = 'cnpj-consultas-recentes';
const MAX_ITEMS = 15;

export type RecentSearch = {
  cnpj: string;          // 14 dígitos
  cnpjFormatado: string; // XX.XXX.XXX/XXXX-XX
  razaoSocial: string;
  situacao: string;
  timestamp: number;     // Date.now()
};

// ── Subscribers para useSyncExternalStore ──────────────────────────────────
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Leitura do localStorage ────────────────────────────────────────────────
function getSnapshot(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentSearch[];
  } catch {
    return [];
  }
}

// Cache para evitar recriar a referência em cada render
let cachedSnapshot: RecentSearch[] | null = null;
let cachedRaw: string | null = null;

function getStableSnapshot(): RecentSearch[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw && cachedSnapshot !== null) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = getSnapshot();
  return cachedSnapshot;
}

// ── Escrita no localStorage ────────────────────────────────────────────────
function saveItems(items: RecentSearch[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  cachedRaw = null;
  cachedSnapshot = null;
  notifyListeners();
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useRecentSearches() {
  const items = useSyncExternalStore(subscribe, getStableSnapshot, () => []);

  const addSearch = useCallback(
    (cnpj: string, razaoSocial: string, situacao: string) => {
      const current = getSnapshot();
      // Remove duplicata do mesmo CNPJ (se existir)
      const filtered = current.filter((s) => s.cnpj !== cnpj);
      const newItem: RecentSearch = {
        cnpj,
        cnpjFormatado: formatCnpj(cnpj),
        razaoSocial: razaoSocial || '—',
        situacao: situacao || '—',
        timestamp: Date.now(),
      };
      // Insere no início e limita ao máximo
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      saveItems(updated);
    },
    [],
  );

  const clearAll = useCallback(() => {
    saveItems([]);
  }, []);

  const removeSearch = useCallback((cnpj: string) => {
    const current = getSnapshot();
    saveItems(current.filter((s) => s.cnpj !== cnpj));
  }, []);

  return { items, addSearch, clearAll, removeSearch };
}
