export type StateSintegraInfo = {
  nome: string;
  url: string;
  portalName: string;
};

export const SINTEGRA_STATE_LINKS: Record<string, StateSintegraInfo> = {
  AC: {
    nome: 'Acre',
    url: 'http://sefaznet.ac.gov.br/sintegra/',
    portalName: 'SEFAZ-AC (Sintegra)',
  },
  AL: {
    nome: 'Alagoas',
    url: 'http://sintegra.sefaz.al.gov.br/',
    portalName: 'SEFAZ-AL (Sintegra)',
  },
  AP: {
    nome: 'Amapá',
    url: 'https://www.sefaz.ap.gov.br/sica/',
    portalName: 'SEFAZ-AP (SICA)',
  },
  AM: {
    nome: 'Amazonas',
    url: 'https://online.sefaz.am.gov.br/sintegra/',
    portalName: 'SEFAZ-AM (Sintegra)',
  },
  BA: {
    nome: 'Bahia',
    url: 'http://www.sefaz.ba.gov.br/scripts/cadastro/cadastroBa/consultaBa.asp',
    portalName: 'SEFAZ-BA (Cadastro)',
  },
  CE: {
    nome: 'Ceará',
    url: 'https://sintegra.sefaz.ce.gov.br/',
    portalName: 'SEFAZ-CE (Sintegra)',
  },
  DF: {
    nome: 'Distrito Federal',
    url: 'https://ww1.receita.fazenda.df.gov.br/sintegra/',
    portalName: 'Receita-DF (Sintegra)',
  },
  ES: {
    nome: 'Espírito Santo',
    url: 'https://internet.sefaz.es.gov.br/informacoes/sintegra/',
    portalName: 'SEFAZ-ES (Sintegra)',
  },
  GO: {
    nome: 'Goiás',
    url: 'http://aplicacao.sefaz.go.gov.br/sintegra/',
    portalName: 'SEFAZ-GO (Sintegra)',
  },
  MA: {
    nome: 'Maranhão',
    url: 'https://sistemas1.sefaz.ma.gov.br/sintegra/',
    portalName: 'SEFAZ-MA (Sintegra)',
  },
  MT: {
    nome: 'Mato Grosso',
    url: 'https://www.sefaz.mt.gov.br/sintegra/',
    portalName: 'SEFAZ-MT (Sintegra)',
  },
  MS: {
    nome: 'Mato Grosso do Sul',
    url: 'http://www.sintegra.ms.gov.br/',
    portalName: 'SEFAZ-MS (Sintegra)',
  },
  MG: {
    nome: 'Minas Gerais',
    url: 'https://dfe-portal.fazenda.mg.gov.br/sintegra/',
    portalName: 'SEF-MG (Sintegra)',
  },
  PA: {
    nome: 'Pará',
    url: 'https://app.sefa.pa.gov.br/sintegra/',
    portalName: 'SEFA-PA (Sintegra)',
  },
  PB: {
    nome: 'Paraíba',
    url: 'https://www.sefaz.pb.gov.br/sintegra/',
    portalName: 'SEFAZ-PB (Sintegra)',
  },
  PR: {
    nome: 'Paraná',
    url: 'http://www.sintegra.fazenda.pr.gov.br/sintegra/',
    portalName: 'Sintegra-PR',
  },
  PE: {
    nome: 'Pernambuco',
    url: 'https://www.sefaz.pe.gov.br/sintegra/',
    portalName: 'SEFAZ-PE (Sintegra)',
  },
  PI: {
    nome: 'Piauí',
    url: 'https://web.sefaz.pi.gov.br/sintegra/',
    portalName: 'SEFAZ-PI (Sintegra)',
  },
  RJ: {
    nome: 'Rio de Janeiro',
    url: 'http://www.fazenda.rj.gov.br/sintegra/',
    portalName: 'SEFAZ-RJ (Sintegra)',
  },
  RN: {
    nome: 'Rio Grande do Norte',
    url: 'https://uvt.set.rn.gov.br/#/services/sintegra',
    portalName: 'SET-RN (UVT)',
  },
  RS: {
    nome: 'Rio Grande do Sul',
    url: 'https://www.sefaz.rs.gov.br/consultas/sintegra',
    portalName: 'Receita Estadual-RS',
  },
  RO: {
    nome: 'Rondônia',
    url: 'https://portalcontribuinte.sefin.ro.gov.br/Publico/parametropublica.jsp',
    portalName: 'SEFIN-RO (REDESIM / Sintegra)',
  },
  RR: {
    nome: 'Roraima',
    url: 'https://sintegra.sefaz.rr.gov.br/',
    portalName: 'SEFAZ-RR (Sintegra)',
  },
  SC: {
    nome: 'Santa Catarina',
    url: 'https://sat.sef.sc.gov.br/tax.net/sat.sintegra.web/',
    portalName: 'SEF-SC (SAT Sintegra)',
  },
  SP: {
    nome: 'São Paulo',
    url: 'https://www.cadesp.fazenda.sp.gov.br/',
    portalName: 'SEFAZ-SP (CADESP)',
  },
  SE: {
    nome: 'Sergipe',
    url: 'https://security.sefaz.se.gov.br/sintegra/',
    portalName: 'SEFAZ-SE (Sintegra)',
  },
  TO: {
    nome: 'Tocantins',
    url: 'http://sintegra.sefaz.to.gov.br/',
    portalName: 'SEFAZ-TO (Sintegra)',
  },
};

export const SINTEGRA_NACIONAL_URL = 'https://www.sintegra.gov.br/';
export const CCC_NACIONAL_URL = 'https://dfe-portal.svrs.rs.gov.br/NFE/CCC';

export function getSintegraInfo(uf?: string | null): StateSintegraInfo {
  const cleanUf = (uf || '').trim().toUpperCase();
  if (cleanUf && SINTEGRA_STATE_LINKS[cleanUf]) {
    return SINTEGRA_STATE_LINKS[cleanUf];
  }
  return {
    nome: 'Nacional',
    url: SINTEGRA_NACIONAL_URL,
    portalName: 'Sintegra Nacional',
  };
}

export const SINTEGRA_PR_URL = 'http://www.sintegra.fazenda.pr.gov.br/sintegra/';

/**
 * Copia o texto para a área de transferência com fallback para navegadores antigos/permissões restritas
 */
export function copyCnpjToClipboard(cnpjDigits: string): boolean {
  const cleanCnpj = cnpjDigits.replace(/\D/g, '');
  if (!cleanCnpj) return false;

  let copied = false;
  try {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanCnpj).catch(() => {});
      copied = true;
    }
  } catch {
    // fallback abaixo
  }

  if (!copied && typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = cleanCnpj;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      copied = false;
    }
  }

  return copied;
}

/**
 * Redireciona o usuário para o Sintegra-PR abrindo em nova aba e copiando o CNPJ para a área de transferência
 */
export function redirectToSintegraPr(cnpjDigits: string): { opened: boolean; copied: boolean } {
  const copied = copyCnpjToClipboard(cnpjDigits);

  let opened = false;
  try {
    const win = window.open(SINTEGRA_PR_URL, '_blank');
    if (win && !win.closed && typeof win.closed !== 'undefined') {
      opened = true;
    } else if (win) {
      opened = true;
    }
  } catch {
    opened = false;
  }

  return { opened, copied };
}

