import type { InscricaoEstadual } from '../utils/types';

export interface ApiSettings {
  cnpjWsToken: string;
  sintegraWsToken: string;
}

const SETTINGS_KEY = 'atopy_api_settings';

export function getApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cnpjWsToken: parsed.cnpjWsToken || '',
        sintegraWsToken: parsed.sintegraWsToken || '',
      };
    }
  } catch {
    // ignore
  }

  return {
    cnpjWsToken: import.meta.env.VITE_CNPJ_WS_TOKEN || '',
    sintegraWsToken: import.meta.env.VITE_SINTEGRA_WS_TOKEN || '',
  };
}

export function saveApiSettings(settings: ApiSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasActiveApiToken(): boolean {
  const s = getApiSettings();
  return Boolean(s.cnpjWsToken.trim() || s.sintegraWsToken.trim());
}

interface SintegraWsResponse {
  code?: string | number;
  status?: string;
  message?: string;
  cnpj?: string;
  ie?: string;
  uf?: string;
  situacao_cnpj?: string;
  situacao_ie?: string;
  situacao_cadastral?: string;
}

/**
 * Consulta a IE diretamente no SintegraWS (https://www.sintegraws.com.br)
 */
export async function fetchSintegraWsIe(cnpjDigits: string): Promise<InscricaoEstadual[]> {
  const { sintegraWsToken } = getApiSettings();
  if (!sintegraWsToken.trim()) return [];

  const cleanCnpj = cnpjDigits.replace(/\D/g, '');
  const url = `https://www.sintegraws.com.br/api/v1/execute-api.php?token=${encodeURIComponent(
    sintegraWsToken.trim()
  )}&cnpj=${cleanCnpj}&plugin=ST`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as SintegraWsResponse;
    const ieNum = (data.ie || '').trim();

    if (ieNum && ieNum.toUpperCase() !== 'ISENTO' && ieNum !== '0') {
      const situacao = (data.situacao_ie || data.situacao_cadastral || '').toUpperCase();
      const isAtivo =
        situacao.includes('HABILITADO') ||
        situacao.includes('ATIV') ||
        situacao === 'REGULAR' ||
        situacao === 'OK';

      return [
        {
          inscricao_estadual: ieNum,
          ativo: isAtivo,
          atualizado_em: new Date().toISOString(),
          estado: {
            sigla: (data.uf || '').toUpperCase(),
          },
        },
      ];
    }
  } catch (err) {
    console.warn('Erro ao consultar SintegraWS:', err);
  }

  return [];
}

/**
 * Testa o token da SintegraWS
 */
export async function testSintegraWsToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  if (!token.trim()) {
    return { success: false, message: 'Informe o token do SintegraWS para testar.' };
  }

  const url = `https://www.sintegraws.com.br/api/v1/execute-api.php?token=${encodeURIComponent(
    token.trim()
  )}&cnpj=53979454000112&plugin=ST`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === '0' || data.status === 'OK' || data.ie) {
      return {
        success: true,
        message: `Token validado com sucesso! Inscrição Estadual encontrada: ${data.ie} (${data.uf || 'RO'})`,
      };
    }

    if (data.code === '4' || data.message?.toLowerCase().includes('crédito') || data.message?.toLowerCase().includes('credito')) {
      return {
        success: false,
        message: `Token reconhecido pelo SintegraWS, mas sua conta está sem créditos: "${data.message}". Solicite o teste gratuito via chat no site ou ative um pacote de consultas.`,
      };
    }

    return {
      success: false,
      message: data.message || `Erro na validação do token (código ${data.code || res.status}).`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Falha na conexão com o SintegraWS.',
    };
  }
}

/**
 * Testa o token da CNPJ.ws comercial
 */
export async function testCnpjWsToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  if (!token.trim()) {
    return { success: false, message: 'Informe o token da CNPJ.ws para testar.' };
  }

  const url = `https://comercial.cnpj.ws/cnpj/53979454000112?token=${encodeURIComponent(
    token.trim()
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        'x-api-key': token.trim(),
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      return {
        success: true,
        message: 'Token comercial da CNPJ.ws validado com sucesso! Consultas completas liberadas.',
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        message: 'Token inválido ou não autorizado pela CNPJ.ws. Verifique a chave digitada.',
      };
    }

    return {
      success: false,
      message: `Erro na validação da CNPJ.ws (HTTP ${res.status}).`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Falha de conexão com a CNPJ.ws.',
    };
  }
}

