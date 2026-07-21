import { useState } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { CnpjForm } from './components/CnpjForm';
import { EmptyState } from './components/EmptyState';
import { ErrorAlert } from './components/ErrorAlert';
import { SpinnerIcon } from './components/Icons';
import { SummaryCard } from './components/SummaryCard';
import { useCnpjLookup } from './hooks/useCnpjLookup';

export default function App() {
  const { status, data, error, lookup } = useCnpjLookup();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    const element = document.getElementById('comprovante-cnpj');
    if (!element) return;

    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      if (contentHeight <= pdfHeight - (margin * 2)) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      } else {
        let heightLeft = contentHeight;
        let position = margin;
        
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - margin * 2);
        
        while (heightLeft > 0) {
          position = heightLeft - contentHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }
      }
      
      const cnpjName = data?.estabelecimento?.cnpj || 'cnpj';
      const filename = `comprovante-cnpj-${cnpjName}.pdf`;

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Documento PDF',
              accept: { 'application/pdf': ['.pdf'] }
            }]
          });
          const pdfBlob = pdf.output('blob');
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (pickerErr) {
          if (pickerErr instanceof Error && pickerErr.name === 'AbortError') {
            // Usuário cancelou a janela de salvar
            return;
          }
          pdf.save(filename);
        }
      } else {
        pdf.save(filename);
      }
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
          <img src="/logo/ATOPY LOGO.png" alt="ATOPY" className="h-9" />
          <h1 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">Consulta CNPJ</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 print:p-0 print:my-0 print:max-w-none">
        <div className="rounded-xl border border-border-soft bg-white p-5 shadow-sm sm:p-6 print:hidden">
          <CnpjForm loading={status === 'loading'} onSubmit={lookup} />
        </div>

        {status === 'idle' && <EmptyState />}

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
          <img src="/logo/ATOPY LOGO.png" alt="ATOPY" className="h-6" />
          <span>· Ferramenta interna — Fonte: API pública publica.cnpj.ws</span>
        </div>
      </footer>
    </div>
  );
}
