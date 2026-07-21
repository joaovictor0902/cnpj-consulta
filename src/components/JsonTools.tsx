import { useMemo, useState } from 'react';
import { countFilledFields, countTotalFields } from '../utils/count';
import { CheckIcon, CodeIcon, CopyIcon } from './Icons';

type JsonToolsProps = {
  data: Record<string, unknown>;
};

export function JsonTools({ data }: JsonToolsProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const formattedJson = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const filled = useMemo(() => countFilledFields(data), [data]);
  const total = useMemo(() => countTotalFields(data), [data]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  }

  return (
    <section aria-label="Ferramentas do JSON" className="rounded-xl border border-border-soft bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{filled}</span> de{' '}
          <span className="font-semibold text-ink">{total}</span> campos preenchidos
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            aria-expanded={showRaw}
            aria-controls="raw-json"
            className="inline-flex items-center gap-2 rounded-lg border border-border-soft bg-transparent px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-bg-alt hover:text-ink"
          >
            <CodeIcon />
            {showRaw ? 'Ocultar JSON bruto' : 'Ver JSON bruto'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
              copied
                ? 'border-success/30 bg-success-soft text-success-text'
                : 'border-border-soft bg-transparent text-ink-soft hover:bg-bg-alt hover:text-ink'
            }`}
          >
            {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon />}
            {copied ? 'Copiado!' : 'Copiar JSON'}
          </button>
        </div>
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {copied ? 'JSON copiado para a área de transferência.' : ''}
      </div>
      {copyError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Não foi possível copiar. Seu navegador pode ter bloqueado o acesso à área de transferência.
        </p>
      )}
      {showRaw && (
        <pre
          id="raw-json"
          className="mt-4 max-h-96 overflow-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-white"
        >
          {formattedJson}
        </pre>
      )}
    </section>
  );
}
