import { AlertIcon } from './Icons';

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4">
      <span className="mt-0.5 shrink-0 text-danger">
        <AlertIcon />
      </span>
      <div>
        <h2 className="text-sm font-semibold text-danger-text">Não foi possível concluir a consulta</h2>
        <p className="mt-0.5 text-sm text-ink-soft">{message}</p>
      </div>
    </div>
  );
}
