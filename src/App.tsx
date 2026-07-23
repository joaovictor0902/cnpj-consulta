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
      // Configura html2canvas com onclone para garantir renderização de desktop (800px)
      // e remoção de elementos interativos (botões de copiar)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (el) =>
          el.hasAttribute('data-html2canvas-ignore') ||
          el.classList?.contains('print:hidden') ||
          el.tagName === 'BUTTON',
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('comprovante-cnpj');
          if (clonedEl) {
            clonedEl.style.width = '800px';
            clonedEl.style.maxWidth = '800px';
            clonedEl.style.minWidth = '800px';
            clonedEl.style.boxSizing = 'border-box';
            clonedEl.style.margin = '0';
            clonedEl.style.boxShadow = 'none';

            // Remove todos os botões no clone como segurança extra
            const buttons = clonedEl.querySelectorAll(
              'button, .print\\:hidden, [data-html2canvas-ignore]'
            );
            buttons.forEach((btn) => btn.remove());
          }
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 10; // 10mm de margem
      const contentWidth = pdfWidth - margin * 2; // 190mm
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      // Altura imprimível de cada página em mm
      const pageContentHeight = pdfHeight - margin * 2; // 277mm

      if (contentHeight <= pageContentHeight) {
        // Cabe em uma única página
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      } else {
        // Multi-página: fatia a imagem em submódulos de canvas por página
        const canvasPageHeight = (canvas.width * pageContentHeight) / contentWidth;
        let positionY = 0;
        let pageIndex = 0;

        while (positionY < canvas.height) {
          if (pageIndex > 0) {
            pdf.addPage();
          }

          const sliceHeight = Math.min(canvasPageHeight, canvas.height - positionY);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;

          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0,
              positionY,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/png');
          const slicePdfHeight = (sliceHeight * contentWidth) / canvas.width;

          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, slicePdfHeight);

          positionY += sliceHeight;
          pageIndex++;
        }
      }

      const rawCnpj = data?.estabelecimento?.cnpj || '';
      const cnpjClean = rawCnpj.replace(/\D/g, '') || 'comprovante';
      const filename = `comprovante-cnpj-${cnpjClean}.pdf`;

      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'Documento PDF (*.pdf)',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });
          const pdfBlob = pdf.output('blob');
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (pickerErr) {
          if (pickerErr instanceof Error && pickerErr.name === 'AbortError') {
            // Usuário cancelou a janela de seleção de arquivo/pasta
            return;
          }
          // Em caso de outro erro (ex: restrição do navegador), faz o download padrão
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
