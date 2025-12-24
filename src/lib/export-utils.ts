/**
 * Unified Export Utilities
 * Centralized helpers for PDF and Excel exports
 */

import jsPDF from 'jspdf';
import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============= TYPES =============

export interface ExportCompanyInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  logo_url?: string;
}

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

export interface PDFExportConfig {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  company?: ExportCompanyInfo;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summary?: { label: string; value: string }[];
  filename: string;
}

export interface ExcelExportConfig {
  sheetName: string;
  title?: string;
  company?: ExportCompanyInfo;
  columns: ExportColumn[];
  data: Record<string, any>[];
  filename: string;
  styled?: boolean;
}

// ============= EXCEL STYLES =============

const excelBorder = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const excelHeaderStyle = {
  font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1E3A5F' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: excelBorder,
};

const excelCellStyle = {
  font: { sz: 9 },
  alignment: { vertical: 'center', wrapText: true },
  border: excelBorder,
};

const excelCellCenter = {
  font: { sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: excelBorder,
};

const excelTitleStyle = {
  font: { bold: true, sz: 14, color: { rgb: '1E3A5F' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

// ============= HELPERS =============

/**
 * Format date to Brazilian format
 */
export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Format datetime to Brazilian format
 */
export function formatDateTimeBR(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '-';
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(base: string, extension: 'pdf' | 'xlsx' | 'csv'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  return `${base}_${timestamp}.${extension}`;
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// ============= PDF EXPORT =============

/**
 * Export data to PDF using jsPDF
 */
export function exportToPDF(config: PDFExportConfig): void {
  const { title, subtitle, orientation = 'portrait', company, columns, data, summary, filename } = config;
  
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header with company info
  if (company?.name) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(company.name, pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (company.address || company.city || company.state) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const address = [company.address, company.city, company.state].filter(Boolean).join(' - ');
      doc.text(address, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }
  }

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(title, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Subtitle
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }

  // Date
  doc.setFontSize(8);
  doc.text(`Gerado em: ${formatDateTimeBR(new Date())}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Summary
  if (summary && summary.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Resumo:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    summary.forEach((item, idx) => {
      const x = margin + (idx % 4) * 60;
      if (idx > 0 && idx % 4 === 0) y += 5;
      doc.text(`${item.label}: ${item.value}`, x, y);
    });
    y += 8;
  }

  // Table
  const colCount = columns.length;
  const availableWidth = pageWidth - margin * 2;
  const defaultColWidth = availableWidth / colCount;
  const colWidths = columns.map(col => col.width || defaultColWidth);
  const rowHeight = 6;

  // Table header
  doc.setFillColor(30, 58, 95);
  doc.rect(margin, y, availableWidth, rowHeight, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let x = margin;
  columns.forEach((col, idx) => {
    doc.text(col.header, x + 2, y + 4);
    x += colWidths[idx];
  });
  y += rowHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  data.forEach((row, rowIdx) => {
    // Check for page break
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    // Alternate row colors
    if (rowIdx % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, availableWidth, rowHeight, 'F');
    }

    x = margin;
    columns.forEach((col, colIdx) => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      const text = String(value ?? '-');
      const truncated = text.length > 30 ? text.substring(0, 27) + '...' : text;
      doc.text(truncated, x + 2, y + 4);
      x += colWidths[colIdx];
    });
    y += rowHeight;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(filename);
}

// ============= EXCEL EXPORT =============

/**
 * Export data to styled Excel using xlsx-js-style
 */
export function exportToExcel(config: ExcelExportConfig): void {
  const { sheetName, title, company, columns, data, filename, styled = true } = config;
  
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];
  let rowOffset = 0;

  // Title row
  if (title || company?.name) {
    const titleText = company?.name ? `${company.name} - ${title}` : title;
    wsData.push([{ v: titleText, s: excelTitleStyle }]);
    rowOffset++;
    wsData.push([]); // Empty row
    rowOffset++;
  }

  // Header row
  const headerRow = columns.map(col => ({
    v: col.header,
    s: styled ? excelHeaderStyle : undefined,
  }));
  wsData.push(headerRow);
  rowOffset++;

  // Data rows
  data.forEach((row, rowIdx) => {
    const dataRow = columns.map(col => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      const cellStyle = styled
        ? col.align === 'center' ? excelCellCenter : excelCellStyle
        : undefined;
      return { v: value ?? '', s: cellStyle };
    });
    wsData.push(dataRow);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // Merge title row if exists
  if (title || company?.name) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }];
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

// ============= CSV EXPORT =============

/**
 * Export data to CSV
 */
export function exportToCSV(
  columns: ExportColumn[],
  data: Record<string, any>[],
  filename: string
): void {
  const headers = columns.map(col => col.header);
  const rows = data.map(row =>
    columns.map(col => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value);
      }
      // Escape quotes and wrap in quotes if contains comma
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============= QUICK HELPERS =============

/**
 * Quick PDF export with minimal config
 */
export function quickExportPDF(
  title: string,
  columns: { key: string; header: string }[],
  data: Record<string, any>[],
  company?: ExportCompanyInfo
): void {
  exportToPDF({
    title,
    company,
    columns,
    data,
    filename: generateFilename(sanitizeFilename(title), 'pdf'),
  });
}

/**
 * Quick Excel export with minimal config
 */
export function quickExportExcel(
  title: string,
  columns: { key: string; header: string }[],
  data: Record<string, any>[],
  company?: ExportCompanyInfo
): void {
  exportToExcel({
    sheetName: title.substring(0, 31), // Excel sheet name limit
    title,
    company,
    columns,
    data,
    filename: generateFilename(sanitizeFilename(title), 'xlsx'),
  });
}

/**
 * Quick CSV export with minimal config
 */
export function quickExportCSV(
  title: string,
  columns: { key: string; header: string }[],
  data: Record<string, any>[]
): void {
  exportToCSV(columns, data, generateFilename(sanitizeFilename(title), 'csv'));
}
