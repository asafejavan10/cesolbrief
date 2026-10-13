import { Briefing } from '../types';
import { formatDate } from './format';
import { getProductImage } from './productThumbnail';

const columns = [
  'Empreendimento',
  'Técnico',
  'Cidade',
  'Serviço',
  'Tipo',
  'Status',
  'Situação',
  'Data',
  'Anexos',
  'Material Final (Link)',
];

function rows(briefings: Briefing[], forExcel = false) {
  return briefings.map((briefing) => {
    const finalFiles = briefing.arquivos.filter((f) => f.is_final);
    const finalLinks = forExcel
      ? finalFiles.map((f) => `<a href="${f.url}">${f.nome}</a>`).join(', ') || 'Nenhum'
      : finalFiles.map((f) => f.url).join(' ; ') || 'Nenhum';

    return [
      briefing.empreendimento,
      briefing.agente,
      briefing.cidade,
      briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico,
      briefing.tipo_servico,
      briefing.status,
      briefing.situacao,
      formatDate(briefing.created_at),
      String(briefing.arquivos.length),
      finalLinks,
    ];
  });
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
  const content = [columns, ...rows(briefings, false)]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  download(`\uFEFF${content}`, 'relatorio-cesolbrief.csv', 'text/csv;charset=utf-8');
}

export function exportExcel(briefings: Briefing[]) {
  const tableRows = rows(briefings, true)
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
  const briefingsWithFinal = briefings.filter((b) => b.arquivos.some((f) => f.is_final));

  if (briefingsWithFinal.length === 0) {
    throw new Error('Nenhum briefing com material finalizado foi encontrado para exportar o PDF.');
  }

  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Header minimalista
  doc.setFillColor(184, 106, 0);
  doc.rect(margin, 12, 4, 12, 'F');

  doc.setFontSize(16);
  doc.setTextColor(28, 25, 23);
  doc.setFont('helvetica', 'bold');
  doc.text('Catálogo de Produtos - CesolBrief', margin + 7, 18);

  doc.setFontSize(9);
  doc.setTextColor(120, 113, 108);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, margin + 7, 23);

  let currentY = 29;
  const cardHeight = 74;
  const bottomMargin = 15;

  for (const briefing of briefingsWithFinal) {
    const finalFiles = briefing.arquivos.filter((f) => f.is_final);
    const primaryFinal = finalFiles[0];

    if (currentY + cardHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = margin;
    }

    // Card Background & Border
    doc.setFillColor(250, 250, 249);
    doc.setDrawColor(231, 229, 228);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 3, 3, 'FD');

    // Left Column: Nome do Empreendimento e Serviço
    const textX = margin + 8;
    const textWidth = 78;

    // Nome do Empreendimento
    doc.setFontSize(15);
    doc.setTextColor(28, 25, 23);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(briefing.empreendimento, textWidth);
    doc.text(titleLines, textX, currentY + 28);

    // Serviço
    const servicoNome = briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico;
    const titleHeightOffset = (titleLines.length - 1) * 6;
    doc.setFontSize(12);
    doc.setTextColor(184, 106, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Serviço: ${servicoNome}`, textX, currentY + 38 + titleHeightOffset);

    // Right Column: Foto do Produto
    const boxW = 86;
    const boxH = 64;
    const boxX = margin + contentWidth - boxW - 5;
    const boxY = currentY + 5;

    // Box de fundo da imagem
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'FD');

    if (primaryFinal) {
      try {
        const imgInfo = await getProductImage(primaryFinal.url, primaryFinal.nome);
        if (imgInfo && imgInfo.dataUrl) {
          const imgRatio = imgInfo.width / imgInfo.height;
          const innerW = boxW - 4;
          const innerH = boxH - 4;
          const boxRatio = innerW / innerH;
          let drawW = innerW;
          let drawH = innerH;

          if (imgRatio > boxRatio) {
            drawW = innerW;
            drawH = innerW / imgRatio;
          } else {
            drawH = innerH;
            drawW = innerH * imgRatio;
          }

          const imgX = boxX + 2 + (innerW - drawW) / 2;
          const imgY = boxY + 2 + (innerH - drawH) / 2;

          doc.addImage(imgInfo.dataUrl, 'JPEG', imgX, imgY, drawW, drawH);
        } else {
          doc.setFontSize(9);
          doc.setTextColor(156, 163, 175);
          doc.text('Visualização indisponível', boxX + 18, boxY + boxH / 2);
        }
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text('Erro na imagem', boxX + 25, boxY + boxH / 2);
      }
    }

    currentY += cardHeight + 6;
  }

  doc.save('catalogo-produtos-cesolbrief.pdf');
}
