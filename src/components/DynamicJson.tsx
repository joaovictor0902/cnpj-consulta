import type { ReactNode } from 'react';
import { formatField, humanizeKey } from '../utils/format';
import type { JsonPrimitive } from '../utils/types';

function isPrimitive(value: unknown): value is JsonPrimitive {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function PrimitiveValue({ fieldKey, value }: { fieldKey: string; value: JsonPrimitive }) {
  const formatted = formatField(fieldKey, value);
  if (formatted.kind === 'boolean-true') {
    return <span className="font-bold text-success">Sim</span>;
  }
  if (formatted.kind === 'boolean-false') {
    return <span className="font-semibold text-ink-muted">Não</span>;
  }
  if (formatted.kind === 'empty') {
    return <span className="text-ink-muted">—</span>;
  }
  return <span className="break-words text-ink">{formatted.display}</span>;
}

function FieldRow({ fieldKey, value }: { fieldKey: string; value: JsonPrimitive }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="shrink-0 text-sm font-semibold text-ink sm:w-56">{humanizeKey(fieldKey)}</dt>
      <dd className="text-sm">
        <PrimitiveValue fieldKey={fieldKey} value={value} />
      </dd>
    </div>
  );
}

/** Tabela para lista de objetos cujos valores são todos primitivos. */
function ObjectTable({ items }: { items: Record<string, unknown>[] }) {
  const columns = Array.from(new Set(items.flatMap((item) => Object.keys(item))));
  return (
    <div className="overflow-x-auto rounded-lg border border-border-soft">
      <table className="min-w-full divide-y divide-border-soft text-sm">
        <thead className="bg-bg-alt">
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {humanizeKey(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-soft bg-white">
          {items.map((item, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 align-top">
                  {isPrimitive(item[col]) ? (
                    <PrimitiveValue fieldKey={col} value={item[col] as JsonPrimitive} />
                  ) : item[col] === undefined ? (
                    <span className="text-ink-muted">—</span>
                  ) : (
                    <DynamicNode fieldKey={col} value={item[col]} depth={99} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border-soft bg-bg-alt/60 p-4">
      <h3 className="mb-1 text-sm font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

type DynamicNodeProps = {
  fieldKey: string;
  value: unknown;
  depth: number;
};

export function DynamicNode({ fieldKey, value, depth }: DynamicNodeProps) {
  if (isPrimitive(value)) {
    return <FieldRow fieldKey={fieldKey} value={value} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <FieldRow fieldKey={fieldKey} value={null} />;
    }

    const allPrimitives = value.every(isPrimitive);
    if (allPrimitives) {
      return (
        <div className="py-2">
          <dt className="text-sm font-semibold text-ink">{humanizeKey(fieldKey)}</dt>
          <dd className="mt-1.5">
            <ul className="list-disc space-y-1 pl-5 marker:text-brand-orange">
              {value.map((item, index) => (
                <li key={index} className="text-sm">
                  <PrimitiveValue fieldKey={fieldKey} value={item as JsonPrimitive} />
                </li>
              ))}
            </ul>
          </dd>
        </div>
      );
    }

    const allFlatObjects =
      value.every(isPlainObject) &&
      value.every((item) => Object.values(item as Record<string, unknown>).every(isPrimitive));

    if (allFlatObjects) {
      return (
        <div className="py-2">
          <dt className="mb-2 text-sm font-semibold text-ink">
            {humanizeKey(fieldKey)} <span className="text-ink-muted">({value.length})</span>
          </dt>
          <ObjectTable items={value as Record<string, unknown>[]} />
        </div>
      );
    }

    return (
      <div className="space-y-3 py-2">
        <dt className="text-sm font-semibold text-ink">
          {humanizeKey(fieldKey)} <span className="text-ink-muted">({value.length})</span>
        </dt>
        {value.map((item, index) => (
          <SubCard key={index} title={`${humanizeKey(fieldKey)} #${index + 1}`}>
            {isPrimitive(item) ? (
              <PrimitiveValue fieldKey={fieldKey} value={item} />
            ) : (
              <ObjectBody value={item as Record<string, unknown>} depth={depth + 1} />
            )}
          </SubCard>
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div className="py-2">
        <SubCard title={humanizeKey(fieldKey)}>
          <ObjectBody value={value} depth={depth + 1} />
        </SubCard>
      </div>
    );
  }

  return null;
}

function ObjectBody({ value, depth }: { value: Record<string, unknown>; depth: number }) {
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">Sem dados</p>;
  }
  return (
    <dl className="divide-y divide-border-soft/70">
      {entries.map(([key, val]) => (
        <DynamicNode key={key} fieldKey={key} value={val} depth={depth} />
      ))}
    </dl>
  );
}

export function DynamicJsonSection({ data }: { data: Record<string, unknown> }) {
  return (
    <section aria-labelledby="dynamic-title" className="rounded-xl border border-border-soft bg-white p-5 shadow-sm sm:p-6">
      <h2 id="dynamic-title" className="mb-3 text-lg font-bold text-ink">
        Todos os campos retornados
      </h2>
      <ObjectBody value={data} depth={0} />
    </section>
  );
}
