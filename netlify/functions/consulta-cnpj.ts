import type { Context, Config } from '@netlify/functions';

function mapMinhaReceitaToCnpjResponse(d: Record<string, any>) {
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

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}, timeoutMs = 4000): Promise<Response> {
  return fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export default async (req: Request, _context: Context) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(req.url);
  const cnpjDigits = (url.searchParams.get('cnpj') || '').replace(/\D/g, '');
  const token = url.searchParams.get('token') || req.headers.get('x-api-key') || '';

  if (!cnpjDigits || cnpjDigits.length !== 14) {
    return new Response(
      JSON.stringify({ error: 'CNPJ inválido. Verifique os dígitos informados.' }),
      { status: 400, headers }
    );
  }

  // 1. Tenta CNPJ.ws (comercial se houver token, ou pública)
  try {
    const wsUrl = token.trim()
      ? `https://comercial.cnpj.ws/cnpj/${cnpjDigits}?token=${encodeURIComponent(token.trim())}`
      : `https://publica.cnpj.ws/cnpj/${cnpjDigits}`;

    const wsHeaders: Record<string, string> = { Accept: 'application/json' };
    if (token.trim()) wsHeaders['x-api-key'] = token.trim();

    const wsRes = await fetchWithTimeout(wsUrl, wsHeaders, 3500);

    if (wsRes.ok) {
      const data = await wsRes.json();
      data._provedorOrigem = 'cnpj_ws';
      if (token.trim()) data._ieOrigem = 'comercial';
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    if (wsRes.status === 404) {
      return new Response(JSON.stringify({ error: 'CNPJ não encontrado na base de dados.' }), {
        status: 404,
        headers,
      });
    }

    console.warn(`[consulta-cnpj] CNPJ.ws retornou status ${wsRes.status}. Acionando contingência...`);
  } catch (err) {
    console.warn('[consulta-cnpj] Falha ao conectar na CNPJ.ws (timeout/erro):', err);
  }

  // 2. Contingência 1: Minha Receita
  try {
    const mrRes = await fetchWithTimeout(`https://minhareceita.org/${cnpjDigits}`, { Accept: 'application/json' }, 5000);
    if (mrRes.ok) {
      const mrData = await mrRes.json();
      const mapped = mapMinhaReceitaToCnpjResponse(mrData);
      return new Response(JSON.stringify(mapped), { status: 200, headers });
    }
    if (mrRes.status === 404) {
      return new Response(JSON.stringify({ error: 'CNPJ não encontrado na base de dados.' }), {
        status: 404,
        headers,
      });
    }
    console.warn(`[consulta-cnpj] Minha Receita retornou ${mrRes.status}. Acionando BrasilAPI...`);
  } catch (err) {
    console.warn('[consulta-cnpj] Falha ao conectar em Minha Receita:', err);
  }

  // 3. Contingência 2: BrasilAPI
  try {
    const brRes = await fetchWithTimeout(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`,
      { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      5000
    );
    if (brRes.ok) {
      const brData = await brRes.json();
      const mapped = mapMinhaReceitaToCnpjResponse(brData);
      mapped._provedorOrigem = 'brasilapi';
      return new Response(JSON.stringify(mapped), { status: 200, headers });
    }
    if (brRes.status === 404) {
      return new Response(JSON.stringify({ error: 'CNPJ não encontrado na base de dados.' }), {
        status: 404,
        headers,
      });
    }
  } catch (err) {
    console.warn('[consulta-cnpj] Falha ao conectar na BrasilAPI:', err);
  }

  return new Response(
    JSON.stringify({
      error: 'Não foi possível consultar o CNPJ. Os servidores externos estão temporariamente indisponíveis.',
    }),
    { status: 503, headers }
  );
};

export const config: Config = {
  path: '/api/consulta-cnpj',
};
