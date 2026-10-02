import { getStore } from '@netlify/blobs';
import type { Context, Config } from '@netlify/functions';

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const cnpj = (url.searchParams.get('cnpj') || '').replace(/\D/g, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const store = getStore('inscricoes-estaduais');

    // ── BUSCA (GET) ──
    if (req.method === 'GET') {
      if (!cnpj) {
        return new Response(
          JSON.stringify({ found: false, message: 'CNPJ é obrigatório' }),
          { status: 400, headers }
        );
      }

      const item = await store.get(cnpj, { type: 'json' });
      if (item) {
        return new Response(JSON.stringify({ found: true, data: item }), {
          status: 200,
          headers,
        });
      }
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers,
      });
    }

    // ── SALVAR / ATUALIZAR (POST) ──
    if (req.method === 'POST') {
      const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const bodyCnpj = String(payload.cnpj || cnpj).replace(/\D/g, '');
      const ie = String(payload.ie || '').trim();
      const uf = String(payload.uf || '').trim().toUpperCase();
      const ativo = payload.ativo !== undefined ? Boolean(payload.ativo) : true;

      if (!bodyCnpj || !ie) {
        return new Response(
          JSON.stringify({ success: false, message: 'CNPJ e IE são obrigatórios' }),
          { status: 400, headers }
        );
      }

      const record = {
        cnpj: bodyCnpj,
        ie,
        uf,
        ativo,
        updatedAt: new Date().toISOString(),
      };

      await store.setJSON(bodyCnpj, record);

      return new Response(JSON.stringify({ success: true, data: record }), {
        status: 200,
        headers,
      });
    }

    // ── EXCLUIR / RESTAURAR ORIGINAL (DELETE) ──
    if (req.method === 'DELETE') {
      if (!cnpj) {
        return new Response(
          JSON.stringify({ success: false, message: 'CNPJ é obrigatório' }),
          { status: 400, headers }
        );
      }

      await store.delete(cnpj);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ message: 'Método não permitido' }), {
      status: 405,
      headers,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Netlify Blobs Error]:', errorMsg);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers }
    );
  }
};

export const config: Config = {
  path: '/api/ie-customizada',
};
