import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanyInfo {
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

interface ReportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => string;
}

interface ReportConfig {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  data: any[];
  summary?: { label: string; value: string }[];
  orientation?: 'portrait' | 'landscape';
}

// Helper to add company header
function addCompanyHeader(doc: jsPDF, company: CompanyInfo, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95); // Dark blue
  doc.text(company.name || 'Empresa', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  if (company.cnpj) {
    doc.text(`CNPJ: ${company.cnpj}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  if (company.address || company.city) {
    const addressParts = [company.address, company.city, company.state].filter(Boolean);
    doc.text(addressParts.join(' - '), pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  if (company.phone || company.email) {
    const contactParts = [company.phone, company.email].filter(Boolean);
    doc.text(contactParts.join(' | '), pageWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Separator line
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  return y;
}

// Helper to add report title
function addReportTitle(doc: jsPDF, config: ReportConfig, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(config.title, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Subtitle
  if (config.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(config.subtitle, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Generation date
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 8;

  return y;
}

// Helper to draw table
function drawTable(doc: jsPDF, config: ReportConfig, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const tableWidth = pageWidth - marginLeft - marginRight;
  const rowHeight = 7;
  const headerHeight = 8;
  let y = startY;

  // Calculate column widths
  const totalDefinedWidth = config.columns.reduce((sum, col) => sum + (col.width || 0), 0);
  const undefinedCount = config.columns.filter(col => !col.width).length;
  const remainingWidth = tableWidth - totalDefinedWidth;
  const defaultWidth = undefinedCount > 0 ? remainingWidth / undefinedCount : 0;

  const columnWidths = config.columns.map(col => col.width || defaultWidth);

  // Draw header background
  doc.setFillColor(30, 58, 95); // Dark blue
  doc.rect(marginLeft, y, tableWidth, headerHeight, 'F');

  // Draw header text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let x = marginLeft;
  config.columns.forEach((col, i) => {
    const textX = col.align === 'right' ? x + columnWidths[i] - 2 : col.align === 'center' ? x + columnWidths[i] / 2 : x + 2;
    const align = col.align || 'left';
    doc.text(col.header, textX, y + 5.5, { align });
    x += columnWidths[i];
  });

  y += headerHeight;

  // Draw data rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(7);

  config.data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y + rowHeight > pageHeight - 25) {
      doc.addPage();
      y = 20;

      // Redraw header on new page
      doc.setFillColor(30, 58, 95);
      doc.rect(marginLeft, y, tableWidth, headerHeight, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);

      let hx = marginLeft;
      config.columns.forEach((col, i) => {
        const textX = col.align === 'right' ? hx + columnWidths[i] - 2 : col.align === 'center' ? hx + columnWidths[i] / 2 : hx + 2;
        doc.text(col.header, textX, y + 5.5, { align: col.align || 'left' });
        hx += columnWidths[i];
      });

      y += headerHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(7);
    }

    // Alternating row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginLeft, y, tableWidth, rowHeight, 'F');
    }

    // Draw cell content
    x = marginLeft;
    config.columns.forEach((col, i) => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      value = value?.toString() || '-';

      // Truncate long text
      const maxChars = Math.floor(columnWidths[i] / 2);
      if (value.length > maxChars) {
        value = value.substring(0, maxChars - 2) + '...';
      }

      const textX = col.align === 'right' ? x + columnWidths[i] - 2 : col.align === 'center' ? x + columnWidths[i] / 2 : x + 2;
      doc.text(value, textX, y + 4.5, { align: col.align || 'left' });
      x += columnWidths[i];
    });

    // Row border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(marginLeft, y + rowHeight, marginLeft + tableWidth, y + rowHeight);

    y += rowHeight;
  });

  // Table border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, startY, tableWidth, y - startY);

  return y + 5;
}

// Helper to add summary section
function addSummary(doc: jsPDF, summary: { label: string; value: string }[], startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  summary.forEach(item => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(item.label + ':', 15, y);

    doc.setFont('helvetica', 'normal');
    doc.text(item.value, 60, y);
    y += 5;
  });

  return y;
}

// Helper to add footer
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    // Page number
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Document info
    doc.text('Documento gerado automaticamente pelo sistema', 15, pageHeight - 10);
  }
}

// Main export function
export function exportToPDF(company: CompanyInfo, config: ReportConfig): void {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = 15;

  // Add company header
  y = addCompanyHeader(doc, company, y);

  // Add report title
  y = addReportTitle(doc, config, y);

  // Add table
  if (config.data.length > 0) {
    y = drawTable(doc, config, y);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum registro encontrado.', doc.internal.pageSize.getWidth() / 2, y + 10, { align: 'center' });
    y += 20;
  }

  // Add summary
  if (config.summary && config.summary.length > 0) {
    y = addSummary(doc, config.summary, y);
  }

  // Add footer to all pages
  addFooter(doc);

  // Save
  const filename = `${config.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Specific report exports
export function exportRelatorioObras(
  company: CompanyInfo,
  obras: any[],
  formatCurrency: (value: number) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de Obras',
    subtitle: 'Acompanhamento de projetos e obras em andamento',
    orientation: 'landscape',
    columns: [
      { header: 'Nome da Obra', key: 'nome', width: 50 },
      { 
        header: 'Status', 
        key: 'status', 
        width: 25,
        format: (value) => {
          const statusLabels: Record<string, string> = {
            planejada: 'Planejada',
            em_andamento: 'Em Andamento',
            pausada: 'Pausada',
            concluida: 'Concluída',
            cancelada: 'Cancelada',
          };
          return statusLabels[value] || value;
        }
      },
      { 
        header: 'Progresso', 
        key: 'progresso', 
        width: 20, 
        align: 'center',
        format: (value) => `${value || 0}%`
      },
      { 
        header: 'Data Início', 
        key: 'data_inicio', 
        width: 25,
        format: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '-'
      },
      { 
        header: 'Previsão Término', 
        key: 'previsao_termino', 
        width: 25,
        format: (value) => value ? format(new Date(value), 'dd/MM/yyyy') : '-'
      },
      { header: 'Cidade', key: 'cidade', width: 35 },
      { header: 'Estado', key: 'estado', width: 15, align: 'center' },
      { 
        header: 'Valor Contrato', 
        key: 'valor_contrato', 
        width: 30, 
        align: 'right',
        format: (value) => value ? formatCurrency(value) : '-'
      },
    ],
    data: obras,
    summary: [
      { label: 'Total de obras', value: obras.length.toString() },
      { 
        label: 'Em andamento', 
        value: obras.filter(o => o.status === 'em_andamento').length.toString() 
      },
      { 
        label: 'Concluídas', 
        value: obras.filter(o => o.status === 'concluida').length.toString() 
      },
      { 
        label: 'Valor total', 
        value: formatCurrency(obras.reduce((acc, o) => acc + (o.valor_contrato || 0), 0))
      },
    ],
  };

  exportToPDF(company, config);
}

export function exportRelatorioMovimentacoes(
  company: CompanyInfo,
  movements: any[],
  formatDate: (date: string) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de Movimentações',
    subtitle: 'Histórico de entradas e saídas de estoque',
    orientation: 'landscape',
    columns: [
      { 
        header: 'Data/Hora', 
        key: 'created_at', 
        width: 35,
        format: (value) => formatDate(value)
      },
      { header: 'Produto', key: 'product', width: 50, format: (_, row) => row.product?.name || '-' },
      { 
        header: 'Tipo', 
        key: 'movement_type', 
        width: 25,
        format: (value) => {
          const types: Record<string, string> = {
            entrada: 'Entrada',
            saida: 'Saída',
            transferencia: 'Transferência',
            ajuste: 'Ajuste',
            devolucao: 'Devolução',
          };
          return types[value] || value;
        }
      },
      { header: 'Quantidade', key: 'quantity', width: 20, align: 'center' },
      { header: 'Estoque Anterior', key: 'previous_stock', width: 25, align: 'center' },
      { header: 'Estoque Atual', key: 'new_stock', width: 25, align: 'center' },
      { header: 'Motivo', key: 'reason', width: 60 },
    ],
    data: movements,
    summary: [
      { label: 'Total de movimentações', value: movements.length.toString() },
      { 
        label: 'Entradas', 
        value: movements.filter(m => m.movement_type === 'entrada').length.toString() 
      },
      { 
        label: 'Saídas', 
        value: movements.filter(m => m.movement_type === 'saida').length.toString() 
      },
    ],
  };

  exportToPDF(company, config);
}

export function exportRelatorioEstoque(
  company: CompanyInfo,
  products: any[],
  formatCurrency: (value: number) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de Estoque',
    subtitle: 'Inventário completo de produtos',
    orientation: 'landscape',
    columns: [
      { header: 'Código', key: 'code', width: 25 },
      { header: 'Produto', key: 'name', width: 60 },
      { 
        header: 'Categoria', 
        key: 'category', 
        width: 25,
        format: (value) => value?.toUpperCase() || '-'
      },
      { header: 'Unidade', key: 'unit', width: 15, align: 'center' },
      { header: 'Estoque Atual', key: 'current_stock', width: 25, align: 'center' },
      { header: 'Estoque Mínimo', key: 'min_stock', width: 25, align: 'center' },
      { 
        header: 'Valor Unit.', 
        key: 'unit_price', 
        width: 25, 
        align: 'right',
        format: (value) => value ? formatCurrency(value) : '-'
      },
      { 
        header: 'Valor Total', 
        key: 'total_value', 
        width: 30, 
        align: 'right',
        format: (_, row) => formatCurrency((row.current_stock || 0) * (row.unit_price || 0))
      },
    ],
    data: products,
    summary: [
      { label: 'Total de produtos', value: products.length.toString() },
      { 
        label: 'Itens em estoque', 
        value: products.reduce((acc, p) => acc + (p.current_stock || 0), 0).toString() 
      },
      { 
        label: 'Valor total do estoque', 
        value: formatCurrency(products.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.unit_price || 0)), 0))
      },
      { 
        label: 'Itens abaixo do mínimo', 
        value: products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length.toString()
      },
    ],
  };

  exportToPDF(company, config);
}

