/**
 * Conta recursivamente quantos campos-folha do JSON têm valor não vazio
 * (diferente de null, undefined, string vazia, objeto/array vazio).
 */
export function countFilledFields(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (Array.isArray(value)) {
    return value.reduce<number>((acc, item) => acc + countFilledFields(item), 0);
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (acc, item) => acc + countFilledFields(item),
      0,
    );
  }

  if (typeof value === 'string') return value.trim() === '' ? 0 : 1;
  return 1;
}

/** Conta o total de campos-folha, preenchidos ou não (para exibir "X de Y"). */
export function countTotalFields(value: unknown): number {
  if (value !== null && typeof value === 'object') {
    const items = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
    return items.reduce<number>((acc, item) => acc + countTotalFields(item), 0);
  }
  return 1;
}
