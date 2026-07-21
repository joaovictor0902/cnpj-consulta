import { RocketIcon } from './Icons';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border-soft bg-white px-6 py-14 text-center">
      <span className="rounded-full bg-bg-alt p-4 text-ink-muted">
        <RocketIcon className="w-8 h-8" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink">Nenhuma consulta realizada</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Digite um CNPJ no campo acima e clique em “Consultar” para ver os dados públicos da empresa.
      </p>
    </div>
  );
}
