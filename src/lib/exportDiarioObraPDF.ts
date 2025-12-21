import jsPDF from 'jspdf';
import { DiarioObra, Obra } from '@/hooks/useObras';

interface TenantInfo {
  name: string;
  logo_url?: string;
  logo_dark_url?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
}

interface ExportDiarioObraPDFParams {
  diario: DiarioObra;
  obra?: Obra | null;
  tenant: TenantInfo;
}

export const exportDiarioObraPDF = async ({
  diario,
  obra,
  tenant,
}: ExportDiarioObraPDFParams) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  
  let y = margin;
  
  const drawRect = (x: number, yPos: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(x, yPos, w, h);
  };

  const drawFilledRect = (x: number, yPos: number, w: number, h: number, color: number[] = [0, 0, 0]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, yPos, w, h, 'F');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  };

  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  const getClimaMarks = (clima?: string) => {
    return {
      bom: clima === 'bom' ? 'X' : ' ',
      chuva: clima === 'chuva' ? 'X' : ' ',
      instavel: clima === 'instavel' || clima === 'nublado' ? 'X' : ' ',
    };
  };

  // ====== HEADER SECTION ======
  const headerHeight = 28;
  
  // Outer border
  drawRect(margin, y, contentWidth, headerHeight);
  
  // Logo area (left)
  const logoWidth = 22;
  drawRect(margin, y, logoWidth, headerHeight);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGO', margin + logoWidth / 2, y + headerHeight / 2, { align: 'center' });
  
  // Company info area
  const companyInfoWidth = 48;
  const companyInfoX = margin + logoWidth;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const companyName = (tenant.name || 'EMPRESA').toUpperCase();
  doc.text(companyName, companyInfoX + companyInfoWidth / 2, y + 6, { align: 'center' });
  
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  let infoY = y + 10;
  if (tenant.address) {
    doc.text(tenant.address.substring(0, 30), companyInfoX + 2, infoY);
    infoY += 3;
  }
  if (tenant.city && tenant.state) {
    doc.text(`${tenant.city} - ${tenant.state}`, companyInfoX + 2, infoY);
    infoY += 3;
  }
  if (tenant.phone) {
    doc.text(tenant.phone, companyInfoX + 2, infoY);
  }
  
  // Title area
  const titleX = margin + logoWidth + companyInfoWidth;
  const titleWidth = 70;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO', titleX + titleWidth / 2, y + 10, { align: 'center' });
  doc.text('DIÁRIO DE OBRA', titleX + titleWidth / 2, y + 18, { align: 'center' });
  
  // Date fields area
  const dateFieldsX = titleX + titleWidth;
  const dateObj = new Date(diario.data);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text(`DIA: ${dateObj.getDate()}`, dateFieldsX + 2, y + 6);
  doc.text(formatDate(diario.data), dateFieldsX + 2, y + 10);
  doc.text(`${getDayOfWeek(diario.data)}`, dateFieldsX + 2, y + 14);
  
  // Weather area
  const weatherX = margin + contentWidth - 38;
  const weatherWidth = 38;
  drawRect(weatherX, y, weatherWidth, headerHeight);
  
  const climaManha = getClimaMarks(diario.clima_manha || diario.clima);
  const climaTarde = getClimaMarks(diario.clima_tarde);
  
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TEMPO:', weatherX + 2, y + 5);
  doc.text('M', weatherX + 20, y + 5);
  doc.text('T', weatherX + 32, y + 5);
  
  doc.setFont('helvetica', 'normal');
  const weatherY = y + 9;
  doc.text('BOM', weatherX + 2, weatherY);
  doc.text(`(${climaManha.bom})`, weatherX + 18, weatherY);
  doc.text(`(${climaTarde.bom})`, weatherX + 30, weatherY);
  
  doc.text('CHUVA', weatherX + 2, weatherY + 4);
  doc.text(`(${climaManha.chuva})`, weatherX + 18, weatherY + 4);
  doc.text(`(${climaTarde.chuva})`, weatherX + 30, weatherY + 4);
  
  doc.text('INSTÁVEL', weatherX + 2, weatherY + 8);
  doc.text(`(${climaManha.instavel})`, weatherX + 18, weatherY + 8);
  doc.text(`(${climaTarde.instavel})`, weatherX + 30, weatherY + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text(formatDate(diario.data), weatherX + weatherWidth / 2, y + 25, { align: 'center' });

  y += headerHeight;

  // ====== CONTRATANTE BAR ======
  const contractHeight = 5;
  drawFilledRect(margin, y, contentWidth, contractHeight);
  drawRect(margin, y, contentWidth, contractHeight);
  doc.setTextColor(255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const customerName = obra?.customer?.name || obra?.nome || diario.equipe_manha || '';
  doc.text(`CONTRATANTE: ${customerName.toUpperCase()}`, margin + contentWidth / 2, y + 3.5, { align: 'center' });
  doc.setTextColor(0);
  y += contractHeight;

  // ====== SHIFT INFO SECTION ======
  const leftColWidth = (contentWidth - 24) / 2;
  const centerColWidth = 24;
  const rightColWidth = leftColWidth;
  const rowH = 5;

  // Column headers
  drawFilledRect(margin, y, leftColWidth, rowH, [220, 220, 220]);
  drawFilledRect(margin + leftColWidth, y, centerColWidth, rowH, [220, 220, 220]);
  drawFilledRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH, [220, 220, 220]);
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('MANHÃ', margin + leftColWidth / 2, y + 3.5, { align: 'center' });
  doc.text('ALMOÇO', margin + leftColWidth + centerColWidth / 2, y + 3.5, { align: 'center' });
  doc.text('TARDE', margin + leftColWidth + centerColWidth + rightColWidth / 2, y + 3.5, { align: 'center' });
  y += rowH;

  // Equipe row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('Equipe:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.equipe_manha || '', margin + 12, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('HORA INÍCIO', margin + leftColWidth + centerColWidth / 2, y + 3.5, { align: 'center' });
  doc.text('Equipe:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.equipe_tarde || '', margin + leftColWidth + centerColWidth + 12, y + 3.5);
  y += rowH;

  // Veículo row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diario.veiculo_manha || ''} / ${diario.placa_manha || ''}`, margin + 14, y + 3.5);
  doc.text(diario.hora_inicio_manha || '', margin + leftColWidth + centerColWidth / 2, y + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Veículo:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diario.veiculo_tarde || ''} / ${diario.placa_tarde || ''}`, margin + leftColWidth + centerColWidth + 14, y + 3.5);
  y += rowH;

  // Motorista row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.text('Motorista:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.motorista_manha || '', margin + 16, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Motorista:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.motorista_tarde || '', margin + leftColWidth + centerColWidth + 16, y + 3.5);
  y += rowH;

  // KM row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.text('KM Ida:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_ida_manha || '', margin + 12, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Volta:', margin + 28, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_volta_manha || '', margin + 38, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('HORA FIM', margin + leftColWidth + centerColWidth / 2, y + 3.5, { align: 'center' });
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.text('KM Ida:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_ida_tarde || '', margin + leftColWidth + centerColWidth + 12, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Volta:', margin + leftColWidth + centerColWidth + 28, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_volta_tarde || '', margin + leftColWidth + centerColWidth + 38, y + 3.5);
  y += rowH;

  // KM Rodado row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('KM Rodado:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_rodado_manha || '', margin + 18, y + 3.5);
  doc.text(diario.hora_fim_manha || '', margin + leftColWidth + centerColWidth / 2, y + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('KM Rodado:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.km_rodado_tarde || '', margin + leftColWidth + centerColWidth + 18, y + 3.5);
  y += rowH;

  // Horário row
  drawRect(margin, y, leftColWidth, rowH);
  drawRect(margin + leftColWidth, y, centerColWidth, rowH);
  drawRect(margin + leftColWidth + centerColWidth, y, rightColWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.text('Horário:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diario.hora_inicio_manha || ''} - ${diario.hora_fim_manha || ''}`, margin + 14, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Horário:', margin + leftColWidth + centerColWidth + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${diario.hora_inicio_tarde || ''} - ${diario.hora_fim_tarde || ''}`, margin + leftColWidth + centerColWidth + 14, y + 3.5);
  y += rowH;

  // ====== MATERIALS RESPONSIBILITY SECTION ======
  drawFilledRect(margin, y, contentWidth, rowH, [220, 220, 220]);
  drawRect(margin, y, contentWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('RESPONSÁVEL PELA ENTREGA E RETIRADA DO MATERIAL', margin + contentWidth / 2, y + 3.5, { align: 'center' });
  y += rowH;

  const respLabelWidth = contentWidth * 0.5;
  drawRect(margin, y, respLabelWidth, rowH);
  drawRect(margin + respLabelWidth, y, contentWidth - respLabelWidth, rowH);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('Resp. Entrega:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.responsavel_entrega_materiais || '', margin + 22, y + 3.5);
  y += rowH;

  drawRect(margin, y, respLabelWidth, rowH);
  drawRect(margin + respLabelWidth, y, contentWidth - respLabelWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.text('Resp. Devolução:', margin + 1, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.responsavel_devolucao_materiais || '', margin + 25, y + 3.5);
  y += rowH;

  // ====== MATERIALS LIST SECTION ======
  drawFilledRect(margin, y, contentWidth, rowH, [220, 220, 220]);
  drawRect(margin, y, contentWidth, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.text('RELAÇÃO DE MATERIAIS / FERRAMENTAS', margin + contentWidth / 2, y + 3.5, { align: 'center' });
  y += rowH;

  const materialsHeight = 20;
  drawRect(margin, y, contentWidth, materialsHeight);
  
  const lineSpacing = 5;
  for (let i = 1; i < materialsHeight / lineSpacing; i++) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(margin, y + i * lineSpacing, margin + contentWidth, y + i * lineSpacing);
  }
  doc.setDrawColor(0);
  
  if (diario.materiais_utilizados) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const lines = doc.splitTextToSize(diario.materiais_utilizados, contentWidth - 4);
    doc.text(lines.slice(0, 4), margin + 2, y + 4);
  }
  y += materialsHeight;

  // ====== SERVICES DESCRIPTION SECTION ======
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('DESCRIÇÃO DOS SERVIÇOS EXECUTADOS', margin + contentWidth / 2, y + 4, { align: 'center' });
  y += 6;

  const servicesHeight = 40;
  drawRect(margin, y, contentWidth, servicesHeight);
  
  for (let i = 1; i < servicesHeight / lineSpacing; i++) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(margin, y + i * lineSpacing, margin + contentWidth, y + i * lineSpacing);
  }
  doc.setDrawColor(0);
  
  if (diario.atividades_realizadas) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const lines = doc.splitTextToSize(diario.atividades_realizadas, contentWidth - 4);
    doc.text(lines.slice(0, 8), margin + 2, y + 4);
  }
  y += servicesHeight;

  // ====== TEAM SIGNATURES SECTION ======
  const sigRowH = 6;
  const teamMembers = diario.equipe_assinaturas || [];
  const maxTeamRows = Math.max(3, Math.min(teamMembers.length, 6));
  
  const nameColWidth = contentWidth * 0.4;
  const funcaoColWidth = contentWidth * 0.25;
  const sigColWidth = contentWidth * 0.35;
  
  drawFilledRect(margin, y, contentWidth, sigRowH, [220, 220, 220]);
  drawRect(margin, y, nameColWidth, sigRowH);
  drawRect(margin + nameColWidth, y, funcaoColWidth, sigRowH);
  drawRect(margin + nameColWidth + funcaoColWidth, y, sigColWidth, sigRowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('NOME', margin + nameColWidth / 2, y + 4, { align: 'center' });
  doc.text('FUNÇÃO', margin + nameColWidth + funcaoColWidth / 2, y + 4, { align: 'center' });
  doc.text('ASSINATURA', margin + nameColWidth + funcaoColWidth + sigColWidth / 2, y + 4, { align: 'center' });
  y += sigRowH;

  for (let i = 0; i < maxTeamRows; i++) {
    const currentRowH = teamMembers[i]?.assinatura ? 12 : sigRowH;
    drawRect(margin, y, nameColWidth, currentRowH);
    drawRect(margin + nameColWidth, y, funcaoColWidth, currentRowH);
    drawRect(margin + nameColWidth + funcaoColWidth, y, sigColWidth, currentRowH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    if (teamMembers[i]) {
      doc.text(`${i + 1}) ${teamMembers[i].nome || ''}`, margin + 2, y + 4);
      doc.text(teamMembers[i].funcao || '', margin + nameColWidth + 2, y + 4);
      if (teamMembers[i].assinatura) {
        try {
          const sigX = margin + nameColWidth + funcaoColWidth + 2;
          const sigWidth = sigColWidth - 4;
          const sigHeight = currentRowH - 2;
          doc.addImage(teamMembers[i].assinatura, 'PNG', sigX, y + 1, sigWidth, sigHeight);
        } catch (e) {
          doc.setFontSize(4);
          doc.text('[Assinatura inválida]', margin + nameColWidth + funcaoColWidth + 2, y + 4);
        }
      }
    } else {
      doc.text(`${i + 1})`, margin + 2, y + 4);
    }
    y += currentRowH;
  }

  // ====== OCCURRENCES SECTION ======
  if (diario.ocorrencias) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('OCORRÊNCIAS', margin + contentWidth / 2, y + 4, { align: 'center' });
    y += 6;

    const occHeight = 15;
    drawRect(margin, y, contentWidth, occHeight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const lines = doc.splitTextToSize(diario.ocorrencias, contentWidth - 4);
    doc.text(lines.slice(0, 3), margin + 2, y + 4);
    y += occHeight;
  }

  // ====== FISCALIZATION SECTION ======
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('REGISTRO DA FISCALIZAÇÃO', margin + contentWidth / 2, y + 4, { align: 'center' });
  y += 6;

  const fiscHeight = 18;
  drawRect(margin, y, contentWidth, fiscHeight);
  
  for (let i = 1; i < fiscHeight / lineSpacing; i++) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.line(margin, y + i * lineSpacing, margin + contentWidth, y + i * lineSpacing);
  }
  doc.setDrawColor(0);
  
  if (diario.observacao_fiscalizacao) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    const lines = doc.splitTextToSize(diario.observacao_fiscalizacao, contentWidth - 4);
    doc.text(lines.slice(0, 3), margin + 2, y + 4);
  }
  y += fiscHeight;

  // Supervisor signature row
  const fiscSignH = diario.supervisor_signature ? 18 : 10;
  drawRect(margin, y, contentWidth / 2, fiscSignH);
  drawRect(margin + contentWidth / 2, y, contentWidth / 2, fiscSignH);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURA DO SUPERVISOR:', margin + 2, y + 4);
  if (diario.supervisor_signature) {
    try {
      const supSigWidth = (contentWidth / 2) - 6;
      const supSigHeight = fiscSignH - 8;
      doc.addImage(diario.supervisor_signature, 'PNG', margin + 2, y + 6, supSigWidth, supSigHeight);
    } catch (e) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.text('[Assinatura inválida]', margin + 2, y + 8);
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', margin + contentWidth / 2 + 2, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(diario.status === 'validado' ? 'VALIDADO' : 'ABERTO', margin + contentWidth / 2 + 15, y + 4);
  if (diario.validated_at) {
    doc.setFontSize(4);
    doc.text(`Validado em: ${formatDateTime(diario.validated_at)}`, margin + contentWidth / 2 + 2, y + 8);
  }

  // Save PDF
  const obraName = obra?.nome?.replace(/\s+/g, '_') || diario.equipe_manha?.replace(/\s+/g, '_') || 'Geral';
  const fileName = `Diario_Obra_${obraName}_${diario.data}.pdf`;
  doc.save(fileName);
};
