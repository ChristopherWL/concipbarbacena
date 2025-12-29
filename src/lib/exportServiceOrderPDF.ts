import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceOrder, SERVICE_ORDER_STATUS_LABELS, PRIORITY_LABELS } from '@/types/serviceOrders';

interface CompanyInfo {
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export function exportServiceOrderPDF(order: ServiceOrder, company: CompanyInfo): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Company Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text(company.name || 'Empresa', pageWidth / 2, y, { align: 'center' });
  y += 6;

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
  y += 8;

  // Order Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('ORDEM DE SERVIÇO', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Order Number
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Nº ${order.order_number.toString().padStart(5, '0')}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Order Info Box
  const boxStartY = y;
  const boxHeight = 45;
  doc.setFillColor(248, 249, 250);
  doc.rect(15, y, pageWidth - 30, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(15, y, pageWidth - 30, boxHeight);
  y += 6;

  const leftCol = 20;
  const rightCol = pageWidth / 2 + 5;

  // Left Column
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Status:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(SERVICE_ORDER_STATUS_LABELS[order.status] || order.status, leftCol + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Prioridade:', rightCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(PRIORITY_LABELS[order.priority] || order.priority, rightCol + 30, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Data de Criação:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }), leftCol + 38, y);

  if (order.scheduled_date) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Agendamento:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(format(new Date(order.scheduled_date), 'dd/MM/yyyy', { locale: ptBR }), rightCol + 32, y);
  }
  y += 7;

  if (order.started_at) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Início:', leftCol, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(format(new Date(order.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }), leftCol + 20, y);
  }

  if (order.completed_at) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('Conclusão:', rightCol, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(format(new Date(order.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }), rightCol + 28, y);
  }
  y += 7;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Título:', leftCol, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  const titleLines = doc.splitTextToSize(order.title, pageWidth - 60);
  doc.text(titleLines[0], leftCol + 18, y);
  
  y = boxStartY + boxHeight + 10;

  // Customer Section
  if (order.customer) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('CLIENTE', 15, y);
    y += 6;

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(15, y, 50, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`Nome: ${order.customer.name}`, 15, y);
    y += 5;

    if (order.customer.document) {
      doc.text(`Documento: ${order.customer.document}`, 15, y);
      y += 5;
    }

    if (order.customer.phone) {
      doc.text(`Telefone: ${order.customer.phone}`, 15, y);
      y += 5;
    }

    if (order.customer.email) {
      doc.text(`Email: ${order.customer.email}`, 15, y);
      y += 5;
    }

    y += 5;
  }

  // Address Section
  if (order.address) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('ENDEREÇO DO SERVIÇO', 15, y);
    y += 6;

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(15, y, 80, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const addressParts = [order.address, order.city, order.state].filter(Boolean);
    doc.text(addressParts.join(', '), 15, y);
    y += 10;
  }

  // Description Section
  if (order.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('DESCRIÇÃO', 15, y);
    y += 6;

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(15, y, 55, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const descLines = doc.splitTextToSize(order.description, pageWidth - 30);
    doc.text(descLines, 15, y);
    y += descLines.length * 5 + 5;
  }

  // Notes Section
  if (order.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('OBSERVAÇÕES', 15, y);
    y += 6;

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(15, y, 60, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const notesLines = doc.splitTextToSize(order.notes, pageWidth - 30);
    doc.text(notesLines, 15, y);
    y += notesLines.length * 5 + 10;
  }

  // Signature Section
  if (order.signature_url) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('ASSINATURA DE CONCLUSÃO', 15, y);
    y += 6;

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(15, y, 90, y);
    y += 10;

    // Signature placeholder
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(15, y, 80, 25);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Assinatura digital registrada no sistema', 55, y + 15, { align: 'center' });
    y += 30;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    15,
    pageHeight - 15
  );
  doc.text('Documento gerado automaticamente pelo sistema', pageWidth - 15, pageHeight - 15, { align: 'right' });

  // Save
  const filename = `OS_${order.order_number.toString().padStart(5, '0')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