export function exportRelatorioEPI(
  company: CompanyInfo,
  assignments: any[],
  formatDate: (date: string) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de EPI',
    subtitle: 'Equipamentos de Proteção Individual entregues',
    orientation: 'landscape',
    columns: [
      { header: 'Colaborador', key: 'employee', width: 45, format: (_, row) => row.employee?.name || '-' },
      { header: 'Cargo', key: 'position', width: 30, format: (_, row) => row.employee?.position || '-' },
      { header: 'EPI', key: 'description', width: 50 },
      { header: 'CA', key: 'ca_number', width: 20, align: 'center' },
      { header: 'Tamanho', key: 'size', width: 15, align: 'center' },
      { header: 'Qtd', key: 'quantity', width: 12, align: 'center' },
      { 
        header: 'Entrega', 
        key: 'delivery_date', 
        width: 22,
        format: (value) => formatDate(value)
      },
      { 
        header: 'Devolução', 
        key: 'return_date', 
        width: 22,
        format: (value) => value ? formatDate(value) : '-'
      },
    ],
    data: assignments,
    summary: [
      { label: 'Total de entregas', value: assignments.length.toString() },
      { 
        label: 'Colaboradores atendidos', 
        value: new Set(assignments.map(a => a.employee_id)).size.toString()
      },
      { 
        label: 'Pendentes de devolução', 
        value: assignments.filter(a => !a.return_date).length.toString()
      },
    ],
  };

  exportToPDF(company, config);
}

export function exportRelatorioFerramentas(
  company: CompanyInfo,
  assignments: any[],
  formatDate: (date: string) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de Ferramentas',
    subtitle: 'Ferramentas e equipamentos entregues aos colaboradores',
    orientation: 'landscape',
    columns: [
      { header: 'Colaborador', key: 'employee', width: 45, format: (_, row) => row.employee?.name || '-' },
      { header: 'Cargo', key: 'position', width: 30, format: (_, row) => row.employee?.position || '-' },
      { header: 'Ferramenta', key: 'description', width: 50 },
      { header: 'Nº Série', key: 'serial_number', width: 25 },
      { header: 'Qtd', key: 'quantity', width: 12, align: 'center' },
      { 
        header: 'Entrega', 
        key: 'delivery_date', 
        width: 22,
        format: (value) => formatDate(value)
      },
      { 
        header: 'Devolução', 
        key: 'return_date', 
        width: 22,
        format: (value) => value ? formatDate(value) : '-'
      },
      { header: 'Estado Entrega', key: 'condition_delivery', width: 25 },
    ],
    data: assignments,
    summary: [
      { label: 'Total de entregas', value: assignments.length.toString() },
      { 
        label: 'Colaboradores atendidos', 
        value: new Set(assignments.map(a => a.employee_id)).size.toString()
      },
      { 
        label: 'Pendentes de devolução', 
        value: assignments.filter(a => !a.return_date).length.toString()
      },
    ],
  };

  exportToPDF(company, config);
}

