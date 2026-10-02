import type { InscricaoEstadual } from '../utils/types';

export async function fetchSefazA1Ie(
  cnpjDigits: string,
  uf?: string | null
): Promise<InscricaoEstadual[]> {
  try {
    const cleanCnpj = cnpjDigits.replace(/\D/g, '');
    const cleanUf = (uf || '').trim().toUpperCase();
    const url = `/api/sefaz/consulta-cadastro?cnpj=${cleanCnpj}${cleanUf ? `&uf=${cleanUf}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (data.success) {
      if (Array.isArray(data.allIes) && data.allIes.length > 0) {
        return data.allIes.map((item: { ie: string; uf: string; ativo: boolean }) => ({
          inscricao_estadual: String(item.ie).trim(),
          ativo: Boolean(item.ativo),
          atualizado_em: new Date().toISOString(),
          estado: {
            sigla: item.uf || cleanUf,
          },
        }));
      }
      if (data.ie) {
        return [
          {
            inscricao_estadual: String(data.ie).trim(),
            ativo: data.ativo ?? true,
            atualizado_em: new Date().toISOString(),
            estado: {
              sigla: data.uf || cleanUf,
            },
          },
        ];
      }
    }
  } catch (err) {
    // Falha silenciosa caso o serviço da SEFAZ local não esteja respondendo
    console.debug('Consulta SEFAZ A1 indisponível:', err);
  }

  return [];
}
