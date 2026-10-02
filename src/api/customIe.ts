export type SavedIeData = {
  cnpj: string;
  ie: string;
  uf?: string;
  ativo?: boolean;
  updatedAt?: string;
};

const STORAGE_KEY = 'cnpj_saved_ies_cache_v1';

function getLocalCache(): Record<string, SavedIeData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalCache(cnpj: string, data: SavedIeData | null) {
  try {
    const cache = getLocalCache();
    if (data) {
      cache[cnpj] = data;
    } else {
      delete cache[cnpj];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignora erro de cota de localStorage
  }
}

export async function getSavedIe(cnpjDigits: string): Promise<SavedIeData | null> {
  const clean = cnpjDigits.replace(/\D/g, '');
  if (!clean) return null;

  try {
    const res = await fetch(`/api/ie-customizada?cnpj=${clean}`);
    if (res.ok) {
      const json = await res.json();
      if (json.found && json.data) {
        setLocalCache(clean, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.debug('Falha ao consultar API na nuvem, usando cache local:', err);
  }

  // Fallback para cache local se a nuvem estiver indisponível ou offline
  const local = getLocalCache();
  return local[clean] || null;
}

export async function saveCustomIe(
  cnpjDigits: string,
  ie: string,
  uf?: string
): Promise<SavedIeData | null> {
  const clean = cnpjDigits.replace(/\D/g, '');
  if (!clean || !ie) return null;

  const fallbackRecord: SavedIeData = {
    cnpj: clean,
    ie: ie.trim(),
    uf: (uf || '').trim().toUpperCase(),
    ativo: true,
    updatedAt: new Date().toISOString(),
  };

  // Salva no cache local imediatamente para resposta instantânea
  setLocalCache(clean, fallbackRecord);

  try {
    const res = await fetch('/api/ie-customizada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        setLocalCache(clean, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Não foi possível sincronizar com o banco na nuvem:', err);
  }

  return fallbackRecord;
}

export async function deleteSavedIe(cnpjDigits: string): Promise<boolean> {
  const clean = cnpjDigits.replace(/\D/g, '');
  if (!clean) return false;

  setLocalCache(clean, null);

  try {
    const res = await fetch(`/api/ie-customizada?cnpj=${clean}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return true;
  }
}
