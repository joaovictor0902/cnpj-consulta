import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import https from 'https';
import type { IncomingMessage, ServerResponse } from 'http';

const SEFAZ_WS_URLS: Record<string, string> = {
  // SVRS (SEFAZ Virtual RS atende 14 estados)
  AC: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  AL: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  AP: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  DF: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  ES: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  PB: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  PI: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  RJ: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  RN: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  RO: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  RR: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  SC: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  SE: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  TO: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  MA: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',

  // Estados com servidores próprios
  AM: 'https://nfe.sefaz.am.gov.br/services2/services/CadConsultaCadastro4',
  BA: 'https://nfe.sefaz.ba.gov.br/webservices/CadConsultaCadastro4/CadConsultaCadastro4.asmx',
  CE: 'https://nfe.sefaz.ce.gov.br/nfe4/services/CadConsultaCadastro4',
  GO: 'https://nfe.sefaz.go.gov.br/nfe/services/CadConsultaCadastro4',
  MG: 'https://nfe.fazenda.mg.gov.br/nfe2/services/CadConsultaCadastro4',
  MS: 'https://nfe.sefaz.ms.gov.br/ws/CadConsultaCadastro4',
  MT: 'https://cad.sefaz.mt.gov.br/nfe2/services/CadConsultaCadastro4',
  PA: 'https://nfe.sefa.pa.gov.br/services4/CadConsultaCadastro4',
  PE: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/CadConsultaCadastro4',
  PR: 'https://nfe.sefa.pr.gov.br/nfe/CadConsultaCadastro4',
  RS: 'https://cad.svrs.rs.gov.br/ws/cadconsultacadastro/cadconsultacadastro4.asmx',
  SP: 'https://nfe.fazenda.sp.gov.br/ws/cadconsultacadastro4.asmx',
};

function getCertInfo(projectRoot: string) {
  const certDir = path.join(projectRoot, 'certificado-a1');
  if (!fs.existsSync(certDir)) {
    return null;
  }
  const files = fs.readdirSync(certDir);
  const certFile = files.find((f: string) => f.endsWith('.pfx') || f.endsWith('.p12'));
  if (!certFile) {
    return null;
  }

  const filePath = path.join(certDir, certFile);
  const pfxBuffer = fs.readFileSync(filePath);

  // Determina a senha: env, ou número no nome do arquivo, ou padrão
  let passphrase = process.env.CERT_PASSWORD || process.env.SEFAZ_A1_PASSWORD;
  if (!passphrase) {
    const match = certFile.match(/\b(\d{4,8})\b/);
    passphrase = match ? match[1] : '12345678';
  }

  return {
    filename: certFile,
    filePath,
    pfxBuffer,
    passphrase,
  };
}

function getSavedIesFilePath(projectRoot: string) {
  const dir = path.join(projectRoot, 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'inscricoes_salvas.json');
}

function loadSavedIes(projectRoot: string): Record<string, { cnpj: string; ie: string; uf?: string; ativo?: boolean; updatedAt?: string }> {
  const filePath = getSavedIesFilePath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error('Erro ao ler inscricoes_salvas.json:', err);
    return {};
  }
}

