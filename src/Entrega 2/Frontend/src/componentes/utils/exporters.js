import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderizarValorTabela } from './formatters';

export const exportarCsv = ({ nomeArquivo, colunas, dados }) => {
  if (!dados || dados.length === 0) return;

  const cabecalho = colunas.map((coluna) => coluna.label).join(';');

  const linhas = dados.map((item) => {
    return colunas
      .map((coluna) => {
        const valor = item[coluna.key] ?? '';
        const texto = String(valor).replace(/"/g, '""');
        return `"${texto}"`;
      })
      .join(';');
  });

  const csv = [cabecalho, ...linhas].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const exportarPdf = ({ titulo, descricao, nomeArquivo, colunas, dados }) => {
  if (!dados || dados.length === 0) return;

  const documento = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const dataAtual = new Date().toLocaleString('pt-BR');

  documento.setFontSize(16);
  documento.text(titulo || 'Detalhamento do Dashboard', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada do painel.', 40, 58);

  documento.setFontSize(8);
  documento.text(`Exportado em: ${dataAtual}`, 40, 74);

  autoTable(documento, {
    head: [colunas.map((coluna) => coluna.label)],
    body: dados.map((item) =>
      colunas.map((coluna) => renderizarValorTabela(coluna.key, item[coluna.key]))
    ),
    startY: 92,
    styles: {
      fontSize: 7,
      cellPadding: 4,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [242, 99, 34],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 246, 241]
    },
    margin: {
      left: 40,
      right: 40
    }
  });

  documento.save(nomeArquivo.replace('.csv', '.pdf'));
};