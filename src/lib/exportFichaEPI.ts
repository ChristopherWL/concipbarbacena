import XLSX from 'xlsx-js-style';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TenantInfo {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  logo_url?: string;
}

interface ColaboradorInfo {
  name: string;
  position?: string;
  hire_date?: string;
  termination_date?: string;
  local_trabalho?: string;
}

interface EPIAssignment {
  quantity: number;
  description: string;
  size?: string;
  ca_number?: string;
  delivery_date: string;
  return_date?: string;
  return_reason?: string;
  signature?: string;
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

export function exportFichaEPI(
  tenant: TenantInfo,
  colaborador: ColaboradorInfo,
  epiAssignments: EPIAssignment[],
  uniformeSizes?: { blusa?: string; calca?: string; calcado?: string }
) {
  const wb = XLSX.utils.book_new();
  const address = [tenant.address, tenant.city, tenant.state].filter(Boolean).join(' - ');
  const admissao = colaborador.hire_date ? format(new Date(colaborador.hire_date), 'dd/MM/yyyy', { locale: ptBR }) : '';
  const demissao = colaborador.termination_date ? format(new Date(colaborador.termination_date), 'dd/MM/yyyy', { locale: ptBR }) : '';

  const wsData: any[][] = [];

  // Row 0: Header - Logo area | ENDEREÇO | BLUSA | CALÇA | CALÇADO
  wsData.push([
    { v: tenant.name || '', s: { ...cellStyle, font: { bold: true, sz: 11 } } },
    { v: '', s: cellStyle },
    { v: 'ENDEREÇO DA EMPRESA', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: 'BLUSA Nº', s: headerStyle },
    { v: 'CALÇA Nº', s: headerStyle },
    { v: 'CALÇADO Nº', s: headerStyle },
  ]);

  // Row 1: Logo | Address value | Size values
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: address || '', s: cellCenter },
    { v: '', s: cellCenter },
    { v: '', s: cellCenter },
    { v: uniformeSizes?.blusa || '', s: cellCenter },
    { v: uniformeSizes?.calca || '', s: cellCenter },
    { v: uniformeSizes?.calcado || '', s: cellCenter },
  ]);

  // Row 2: Logo | Declaration text
  const declaration = "Declaro que recebi e fui devidamente treinado quanto ao uso correto do EPI'S (Equipamento de Proteção Individual) relacionados abaixo e assumo integral responsabilidade sobre os mesmos e nos casos de perda, extravio ou danos provenientes de negligência, fico obrigado a ressarcir a empresa o valor apurado na ocasião (Parágrafo 1º art. 462 da CLT). Da mesma forma, fico ciente de que no caso de desobedecer as ordens relativas a sua utilização e conservação, estarei cometendo falta grave, podendo ser dispensado por JUSTA CAUSA.";
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: declaration, s: { ...cellStyle, alignment: { vertical: 'top', wrapText: true } } },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 3: Logo | Signature line
  wsData.push([
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: 'Assinatura do Colaborador: x_______________________________________________', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 4: Title - FICHA DE CONTROLE INDIVIDUAL DE EPI'S
  wsData.push([
    { v: "FICHA DE CONTROLE INDIVIDUAL DE EPI'S", s: { ...headerStyle, font: { bold: true, sz: 10 } } },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
  ]);

  // Row 5: Nome | Função
  wsData.push([
    { v: 'Nome:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.name || '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: 'Função:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.position || '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 6: ADMISSÃO | DEMISSÃO | Local de Trabalho
  wsData.push([
    { v: 'ADMISSÃO:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: admissao, s: cellCenter },
    { v: 'DEMISSÃO:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: demissao, s: cellCenter },
    { v: 'Local de Trabalho:', s: { ...cellStyle, font: { bold: true, sz: 9 } } },
    { v: colaborador.local_trabalho || '', s: cellStyle },
    { v: '', s: cellStyle },
    { v: '', s: cellStyle },
  ]);

  // Row 7: Table header
  wsData.push([
    { v: 'Quant.', s: headerStyle },
    { v: 'Descrição do EPI', s: headerStyle },
    { v: 'Tamanho', s: headerStyle },
    { v: 'Entrega', s: headerStyle },
    { v: 'Devolução', s: headerStyle },
    { v: '', s: headerStyle },
    { v: 'Assinatura do Recebimento do Empregado', s: headerStyle },
    { v: '', s: headerStyle },
  ]);

  // Data rows - minimum 15 rows
  const minRows = 15;
  const totalRows = Math.max(minRows, epiAssignments.length);
  
  for (let i = 0; i < totalRows; i++) {
    const epi = epiAssignments[i];
    if (epi) {
      wsData.push([
        { v: epi.quantity, s: cellCenter },
        { v: epi.description, s: cellStyle },
        { v: epi.size || '', s: cellCenter },
        { v: epi.delivery_date ? format(new Date(epi.delivery_date), 'dd/MM/yyyy', { locale: ptBR }) : '', s: cellCenter },
        { v: epi.return_date ? format(new Date(epi.return_date), 'dd/MM/yyyy', { locale: ptBR }) : '', s: cellCenter },
        { v: '', s: cellStyle },
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
        { v: '', s: cellStyle },
        { v: 'x', s: cellCenter },
        { v: '', s: cellStyle },
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 8 },   // A - Quant/ADMISSÃO
    { wch: 28 },  // B - Descrição
    { wch: 10 },  // C - Tamanho/DEMISSÃO
    { wch: 10 },  // D - Entrega
    { wch: 10 },  // E - Devolução
    { wch: 8 },   // F
    { wch: 32 },  // G - Assinatura
    { wch: 10 },  // H
  ];

  // Row heights
  ws['!rows'] = [];
  for (let i = 0; i < wsData.length; i++) {
    if (i === 2) {
      ws['!rows'][i] = { hpt: 50 }; // Declaration row
    } else {
      ws['!rows'][i] = { hpt: 16 };
    }
  }

  // Merges
  ws['!merges'] = [
    // Row 0: Logo area
    { s: { r: 0, c: 0 }, e: { r: 3, c: 1 } },
    // Row 0: ENDEREÇO header
    { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } },
    // Row 1: Address value
    { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
    // Row 2: Declaration
    { s: { r: 2, c: 2 }, e: { r: 2, c: 7 } },
    // Row 3: Signature
    { s: { r: 3, c: 2 }, e: { r: 3, c: 7 } },
    // Row 4: Title
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
    // Row 5: Nome value
    { s: { r: 5, c: 1 }, e: { r: 5, c: 2 } },
    // Row 5: Função value
    { s: { r: 5, c: 4 }, e: { r: 5, c: 7 } },
    // Row 6: Local de Trabalho value
    { s: { r: 6, c: 5 }, e: { r: 6, c: 7 } },
    // Row 7: Assinatura header
    { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },
  ];

  // Merge signature column for each data row
  const dataStartRow = 8;
  for (let i = 0; i < totalRows; i++) {
    ws['!merges']?.push(
      { s: { r: dataStartRow + i, c: 6 }, e: { r: dataStartRow + i, c: 7 } }
    );
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Ficha EPI');

  const fileName = `Ficha_EPI_${colaborador.name?.replace(/\s+/g, '_') || 'Colaborador'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