function saveSavedIes(projectRoot: string, data: Record<string, any>) {
  const filePath = getSavedIesFilePath(projectRoot);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function createApiMiddleware(projectRoot: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '', `http://${host}`);

    // --- API DE INSCRIÇÃO ESTADUAL PERSONALIZADA / COMPARTILHADA ---
    if (url.pathname === '/api/ie-customizada') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (req.method === 'GET') {
        const cnpj = (url.searchParams.get('cnpj') || '').replace(/\D/g, '');
        if (!cnpj) {
          res.statusCode = 400;
          res.end(JSON.stringify({ found: false, message: 'CNPJ obrigatório' }));
          return;
        }
        const store = loadSavedIes(projectRoot);
        const item = store[cnpj];
        if (item) {
          res.end(JSON.stringify({ found: true, data: item }));
        } else {
          res.end(JSON.stringify({ found: false }));
        }
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: Buffer | string) => { body += chunk; });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const cnpj = String(payload.cnpj || '').replace(/\D/g, '');
            const ie = String(payload.ie || '').trim();
            const uf = String(payload.uf || '').trim().toUpperCase();
            const ativo = payload.ativo !== undefined ? Boolean(payload.ativo) : true;

            if (!cnpj || !ie) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: 'CNPJ e IE são obrigatórios' }));
              return;
            }

            const store = loadSavedIes(projectRoot);
            store[cnpj] = {
              cnpj,
              ie,
              uf,
              ativo,
              updatedAt: new Date().toISOString(),
            };
            saveSavedIes(projectRoot, store);

            res.end(JSON.stringify({ success: true, data: store[cnpj] }));
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, message: errorMsg }));
          }
        });
        return;
      }

      if (req.method === 'DELETE') {
        const cnpj = (url.searchParams.get('cnpj') || '').replace(/\D/g, '');
        if (!cnpj) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, message: 'CNPJ obrigatório' }));
          return;
        }
        const store = loadSavedIes(projectRoot);
        if (store[cnpj]) {
          delete store[cnpj];
          saveSavedIes(projectRoot, store);
        }
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }

    if (url.pathname === '/api/sefaz/status') {
      const cert = getCertInfo(projectRoot);
      res.setHeader('Content-Type', 'application/json');
      if (!cert) {
        res.end(JSON.stringify({ hasCert: false, message: 'Nenhum certificado A1 na pasta certificado-a1' }));
        return;
      }
      res.end(JSON.stringify({ hasCert: true, filename: cert.filename }));
      return;
    }

        if (url.pathname === '/api/sefaz/consulta-cadastro') {
          const cnpj = (url.searchParams.get('cnpj') || '').replace(/\D/g, '');
          const uf = (url.searchParams.get('uf') || '').trim().toUpperCase();

          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (!cnpj || cnpj.length !== 14) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, message: 'CNPJ inválido' }));
            return;
          }

          if (!uf || !SEFAZ_WS_URLS[uf]) {
            res.statusCode = 400;
            res.end(JSON.stringify({ success: false, message: `UF não suportada ou não informada: ${uf}` }));
            return;
          }

          const cert = getCertInfo(projectRoot);
          if (!cert) {
            res.statusCode = 404;
            res.end(JSON.stringify({
              success: false,
              message: 'Nenhum certificado digital A1 (.pfx) encontrado na pasta certificado-a1',
            }));
            return;
          }

          const wsUrl = SEFAZ_WS_URLS[uf];
          const consCadXml = `<ConsCad versao="2.00" xmlns="http://www.portalfiscal.inf.br/nfe"><infCons><xServ>CONS-CAD</xServ><UF>${uf}</UF><CNPJ>${cnpj}</CNPJ></infCons></ConsCad>`;
          const soapXml = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/CadConsultaCadastro4">${consCadXml}</nfeDadosMsg></soap12:Body></soap12:Envelope>`;

          try {
            const soapResponse = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
              const parsedUrl = new URL(wsUrl);
              const request = https.request(
                {
                  hostname: parsedUrl.hostname,
                  port: parsedUrl.port || 443,
                  path: parsedUrl.pathname + parsedUrl.search,
                  method: 'POST',
                  pfx: cert.pfxBuffer,
                  passphrase: cert.passphrase,
                  rejectUnauthorized: false,
                  timeout: 10000,
                  headers: {
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                    'Content-Length': Buffer.byteLength(soapXml),
                  },
                },
                (response: IncomingMessage) => {
                  let body = '';
                  response.on('data', (chunk: Buffer | string) => {
                    body += chunk;
                  });
                  response.on('end', () => {
                    resolve({ statusCode: response.statusCode || 200, body });
                  });
                }
              );

              request.on('timeout', () => {
                request.destroy(new Error('Timeout de 10s na conexão com a SEFAZ'));
              });

              request.on('error', (err: Error) => {
                reject(err);
              });

              request.write(soapXml);
              request.end();
            });

            // Parse response
            const body = soapResponse.body;
            const cStatMatch = body.match(/<cStat>(\d+)<\/cStat>/);
            const xMotivoMatch = body.match(/<xMotivo>([^<]+)<\/xMotivo>/);
            const cStat = cStatMatch ? cStatMatch[1] : null;
            const xMotivo = xMotivoMatch ? xMotivoMatch[1] : 'Sem resposta';

            // cStat 111: Consulta cadastro com uma ocorrência
            // cStat 112: Consulta cadastro com mais de uma ocorrência
            if (cStat === '111' || cStat === '112') {
              const infCads: Array<{ ie: string; uf: string; ativo: boolean }> = [];
              const infCadRegex = /<infCad>([\s\S]*?)<\/infCad>/g;
              let match;
              while ((match = infCadRegex.exec(body)) !== null) {
                const block = match[1];
                const ieM = block.match(/<IE>([^<]+)<\/IE>/);
                const cSitM = block.match(/<cSit>([^<]+)<\/cSit>/);
                const ufM = block.match(/<UF>([^<]+)<\/UF>/);
                if (ieM) {
                  infCads.push({
                    ie: ieM[1].trim(),
                    uf: ufM ? ufM[1].trim() : uf,
                    ativo: cSitM ? cSitM[1].trim() === '1' : true,
                  });
                }
              }

              if (infCads.length > 0) {
                const preferred = infCads.find(c => c.ativo) || infCads[0];
                res.end(
                  JSON.stringify({
                    success: true,
                    ie: preferred.ie,
                    uf: preferred.uf,
                    ativo: preferred.ativo,
                    allIes: infCads,
                    cStat,
                    xMotivo,
                  })
                );
                return;
              }
            }

            res.end(
              JSON.stringify({
                success: false,
                cStat,
                xMotivo,
                message: xMotivo,
              })
            );
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error('[SEFAZ A1 Middleware Error]:', errorMsg);
            res.statusCode = 502;
            res.end(
              JSON.stringify({
                success: false,
                error: errorMsg,
                message: `Falha na comunicação com a SEFAZ (${errorMsg})`,
              })
            );
          }
          return;
        }

        next();
      };
    }

    export function sefazA1Plugin(): Plugin {
      let projectRoot = process.cwd();

      return {
        name: 'vite-plugin-sefaz-a1',
        configResolved(config) {
          projectRoot = config.root;
        },
        configureServer(server) {
          server.middlewares.use(createApiMiddleware(projectRoot));
        },
        configurePreviewServer(server) {
          server.middlewares.use(createApiMiddleware(projectRoot));
        },
      };
    }
