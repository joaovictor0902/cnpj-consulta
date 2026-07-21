export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

export type Estado = {
  id?: number;
  nome?: string;
  sigla?: string;
};

export type Cidade = {
  id?: number;
  nome?: string;
};

export type Atividade = {
  id?: string;
  descricao?: string;
};

export type InscricaoEstadual = {
  inscricao_estadual?: string;
  ativo?: boolean;
  atualizado_em?: string;
  estado?: Estado;
};

export type Estabelecimento = {
  cnpj?: string;
  tipo?: string;
  nome_fantasia?: string | null;
  situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  motivo_situacao_cadastral?: string | null;
  situacao_especial?: string | null;
  data_situacao_especial?: string | null;
  data_inicio_atividade?: string;
  atividade_principal?: Atividade;
  atividades_secundarias?: Atividade[];
  tipo_logradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  ddd1?: string | null;
  telefone1?: string | null;
  ddd2?: string | null;
  telefone2?: string | null;
  email?: string | null;
  cidade?: Cidade;
  estado?: Estado;
  inscricoes_estaduais?: InscricaoEstadual[];
  ente_federativo_responsavel?: string | null;
};

export type CnpjResponse = {
  cnpj_raiz?: string;
  razao_social?: string;
  capital_social?: string;
  atualizado_em?: string;
  porte?: { id?: string; descricao?: string };
  natureza_juridica?: { id?: string; descricao?: string };
  estabelecimento?: Estabelecimento;
};

export type LookupStatus = 'idle' | 'loading' | 'success' | 'error';
