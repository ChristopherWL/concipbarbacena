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
