import { jsPDF } from 'jspdf';
import type { CnpjResponse } from './types';
import { formatCep, formatPhone, formatDateBR, formatCnpj } from './format';
import { LOGO_BASE64 } from '../assets/logoBase64';

// ── Constantes do layout ──────────────────────────────────────────────────────
const PAGE_W = 210; // A4 largura em mm
const PAGE_H = 297; // A4 altura em mm
const MARGIN = 10;
const CONTENT_W = PAGE_W - MARGIN * 2; // 190mm
const BORDER_COLOR = '#6b7280';
const LABEL_FONT_SIZE = 6.5;
const VALUE_FONT_SIZE = 9;
const HEADER_FONT_SIZE = 9;
const LINE_HEIGHT = 3.5; // mm por linha de texto
const CELL_PAD_X = 3; // padding horizontal da célula
const CELL_PAD_Y = 2; // padding vertical da célula
const ACTIVE_BG = '#f0fdf4';
const ACTIVE_COLOR = '#15803d';
const INACTIVE_BG = '#fef2f2';
const INACTIVE_COLOR = '#b91c1c';

type CellDef = {
  label: string;
  value: string;
  widthPct: number; // 0-1
  bgColor?: string;
  valueColor?: string;
  valueBold?: boolean;
};

/**
 * Gera o PDF do comprovante de CNPJ diretamente via jsPDF,
 * sem dependência de html2canvas.
 */
