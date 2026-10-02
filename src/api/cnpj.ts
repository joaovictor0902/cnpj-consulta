import type { CnpjResponse } from '../utils/types';
import { getApiSettings } from './providers';

const PUBLICA_URL = 'https://publica.cnpj.ws/cnpj';
const COMERCIAL_URL = 'https://comercial.cnpj.ws/cnpj';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Utilitário de fetch com timeout integrado e suporte a sinal de cancelamento externo
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4500,
  externalSignal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => {
      clearTimeout(timer);
      controller.abort();
    });
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Converte o retorno padronizado da Receita Federal (Minha Receita / BrasilAPI)
 * para o formato esperado pelo layout do sistema (CnpjResponse).
 */
export function mapReceitaFederalToCnpjResponse(d: Record<string, any>): CnpjResponse {
  let ddd1: string | null = null;
  let tel1: string | null = null;
  if (d.ddd_telefone_1) {
    const raw = String(d.ddd_telefone_1).replace(/\D/g, '');
    if (raw.length >= 10) {
      ddd1 = raw.slice(0, 2);
      tel1 = raw.slice(2);
    } else {
      tel1 = raw;
    }
  }

  let ddd2: string | null = null;
  let tel2: string | null = null;
  if (d.ddd_telefone_2) {
    const raw = String(d.ddd_telefone_2).replace(/\D/g, '');
    if (raw.length >= 10) {
      ddd2 = raw.slice(0, 2);
      tel2 = raw.slice(2);
    } else {
      tel2 = raw;
    }
  }

  return {
    cnpj_raiz: d.cnpj ? String(d.cnpj).replace(/\D/g, '').slice(0, 8) : undefined,
    razao_social: d.razao_social || '—',
    capital_social: d.capital_social != null ? String(d.capital_social) : undefined,
    atualizado_em: new Date().toISOString(),
    porte: {
      id: d.codigo_porte != null ? String(d.codigo_porte) : undefined,
      descricao: d.porte || undefined,
    },
    natureza_juridica: {
      id: d.codigo_natureza_juridica != null ? String(d.codigo_natureza_juridica) : undefined,
      descricao: d.natureza_juridica || undefined,
    },
    estabelecimento: {
      cnpj: d.cnpj ? String(d.cnpj).replace(/\D/g, '') : undefined,
      tipo: d.descricao_identificador_matriz_filial || (d.identificador_matriz_filial === 1 ? 'MATRIZ' : 'FILIAL'),
      nome_fantasia: d.nome_fantasia || null,
      situacao_cadastral: d.descricao_situacao_cadastral || (d.situacao_cadastral === 2 ? 'ATIVA' : undefined),
      data_situacao_cadastral: d.data_situacao_cadastral || undefined,
      motivo_situacao_cadastral: d.descricao_motivo_situacao_cadastral || null,
      situacao_especial: d.situacao_especial || null,
      data_situacao_especial: d.data_situacao_especial || null,
      data_inicio_atividade: d.data_inicio_atividade || undefined,
      atividade_principal: d.cnae_fiscal
        ? {
            id: String(d.cnae_fiscal),
            descricao: d.cnae_fiscal_descricao || undefined,
          }
        : undefined,
      atividades_secundarias: Array.isArray(d.cnaes_secundarios)
        ? d.cnaes_secundarios.map((c: any) => ({
            id: String(c.codigo || c.id || ''),
            descricao: c.descricao || '',
          }))
        : [],
      tipo_logradouro: d.descricao_tipo_de_logradouro || null,
      logradouro: d.logradouro || null,
      numero: d.numero || null,
      complemento: d.complemento || null,
      bairro: d.bairro || null,
      cep: d.cep ? String(d.cep).replace(/\D/g, '') : null,
      ddd1,
      telefone1: tel1,
      ddd2,
      telefone2: tel2,
      email: d.email || null,
      cidade: {
        id: d.codigo_municipio_ibge,
        nome: d.municipio,
      },
      estado: {
        sigla: d.uf,
      },
      inscricoes_estaduais: [],
      ente_federativo_responsavel: d.ente_federativo_responsavel || null,
    },
    qsa: d.qsa,
    _provedorOrigem: 'minhareceita',
  };
}

/**
 * Consulta de contingência direta na Minha Receita (CORS habilitado, alta disponibilidade)
 */