export function exportRelatorioEPC(
  company: CompanyInfo,
  assignments: any[],
  formatDate: (date: string) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de EPC',
    subtitle: 'Equipamentos de Proteção Coletiva',
    orientation: 'landscape',
    columns: [
      { header: 'Colaborador', key: 'employee', width: 40, format: (_, row) => row.employee?.name || '-' },
      { header: 'EPC', key: 'description', width: 50 },
      { header: 'Nº Série', key: 'serial_number', width: 25 },
      { header: 'Local', key: 'location', width: 35 },
      { header: 'Qtd', key: 'quantity', width: 12, align: 'center' },
      { 
        header: 'Entrega', 
        key: 'delivery_date', 
        width: 22,
        format: (value) => formatDate(value)
      },
      { 
        header: 'Devolução', 
        key: 'return_date', 
        width: 22,
        format: (value) => value ? formatDate(value) : '-'
      },
      { header: 'Estado Entrega', key: 'condition_delivery', width: 25 },
    ],
    data: assignments,
    summary: [
      { label: 'Total de entregas', value: assignments.length.toString() },
      { 
        label: 'Pendentes de devolução', 
        value: assignments.filter(a => !a.return_date).length.toString()
      },
    ],
  };

  exportToPDF(company, config);
}

// Individual report exports - Detailed reports for single items

