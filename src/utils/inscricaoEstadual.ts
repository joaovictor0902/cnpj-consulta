import type { InscricaoEstadual } from './types';

/**
 * Seleciona a Inscrição Estadual mais relevante do estabelecimento:
 * 1. Prioridade máxima: IE do mesmo estado (UF ou ID de estado) E que esteja ATIVA (ativo === true).
 * 2. Segunda prioridade: IE do mesmo estado (mesmo que conste inativa).
 * 3. Terceira prioridade: Qualquer IE que conste como ativa.
 * 4. Quarta prioridade: A primeira IE da lista.
 */
export function getPrincipalInscricaoEstadual(
  ieList?: InscricaoEstadual[] | null,
  estUf?: string | null,
  estEstadoId?: number | null,
): InscricaoEstadual | undefined {
  if (!ieList || ieList.length === 0) return undefined;

  const cleanEstUf = (estUf || '').trim().toUpperCase();

  const isSameState = (ie: InscricaoEstadual) => {
    const ieUf = (ie.estado?.sigla || '').trim().toUpperCase();
    const sameSigla = Boolean(cleanEstUf && ieUf && ieUf === cleanEstUf);
    const sameId = Boolean(estEstadoId && ie.estado?.id && ie.estado.id === estEstadoId);
    return sameSigla || sameId;
  };

  // 1. Mesmo estado E ativa
  const sameStateActive = ieList.find((ie) => isSameState(ie) && ie.ativo);
  if (sameStateActive) return sameStateActive;

  // 2. Mesmo estado (mesmo inativa)
  const sameState = ieList.find((ie) => isSameState(ie));
  if (sameState) return sameState;

  // 3. Qualquer ativa
  const anyActive = ieList.find((ie) => ie.ativo);
  if (anyActive) return anyActive;

  // 4. Primeira da lista
  return ieList[0];
}

/**
 * Formata o texto descritivo da IE para exibição e PDF.
 */
export function formatIeSummary(
  ie?: InscricaoEstadual | null,
  customIeText?: string | null,
  fallbackEstUf?: string | null,
): { text: string; isIsento: boolean; isManual: boolean; hasIe: boolean } {
  // Se o usuário informou manualmente (ou selecionou algo)
  if (customIeText !== undefined && customIeText !== null) {
    const trimmed = customIeText.trim();
    if (trimmed.toUpperCase() === 'ISENTO') {
      return { text: 'ISENTO', isIsento: true, isManual: true, hasIe: false };
    }
    if (trimmed) {
      const ufSuffix = fallbackEstUf ? ` (${fallbackEstUf.trim().toUpperCase()})` : '';
      return {
        text: trimmed.includes('(') ? trimmed : `${trimmed}${ufSuffix}`,
        isIsento: false,
        isManual: true,
        hasIe: true,
      };
    }
  }

  // Se veio da API
  if (ie?.inscricao_estadual) {
    const uf = ie.estado?.sigla || fallbackEstUf || '';
    const status = ie.ativo ? '' : ' - Inativa';
    const text = uf ? `${ie.inscricao_estadual} (${uf}${status})` : `${ie.inscricao_estadual}${status}`;
    return { text, isIsento: false, isManual: false, hasIe: true };
  }

  // Não retornada pela API
  return {
    text: 'INCRIÇÃO ESTADUAL NÃO ENCONTRADA NA BASE PUBLICA, POR FAVOR VERIFIQUE NO SINTEGRA DO ESTADO',
    isIsento: false,
    isManual: false,
    hasIe: false,
  };
}
