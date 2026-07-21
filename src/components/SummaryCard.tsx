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
    <div className={`border-r border-b border-gray-400 px-2 py-1.5 ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 leading-none mb-1">
        {label}
      </p>
      <div className="text-[13px] text-gray-900 leading-snug">{children}</div>
    </div>
  );
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex ${className}`}>{children}</div>;
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
      // Container externo: border-top e border-left. As células dão border-right e border-bottom.
      className="border-t border-l border-gray-400 bg-white font-sans shadow-sm"
    >
      {/* ── CABEÇALHO ── */}
      <Row>
        {/* NÚMERO DE INSCRIÇÃO */}
        <div className="border-r border-b border-gray-400 px-2 py-1.5 w-52 shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 leading-none mb-1">
            Número de Inscrição
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-semibold text-gray-900 leading-snug">{cnpjFormatado}</p>
            {cnpjFormatado !== '—' && (
              <CopyButton text={cnpjFormatado} label="Copiar CNPJ" />
            )}
          </div>
          <p className="text-[13px] text-gray-900 leading-snug">{tipo}</p>
        </div>

        {/* TÍTULO CENTRAL */}
        <div className="border-r border-b border-gray-400 flex-1 flex items-center justify-center px-4 py-3">
          <h1
            id="comprovante-title"
            className="text-[16px] font-bold uppercase text-center text-gray-900 leading-tight tracking-wide"
          >
            Comprovante de Inscrição e de Situação<br />Cadastral
          </h1>
        </div>

        {/* DATA DE ABERTURA */}
        <div className="border-r border-b border-gray-400 px-2 py-1.5 w-40 shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 leading-none mb-1">
            Data de Abertura
          </p>
          <p className="text-[13px] text-gray-900 leading-snug">{dataAbertura}</p>
        </div>
      </Row>

      {/* ── NOME EMPRESARIAL ── */}
      <Row>
        <Cell label="Nome Empresarial" className="flex-1">
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
        <Cell label="Título do Estabelecimento (Nome de Fantasia)" className="flex-1">
          {nomeFantasia}
        </Cell>
        <Cell label="Porte" className="w-24 shrink-0">
          {porte}
        </Cell>
      </Row>

      {/* ── INSCRIÇÃO ESTADUAL ── */}
      <Row>
        <Cell label="Inscrição Estadual" className="flex-1">
          {iePrincipal?.inscricao_estadual ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <span className="font-semibold text-gray-900">{iePrincipal.inscricao_estadual}</span>
              <span className="text-[11px] text-gray-500">
                ({iePrincipal.estado?.sigla ?? ''}){!iePrincipal.ativo && ' - Inativa'}
              </span>
              <CopyButton text={iePrincipal.inscricao_estadual} label="Copiar Inscrição Estadual" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
      </Row>

      {/* ── CNAE PRINCIPAL ── */}
      <Row>
        <Cell label="Código e Descrição da Atividade Econômica Principal" className="flex-1">
          {cnaePrincipal}
        </Cell>
      </Row>

      {/* ── CNAES SECUNDÁRIOS ── */}
      <Row>
        <Cell label="Código e Descrição das Atividades Econômicas Secundárias" className="flex-1">
          {cnaesSecundarios.length > 0 ? (
            <ul className="space-y-0">
              {cnaesSecundarios.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
      </Row>

      {/* ── NATUREZA JURÍDICA ── */}
      <Row>
        <Cell label="Código e Descrição da Natureza Jurídica" className="flex-1">
          {naturezaJuridica}
        </Cell>
      </Row>

      {/* ── ENDEREÇO ── */}
      <Row>
        <Cell label="Logradouro" className="flex-1">
          {logradouro !== '—' ? (
            <div className="flex items-center justify-between gap-1">
              <span>{logradouro}</span>
              <CopyButton text={logradouro} label="Copiar Logradouro" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Número" className="w-24 shrink-0">
          {numero ? (
            <div className="flex items-center justify-between gap-1">
              <span>{numero}</span>
              <CopyButton text={numero} label="Copiar Número" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
        <Cell label="Complemento" className="w-36 shrink-0">
          {complemento ? (
            <div className="flex items-center justify-between gap-1">
              <span>{complemento}</span>
              <CopyButton text={complemento} label="Copiar Complemento" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
      </Row>

      {/* ── CEP / BAIRRO / MUNICÍPIO / UF ── */}
      <Row>
        <Cell label="CEP" className="w-28 shrink-0">
          {cep !== '—' ? (
            <div className="flex items-center justify-between gap-1">
              <span>{cep}</span>
              <CopyButton text={cep} label="Copiar CEP" />
            </div>
          ) : (
            <span>—</span>
          )}
        </Cell>
        <Cell label="Bairro/Distrito" className="flex-1">
          {bairro ? (
            <div className="flex items-center justify-between gap-1">
              <span>{bairro}</span>
              <CopyButton text={bairro} label="Copiar Bairro/Distrito" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
        <Cell label="Município" className="flex-1">
          {municipio}
        </Cell>
        <Cell label="UF" className="w-12 shrink-0">
          {uf}
        </Cell>
      </Row>

      {/* ── EMAIL / TELEFONE ── */}
      <Row>
        <Cell label="E-mail" className="flex-1">
          {email ? (
            <div className="flex items-center justify-between gap-1">
              <span>{email}</span>
              <CopyButton text={email} label="Copiar E-mail" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
        <Cell label="Telefone" className="w-44 shrink-0">
          {telefone ? (
            <div className="flex items-center justify-between gap-1">
              <span>{telefone}</span>
              <CopyButton text={telefone} label="Copiar Telefone" />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </Cell>
      </Row>

      {/* ── ENTE FEDERATIVO RESPONSÁVEL ── */}
      <Row>
        <Cell label="Ente Federativo Responsável (EFR)" className="flex-1">
          {efr || <span className="text-gray-400">—</span>}
        </Cell>
      </Row>

      {/* ── SITUAÇÃO CADASTRAL / DATA ── */}
      <Row>
        <div
          className={`border-r border-b border-gray-400 px-2 py-1.5 flex-1 ${
            isSituacaoAtiva ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-500 leading-none mb-1">
            Situação Cadastral
          </p>
          <p
            className={`text-[13px] font-bold uppercase leading-snug ${
              isSituacaoAtiva ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {situacao}
          </p>
        </div>
        <Cell label="Data da Situação Cadastral" className="w-44 shrink-0">
          {dataSituacao}
        </Cell>
      </Row>

      {/* ── MOTIVO DE SITUAÇÃO CADASTRAL ── */}
      <Row>
        <Cell label="Motivo de Situação Cadastral" className="flex-1">
          {motivoSituacao || <span className="text-gray-400">—</span>}
        </Cell>
      </Row>

      {/* ── SITUAÇÃO ESPECIAL / DATA ── */}
      <Row>
        <Cell label="Situação Especial" className="flex-1">
          {situacaoEspecial || <span className="text-gray-400">—</span>}
        </Cell>
        <Cell label="Data da Situação Especial" className="w-44 shrink-0">
          {dataSituacaoEspecial || <span className="text-gray-400">—</span>}
        </Cell>
      </Row>
    </section>
  );
}
