import { useState } from 'react';
import type { CnpjResponse } from '../utils/types';
import { formatCep, formatPhone, formatDateBR, formatCnpj } from '../utils/format';
import { CopyIcon, CheckIcon } from './Icons';

type SummaryCardProps = {
  data: CnpjResponse;
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
      className={`border-r border-b border-gray-400 px-2 py-1.5 ${className}`}
      style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}
    >
      <p
        className="text-[9px] font-bold uppercase tracking-wide leading-none mb-1"
        style={{ color: '#1c1c1e' }}
      >
        {label}
      </p>
      <div className="text-[13px] leading-snug" style={{ color: '#000000' }}>
        {children}
      </div>
    </div>
  );
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex w-full ${className}`}>{children}</div>;
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
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all cursor-pointer border ${
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

export function SummaryCard({ data }: SummaryCardProps) {
  const est = data.estabelecimento;

  const cnpjFormatado = est?.cnpj ? formatCnpj(est.cnpj) : '—';
  const tipo = est?.tipo ?? '';
  const dataAbertura = est?.data_inicio_atividade ? formatDateBR(est.data_inicio_atividade) : '—';
  const nomeEmpresarial = data.razao_social ?? '—';
  const nomeFantasia = est?.nome_fantasia || '';
  const porte = data.porte?.descricao ?? '—';
  const ieList = est?.inscricoes_estaduais ?? [];
  const estUf = est?.estado?.sigla || '';
  const iePrincipal = ieList.find((ie) => ie.estado?.sigla === estUf) 
    || ieList.find((ie) => ie.ativo) 
    || ieList[0];

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

  const isSituacaoAtiva = situacao === 'Ativa';

  return (
    <section
      id="comprovante-cnpj"
      aria-labelledby="comprovante-title"
      className="border-t border-l border-gray-400 bg-white font-sans shadow-sm w-full overflow-hidden"
      style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}
    >
      {/* ── CABEÇALHO ── */}
      <Row>
        {/* NÚMERO DE INSCRIÇÃO (CNPJ) */}
        <div
          className="border-r border-b border-gray-400 px-2 py-1.5 w-[26%] shrink-0 flex flex-col justify-center text-center"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-wide leading-none mb-1"
            style={{ color: '#1c1c1e' }}
          >
            CNPJ
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-[13px] font-semibold leading-snug" style={{ color: '#000000' }}>
              {cnpjFormatado}
            </p>
            {cnpjFormatado !== '—' && (
              <CopyButton text={cnpjFormatado} label="Copiar CNPJ" />
            )}
          </div>
          <p className="text-[13px] leading-snug" style={{ color: '#000000' }}>{tipo}</p>
        </div>

        {/* TÍTULO CENTRAL */}
        <div
          className="border-r border-b border-gray-400 flex-1 flex flex-col items-center justify-center gap-2 px-4 py-2 w-[54%]"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}
        >
          {/* ponytail: logo via html2canvas (useCORS já habilitado); se trocar por SVG, manter crossOrigin */}
          <img
            src="/logo/ATOPY FOGUETE CURVAS.jpg"
            alt="ATOPY"
            crossOrigin="anonymous"
            className="h-9 w-auto object-contain"
          />
          <h1
            id="comprovante-title"
            className="text-[13px] font-bold uppercase text-center leading-tight tracking-wide"
            style={{ color: '#000000' }}
          >
            Comprovante de Inscrição e de Situação<br />Cadastral
          </h1>
        </div>

        {/* DATA DE ABERTURA */}
        <div
          className="border-r border-b border-gray-400 px-2 py-1.5 w-[20%] shrink-0 flex flex-col justify-center text-center"
          style={{ borderColor: '#6b7280', backgroundColor: '#ffffff' }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-wide leading-none mb-1"
            style={{ color: '#1c1c1e' }}
          >
            Data de Abertura
          </p>
          <p className="text-[13px] leading-snug" style={{ color: '#000000' }}>
            {dataAbertura}
          </p>
        </div>
      </Row>

      {/* ── NOME EMPRESARIAL ── */}
      <Row>
        <Cell label="Nome Empresarial" className="w-full">
          {nomeEmpresarial !== '—' ? (
            <div className="flex items-center justify-between gap-1">
              <span>{nomeEmpresarial}</span>
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
          {iePrincipal?.inscricao_estadual ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="font-semibold" style={{ color: '#000000' }}>
                {iePrincipal.inscricao_estadual}
              </span>
              <span className="text-[11px]" style={{ color: '#1c1c1e' }}>
                ({iePrincipal.estado?.sigla ?? ''}){!iePrincipal.ativo && ' - Inativa'}
              </span>
              <CopyButton text={iePrincipal.inscricao_estadual} label="Copiar Inscrição Estadual" />
            </div>
          ) : (
            <span className="font-semibold" style={{ color: '#000000' }}>ISENTO</span>
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
                <li key={c}>{c}</li>
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
            <div className="flex items-center justify-between gap-1">
              <span>{logradouro}</span>
              <CopyButton text={logradouro} label="Copiar Logradouro" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Número" className="w-[18%]">
          {numero ? (
            <div className="flex items-center justify-between gap-1">
              <span>{numero}</span>
              <CopyButton text={numero} label="Copiar Número" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
        <Cell label="Complemento" className="w-[22%]">
          {complemento ? (
            <div className="flex items-center justify-between gap-1">
              <span>{complemento}</span>
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
            <div className="flex items-center justify-between gap-1">
              <span>{cep}</span>
              <CopyButton text={cep} label="Copiar CEP" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Bairro/Distrito" className="w-[32%]">
          {bairro ? (
            <div className="flex items-center justify-between gap-1">
              <span>{bairro}</span>
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
            <div className="flex items-center justify-between gap-1">
              <span>{email}</span>
              <CopyButton text={email} label="Copiar E-mail" />
            </div>
          ) : (
            <span style={{ color: '#0a0a0a' }}>—</span>
          )}
        </Cell>
        <Cell label="Telefone" className="w-[35%]">
          {telefone ? (
            <div className="flex items-center justify-between gap-1">
              <span>{telefone}</span>
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
          className={`border-r border-b border-gray-400 px-2 py-1.5 w-[75%] ${
            isSituacaoAtiva ? 'bg-green-50' : 'bg-red-50'
          }`}
          style={{
            borderColor: '#6b7280',
            backgroundColor: isSituacaoAtiva ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-wide leading-none mb-1"
            style={{ color: '#1c1c1e' }}
          >
            Situação Cadastral
          </p>
          <p
            className={`text-[13px] font-bold uppercase leading-snug ${
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

