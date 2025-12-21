import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TenantInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface ColaboradorInfo {
  name: string;
  position?: string;
  hire_date?: string;
  termination_date?: string;
  department?: string;
}

interface FerramentaAssignment {
  quantity: number;
  description: string;
  serial_number?: string;
  delivery_date: string;
  return_date?: string;
  return_reason?: string;
  condition_delivery?: string;
  condition_return?: string;
}

const border = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
};

const headerStyle = {
  font: { bold: true, sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border,
};

const cellStyle = {
  font: { sz: 9 },
  alignment: { vertical: 'center', wrapText: true },
  border,
};

const cellCenter = {
  font: { sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border,
};

export function exportFichaFerramentas(
  tenant: TenantInfo,
  colaborador: ColaboradorInfo,
  ferramentasAssignments: FerramentaAssignment[]
) {
  const wb = XLSX.utils.book_new();
  const address = [tenant.address, tenant.city, tenant.state].filter(Boolean).join(' - ');
  const admissao = colaborador.hire_date ? format(new Date(colaborador.hire_date), 'dd/MM/yyyy', { locale: ptBR }) : '';
  const demissao = colaborador.termination_date ? format(new Date(colaborador.termination_date), 'dd/MM/yyyy', { locale: ptBR }) : '';

  const wsData: any[][] = [];

  // Row 0: Header
  wsData.push([
    { v: tenant.name || '', s: { ...cellStyle, font: { bold: true, sz: 11 } } },
    { v: '', s: cellStyle },
    { v: 'ENDEREÇO DA EMPRESA', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
  ]);

  // Row 1: Address
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: address || '', s: cellCenter },
    { v: '', s: cellCenter },
    { v: '', s: cellCenter },
    { v: '', s: cellCenter },
    { v: '', s: cellCenter },
  ]);

  // Row 2: Declaration
  const declaration = "Declaro que recebi as ferramentas relacionadas abaixo e assumo integral responsabilidade sobre as mesmas. Nos casos de perda, extravio ou danos provenientes de negligência, fico obrigado a ressarcir a empresa o valor apurado na ocasião (Parágrafo 1º art. 462 da CLT).";
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: declaration, s: { ...cellStyle, alignment: { vertical: 'top', wrapText: true } } },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 3: Signature
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: 'Assinatura do Colaborador: x_______________________________________________', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 4: Title
  wsData.push([
    { v: 'FICHA DE CONTROLE INDIVIDUAL DE FERRAMENTAS', s: { ...headerStyle, font: { bold: true, sz: 10 } } },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
  ]);

  // Row 5: Nome + Função
  wsData.push([
    { v: 'Nome:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.name || '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: 'Função:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.position || '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 6: ADMISSÃO + DEMISSÃO + Setor
  wsData.push([
    { v: 'ADMISSÃO:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: admissao, s: cellCenter },
    { v: 'DEMISSÃO:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: demissao, s: cellCenter },
    { v: 'Setor:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.department || '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 7: Table header
  wsData.push([
    { v: 'Quant.', s: headerStyle },
    { v: 'Descrição da Ferramenta', s: headerStyle },
    { v: 'Nº Série', s: headerStyle },
    { v: 'Entrega', s: headerStyle },
    { v: 'Devolução', s: headerStyle },
    { v: 'Assinatura do Recebimento', s: headerStyle },
    { v: '', s: headerStyle },
  ]);

  // Data rows
  const minRows = 15;
  const totalRows = Math.max(minRows, ferramentasAssignments.length);
  
  for (let i = 0; i < totalRows; i++) {
    const item = ferramentasAssignments[i];
    if (item) {
      wsData.push([
        { v: item.quantity, s: cellCenter },
        { v: item.description, s: cellStyle },
        { v: item.serial_number || '', s: cellCenter },
        { v: item.delivery_date ? format(new Date(item.delivery_date), 'dd/MM/yyyy', { locale: ptBR }) : '', s: cellCenter },
        { v: item.return_date ? format(new Date(item.return_date), 'dd/MM/yyyy', { locale: ptBR }) : '', s: cellCenter },
        { v: 'x', s: cellCenter },
        { v: '', s: cellStyle },
      ]);
    } else {
      wsData.push([
        { v: '', s: cellStyle },
        { v: '', s: cellStyle },
        { v: '', s: cellStyle },
        { v: '', s: cellStyle },
        { v: '', s: cellStyle },
        { v: 'x', s: cellCenter },
        { v: '', s: cellStyle },
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 28 },
    { wch: 8 },
  ];

  ws['!rows'] = [];
  for (let i = 0; i < wsData.length; i++) {
    ws['!rows'][i] = { hpt: i === 2 ? 40 : 16 };
  }

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 0, c: 2 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 2 }, e: { r: 2, c: 6 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: 6 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 2 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 6 } },
    { s: { r: 6, c: 5 }, e: { r: 6, c: 6 } },
    { s: { r: 7, c: 5 }, e: { r: 7, c: 6 } },
  ];

  const dataStartRow = 8;
  for (let i = 0; i < totalRows; i++) {
    ws['!merges']?.push({ s: { r: dataStartRow + i, c: 5 }, e: { r: dataStartRow + i, c: 6 } });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Ficha Ferramentas');

  const fileName = `Ficha_Ferramentas_${colaborador.name?.replace(/\s+/g, '_') || 'Colaborador'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