// Individual Obra Report
export function exportRelatorioObraIndividual(
  company: CompanyInfo,
  obra: any,
  etapas: any[],
  formatCurrency: (value: number) => string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Company header
  y = addCompanyHeader(doc, company, y);

  // Report title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Relatório Individual de Obra', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Generation date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 10;

  // Obra info section
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 45);
  y += 6;

  // Obra name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(obra.nome || 'Obra sem nome', 20, y);
  y += 6;

  // Status badge
  const statusLabels: Record<string, string> = {
    planejada: 'Planejada',
    em_andamento: 'Em Andamento',
    pausada: 'Pausada',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  };
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Status: ${statusLabels[obra.status] || obra.status}`, 20, y);
  doc.text(`Progresso: ${obra.progresso || 0}%`, 80, y);
  y += 5;

  // Details grid
  doc.setFontSize(8);
  const leftCol = 20;
  const rightCol = 110;

  const addField = (label: string, value: string, x: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', x + doc.getTextWidth(`${label}: `), y);
  };

  addField('Data Início', obra.data_inicio ? format(new Date(obra.data_inicio), 'dd/MM/yyyy') : '-', leftCol);
  addField('Previsão Término', obra.previsao_termino ? format(new Date(obra.previsao_termino), 'dd/MM/yyyy') : '-', rightCol);
  y += 5;
  addField('Cidade', obra.cidade || '-', leftCol);
  addField('Estado', obra.estado || '-', rightCol);
  y += 5;
  addField('Endereço', obra.endereco || '-', leftCol);
  y += 5;
  addField('Valor do Contrato', obra.valor_contrato ? formatCurrency(obra.valor_contrato) : '-', leftCol);
  y += 5;

  // Description
  if (obra.descricao) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição:', leftCol, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(obra.descricao, pageWidth - 40);
    doc.text(lines.slice(0, 2), leftCol, y);
    y += lines.slice(0, 2).length * 4;
  }

  y += 12;

  // Etapas section
  if (etapas && etapas.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Etapas da Obra', 15, y);
    y += 6;

    // Etapas table
    const etapasConfig: ReportConfig = {
      title: '',
      columns: [
        { header: 'Ordem', key: 'ordem', width: 15, align: 'center' },
        { header: 'Etapa', key: 'nome', width: 60 },
        { 
          header: 'Status', 
          key: 'status', 
          width: 25,
          format: (value) => {
            const labels: Record<string, string> = {
              pendente: 'Pendente',
              em_andamento: 'Em Andamento',
              concluida: 'Concluída',
            };
            return labels[value] || value;
          }
        },
        { header: 'Peso %', key: 'percentual_peso', width: 15, align: 'center', format: (v) => `${v || 0}%` },
        { header: 'Início Previsto', key: 'data_inicio_prevista', width: 25, format: (v) => v ? format(new Date(v), 'dd/MM/yy') : '-' },
        { header: 'Fim Previsto', key: 'data_fim_prevista', width: 25, format: (v) => v ? format(new Date(v), 'dd/MM/yy') : '-' },
      ],
      data: etapas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
    };

    y = drawTable(doc, etapasConfig, y);
  }

  // Summary
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo:', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de etapas: ${etapas?.length || 0}`, 15, y);
  y += 4;
  doc.text(`Etapas concluídas: ${etapas?.filter(e => e.status === 'concluida').length || 0}`, 15, y);
  y += 4;
  doc.text(`Etapas em andamento: ${etapas?.filter(e => e.status === 'em_andamento').length || 0}`, 15, y);

  addFooter(doc);

  const filename = `obra_${obra.nome?.toLowerCase().replace(/\s+/g, '_') || 'relatorio'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Individual Movement Report
export function exportRelatorioMovimentacaoIndividual(
  company: CompanyInfo,
  movement: any
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  y = addCompanyHeader(doc, company, y);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Comprovante de Movimentação', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 12;

  // Movement details
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 50, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 50);
  y += 8;

  const typeLabels: Record<string, string> = {
    entrada: 'Entrada',
    saida: 'Saída',
    transferencia: 'Transferência',
    ajuste: 'Ajuste',
    devolucao: 'Devolução',
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(`Tipo: ${typeLabels[movement.movement_type] || movement.movement_type}`, 20, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addDetailRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 70, y);
    y += 6;
  };

  addDetailRow('Produto', movement.product?.name || '-');
  addDetailRow('Quantidade', movement.quantity?.toString() || '0');
  addDetailRow('Estoque Anterior', movement.previous_stock?.toString() || '0');
  addDetailRow('Estoque Atual', movement.new_stock?.toString() || '0');
  addDetailRow('Data/Hora', format(new Date(movement.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));

  y += 8;

  if (movement.reason) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Motivo:', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(movement.reason, pageWidth - 40);
    doc.text(lines, 15, y);
  }

  addFooter(doc);

  const filename = `movimentacao_${format(new Date(movement.created_at), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Individual Product Report
export function exportRelatorioProdutoIndividual(
  company: CompanyInfo,
  product: any,
  movements: any[],
  formatCurrency: (value: number) => string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  y = addCompanyHeader(doc, company, y);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Ficha de Produto', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Product info
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 40, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 40);
  y += 6;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(product.name || 'Produto', 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addRow = (label: string, value: string, x: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', x + doc.getTextWidth(`${label}: `), y);
  };

  addRow('Código', product.code || '-', 20);
  addRow('Categoria', product.category?.toUpperCase() || '-', 100);
  y += 5;
  addRow('Estoque Atual', product.current_stock?.toString() || '0', 20);
  addRow('Estoque Mínimo', product.min_stock?.toString() || '0', 100);
  y += 5;
  addRow('Unidade', product.unit || '-', 20);
  addRow('Valor Unitário', formatCurrency(product.unit_price || 0), 100);
  y += 5;
  addRow('Valor em Estoque', formatCurrency((product.current_stock || 0) * (product.unit_price || 0)), 20);
  y += 10;

  // Recent movements
  if (movements && movements.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Últimas Movimentações', 15, y);
    y += 6;

    const movConfig: ReportConfig = {
      title: '',
      columns: [
        { header: 'Data', key: 'created_at', width: 30, format: (v) => format(new Date(v), 'dd/MM/yy HH:mm') },
        { header: 'Tipo', key: 'movement_type', width: 25, format: (v) => {
          const types: Record<string, string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste', devolucao: 'Devolução' };
          return types[v] || v;
        }},
        { header: 'Qtd', key: 'quantity', width: 20, align: 'center' },
        { header: 'Anterior', key: 'previous_stock', width: 20, align: 'center' },
        { header: 'Atual', key: 'new_stock', width: 20, align: 'center' },
        { header: 'Motivo', key: 'reason', width: 50 },
      ],
      data: movements.slice(0, 20),
    };

    y = drawTable(doc, movConfig, y);
  }

  addFooter(doc);

  const filename = `produto_${product.code || product.name?.toLowerCase().replace(/\s+/g, '_') || 'ficha'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Individual EPI Assignment Report
export function exportRelatorioEPIIndividual(
  company: CompanyInfo,
  assignment: any
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  y = addCompanyHeader(doc, company, y);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Comprovante de Entrega de EPI', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 12;

  // Assignment details
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 55, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 55);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados do Colaborador', 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 70, y);
    y += 5;
  };

  addRow('Nome', assignment.employee?.name || '-');
  addRow('Cargo', assignment.employee?.position || '-');
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados do EPI', 20, y);
  y += 6;
  doc.setTextColor(50, 50, 50);

  addRow('Descrição', assignment.description || '-');
  addRow('Quantidade', assignment.quantity?.toString() || '1');
  addRow('Tamanho', assignment.size || '-');
  addRow('Nº CA', assignment.ca_number || '-');
  addRow('Data Entrega', format(new Date(assignment.delivery_date), 'dd/MM/yyyy'));
  if (assignment.return_date) {
    addRow('Data Devolução', format(new Date(assignment.return_date), 'dd/MM/yyyy'));
  }

  y += 10;

  // Signature area
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y + 15, 90, y + 15);
  doc.line(110, y + 15, pageWidth - 20, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Colaborador', 55, y + 20, { align: 'center' });
  doc.text('Assinatura do Responsável', (110 + pageWidth - 20) / 2, y + 20, { align: 'center' });

  addFooter(doc);

  const filename = `epi_${assignment.employee?.name?.toLowerCase().replace(/\s+/g, '_') || 'comprovante'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Individual Ferramenta Assignment Report
export function exportRelatorioFerramentaIndividual(
  company: CompanyInfo,
  assignment: any
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  y = addCompanyHeader(doc, company, y);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Comprovante de Entrega de Ferramenta', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 12;

  // Assignment details
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 60, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 60);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados do Colaborador', 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 70, y);
    y += 5;
  };

  addRow('Nome', assignment.employee?.name || '-');
  addRow('Cargo', assignment.employee?.position || '-');
  addRow('Departamento', assignment.employee?.department || '-');
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados da Ferramenta', 20, y);
  y += 6;
  doc.setTextColor(50, 50, 50);

  addRow('Descrição', assignment.description || '-');
  addRow('Quantidade', assignment.quantity?.toString() || '1');
  addRow('Nº Série', assignment.serial_number || '-');
  addRow('Estado na Entrega', assignment.condition_delivery || '-');
  addRow('Data Entrega', format(new Date(assignment.delivery_date), 'dd/MM/yyyy'));
  if (assignment.return_date) {
    addRow('Data Devolução', format(new Date(assignment.return_date), 'dd/MM/yyyy'));
    addRow('Estado na Devolução', assignment.condition_return || '-');
  }

  y += 10;

  // Signature area
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y + 15, 90, y + 15);
  doc.line(110, y + 15, pageWidth - 20, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Colaborador', 55, y + 20, { align: 'center' });
  doc.text('Assinatura do Responsável', (110 + pageWidth - 20) / 2, y + 20, { align: 'center' });

  addFooter(doc);

  const filename = `ferramenta_${assignment.employee?.name?.toLowerCase().replace(/\s+/g, '_') || 'comprovante'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Individual EPC Assignment Report
export function exportRelatorioEPCIndividual(
  company: CompanyInfo,
  assignment: any
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  y = addCompanyHeader(doc, company, y);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Comprovante de Entrega de EPC', pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 12;

  // Assignment details
  doc.setFillColor(245, 247, 250);
  doc.rect(15, y, pageWidth - 30, 60, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, pageWidth - 30, 60);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados do Colaborador', 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 70, y);
    y += 5;
  };

  addRow('Nome', assignment.employee?.name || '-');
  addRow('Cargo', assignment.employee?.position || '-');
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Dados do EPC', 20, y);
  y += 6;
  doc.setTextColor(50, 50, 50);

  addRow('Descrição', assignment.description || '-');
  addRow('Quantidade', assignment.quantity?.toString() || '1');
  addRow('Nº Série', assignment.serial_number || '-');
  addRow('Local', assignment.location || '-');
  addRow('Estado na Entrega', assignment.condition_delivery || '-');
  addRow('Data Entrega', format(new Date(assignment.delivery_date), 'dd/MM/yyyy'));
  if (assignment.return_date) {
    addRow('Data Devolução', format(new Date(assignment.return_date), 'dd/MM/yyyy'));
    addRow('Estado na Devolução', assignment.condition_return || '-');
  }

  y += 10;

  // Signature area
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, y + 15, 90, y + 15);
  doc.line(110, y + 15, pageWidth - 20, y + 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Colaborador', 55, y + 20, { align: 'center' });
  doc.text('Assinatura do Responsável', (110 + pageWidth - 20) / 2, y + 20, { align: 'center' });

  addFooter(doc);

  const filename = `epc_${assignment.employee?.name?.toLowerCase().replace(/\s+/g, '_') || 'comprovante'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

// Ficha de Controle de Saída de Material do Almoxarifado
export interface BranchInfo {
  name: string;
  cnpj?: string;
  address?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  logo_dark_url?: string;
}

export async function exportFichaControleSaidaMaterial(
  company: CompanyInfo,
  branch: BranchInfo | null,
  movements: any[],
  title: string = 'FICHA DE CONTROLE DE SAÍDA DE MATERIAL DO ALMOXARIFADO'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const tableWidth = pageWidth - marginLeft - marginRight;
  let y = 8;

  // Header box with logo and company/branch info
  const headerHeight = 28;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, tableWidth, headerHeight, 'S');

  // Logo area (left side)
  const logoWidth = 40;
  doc.setLineWidth(0.3);
  doc.line(marginLeft + logoWidth, y, marginLeft + logoWidth, y + headerHeight);

  // Try to add logo - usar logo_url (fundo claro) da filial
  const logoUrl = branch?.logo_url || company.logoUrl;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              // Calculate aspect ratio to fit in logo area
              const maxWidth = 35;
              const maxHeight = 22;
              let imgWidth = img.width;
              let imgHeight = img.height;
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              imgWidth *= ratio;
              imgHeight *= ratio;
              const imgX = marginLeft + (logoWidth - imgWidth) / 2;
              const imgY = y + (headerHeight - imgHeight) / 2;
              doc.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
            }
            resolve();
          } catch {
            resolve();
          }
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch {
      // If logo fails, just show company name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(company.name || 'Empresa', marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
    }
  } else {
    // No logo, show company name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const companyName = company.name || 'Empresa';
    const lines = doc.splitTextToSize(companyName, logoWidth - 4);
    doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2 - (lines.length - 1) * 2, { align: 'center' });
  }

  // Title area (center)
  const titleStartX = marginLeft + logoWidth;
  const titleWidth = tableWidth - logoWidth - 50; // Leave space for branch info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, titleStartX + titleWidth / 2, y + 10, { align: 'center' });

  // Branch info below title
  const branchOrCompany = branch || company;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let infoY = y + 15;
  if (branchOrCompany.cnpj) {
    doc.text(`CNPJ: ${branchOrCompany.cnpj}`, titleStartX + titleWidth / 2, infoY, { align: 'center' });
    infoY += 4;
  }

  const addressParts = [];
  if (branch?.address) addressParts.push(branch.address);
  if (branch?.number) addressParts.push(`Nº ${branch.number}`);
  if (branch?.neighborhood) addressParts.push(branch.neighborhood);
  
  if (addressParts.length > 0 || branchOrCompany.address) {
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : branchOrCompany.address;
    doc.text(addressLine || '', titleStartX + titleWidth / 2, infoY, { align: 'center' });
    infoY += 4;
  }

  const cityState = [branch?.city || company.city, branch?.state || company.state].filter(Boolean).join(' - ');
  const cep = branch?.zip_code ? ` | CEP: ${branch.zip_code}` : '';
  if (cityState) {
    doc.text(`${cityState}${cep}`, titleStartX + titleWidth / 2, infoY, { align: 'center' });
    infoY += 4;
  }

  const contact = [branch?.phone || company.phone, branch?.email || company.email].filter(Boolean).join(' | ');
  if (contact) {
    doc.text(contact, titleStartX + titleWidth / 2, infoY, { align: 'center' });
  }

  // Date area (right side) - centralizar verticalmente
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 50, y, pageWidth - marginRight - 50, y + headerHeight);
  
  const dateAreaCenterY = y + headerHeight / 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Data:', pageWidth - marginRight - 45, dateAreaCenterY - 6);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - marginRight - 45, dateAreaCenterY - 1);
  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', pageWidth - marginRight - 45, dateAreaCenterY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'HH:mm'), pageWidth - marginRight - 45, dateAreaCenterY + 10);

  y += headerHeight + 3;

  // Table header - ajustar larguras para caber no tableWidth (277mm)
  const columns = [
    { header: 'ITEM', width: 14 },
    { header: 'DATA SAÍDA', width: 24 },
    { header: 'DESCRIÇÃO DO PRODUTO', width: 75 },
    { header: 'QTD', width: 18 },
    { header: 'APLICAÇÃO', width: 40 },
    { header: 'RESPONSÁVEL', width: 55 },
    { header: 'ASSINATURA', width: 51 },
  ];

  const rowHeight = 8;
  const tableRowHeaderHeight = 8;

  // Draw header row
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let x = marginLeft;
  columns.forEach((col) => {
    // Vertical line
    doc.line(x, y, x, y + tableRowHeaderHeight);
    // Header text centered with padding
    const headerText = col.header;
    doc.text(headerText, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
    x += col.width;
  });
  // Last vertical line
  doc.line(x, y, x, y + tableRowHeaderHeight);

  y += tableRowHeaderHeight;

  // Data rows - fill with actual data or empty rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const totalRows = Math.max(movements.length, 20); // Minimum 20 rows
  
  for (let i = 0; i < totalRows; i++) {
    // Check for new page
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 12;

      // Redraw header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');

      x = marginLeft;
      columns.forEach((col) => {
        doc.line(x, y, x, y + tableRowHeaderHeight);
        doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
        x += col.width;
      });
      doc.line(x, y, x, y + tableRowHeaderHeight);

      y += tableRowHeaderHeight;
      doc.setFont('helvetica', 'normal');
    }

    // Draw row
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, y, tableWidth, rowHeight, 'S');

    x = marginLeft;
    const mov = movements[i];

    columns.forEach((col, colIndex) => {
      // Vertical line
      doc.line(x, y, x, y + rowHeight);

      // Cell content
      let value = '';
      if (mov) {
        switch (colIndex) {
          case 0: // ITEM
            value = (i + 1).toString();
            break;
          case 1: // DATA DE SAÍDA
            value = mov.date ? format(new Date(mov.date), 'dd/MM/yyyy') : '';
            break;
          case 2: // DESCRIÇÃO DO PRODUTO
            value = mov.product_name || mov.description || '';
            break;
          case 3: // QUANTIDADE
            value = mov.quantity?.toString() || '';
            break;
          case 4: // APLICAÇÃO
            value = mov.application || mov.reason || '';
            break;
          case 5: // NOME DO RESPONSÁVEL
            value = mov.responsible_name || '';
            break;
          case 6: // ASSINATURA
            value = ''; // Empty for signature
            break;
        }
      } else if (colIndex === 0) {
        value = (i + 1).toString();
      }

      // Truncate if too long - usar maxWidth para cortar automaticamente
      const maxChars = Math.floor(col.width / 2);
      if (value.length > maxChars) {
        value = value.substring(0, maxChars - 1) + '..';
      }

      if (colIndex === 0 || colIndex === 3) {
        // Center align for ITEM and QUANTIDADE
        doc.text(value, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
      } else {
        doc.text(value, x + 1.5, y + 5, { maxWidth: col.width - 3 });
      }

      x += col.width;
    });
    // Last vertical line
    doc.line(x, y, x, y + rowHeight);

    y += rowHeight;
  }

  // Footer
  addFooter(doc);

  const filename = `ficha_saida_material_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Relatório de Inventário - Formato Ficha (igual ao modelo)
export async function exportRelatorioInventarioFicha(
  company: CompanyInfo,
  branch: BranchInfo | null,
  products: any[],
  formatCurrency: (value: number) => string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const tableWidth = pageWidth - marginLeft - marginRight;
  let y = 8;

  // Header box with logo and company/branch info
  const headerHeight = 28;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, tableWidth, headerHeight, 'S');

  // Logo area (left side)
  const logoWidth = 40;
  doc.setLineWidth(0.3);
  doc.line(marginLeft + logoWidth, y, marginLeft + logoWidth, y + headerHeight);

  // Try to add logo
  const logoUrl = branch?.logo_url || company.logoUrl;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              const maxWidth = 35;
              const maxHeight = 22;
              let imgWidth = img.width;
              let imgHeight = img.height;
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              imgWidth *= ratio;
              imgHeight *= ratio;
              const imgX = marginLeft + (logoWidth - imgWidth) / 2;
              const imgY = y + (headerHeight - imgHeight) / 2;
              doc.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
            }
            resolve();
          } catch {
            resolve();
          }
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
      doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
    doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
  }

  // Title area (center)
  const titleStartX = marginLeft + logoWidth;
  const titleWidth = tableWidth - logoWidth - 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RELATÓRIO DE INVENTÁRIO - ESTOQUE TOTAL', titleStartX + titleWidth / 2, y + 10, { align: 'center' });

  // Branch info below title
  const branchOrCompany = branch || company;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  let infoY = y + 15;
  if (branchOrCompany.cnpj) {
    doc.text(`CNPJ: ${branchOrCompany.cnpj}`, titleStartX + titleWidth / 2, infoY, { align: 'center' });
    infoY += 4;
  }

  const cityState = [branch?.city || company.city, branch?.state || company.state].filter(Boolean).join(' - ');
  if (cityState) {
    doc.text(cityState, titleStartX + titleWidth / 2, infoY, { align: 'center' });
  }

  // Date area (right side)
  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 50, y, pageWidth - marginRight - 50, y + headerHeight);
  
  const dateAreaCenterY = y + headerHeight / 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Data:', pageWidth - marginRight - 45, dateAreaCenterY - 3);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - marginRight - 45, dateAreaCenterY + 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', pageWidth - marginRight - 45, dateAreaCenterY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'HH:mm'), pageWidth - marginRight - 45, dateAreaCenterY + 13);

  y += headerHeight + 3;

  // Table header
  const columns = [
    { header: 'ITEM', width: 12 },
    { header: 'CÓDIGO', width: 25 },
    { header: 'PRODUTO', width: 70 },
    { header: 'CATEGORIA', width: 28 },
    { header: 'UN', width: 15 },
    { header: 'ESTOQUE', width: 22 },
    { header: 'MÍN.', width: 18 },
    { header: 'STATUS', width: 22 },
    { header: 'VALOR UNIT.', width: 30 },
    { header: 'VALOR TOTAL', width: 35 },
  ];

  const rowHeight = 7;
  const tableRowHeaderHeight = 8;

  // Draw header row
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let x = marginLeft;
  columns.forEach((col) => {
    doc.line(x, y, x, y + tableRowHeaderHeight);
    doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
    x += col.width;
  });
  doc.line(x, y, x, y + tableRowHeaderHeight);

  y += tableRowHeaderHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { epi: 'EPI', epc: 'EPC', ferramentas: 'Ferramentas', materiais: 'Materiais', equipamentos: 'Equipamentos' };
    return labels[cat] || cat?.toUpperCase() || '-';
  };

  const getStatus = (stock: number, min: number) => {
    if (stock === 0) return 'Zerado';
    if (stock <= min) return 'Crítico';
    if (stock <= min * 1.5) return 'Baixo';
    return 'OK';
  };

  for (let i = 0; i < products.length; i++) {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 12;

      doc.setFillColor(240, 240, 240);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');

      x = marginLeft;
      columns.forEach((col) => {
        doc.line(x, y, x, y + tableRowHeaderHeight);
        doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
        x += col.width;
      });
      doc.line(x, y, x, y + tableRowHeaderHeight);

      y += tableRowHeaderHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, y, tableWidth, rowHeight, 'S');

    x = marginLeft;
    const p = products[i];
    const stock = p.current_stock || 0;
    const minStock = p.min_stock || 0;

    const rowData = [
      (i + 1).toString(),
      p.code || '-',
      p.name || '-',
      getCategoryLabel(p.category),
      p.unit || 'UN',
      stock.toString(),
      minStock.toString(),
      getStatus(stock, minStock),
      formatCurrency(p.cost_price || 0),
      formatCurrency(stock * (p.cost_price || 0)),
    ];

    rowData.forEach((value, colIndex) => {
      doc.line(x, y, x, y + rowHeight);
      const col = columns[colIndex];
      const text = value.length > Math.floor(col.width / 2) ? value.substring(0, Math.floor(col.width / 2) - 1) + '..' : value;
      
      if (colIndex === 0 || colIndex === 4 || colIndex === 5 || colIndex === 6 || colIndex === 7) {
        doc.text(text, x + col.width / 2, y + 4.5, { align: 'center', maxWidth: col.width - 2 });
      } else if (colIndex === 8 || colIndex === 9) {
        doc.text(text, x + col.width - 2, y + 4.5, { align: 'right', maxWidth: col.width - 2 });
      } else {
        doc.text(text, x + 1.5, y + 4.5, { maxWidth: col.width - 3 });
      }
      x += col.width;
    });
    doc.line(x, y, x, y + rowHeight);

    y += rowHeight;
  }

  addFooter(doc);

  const filename = `relatorio_estoque_total_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Relatório de Entradas - Formato Ficha