export function generateCnpjPdf(data: CnpjResponse): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');

  // ── Extração dos dados ──────────────────────────────────────────────────────
  const est = data.estabelecimento;

  const cnpjFormatado = est?.cnpj ? formatCnpj(est.cnpj) : '—';
  const tipo = est?.tipo ?? '';
  const dataAbertura = est?.data_inicio_atividade ? formatDateBR(est.data_inicio_atividade) : '—';
  const nomeEmpresarial = data.razao_social ?? '—';
  const nomeFantasia = est?.nome_fantasia || '—';
  const porte = data.porte?.descricao ?? '—';

  const ieList = est?.inscricoes_estaduais ?? [];
  const estUf = est?.estado?.sigla || '';
  const iePrincipal =
    ieList.find((ie) => ie.estado?.sigla === estUf) ||
    ieList.find((ie) => ie.ativo) ||
    ieList[0];
  const ieText = iePrincipal?.inscricao_estadual
    ? `${iePrincipal.inscricao_estadual} (${iePrincipal.estado?.sigla ?? ''}${!iePrincipal.ativo ? ' - Inativa' : ''})`
    : 'ISENTO';

  const cnaePrincipal = est?.atividade_principal
    ? `${est.atividade_principal.id ?? ''} - ${est.atividade_principal.descricao ?? ''}`
    : '—';

  const cnaesSecundarios = (est?.atividades_secundarias ?? [])
    .map((a) => `${a.id ?? ''} - ${a.descricao ?? ''}`.trim())
    .filter(Boolean);

  const naturezaJuridica = data.natureza_juridica
    ? `${data.natureza_juridica.id ?? ''}-${data.natureza_juridica.descricao ?? ''}`
    : '—';

  const logradouro =
    [est?.tipo_logradouro, est?.logradouro].filter(Boolean).join(' ') || '—';
  const numero = est?.numero || '—';
  const complemento = est?.complemento || '—';
  const cep = est?.cep ? formatCep(est.cep) : '—';
  const bairro = est?.bairro || '—';
  const municipio = est?.cidade?.nome || '—';
  const uf = est?.estado?.sigla || '—';
  const email = est?.email || '—';
  const telefone =
    est?.ddd1 && est?.telefone1
      ? formatPhone(`${est.ddd1}${est.telefone1}`)
      : est?.telefone1
        ? formatPhone(est.telefone1)
        : '—';

  const efr = est?.ente_federativo_responsavel || '—';
  const situacao = est?.situacao_cadastral ?? '—';
  const dataSituacao = est?.data_situacao_cadastral
    ? formatDateBR(est.data_situacao_cadastral)
    : '—';
  const motivoSituacao = est?.motivo_situacao_cadastral || '—';
  const situacaoEspecial = est?.situacao_especial || '—';
  const dataSituacaoEspecial = est?.data_situacao_especial
    ? formatDateBR(est.data_situacao_especial)
    : '—';

  const isSituacaoAtiva = (situacao || '').trim().toLowerCase() === 'ativa';

  // ── Funções auxiliares de desenho ───────────────────────────────────────────
  let cursorY = MARGIN;

  /** Quebra um texto longo em múltiplas linhas respeitando a largura máxima */
  function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, maxWidth);
  }

  /** Calcula a altura necessária para uma célula */
  function calcCellHeight(cell: CellDef): number {
    const cellW = CONTENT_W * cell.widthPct;
    const innerW = cellW - CELL_PAD_X * 2;
    const labelLines = wrapText(cell.label.toUpperCase(), innerW, LABEL_FONT_SIZE);
    const valueLines = wrapText(cell.value, innerW, VALUE_FONT_SIZE);
    return CELL_PAD_Y * 2 + labelLines.length * (LABEL_FONT_SIZE * 0.4) + 1.5 + valueLines.length * LINE_HEIGHT;
  }

  /** Verifica se precisa adicionar nova página */
  function ensureSpace(height: number) {
    if (cursorY + height > PAGE_H - MARGIN) {
      pdf.addPage();
      cursorY = MARGIN;
    }
  }


  /** Desenha uma linha vertical */
  function drawVLine(x: number, y1: number, y2: number) {
    pdf.setDrawColor(BORDER_COLOR);
    pdf.setLineWidth(0.3);
    pdf.line(x, y1, x, y2);
  }

  /** Desenha uma row de células */
  function drawRow(cells: CellDef[]) {
    // Calcula a altura máxima da row
    const rowH = Math.max(...cells.map(calcCellHeight));
    ensureSpace(rowH);

    let x = MARGIN;
    const y = cursorY;

    for (const cell of cells) {
      const cellW = CONTENT_W * cell.widthPct;
      const innerW = cellW - CELL_PAD_X * 2;

      // Background
      if (cell.bgColor) {
        pdf.setFillColor(cell.bgColor);
        pdf.rect(x, y, cellW, rowH, 'F');
      }

      // Bordas
      pdf.setDrawColor(BORDER_COLOR);
      pdf.setLineWidth(0.3);
      pdf.rect(x, y, cellW, rowH, 'S');

      // Label
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(LABEL_FONT_SIZE);
      pdf.setTextColor('#1c1c1e');
      const labelLines = wrapText(cell.label.toUpperCase(), innerW, LABEL_FONT_SIZE);
      let textY = y + CELL_PAD_Y + LABEL_FONT_SIZE * 0.35;
      for (const line of labelLines) {
        pdf.text(line, x + CELL_PAD_X, textY);
        textY += LABEL_FONT_SIZE * 0.4;
      }

      // Espaço entre label e valor
      textY += 1;

      // Value
      pdf.setFont('Helvetica', cell.valueBold ? 'bold' : 'normal');
      pdf.setFontSize(VALUE_FONT_SIZE);
      pdf.setTextColor(cell.valueColor || '#000000');
      const valueLines = wrapText(cell.value, innerW, VALUE_FONT_SIZE);
      for (const line of valueLines) {
        pdf.text(line, x + CELL_PAD_X, textY);
        textY += LINE_HEIGHT;
      }

      x += cellW;
    }

    cursorY += rowH;
  }

  // ── Desenho do cabeçalho ────────────────────────────────────────────────────

  // Cabeçalho com 3 colunas: CNPJ (26%) | Logo+Título (54%) | Data Abertura (20%)
  const headerH = 28;
  ensureSpace(headerH);

  const col1W = CONTENT_W * 0.26;
  const col2W = CONTENT_W * 0.54;
  const col3W = CONTENT_W * 0.20;

  // Bordas do cabeçalho
  pdf.setDrawColor(BORDER_COLOR);
  pdf.setLineWidth(0.3);
  pdf.rect(MARGIN, cursorY, CONTENT_W, headerH, 'S');
  drawVLine(MARGIN + col1W, cursorY, cursorY + headerH);
  drawVLine(MARGIN + col1W + col2W, cursorY, cursorY + headerH);

  // Col 1 – CNPJ
  const col1X = MARGIN;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(LABEL_FONT_SIZE);
  pdf.setTextColor('#1c1c1e');
  pdf.text('CNPJ', col1X + col1W / 2, cursorY + CELL_PAD_Y + LABEL_FONT_SIZE * 0.35, { align: 'center' });

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(VALUE_FONT_SIZE);
  pdf.setTextColor('#000000');
  pdf.text(cnpjFormatado, col1X + col1W / 2, cursorY + 12, { align: 'center' });

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(VALUE_FONT_SIZE);
  pdf.text(tipo, col1X + col1W / 2, cursorY + 17, { align: 'center' });

  // Col 2 – Logo + Título
  const col2X = MARGIN + col1W;
  try {
    // Logo centralizado
    const logoW = 30;
    const logoH = 10;
    const logoX = col2X + (col2W - logoW) / 2;
    pdf.addImage(LOGO_BASE64, 'JPEG', logoX, cursorY + 2.5, logoW, logoH);
  } catch {
    // Se a logo falhar, ignora
  }

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(HEADER_FONT_SIZE);
  pdf.setTextColor('#000000');
  pdf.text('COMPROVANTE DE INSCRIÇÃO E DE SITUAÇÃO', col2X + col2W / 2, cursorY + 17, { align: 'center' });
  pdf.text('CADASTRAL', col2X + col2W / 2, cursorY + 21.5, { align: 'center' });

  // Col 3 – Data de Abertura
  const col3X = MARGIN + col1W + col2W;
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(LABEL_FONT_SIZE);
  pdf.setTextColor('#1c1c1e');
  pdf.text('DATA DE ABERTURA', col3X + col3W / 2, cursorY + CELL_PAD_Y + LABEL_FONT_SIZE * 0.35, { align: 'center' });

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(VALUE_FONT_SIZE);
  pdf.setTextColor('#000000');
  pdf.text(dataAbertura, col3X + col3W / 2, cursorY + 12, { align: 'center' });

  cursorY += headerH;

  // ── Corpo do comprovante ────────────────────────────────────────────────────

  // Nome Empresarial
  drawRow([{ label: 'Nome Empresarial', value: nomeEmpresarial, widthPct: 1 }]);

  // Nome Fantasia + Porte
  drawRow([
    { label: 'Título do Estabelecimento (Nome de Fantasia)', value: nomeFantasia, widthPct: 0.82 },
    { label: 'Porte', value: porte, widthPct: 0.18 },
  ]);

  // Inscrição Estadual
  drawRow([{ label: 'Inscrição Estadual', value: ieText, widthPct: 1, valueBold: true }]);

  // CNAE Principal
  drawRow([
    { label: 'Código e Descrição da Atividade Econômica Principal', value: cnaePrincipal, widthPct: 1 },
  ]);

  // CNAEs Secundários
  const cnaesText = cnaesSecundarios.length > 0 ? cnaesSecundarios.join('\n') : '—';
  drawRow([
    {
      label: 'Código e Descrição das Atividades Econômicas Secundárias',
      value: cnaesText,
      widthPct: 1,
    },
  ]);

  // Natureza Jurídica
  drawRow([
    { label: 'Código e Descrição da Natureza Jurídica', value: naturezaJuridica, widthPct: 1 },
  ]);

  // Endereço
  drawRow([
    { label: 'Logradouro', value: logradouro, widthPct: 0.60 },
    { label: 'Número', value: numero, widthPct: 0.18 },
    { label: 'Complemento', value: complemento, widthPct: 0.22 },
  ]);

  // CEP / Bairro / Município / UF
  drawRow([
    { label: 'CEP', value: cep, widthPct: 0.18 },
    { label: 'Bairro/Distrito', value: bairro, widthPct: 0.32 },
    { label: 'Município', value: municipio, widthPct: 0.42 },
    { label: 'UF', value: uf, widthPct: 0.08 },
  ]);

  // Email / Telefone
  drawRow([
    { label: 'E-mail', value: email, widthPct: 0.65 },
    { label: 'Telefone', value: telefone, widthPct: 0.35 },
  ]);

  // EFR
  drawRow([
    { label: 'Ente Federativo Responsável (EFR)', value: efr, widthPct: 1 },
  ]);

  // Situação Cadastral + Data
  drawRow([
    {
      label: 'Situação Cadastral',
      value: situacao,
      widthPct: 0.75,
      bgColor: isSituacaoAtiva ? ACTIVE_BG : INACTIVE_BG,
      valueColor: isSituacaoAtiva ? ACTIVE_COLOR : INACTIVE_COLOR,
      valueBold: true,
    },
    { label: 'Data da Situação Cadastral', value: dataSituacao, widthPct: 0.25 },
  ]);

  // Motivo de Situação Cadastral
  drawRow([{ label: 'Motivo de Situação Cadastral', value: motivoSituacao, widthPct: 1 }]);

  // Situação Especial + Data
  drawRow([
    { label: 'Situação Especial', value: situacaoEspecial, widthPct: 0.75 },
    { label: 'Data da Situação Especial', value: dataSituacaoEspecial, widthPct: 0.25 },
  ]);

  return pdf;
}
