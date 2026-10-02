import type { InscricaoEstadual } from '../utils/types';

export interface NuvemFiscalConfig {
  clientId: string;
  clientSecret: string;
  isSandbox: boolean;
  autoEnrich: boolean;
  customProxyUrl?: string;
}

const STORAGE_KEY = 'nuvemfiscal_settings';

export function getNuvemFiscalConfig(): NuvemFiscalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        clientId: parsed.clientId || '',
        clientSecret: parsed.clientSecret || '',
        isSandbox: Boolean(parsed.isSandbox),
        autoEnrich: parsed.autoEnrich ?? true,
        customProxyUrl: parsed.customProxyUrl || '',
      };
    }
  } catch {
    // ignore json parse error
  }

  return {
    clientId: import.meta.env.VITE_NUVEM_FISCAL_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_NUVEM_FISCAL_CLIENT_SECRET || '',
    isSandbox: import.meta.env.VITE_NUVEM_FISCAL_USE_SANDBOX === 'true',
    autoEnrich: true,
    customProxyUrl: import.meta.env.VITE_NUVEM_FISCAL_PROXY_URL || '',
  };
}

export function saveNuvemFiscalConfig(config: NuvemFiscalConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  // Limpa o token em cache se as credenciais mudarem
  cachedToken = null;
  tokenExpiresAt = 0;
}

export function isNuvemFiscalConfigured(): boolean {
  const cfg = getNuvemFiscalConfig();
  return Boolean(cfg.clientId.trim() && cfg.clientSecret.trim());
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getAuthUrl(config: NuvemFiscalConfig): string {
  if (config.customProxyUrl) {
    return `${config.customProxyUrl.replace(/\/+$/, '')}/oauth/token`;
  }
  // No Vite dev, usa o proxy configurado em vite.config.ts para contornar CORS
  if (import.meta.env.DEV) {
    return '/auth-nuvemfiscal/oauth/token';
  }
  return 'https://auth.nuvemfiscal.com.br/oauth/token';
}

function getApiBaseUrl(config: NuvemFiscalConfig): string {
  if (config.customProxyUrl) {
    return config.customProxyUrl.replace(/\/+$/, '');
  }
  // No Vite dev, usa o proxy configurado em vite.config.ts para contornar CORS
  if (import.meta.env.DEV) {
    return '/api-nuvemfiscal';
  }
  return 'https://api.nuvemfiscal.com.br';
}

/**
 * Obtém o Bearer token OAuth2 da Nuvem Fiscal
 */
export async function fetchNuvemFiscalToken(config?: NuvemFiscalConfig): Promise<string> {
  const cfg = config || getNuvemFiscalConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error('Credenciais da Nuvem Fiscal (Client ID / Client Secret) não informadas.');
  }

  const now = Date.now();
  // Se ainda estiver válido com margem de 60s
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const authUrl = getAuthUrl(cfg);
  const bodyParams = new URLSearchParams();
  bodyParams.append('grant_type', 'client_credentials');
  bodyParams.append('client_id', cfg.clientId.trim());
  bodyParams.append('client_secret', cfg.clientSecret.trim());
  bodyParams.append('scope', 'cnpj nfe');

  let res: Response;
  try {
    res = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
    });
  } catch (err) {
    throw new Error('Falha ao conectar com o servidor de autenticação da Nuvem Fiscal. Verifique sua conexão ou bloqueio de CORS.');
  }

  if (!res.ok) {
    let errDetail = '';
    try {
      const errJson = await res.json();
      errDetail = errJson.error_description || errJson.error || errJson.message || '';
    } catch {
      // ignore
    }
    throw new Error(
      `Autenticação na Nuvem Fiscal falhou (HTTP ${res.status})${errDetail ? `: ${errDetail}` : '. Verifique o Client ID e Client Secret.'}`
    );
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedToken;
}

/**
 * Testa a conexão com as credenciais fornecidas
 */
