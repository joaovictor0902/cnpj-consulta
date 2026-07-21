import type { CnpjResponse } from '../utils/types';

const BASE_URL = 'https://publica.cnpj.ws/cnpj';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchCnpj(cnpjDigits: string, signal?: AbortSignal): Promise<CnpjResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${cnpjDigits}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Falha de rede. Verifique sua conexão e tente novamente.');
  }

  if (!response.ok) {
    if (response.status === 400) {
      throw new ApiError('CNPJ inválido. Verifique os dígitos informados.', 400);
    }
    if (response.status === 404) {
      throw new ApiError('CNPJ não encontrado na base de dados.', 404);
    }
    if (response.status === 429) {
      throw new ApiError('Limite de consultas atingido (3 por minuto). Aguarde alguns instantes e tente novamente.', 429);
    }
    if (response.status >= 500) {
      throw new ApiError('O serviço de consulta está indisponível no momento. Tente novamente mais tarde.', response.status);
    }
    throw new ApiError(`Erro inesperado na consulta (HTTP ${response.status}).`, response.status);
  }

  try {
    return (await response.json()) as CnpjResponse;
  } catch {
    throw new ApiError('A resposta do serviço veio em formato inesperado.');
  }
}
