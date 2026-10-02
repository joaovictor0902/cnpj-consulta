import { useCallback, useRef, useState } from 'react';
import { ApiError, fetchCnpj } from '../api/cnpj';
import { fetchSefazA1Ie } from '../api/sefazA1';
import { fetchSintegraWsIe } from '../api/providers';
import { fetchNuvemFiscalIe } from '../api/nuvemfiscal';
import { getSavedIe, saveCustomIe, deleteSavedIe } from '../api/customIe';
import { redirectToSintegraPr } from '../utils/sintegraLinks';
import type { CnpjResponse, LookupStatus } from '../utils/types';

export type UseCnpjLookupOptions = {
  onNotification?: (msg: string) => void;
};

type LookupState = {
  status: LookupStatus;
  data: CnpjResponse | null;
  error: string | null;
};

const INITIAL_STATE: LookupState = {
  status: 'idle',
  data: null,
  error: null,
};

export function useCnpjLookup(options?: UseCnpjLookupOptions) {
  const [state, setState] = useState<LookupState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;


  const lookup = useCallback(
    async (cnpjDigits: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: 'loading', data: null, error: null });
      try {
        const cleanDigits = cnpjDigits.replace(/\D/g, '');
        const data = await fetchCnpj(cleanDigits, controller.signal);
        if (controller.signal.aborted) return;

        // 1. Verifica se já temos uma Inscrição Estadual salva pela equipe no servidor compartilhado
        const saved = await getSavedIe(cleanDigits);
        if (controller.signal.aborted) return;

        if (saved) {
          setState({
            status: 'success',
            data: {
              ...data,
              _ieOrigem: 'custom_salvo',
              _ieAtualizadoEm: saved.updatedAt,
              estabelecimento: {
                ...data.estabelecimento,
                inscricoes_estaduais: [
                  {
                    inscricao_estadual: saved.ie,
                    ativo: saved.ativo ?? true,
                    atualizado_em: saved.updatedAt,
                    estado: { sigla: saved.uf || data.estabelecimento?.estado?.sigla },
                  },
                ],
              },
            },
            error: null,
          });
          return;
        }

        const ies = data.estabelecimento?.inscricoes_estaduais ?? [];
        const uf = (data.estabelecimento?.estado?.sigla || '').trim().toUpperCase();
        const hasPrIe = ies.some(
          (ie) => Boolean(ie.inscricao_estadual) && (ie.estado?.sigla || '').trim().toUpperCase() === 'PR'
        );

        setState({ status: 'success', data, error: null });

        // 2. Se a base não retornou IE (ou é CNPJ do Paraná sem IE encontrada) e não temos no banco interno, tenta enriquecer
        const needsEnrichment = ies.length === 0 || (uf === 'PR' && !hasPrIe);

        if (needsEnrichment) {
          fetchSefazA1Ie(cleanDigits, uf)
            .then(async (sefazIes) => {
              if (controller.signal.aborted) return;
              if (sefazIes.length > 0) {
                setState((prev) => {
                  if (!prev.data) return prev;
                  return {
                    ...prev,
                    data: {
                      ...prev.data,
                      _ieOrigem: 'sefaz_a1',
                      estabelecimento: {
                        ...prev.data.estabelecimento,
                        inscricoes_estaduais: sefazIes,
                      },
                    },
                  };
                });
                return;
              }

              // 3. Se SEFAZ A1 local não encontrou, tenta SintegraWS (se token configurado)
              const sintegraIes = await fetchSintegraWsIe(cleanDigits);
              if (controller.signal.aborted) return;
              if (sintegraIes.length > 0) {
                setState((prev) => {
                  if (!prev.data) return prev;
                  return {
                    ...prev,
                    data: {
                      ...prev.data,
                      _ieOrigem: 'sintegraws',
                      estabelecimento: {
                        ...prev.data.estabelecimento,
                        inscricoes_estaduais: sintegraIes,
                      },
                    },
                  };
                });
                return;
              }

              // 4. Se não encontrou, tenta Nuvem Fiscal (se credenciais configuradas)
              const nuvemIes = await fetchNuvemFiscalIe(cleanDigits, uf);
              if (controller.signal.aborted) return;
              if (nuvemIes.length > 0) {
                setState((prev) => {
                  if (!prev.data) return prev;
                  return {
                    ...prev,
                    data: {
                      ...prev.data,
                      _ieOrigem: 'nuvemfiscal',
                      estabelecimento: {
                        ...prev.data.estabelecimento,
                        inscricoes_estaduais: nuvemIes,
                      },
                    },
                  };
                });
                return;
              }

              // 5. Se nenhuma IE foi encontrada:
              if (uf === 'PR') {
                if (controller.signal.aborted) return;
                const { opened, copied } = redirectToSintegraPr(cleanDigits);
                if (opened) {
                  optionsRef.current?.onNotification?.(
                    copied
                      ? 'CNPJ copiado! Portal Sintegra-PR aberto em nova aba para consulta da IE.'
                      : 'Portal Sintegra-PR aberto em nova aba para consulta da IE.'
                  );
                } else {
                  optionsRef.current?.onNotification?.(
                    copied
                      ? 'CNPJ copiado! O navegador bloqueou a abertura automática da aba. Clique em "Redirecionar para Sintegra-PR".'
                      : 'Clique no botão "Redirecionar para Sintegra-PR" para consultar a IE.'
                  );
                }
              } else {
                if (controller.signal.aborted) return;
                optionsRef.current?.onNotification?.(
                  'Inscrição Estadual não encontrada na base pública. Por favor, verifique no Sintegra do estado.'
                );
              }
            })
            .catch((err) => {
              console.debug('Enriquecimento de IE não disponível:', err);
              if (uf === 'PR' && !controller.signal.aborted) {
                const { opened, copied } = redirectToSintegraPr(cleanDigits);
                if (opened) {
                  optionsRef.current?.onNotification?.(
                    copied
                      ? 'CNPJ copiado! Portal Sintegra-PR aberto em nova aba para consulta da IE.'
                      : 'Portal Sintegra-PR aberto em nova aba para consulta da IE.'
                  );
                } else {
                  optionsRef.current?.onNotification?.(
                    copied
                      ? 'CNPJ copiado! O navegador bloqueou a abertura automática da aba. Clique em "Redirecionar para Sintegra-PR".'
                      : 'Clique no botão "Redirecionar para Sintegra-PR" para consultar a IE.'
                  );
                }
              } else if (!controller.signal.aborted) {
                optionsRef.current?.onNotification?.(
                  'Inscrição Estadual não encontrada na base pública. Por favor, verifique no Sintegra do estado.'
                );
              }
            });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof ApiError ? err.message : 'Erro inesperado ao consultar o CNPJ.';
        setState({ status: 'error', data: null, error: message });
      }
    },
    []
  );

  const updateIe = useCallback(
    async (newIe: string | null): Promise<boolean> => {
      const currentCnpj = state.data?.estabelecimento?.cnpj?.replace(/\D/g, '');
      if (!currentCnpj) return false;
      const uf = state.data?.estabelecimento?.estado?.sigla || '';

      if (newIe && newIe.trim()) {
        const saved = await saveCustomIe(currentCnpj, newIe.trim(), uf);
        if (saved) {
          setState((prev) => {
            if (!prev.data) return prev;
            return {
              ...prev,
              data: {
                ...prev.data,
                _ieOrigem: 'custom_salvo',
                _ieAtualizadoEm: saved.updatedAt,
                estabelecimento: {
                  ...prev.data.estabelecimento,
                  inscricoes_estaduais: [
                    {
                      inscricao_estadual: saved.ie,
                      ativo: saved.ativo ?? true,
                      atualizado_em: saved.updatedAt,
                      estado: { sigla: saved.uf || uf },
                    },
                  ],
                },
              },
            };
          });
          return true;
        }
        return false;
      } else {
        // Remover do banco compartilhado e restaurar original
        await deleteSavedIe(currentCnpj);
        await lookup(currentCnpj);
        return true;
      }
    },
    [state.data, lookup]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, lookup, updateIe, reset };
}