export async function exportRelatorioEntradasFicha(
  company: CompanyInfo,
  branch: BranchInfo | null,
  movements: any[],
  formatCurrency: (value: number) => string,
  period: { start: Date; end: Date }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const tableWidth = pageWidth - marginLeft - marginRight;
  let y = 8;

  // Header
  const headerHeight = 28;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, tableWidth, headerHeight, 'S');

  const logoWidth = 40;
  doc.setLineWidth(0.3);
  doc.line(marginLeft + logoWidth, y, marginLeft + logoWidth, y + headerHeight);

  const logoUrl = branch?.logo_url || company.logoUrl;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              const maxWidth = 35;
              const maxHeight = 22;
              let imgWidth = img.width;
              let imgHeight = img.height;
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              imgWidth *= ratio;
              imgHeight *= ratio;
              const imgX = marginLeft + (logoWidth - imgWidth) / 2;
              const imgY = y + (headerHeight - imgHeight) / 2;
              doc.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
            }
            resolve();
          } catch { resolve(); }
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
      doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
    doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
  }

  const titleStartX = marginLeft + logoWidth;
  const titleWidth = tableWidth - logoWidth - 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RELATÓRIO DE ENTRADAS NO ESTOQUE', titleStartX + titleWidth / 2, y + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Período: ${format(period.start, 'dd/MM/yyyy')} a ${format(period.end, 'dd/MM/yyyy')}`, titleStartX + titleWidth / 2, y + 17, { align: 'center' });

  const cityState = [branch?.city || company.city, branch?.state || company.state].filter(Boolean).join(' - ');
  if (cityState) {
    doc.setFontSize(7);
    doc.text(cityState, titleStartX + titleWidth / 2, y + 22, { align: 'center' });
  }

  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 50, y, pageWidth - marginRight - 50, y + headerHeight);
  
  const dateAreaCenterY = y + headerHeight / 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Data:', pageWidth - marginRight - 45, dateAreaCenterY - 3);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - marginRight - 45, dateAreaCenterY + 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', pageWidth - marginRight - 45, dateAreaCenterY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'HH:mm'), pageWidth - marginRight - 45, dateAreaCenterY + 13);

  y += headerHeight + 3;

  const columns = [
    { header: 'ITEM', width: 12 },
    { header: 'DATA/HORA', width: 32 },
    { header: 'CÓDIGO', width: 25 },
    { header: 'PRODUTO', width: 70 },
    { header: 'CATEGORIA', width: 28 },
    { header: 'TIPO', width: 25 },
    { header: 'QTD', width: 18 },
    { header: 'MOTIVO', width: 50 },
    { header: 'VALOR', width: 28 },
  ];

  const rowHeight = 7;
  const tableRowHeaderHeight = 8;

  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let x = marginLeft;
  columns.forEach((col) => {
    doc.line(x, y, x, y + tableRowHeaderHeight);
    doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
    x += col.width;
  });
  doc.line(x, y, x, y + tableRowHeaderHeight);

  y += tableRowHeaderHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { epi: 'EPI', epc: 'EPC', ferramentas: 'Ferramentas', materiais: 'Materiais', equipamentos: 'Equipamentos' };
    return labels[cat] || cat?.toUpperCase() || '-';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { entrada: 'Entrada', devolucao: 'Devolução' };
    return labels[type] || type;
  };

  for (let i = 0; i < movements.length; i++) {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 12;

      doc.setFillColor(240, 240, 240);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');

      x = marginLeft;
      columns.forEach((col) => {
        doc.line(x, y, x, y + tableRowHeaderHeight);
        doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
        x += col.width;
      });
      doc.line(x, y, x, y + tableRowHeaderHeight);

      y += tableRowHeaderHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, y, tableWidth, rowHeight, 'S');

    x = marginLeft;
    const m = movements[i];

    const rowData = [
      (i + 1).toString(),
      format(new Date(m.created_at), 'dd/MM/yy HH:mm'),
      m.product?.code || '-',
      m.product?.name || '-',
      getCategoryLabel(m.product?.category),
      getTypeLabel(m.movement_type),
      m.quantity.toString(),
      m.reason || '-',
      formatCurrency(m.quantity * (m.product?.cost_price || 0)),
    ];

    rowData.forEach((value, colIndex) => {
      doc.line(x, y, x, y + rowHeight);
      const col = columns[colIndex];
      const text = value.length > Math.floor(col.width / 2) ? value.substring(0, Math.floor(col.width / 2) - 1) + '..' : value;
      
      if (colIndex === 0 || colIndex === 6) {
        doc.text(text, x + col.width / 2, y + 4.5, { align: 'center' });
      } else if (colIndex === 8) {
        doc.text(text, x + col.width - 2, y + 4.5, { align: 'right' });
      } else {
        doc.text(text, x + 1.5, y + 4.5, { maxWidth: col.width - 3 });
      }
      x += col.width;
    });
    doc.line(x, y, x, y + rowHeight);

    y += rowHeight;
  }

  addFooter(doc);

  const filename = `relatorio_entradas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Relatório de Saídas - Formato Ficha
export async function exportRelatorioSaidasFicha(
  company: CompanyInfo,
  branch: BranchInfo | null,
  movements: any[],
  formatCurrency: (value: number) => string,
  period: { start: Date; end: Date }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const tableWidth = pageWidth - marginLeft - marginRight;
  let y = 8;

  // Header
  const headerHeight = 28;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(marginLeft, y, tableWidth, headerHeight, 'S');

  const logoWidth = 40;
  doc.setLineWidth(0.3);
  doc.line(marginLeft + logoWidth, y, marginLeft + logoWidth, y + headerHeight);

  const logoUrl = branch?.logo_url || company.logoUrl;
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              const maxWidth = 35;
              const maxHeight = 22;
              let imgWidth = img.width;
              let imgHeight = img.height;
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              imgWidth *= ratio;
              imgHeight *= ratio;
              const imgX = marginLeft + (logoWidth - imgWidth) / 2;
              const imgY = y + (headerHeight - imgHeight) / 2;
              doc.addImage(dataUrl, 'PNG', imgX, imgY, imgWidth, imgHeight);
            }
            resolve();
          } catch { resolve(); }
        };
        img.onerror = () => resolve();
        img.src = logoUrl;
      });
    } catch {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
      doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(company.name || 'Empresa', logoWidth - 4);
    doc.text(lines, marginLeft + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
  }

  const titleStartX = marginLeft + logoWidth;
  const titleWidth = tableWidth - logoWidth - 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('RELATÓRIO DE SAÍDAS DO ESTOQUE', titleStartX + titleWidth / 2, y + 10, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`Período: ${format(period.start, 'dd/MM/yyyy')} a ${format(period.end, 'dd/MM/yyyy')}`, titleStartX + titleWidth / 2, y + 17, { align: 'center' });

  const cityState = [branch?.city || company.city, branch?.state || company.state].filter(Boolean).join(' - ');
  if (cityState) {
    doc.setFontSize(7);
    doc.text(cityState, titleStartX + titleWidth / 2, y + 22, { align: 'center' });
  }

  doc.setLineWidth(0.3);
  doc.line(pageWidth - marginRight - 50, y, pageWidth - marginRight - 50, y + headerHeight);
  
  const dateAreaCenterY = y + headerHeight / 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Data:', pageWidth - marginRight - 45, dateAreaCenterY - 3);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - marginRight - 45, dateAreaCenterY + 2);
  doc.setFont('helvetica', 'bold');
  doc.text('Hora:', pageWidth - marginRight - 45, dateAreaCenterY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(), 'HH:mm'), pageWidth - marginRight - 45, dateAreaCenterY + 13);

  y += headerHeight + 3;

  const columns = [
    { header: 'ITEM', width: 12 },
    { header: 'DATA/HORA', width: 32 },
    { header: 'CÓDIGO', width: 25 },
    { header: 'PRODUTO', width: 70 },
    { header: 'CATEGORIA', width: 28 },
    { header: 'TIPO', width: 25 },
    { header: 'QTD', width: 18 },
    { header: 'MOTIVO', width: 50 },
    { header: 'VALOR', width: 28 },
  ];

  const rowHeight = 7;
  const tableRowHeaderHeight = 8;

  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  let x = marginLeft;
  columns.forEach((col) => {
    doc.line(x, y, x, y + tableRowHeaderHeight);
    doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
    x += col.width;
  });
  doc.line(x, y, x, y + tableRowHeaderHeight);

  y += tableRowHeaderHeight;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = { epi: 'EPI', epc: 'EPC', ferramentas: 'Ferramentas', materiais: 'Materiais', equipamentos: 'Equipamentos' };
    return labels[cat] || cat?.toUpperCase() || '-';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { saida: 'Saída', transferencia: 'Transferência' };
    return labels[type] || type;
  };

  for (let i = 0; i < movements.length; i++) {
    if (y + rowHeight > pageHeight - 15) {
      doc.addPage();
      y = 12;

      doc.setFillColor(240, 240, 240);
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'F');
      doc.rect(marginLeft, y, tableWidth, tableRowHeaderHeight, 'S');

      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');

      x = marginLeft;
      columns.forEach((col) => {
        doc.line(x, y, x, y + tableRowHeaderHeight);
        doc.text(col.header, x + col.width / 2, y + 5, { align: 'center', maxWidth: col.width - 2 });
        x += col.width;
      });
      doc.line(x, y, x, y + tableRowHeaderHeight);

      y += tableRowHeaderHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, y, tableWidth, rowHeight, 'S');

    x = marginLeft;
    const m = movements[i];

    const rowData = [
      (i + 1).toString(),
      format(new Date(m.created_at), 'dd/MM/yy HH:mm'),
      m.product?.code || '-',
      m.product?.name || '-',
      getCategoryLabel(m.product?.category),
      getTypeLabel(m.movement_type),
      m.quantity.toString(),
      m.reason || '-',
      formatCurrency(m.quantity * (m.product?.cost_price || 0)),
    ];

    rowData.forEach((value, colIndex) => {
      doc.line(x, y, x, y + rowHeight);
      const col = columns[colIndex];
      const text = value.length > Math.floor(col.width / 2) ? value.substring(0, Math.floor(col.width / 2) - 1) + '..' : value;
      
      if (colIndex === 0 || colIndex === 6) {
        doc.text(text, x + col.width / 2, y + 4.5, { align: 'center' });
      } else if (colIndex === 8) {
        doc.text(text, x + col.width - 2, y + 4.5, { align: 'right' });
      } else {
        doc.text(text, x + 1.5, y + 4.5, { maxWidth: col.width - 3 });
      }
      x += col.width;
    });
    doc.line(x, y, x, y + rowHeight);

    y += rowHeight;
  }

  addFooter(doc);

  const filename = `relatorio_saidas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
  doc.save(filename);
}

