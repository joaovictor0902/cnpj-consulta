import { useState } from 'react';
import type { CnpjResponse, InscricaoEstadual } from '../utils/types';
import { formatCep, formatPhone, formatDateBR, formatCnpj } from '../utils/format';
import { CopyIcon, CheckIcon, EditIcon, ExternalLinkIcon } from './Icons';
import { getPrincipalInscricaoEstadual } from '../utils/inscricaoEstadual';
import { copyCnpjToClipboard } from '../utils/sintegraLinks';

import { LOGO_BASE64 } from '../assets/logoBase64';

type SummaryCardProps = {
  data: CnpjResponse;
  customIeText?: string | null;
  onIeChange?: (ieText: string | null) => void;
};

// Componente de célula base - usa apenas border-right e border-bottom
// O container externo fornece border-top e border-left
function Cell({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-r border-b border-gray-400 px-2.5 py-1.5 min-w-0 shrink-0 ${className}`}
      style={{ borderColor: '#6b7280', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
    >
      <p
        className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1 break-words overflow-hidden"
        style={{ color: '#1c1c1e', wordBreak: 'break-word' }}
      >
        {label}
      </p>
      <div className="text-[14.5px] leading-snug break-words overflow-hidden" style={{ color: '#000000', wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex w-full min-w-0 ${className}`} style={{ boxSizing: 'border-box' }}>
      {children}
    </div>
  );
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copiado!' : label}
      data-html2canvas-ignore="true"
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all cursor-pointer border shrink-0 ${
        copied 
          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' 
          : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-400 hover:text-gray-600'
      } print:hidden`}
    >
      {copied ? (
        <CheckIcon className="w-3 h-3" />
      ) : (
        <CopyIcon className="w-3 h-3" />
      )}
    </button>
  );
}

export function SummaryCard({ data, customIeText, onIeChange }: SummaryCardProps) {
  const [isEditingIe, setIsEditingIe] = useState(false);
  const [tempIeInput, setTempIeInput] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const est = data.estabelecimento;

  const cnpjFormatado = est?.cnpj ? formatCnpj(est.cnpj) : '—';
  const tipo = est?.tipo ?? '';
  const dataAbertura = est?.data_inicio_atividade ? formatDateBR(est.data_inicio_atividade) : '—';
  const nomeEmpresarial = data.razao_social ?? '—';
  const nomeFantasia = est?.nome_fantasia || '';
  const porte = data.porte?.descricao ?? '—';
  const ieList = est?.inscricoes_estaduais ?? [];
  const estUf = est?.estado?.sigla || '';
  const estId = est?.estado?.id;
  const iePrincipal = getPrincipalInscricaoEstadual(ieList, estUf, estId);
  const isParana = (estUf || '').trim().toUpperCase() === 'PR';

  // Outras inscrições estaduais válidas diferentes da principal
  const otherIes: InscricaoEstadual[] = ieList.filter(
    (ie) => Boolean(ie.inscricao_estadual) && ie.inscricao_estadual !== iePrincipal?.inscricao_estadual
  );

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
  const numero = est?.numero || '';
  const complemento = est?.complemento || '';
  const cep = est?.cep ? formatCep(est.cep) : '—';
  const bairro = est?.bairro || '';
  const municipio = est?.cidade?.nome || '';
  const uf = est?.estado?.sigla || '';
  const email = est?.email || '';
  const telefone =
    est?.ddd1 && est?.telefone1
      ? formatPhone(`${est.ddd1}${est.telefone1}`)
      : est?.telefone1
        ? formatPhone(est.telefone1)
        : '';

  const efr = est?.ente_federativo_responsavel || '';
  const situacao = est?.situacao_cadastral ?? '—';
  const dataSituacao = est?.data_situacao_cadastral
    ? formatDateBR(est.data_situacao_cadastral)
    : '—';
  const motivoSituacao = est?.motivo_situacao_cadastral || '';
  const situacaoEspecial = est?.situacao_especial || '';
  const dataSituacaoEspecial = est?.data_situacao_especial
    ? formatDateBR(est.data_situacao_especial)
    : '';

  const isSituacaoAtiva = (situacao || '').trim().toLowerCase() === 'ativa';

  return (
    <section
      id="comprovante-cnpj"
      aria-labelledby="comprovante-title"
      className="border-t border-l border-gray-400 bg-white font-sans w-full overflow-hidden"
      style={{ borderColor: '#6b7280', backgroundColor: '#ffffff', boxShadow: 'none', boxSizing: 'border-box' }}
    >
      {/* ── CABEÇALHO ── */}
      <Row>
        {/* NÚMERO DE INSCRIÇÃO (CNPJ) */}
        <div
          className="border-r border-b border-gray-400 px-2.5 py-2 w-[26%] shrink-0 min-w-0 flex flex-col justify-center text-center"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1 break-words"
            style={{ color: '#1c1c1e' }}
          >
            CNPJ
          </p>
          <div className="flex items-center justify-center gap-1.5 flex-wrap min-w-0">
            <p className="text-[15px] font-bold leading-snug break-all" style={{ color: '#000000' }}>
              {cnpjFormatado}
            </p>
            {cnpjFormatado !== '—' && (
              <CopyButton text={cnpjFormatado} label="Copiar CNPJ" />
            )}
          </div>
          <p className="text-[13.5px] leading-snug break-words font-medium" style={{ color: '#000000' }}>{tipo}</p>
        </div>

        {/* TÍTULO CENTRAL */}
        <div
          className="border-r border-b border-gray-400 flex-1 min-w-0 flex flex-col items-center justify-center gap-2 px-4 py-2 w-[54%]"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
        >
          <img
            src={LOGO_BASE64}
            alt="ATOPY"
            className="h-9 w-auto object-contain shrink-0"
            style={{ height: '36px', maxHeight: '36px', width: 'auto', objectFit: 'contain' }}
            height={36}
          />
          <h1
            id="comprovante-title"
            className="text-[14.5px] font-bold uppercase text-center leading-tight tracking-wide break-words"
            style={{ color: '#000000' }}
          >
            Comprovante de Inscrição e de Situação<br />Cadastral
          </h1>
        </div>

        {/* DATA DE ABERTURA */}
        <div
          className="border-r border-b border-gray-400 px-2.5 py-2 w-[20%] shrink-0 min-w-0 flex flex-col justify-center text-center"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1 break-words"
            style={{ color: '#1c1c1e' }}
          >
            Data de Abertura
          </p>
          <p className="text-[15px] font-semibold leading-snug break-words" style={{ color: '#000000' }}>
            {dataAbertura}
          </p>
        </div>
      </Row>

      {/* ── NOME EMPRESARIAL ── */}
      <Row>
        <Cell label="Nome Empresarial" className="w-full">
          {nomeEmpresarial !== '—' ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{nomeEmpresarial}</span>
              <CopyButton text={nomeEmpresarial} label="Copiar Nome Empresarial" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
      </Row>

      {/* ── NOME FANTASIA + PORTE ── */}
      <Row>
        <Cell label="Título do Estabelecimento (Nome de Fantasia)" className="w-[82%]">
          {nomeFantasia || '—'}
        </Cell>
        <Cell label="Porte" className="w-[18%]">
          {porte}
        </Cell>
      </Row>

      {/* ── INSCRIÇÃO ESTADUAL ── */}
      <Row>
        <Cell label="Inscrição Estadual" className="w-full">
          {isEditingIe ? (
            <div className="py-1 flex flex-col sm:flex-row sm:items-center gap-2 print:hidden">
              <input
                type="text"
                value={tempIeInput}
                onChange={(e) => setTempIeInput(e.target.value)}
                placeholder="Ex: 00000004919211 ou ISENTO"
                className="px-2.5 py-1 text-sm border border-gray-400 rounded focus:outline-none focus:border-brand-orange w-full sm:w-64 font-mono font-semibold"
                autoFocus
              />
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const val = tempIeInput.trim();
                    onIeChange?.(val || null);
                    setIsEditingIe(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-brand-orange text-white rounded hover:bg-brand-orange-dark cursor-pointer transition-colors"
                >
                  Salvar no Banco
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onIeChange?.('ISENTO');
                    setIsEditingIe(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded cursor-pointer transition-colors"
                >
                  Definir ISENTO
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingIe(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : customIeText !== undefined && customIeText !== null ? (
            <div className="flex items-center gap-2 py-0.5 flex-wrap min-w-0">
              {customIeText.trim().toUpperCase() === 'ISENTO' ? (
                <>
                  <span className="font-bold text-[15px]" style={{ color: '#000000' }}>ISENTO</span>
                  <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded px-2 py-0.5">
                    ISENTO (Confirmado pela Equipe)
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold break-all text-[15px]" style={{ color: '#000000' }}>
                    {customIeText}
                  </span>
                  {estUf && (
                    <span className="text-[12px] font-medium" style={{ color: '#1c1c1e' }}>
                      ({estUf})
                    </span>
                  )}
                  <CopyButton text={customIeText} label="Copiar Inscrição Estadual" />
                  <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 rounded px-2 py-0.5">
                    Confirmado pela Equipe (Sintegra)
                  </span>
                </>
              )}
              <div className="flex items-center gap-2 print:hidden ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempIeInput(customIeText);
                    setIsEditingIe(true);
                  }}
                  className="text-xs text-brand-orange hover:underline cursor-pointer font-medium inline-flex items-center gap-1"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                  <span>Alterar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onIeChange?.(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Remover do banco compartilhado e restaurar consulta original"
                >
                  Restaurar original
                </button>
              </div>
            </div>
          ) : iePrincipal?.inscricao_estadual ? (
            <div className="flex flex-col gap-1 py-0.5">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {iePrincipal.inscricao_estadual.trim().toUpperCase() === 'ISENTO' ? (
                  <>
                    <span className="font-bold text-[15px]" style={{ color: '#000000' }}>
                      ISENTO
                    </span>
                    <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded px-2 py-0.5">
                      {data._ieOrigem === 'custom_salvo' ? 'ISENTO (Confirmado pela Equipe)' : 'ISENTO'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-bold break-all text-[15px]" style={{ color: '#000000' }}>
                      {iePrincipal.inscricao_estadual}
                    </span>
                    <span className="text-[12px] font-medium break-words" style={{ color: '#1c1c1e' }}>
                      ({iePrincipal.estado?.sigla ?? estUf})
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      iePrincipal.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {iePrincipal.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                    <CopyButton text={iePrincipal.inscricao_estadual} label="Copiar Inscrição Estadual" />
                  </>
                )}

                {data._ieOrigem === 'custom_salvo' && iePrincipal.inscricao_estadual.trim().toUpperCase() !== 'ISENTO' && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300"
                    title={`Inscrição Estadual confirmada e salva no banco compartilhado da equipe`}
                  >
                    Confirmado pela Equipe (Sintegra)
                  </span>
                )}
                {data._ieOrigem === 'comercial' && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300"
                    title="Inscrição Estadual obtida via base comercial atualizada (Sintegra / CCC)"
                  >
                    Sintegra/CCC
                  </span>
                )}
                {data._ieOrigem === 'sintegraws' && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200"
                    title="Inscrição Estadual obtida via SintegraWS"
                  >
                    SintegraWS
                  </span>
                )}
                {data._ieOrigem === 'nuvemfiscal' && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200"
                    title="Inscrição Estadual obtida e validada diretamente no Cadastro Centralizado de Contribuintes (SEFAZ/CCC)"
                  >
                    SEFAZ/CCC
                  </span>
                )}
                {data._ieOrigem === 'sefaz_a1' && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300"
                    title="Inscrição Estadual obtida e validada diretamente na SEFAZ via Certificado Digital A1"
                  >
                    SEFAZ / A1
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTempIeInput(iePrincipal.inscricao_estadual || '');
                    setIsEditingIe(true);
                  }}
                  className="text-xs text-brand-orange hover:underline print:hidden cursor-pointer ml-1.5 inline-flex items-center gap-1 font-medium"
                  title="Alterar ou atualizar a Inscrição Estadual no banco compartilhado"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                  <span>Alterar</span>
                </button>

                {data._ieOrigem === 'custom_salvo' && (
                  <button
                    type="button"
                    onClick={() => onIeChange?.(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 print:hidden cursor-pointer ml-1"
                    title="Remover do banco compartilhado e restaurar consulta original"
                  >
                    Restaurar original
                  </button>
                )}
              </div>

              {otherIes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px] text-gray-600 print:hidden">
                  <span className="text-gray-400">Outras IEs deste CNPJ:</span>
                  {otherIes.map((oIe, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onIeChange?.(oIe.inscricao_estadual || null)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 cursor-pointer transition-colors"
                      title={`Selecionar IE de ${oIe.estado?.sigla || 'outro estado'} (${oIe.ativo ? 'Ativa' : 'Inativa'})`}
                    >
                      <span className="font-mono font-semibold">{oIe.inscricao_estadual}</span>
                      <span className="text-[10px] text-gray-500">
                        ({oIe.estado?.sigla || 'UF'}{!oIe.ativo ? ' Inativa' : ''})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 py-1 min-w-0">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-bold text-[13px] sm:text-[14px] leading-snug text-red-600 tracking-wide uppercase break-words">
                  INCRIÇÃO ESTADUAL NÃO ENCONTRADA NA BASE PUBLICA, POR FAVOR VERIFIQUE NO SINTEGRA DO ESTADO
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap print:hidden">
                <a
                  href="https://www.sintegra.gov.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (est?.cnpj) {
                      const cleanCnpj = est.cnpj.replace(/\D/g, '');
                      copyCnpjToClipboard(cleanCnpj);
                      setCopiedNotification('CNPJ copiado! Cole no portal do Sintegra.');
                      setTimeout(() => setCopiedNotification(null), 4000);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark rounded shadow-sm transition-colors cursor-pointer"
                  title="Abrir portal do Sintegra (https://www.sintegra.gov.br/). O CNPJ será copiado automaticamente para a área de transferência."
                >
                  <span>https://www.sintegra.gov.br/</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>

                {isParana && (
                  <a
                    href="http://www.sintegra.fazenda.pr.gov.br/sintegra/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (est?.cnpj) {
                        const cleanCnpj = est.cnpj.replace(/\D/g, '');
                        copyCnpjToClipboard(cleanCnpj);
                        setCopiedNotification('CNPJ copiado! Cole no portal do Sintegra-PR.');
                        setTimeout(() => setCopiedNotification(null), 4000);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-brand-orange bg-brand-orange-soft hover:bg-brand-orange-soft/80 rounded border border-brand-orange/40 transition-colors cursor-pointer"
                    title="Abrir diretamente o Sintegra do Paraná (http://www.sintegra.fazenda.pr.gov.br/sintegra/)"
                  >
                    <span>Sintegra-PR Direto</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTempIeInput('');
                    setIsEditingIe(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors cursor-pointer"
                  title="Informar manualmente a Inscrição Estadual encontrada"
                >
                  <EditIcon className="w-3.5 h-3.5" />
                  <span>Informar IE</span>
                </button>

                <button
                  type="button"
                  onClick={() => onIeChange?.('ISENTO')}
                  className="px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded border border-dashed border-gray-300 transition-colors cursor-pointer"
                  title="Caso a empresa seja comprovadamente isenta de ICMS"
                >
                  Marcar ISENTO
                </button>
              </div>

              {copiedNotification && (
                <div className="w-full text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 print:hidden">
                  {copiedNotification}
                </div>
              )}
            </div>
          )}
        </Cell>
      </Row>

      {/* ── CNAE PRINCIPAL ── */}
      <Row>
        <Cell label="Código e Descrição da Atividade Econômica Principal" className="w-full">
          {cnaePrincipal}
        </Cell>
      </Row>

      {/* ── CNAES SECUNDÁRIOS ── */}
      <Row>
        <Cell label="Código e Descrição das Atividades Econômicas Secundárias" className="w-full">
          {cnaesSecundarios.length > 0 ? (
            <ul className="space-y-0.5">
              {cnaesSecundarios.map((c) => (
                <li key={c} className="break-words">{c}</li>
              ))}
            </ul>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
      </Row>

      {/* ── NATUREZA JURÍDICA ── */}
      <Row>
        <Cell label="Código e Descrição da Natureza Jurídica" className="w-full">
          {naturezaJuridica}
        </Cell>
      </Row>

      {/* ── ENDEREÇO ── */}
      <Row>
        <Cell label="Logradouro" className="w-[60%]">
          {logradouro !== '—' ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{logradouro}</span>
              <CopyButton text={logradouro} label="Copiar Logradouro" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Número" className="w-[18%]">
          {numero ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{numero}</span>
              <CopyButton text={numero} label="Copiar Número" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
        <Cell label="Complemento" className="w-[22%]">
          {complemento ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{complemento}</span>
              <CopyButton text={complemento} label="Copiar Complemento" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
      </Row>

      {/* ── CEP / BAIRRO / MUNICÍPIO / UF ── */}
      <Row>
        <Cell label="CEP" className="w-[18%]">
          {cep !== '—' ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{cep}</span>
              <CopyButton text={cep} label="Copiar CEP" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Bairro/Distrito" className="w-[32%]">
          {bairro ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{bairro}</span>
              <CopyButton text={bairro} label="Copiar Bairro/Distrito" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
        <Cell label="Município" className="w-[42%]">
          {municipio || '—'}
        </Cell>
        <Cell label="UF" className="w-[8%]">
          {uf || '—'}
        </Cell>
      </Row>

      {/* ── EMAIL / TELEFONE ── */}
      <Row>
        <Cell label="E-mail" className="w-[65%]">
          {email ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-all min-w-0">{email}</span>
              <CopyButton text={email} label="Copiar E-mail" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
        <Cell label="Telefone" className="w-[35%]">
          {telefone ? (
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span className="break-words min-w-0">{telefone}</span>
              <CopyButton text={telefone} label="Copiar Telefone" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
      </Row>

      {/* ── ENTE FEDERATIVO RESPONSÁVEL ── */}
      <Row>
        <Cell label="Ente Federativo Responsável (EFR)" className="w-full">
          {efr || <span style={{ color: '#0a0a0a' }}>—</span>}
        </Cell>
      </Row>

      {/* ── SITUAÇÃO CADASTRAL / DATA ── */}
      <Row>
        <div
          className={`border-r border-b border-gray-400 px-2 py-1.5 w-[75%] min-w-0 shrink-0 ${
            isSituacaoAtiva ? 'bg-green-50' : 'bg-red-50'
          }`}
          style={{
            borderColor: '#6b7280',
            backgroundColor: isSituacaoAtiva ? '#f0fdf4' : '#fef2f2',
            boxSizing: 'border-box',
          }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wide leading-none mb-1 break-words"
            style={{ color: '#1c1c1e' }}
          >
            Situação Cadastral
          </p>
          <p
            className={`text-[15px] font-bold uppercase leading-snug break-words ${
              isSituacaoAtiva ? 'text-green-700' : 'text-red-700'
            }`}
            style={{ color: isSituacaoAtiva ? '#15803d' : '#b91c1c' }}
          >
            {situacao}
          </p>
        </div>
        <Cell label="Data da Situação Cadastral" className="w-[25%]">
          {dataSituacao}
        </Cell>
      </Row>

      {/* ── MOTIVO DE SITUAÇÃO CADASTRAL ── */}
      <Row>
        <Cell label="Motivo de Situação Cadastral" className="w-full">
          {motivoSituacao || <span style={{ color: '#0a0a0a' }}>—</span>}
        </Cell>
      </Row>

      {/* ── SITUAÇÃO ESPECIAL / DATA ── */}
      <Row>
        <Cell label="Situação Especial" className="w-[75%]">
          {situacaoEspecial || <span style={{ color: '#0a0a0a' }}>—</span>}
        </Cell>
        <Cell label="Data da Situação Especial" className="w-[25%]">
          {dataSituacaoEspecial || <span style={{ color: '#0a0a0a' }}>—</span>}
        </Cell>
      </Row>
    </section>
  );
}