export async function testNuvemFiscalAuth(
  clientId: string,
  clientSecret: string,
  isSandbox = false
): Promise<{ success: boolean; message: string }> {
  try {
    const testCfg: NuvemFiscalConfig = {
      clientId,
      clientSecret,
      isSandbox,
      autoEnrich: true,
    };
    await fetchNuvemFiscalToken(testCfg);
    return { success: true, message: 'Conexão e autenticação com a Nuvem Fiscal realizadas com sucesso!' };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

interface ContribuinteItem {
  ie?: string;
  inscricao_estadual?: string;
  uf?: string;
  situacao_cadastral?: number | string;
  cnae?: string;
  razao_social?: string;
  nome_fantasia?: string;
  habilitado?: boolean;
}

interface CadastroContribuinteResponse {
  uf?: string;
  situacao?: string;
  dados?: ContribuinteItem[];
  estabelecimentos?: ContribuinteItem[];
  [key: string]: unknown;
}

/**
 * Consulta a Inscrição Estadual na Nuvem Fiscal (Cadastro Centralizado de Contribuintes / SEFAZ)
 */
export async function fetchNuvemFiscalIe(
  cnpjDigits: string,
  uf?: string | null
): Promise<InscricaoEstadual[]> {
  const cfg = getNuvemFiscalConfig();
  if (!isNuvemFiscalConfigured()) return [];

  const token = await fetchNuvemFiscalToken(cfg);
  const cleanCnpj = cnpjDigits.replace(/\D/g, '');
  const cleanUf = (uf || '').trim().toUpperCase();
  const apiBase = getApiBaseUrl(cfg);

  const foundIes: InscricaoEstadual[] = [];

  // 1ª Tentativa: Consulta Cadastro de Contribuinte na SEFAZ via Nuvem Fiscal (/nfe/cadastro-contribuinte)
  if (cleanUf) {
    try {
      const url = `${apiBase}/nfe/cadastro-contribuinte?cpf_cnpj=${cleanCnpj}&uf=${cleanUf}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const data = (await res.json()) as CadastroContribuinteResponse;
        const items = data.dados || data.estabelecimentos || [];

        for (const item of items) {
          const ieNumero = item.ie || item.inscricao_estadual;
          if (ieNumero) {
            const isAtivo =
              item.habilitado === true ||
              item.situacao_cadastral === 1 ||
              item.situacao_cadastral === '1' ||
              item.situacao_cadastral === 'Habilitado' ||
              item.situacao_cadastral === 'Ativo';

            foundIes.push({
              inscricao_estadual: ieNumero.trim(),
              ativo: isAtivo,
              atualizado_em: new Date().toISOString(),
              estado: {
                sigla: (item.uf || cleanUf).toUpperCase(),
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar /nfe/cadastro-contribuinte na Nuvem Fiscal:', err);
    }
  }

  // 2ª Tentativa: Se não achou na SEFAZ direta ou UF não estava definida, consulta endpoint de CNPJ da Nuvem Fiscal (/cnpj/{cnpj})
  if (foundIes.length === 0) {
    try {
      const url = `${apiBase}/cnpj/${cleanCnpj}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const cnpjData = await res.json();
        const rawIes =
          cnpjData?.inscricoes_estaduais ||
          cnpjData?.estabelecimento?.inscricoes_estaduais ||
          [];

        if (Array.isArray(rawIes)) {
          for (const raw of rawIes) {
            const ieNumero = typeof raw === 'string' ? raw : (raw.ie || raw.inscricao_estadual);
            if (ieNumero) {
              const ieUf = raw.uf || raw.estado?.sigla || cleanUf;
              const isAtivo = raw.ativo ?? (raw.situacao_cadastral === 'Ativa' || raw.habilitado !== false);
              foundIes.push({
                inscricao_estadual: String(ieNumero).trim(),
                ativo: isAtivo,
                atualizado_em: new Date().toISOString(),
                estado: {
                  sigla: ieUf ? String(ieUf).toUpperCase() : undefined,
                },
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar /cnpj/{cnpj} na Nuvem Fiscal:', err);
    }
  }

  return foundIes;
}