async function fetchMinhaReceita(cnpjDigits: string, signal?: AbortSignal): Promise<CnpjResponse> {
  const url = `https://minhareceita.org/${cnpjDigits}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000, signal);

  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError('CNPJ não encontrado na base de dados.', 404);
    }
    if (res.status === 400) {
      throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
    }
    throw new ApiError(`Minha Receita retornou HTTP ${res.status}.`, res.status);
  }

  const json = await res.json();
  return mapReceitaFederalToCnpjResponse(json);
}

/**
 * Consulta de contingência secundária via BrasilAPI
 */
async function fetchBrasilApi(cnpjDigits: string, signal?: AbortSignal): Promise<CnpjResponse> {
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`;
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5000, signal);

  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError('CNPJ não encontrado na base de dados.', 404);
    }
    if (res.status === 400) {
      throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
    }
    throw new ApiError(`BrasilAPI retornou HTTP ${res.status}.`, res.status);
  }

  const json = await res.json();
  const mapped = mapReceitaFederalToCnpjResponse(json);
  mapped._provedorOrigem = 'brasilapi';
  return mapped;
}

/**
 * Função principal de consulta de CNPJ com tolerância a falhas e contingência automática
 */
export async function fetchCnpj(cnpjDigits: string, signal?: AbortSignal): Promise<CnpjResponse> {
  const cleanDigits = cnpjDigits.replace(/\D/g, '');
  if (!cleanDigits || cleanDigits.length !== 14) {
    throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
  }

  const { cnpjWsToken } = getApiSettings();
  const hasToken = Boolean(cnpjWsToken.trim());

  // 1. Se possuir token comercial da CNPJ.ws, tenta o endpoint comercial dedicado
  if (hasToken) {
    try {
      const url = `${COMERCIAL_URL}/${cleanDigits}?token=${encodeURIComponent(cnpjWsToken.trim())}`;
      const res = await fetchWithTimeout(
        url,
        {
          headers: {
            Accept: 'application/json',
            'x-api-key': cnpjWsToken.trim(),
          },
        },
        5000,
        signal
      );

      if (res.ok) {
        const data = (await res.json()) as CnpjResponse;
        data._ieOrigem = 'comercial';
        data._provedorOrigem = 'cnpj_ws';
        return data;
      }
      if (res.status === 404) {
        throw new ApiError('CNPJ não encontrado na base de dados.', 404);
      }
      if (res.status === 400) {
        throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
      }
      console.warn(`CNPJ.ws comercial retornou HTTP ${res.status}. Tentando contingência...`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw err;
      console.warn('Erro ao consultar CNPJ.ws comercial, acionando contingência:', err);
    }
  }

  // 2. Tenta a função serverless Netlify (/api/consulta-cnpj) se disponível
  try {
    const netlifyRes = await fetchWithTimeout(
      `/api/consulta-cnpj?cnpj=${cleanDigits}${hasToken ? `&token=${encodeURIComponent(cnpjWsToken.trim())}` : ''}`,
      { headers: { Accept: 'application/json' } },
      4500,
      signal
    );

    if (netlifyRes.ok) {
      const netlifyData = (await netlifyRes.json()) as CnpjResponse;
      if (hasToken && netlifyData._provedorOrigem === 'cnpj_ws') {
        netlifyData._ieOrigem = 'comercial';
      }
      return netlifyData;
    }
    if (netlifyRes.status === 404) {
      throw new ApiError('CNPJ não encontrado na base de dados.', 404);
    }
    if (netlifyRes.status === 400) {
      throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw err;
    // Em dev local (/api/consulta-cnpj dá 404 porque não tem o Netlify CLI rodando) ou timeout
  }

  // 3. Tenta CNPJ.ws pública com timeout curto (3.5 segundos para não prender o usuário se estiver fora do ar)
  if (!hasToken) {
    try {
      const url = `${PUBLICA_URL}/${cleanDigits}`;
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 3500, signal);

      if (res.ok) {
        const data = (await res.json()) as CnpjResponse;
        data._provedorOrigem = 'cnpj_ws';
        return data;
      }
      if (res.status === 404) {
        throw new ApiError('CNPJ não encontrado na base de dados.', 404);
      }
      if (res.status === 400) {
        throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
      }
      console.warn(`CNPJ.ws pública retornou HTTP ${res.status} (queda ou bloqueio). Tentando Minha Receita...`);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw err;
      console.warn('CNPJ.ws pública inacessível (Timeout / CORS / 521). Tentando Minha Receita...', err);
    }
  }

  // 4. Contingência 1: Minha Receita (API aberta, direta, estável)
  try {
    return await fetchMinhaReceita(cleanDigits, signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw err;
    console.warn('Minha Receita falhou, tentando contingência secundária BrasilAPI...', err);
  }

  // 5. Contingência 2: BrasilAPI
  try {
    return await fetchBrasilApi(cleanDigits, signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw err;
    console.warn('Todas as fontes de consulta falharam:', err);
  }

  throw new ApiError(
    'O serviço de consulta está temporariamente indisponível em todos os provedores. Tente novamente em instantes.'
  );
}