// Relatório de Inventário (mantido para compatibilidade)
export function exportRelatorioInventario(
  company: CompanyInfo,
  products: any[],
  formatCurrency: (value: number) => string
): void {
  const config: ReportConfig = {
    title: 'Relatório de Inventário',
    subtitle: 'Situação atual do estoque por produto',
    orientation: 'landscape',
    columns: [
      { header: 'Código', key: 'code', width: 25 },
      { header: 'Produto', key: 'name', width: 60 },
      { 
        header: 'Categoria', 
        key: 'category', 
        width: 25,
        format: (value) => {
          const labels: Record<string, string> = {
            epi: 'EPI',
            epc: 'EPC',
            ferramentas: 'Ferramentas',
            materiais: 'Materiais',
            equipamentos: 'Equipamentos',
          };
          return labels[value] || value?.toUpperCase() || '-';
        }
      },
      { header: 'Unidade', key: 'unit', width: 15, align: 'center' },
      { header: 'Estoque Atual', key: 'current_stock', width: 25, align: 'center' },
      { header: 'Estoque Mínimo', key: 'min_stock', width: 25, align: 'center' },
      { 
        header: 'Status', 
        key: 'status', 
        width: 20,
        align: 'center',
        format: (_, row) => {
          const stock = row.current_stock || 0;
          const minStock = row.min_stock || 0;
          if (stock === 0) return 'Zerado';
          if (stock <= minStock) return 'Crítico';
          if (stock <= minStock * 1.5) return 'Baixo';
          return 'OK';
        }
      },
      { 
        header: 'Valor Unit.', 
        key: 'cost_price', 
        width: 25, 
        align: 'right',
        format: (value) => value ? formatCurrency(value) : '-'
      },
      { 
        header: 'Valor Total', 
        key: 'total_value', 
        width: 30, 
        align: 'right',
        format: (_, row) => formatCurrency((row.current_stock || 0) * (row.cost_price || 0))
      },
    ],
    data: products,
    summary: [
      { label: 'Total de produtos', value: products.length.toString() },
      { 
        label: 'Itens em estoque', 
        value: products.reduce((acc, p) => acc + (p.current_stock || 0), 0).toString() 
      },
      { 
        label: 'Produtos em estado crítico', 
        value: products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length.toString()
      },
      { 
        label: 'Valor total do estoque', 
        value: formatCurrency(products.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.cost_price || 0)), 0))
      },
    ],
  };

  exportToPDF(company, config);
}
