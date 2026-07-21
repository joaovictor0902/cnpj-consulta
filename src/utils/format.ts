export function formatCnpj(digits: string): string {
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatCpf(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatCep(digits: string): string {
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/** Data ISO (YYYY-MM-DD, com ou sem hora) → DD/MM/YYYY. */
export function formatDateBR(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatCurrencyBRL(value: string | number): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Telefone com ou sem DDD: (XX) XXXX-XXXX / (XX) XXXXX-XXXX / XXXX-XXXX. */
export function formatPhone(digits: string): string {
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return digits;
}

export type FormattedValue = {
  display: string;
  kind: 'text' | 'boolean-true' | 'boolean-false' | 'empty';
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ].*)?$/;

/**
 * Formata um valor primitivo do JSON com base em heurísticas de chave + formato.
 * Detecções ambíguas mantêm o valor original.
 */
export function formatField(key: string, value: string | number | boolean | null): FormattedValue {
  if (value === null || value === undefined || value === '') {
    return { display: '—', kind: 'empty' };
  }

  if (typeof value === 'boolean') {
    return value
      ? { display: 'Sim', kind: 'boolean-true' }
      : { display: 'Não', kind: 'boolean-false' };
  }

  const k = key.toLowerCase();
  const str = String(value);
  const digits = str.replace(/\D/g, '');
  const isNumericString = /^\d+$/.test(str);

  if (k.includes('cnpj') && isNumericString && digits.length === 14) {
    return { display: formatCnpj(digits), kind: 'text' };
  }
  if (k.includes('cpf') && !k.includes('cnpj') && isNumericString && digits.length === 11) {
    return { display: formatCpf(digits), kind: 'text' };
  }
  if (k === 'cep' && isNumericString && digits.length === 8) {
    return { display: formatCep(digits), kind: 'text' };
  }
  if (typeof value === 'string' && ISO_DATE.test(str)) {
    return { display: formatDateBR(str), kind: 'text' };
  }
  if (k === 'capital_social' && /^\d+(\.\d+)?$/.test(str)) {
    return { display: formatCurrencyBRL(str), kind: 'text' };
  }
  if ((k.includes('telefone') || k === 'fax') && isNumericString && digits.length >= 8 && digits.length <= 11) {
    return { display: formatPhone(digits), kind: 'text' };
  }

  return { display: str, kind: 'text' };
}

/** "razao_social" → "Razao social": troca _ por espaço e capitaliza a primeira letra. */
export function humanizeKey(key: string): string {
  const withSpaces = key.replace(/_/g, ' ').trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
