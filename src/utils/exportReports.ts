import { Briefing } from '../types';
import { formatDate } from './format';

const columns = ['Empreendimento', 'Técnico', 'Cidade', 'Serviço', 'Tipo', 'Status', 'Situação', 'Data', 'Anexos'];

function rows(briefings: Briefing[]) {
  return briefings.map((briefing) => [
    briefing.empreendimento,
    briefing.agente,
    briefing.cidade,
    briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico,
    briefing.tipo_servico,
    briefing.status,
    briefing.situacao,
    formatDate(briefing.created_at),
    String(briefing.arquivos.length),
  ]);
}

function download(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(briefings: Briefing[]) {
  const content = [columns, ...rows(briefings)]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  download(`\uFEFF${content}`, 'relatorio-cesolbrief.csv', 'text/csv;charset=utf-8');
}

export function exportExcel(briefings: Briefing[]) {
  const tableRows = rows(briefings)
    .map((row) => `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join('')}</tr>`)
    .join('');
  const tableHead = `<tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr>`;
  const html = `
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table>${tableHead}${tableRows}</table>
      </body>
    </html>
  `;
  download(html, 'relatorio-cesolbrief.xls', 'application/vnd.ms-excel;charset=utf-8');
}

export async function exportPdf(briefings: Briefing[]) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Relatório CesolBrief', 14, 16);
  doc.setFontSize(9);
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, 14, 23);
  autoTable(doc, {
    startY: 30,
    head: [columns],
    body: rows(briefings),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [184, 106, 0] },
  });
  doc.save('relatorio-cesolbrief.pdf');
}
