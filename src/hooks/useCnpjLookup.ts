import { useCallback, useRef, useState } from 'react';
import { ApiError, fetchCnpj } from '../api/cnpj';
import type { CnpjResponse, LookupStatus } from '../utils/types';

type LookupState = {
  status: LookupStatus;
  data: CnpjResponse | null;
  error: string | null;
};

const INITIAL_STATE: LookupState = { status: 'idle', data: null, error: null };

export function useCnpjLookup() {
  const [state, setState] = useState<LookupState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(async (cnpjDigits: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await fetchCnpj(cnpjDigits, controller.signal);
      if (controller.signal.aborted) return;
      setState({ status: 'success', data, error: null });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof ApiError ? err.message : 'Erro inesperado ao consultar o CNPJ.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, lookup, reset };
}
