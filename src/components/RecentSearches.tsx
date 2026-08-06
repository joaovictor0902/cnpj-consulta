import type { RecentSearch } from '../hooks/useRecentSearches';

type RecentSearchesProps = {
  items: RecentSearch[];
  onSelect: (cnpj: string) => void;
  onRemove: (cnpj: string) => void;
  onClearAll: () => void;
  loading: boolean;
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `${days} dias atrás`;
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

function SituacaoBadge({ situacao }: { situacao: string }) {
  const isAtiva = situacao.trim().toLowerCase() === 'ativa';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isAtiva
          ? 'bg-success-soft text-success-text'
          : 'bg-danger-soft text-danger-text'
      }`}
    >
      {situacao}
    </span>
  );
}

export function RecentSearches({
  items,
  onSelect,
  onRemove,
  onClearAll,
  loading,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-soft bg-white shadow-sm print:hidden overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-ink-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <h2 className="text-sm font-semibold text-ink">
            Consultas recentes
          </h2>
          <span className="text-xs text-ink-muted font-medium">
            ({items.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft transition-colors cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Limpar consultas
        </button>
      </div>

      {/* Lista */}
      <ul className="divide-y divide-border-soft max-h-[320px] overflow-y-auto">
        {items.map((search) => (
          <li
            key={search.cnpj}
            className="group flex items-center gap-3 px-4 py-2.5 sm:px-5 hover:bg-brand-orange-soft/50 transition-colors"
          >
            {/* Botão de consultar novamente */}
            <button
              type="button"
              onClick={() => onSelect(search.cnpj)}
              disabled={loading}
              className="flex-1 min-w-0 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink tracking-wide font-mono">
                  {search.cnpjFormatado}
                </span>
                <SituacaoBadge situacao={search.situacao} />
              </div>
              <p className="mt-0.5 text-xs text-ink-muted truncate">
                {search.razaoSocial}
              </p>
            </button>

            {/* Tempo */}
            <span className="shrink-0 text-[10px] text-ink-muted font-medium whitespace-nowrap hidden sm:inline">
              {timeAgo(search.timestamp)}
            </span>

            {/* Botão remover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(search.cnpj);
              }}
              title="Remover"
              className="shrink-0 rounded-md p-1 text-ink-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-soft transition-all cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
