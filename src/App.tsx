import { useState, useEffect } from 'react';
import { CnpjForm } from './components/CnpjForm';
import { EmptyState } from './components/EmptyState';
import { ErrorAlert } from './components/ErrorAlert';
import { SpinnerIcon } from './components/Icons';
import { RecentSearches } from './components/RecentSearches';
import { SummaryCard } from './components/SummaryCard';
import { useCnpjLookup } from './hooks/useCnpjLookup';
import { useRecentSearches } from './hooks/useRecentSearches';
import { generateCnpjPdf } from './utils/generatePdf';

export default function App() {
  const { status, data, error, lookup } = useCnpjLookup();
  const { items: recentItems, addSearch, clearAll, removeSearch } = useRecentSearches();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [toast, setToast] = useState<{ msg: string; visible: boolean } | null>(null);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(null), 4000);
  };

  // Salva a consulta recente quando uma busca é bem-sucedida
  useEffect(() => {
    if (status === 'success' && data) {
      const cnpj = data.estabelecimento?.cnpj || '';
      const razaoSocial = data.razao_social || '';
      const situacao = data.estabelecimento?.situacao_cadastral || '';
      if (cnpj) {
        addSearch(cnpj, razaoSocial, situacao);
      }
    }
  }, [status, data, addSearch]);

  const downloadPdf = async () => {
    if (!data) return;

    setDownloadingPdf(true);
    try {
      const pdf = generateCnpjPdf(data);

      const rawCnpj = data?.estabelecimento?.cnpj || '';
      const cnpjClean = rawCnpj.replace(/\D/g, '') || 'comprovante';
      const filename = `comprovante-cnpj-${cnpjClean}.pdf`;

      pdf.save(filename);
      showToast('Comprovante baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border-soft bg-white/80 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-4 sm:px-6">
          <img src="/logo/ATOPY LOGO.png" alt="ATOPY" className="h-9" style={{ height: '36px' }} />
          <h1 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">Consulta CNPJ</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 print:p-0 print:my-0 print:max-w-none">
        <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm sm:p-6 print:hidden">
          <CnpjForm loading={status === 'loading'} onSubmit={lookup} />
        </div>

        {/* Consultas recentes — aparece quando não há resultado ativo */}
        {status !== 'success' && (
          <RecentSearches
            items={recentItems}
            onSelect={lookup}
            onRemove={removeSearch}
            onClearAll={clearAll}
            loading={status === 'loading'}
          />
        )}

        {status === 'idle' && recentItems.length === 0 && <EmptyState />}

        {status === 'loading' && (
          <div
            role="status"
            className="flex flex-col items-center gap-3 rounded-xl border border-border-soft bg-white py-14 text-ink-muted"
          >
            <SpinnerIcon className="w-6 h-6 text-brand-orange" />
            <span className="text-sm font-medium">Consultando CNPJ…</span>
          </div>
        )}

        {status === 'error' && error && <ErrorAlert message={error} />}

        {status === 'success' && data && (
          <div className="space-y-4">
            <div className="print:shadow-none print:border-0 print:p-0">
              <SummaryCard data={data} />
            </div>
            <div className="flex justify-end print:hidden">
              <button
                onClick={downloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-brand-orange-dark hover:shadow-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingPdf ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
                {downloadingPdf ? 'Gerando PDF…' : 'Baixar PDF'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 sm:px-6 print:hidden">
        <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
          <img src="/logo/ATOPY LOGO.png" alt="ATOPY" className="h-6" style={{ height: '24px' }} />
          <span>· Ferramenta interna — Fonte: API pública publica.cnpj.ws</span>
        </div>
      </footer>

      {toast?.visible && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg print:hidden"
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
        >
          <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
