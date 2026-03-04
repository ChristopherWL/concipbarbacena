import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileDown, Loader2, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import jsPDF from 'jspdf';

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const parseDateOnly = (dateStr: string) => {
  const safe = (dateStr || '').slice(0, 10);
  const [y, m, d] = safe.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export function RelatorioCupons() {
  const { tenant } = useAuthContext();
  const { data: suppliers = [] } = useSuppliers();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [supplierFilter, setSupplierFilter] = useState<string>('all');

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['fiscal_coupons_report', tenant?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('fiscal_coupons')
        .select(`
          id, coupon_number, total_value, issue_date, notes, created_at,
          supplier:suppliers(id, name, cnpj)
        `)
        .eq('tenant_id', tenant.id)
        .gte('issue_date', `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`)
        .lt('issue_date', selectedMonth === 12
          ? `${selectedYear + 1}-01-01`
          : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
        )
        .order('issue_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Group coupons by supplier
  const supplierGroups = useMemo(() => {
    const map = new Map<string, { supplier: { id: string; name: string; cnpj?: string }; coupons: any[]; total: number }>();
    coupons.forEach((c: any) => {
      const s = c.supplier as any;
      const id = s?.id || 'sem-fornecedor';
      if (!map.has(id)) {
        map.set(id, { supplier: { id, name: s?.name || 'Sem Fornecedor', cnpj: s?.cnpj }, coupons: [], total: 0 });
      }
      const group = map.get(id)!;
      group.coupons.push(c);
      group.total += c.total_value || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));
  }, [coupons]);

  const filteredGroups = useMemo(() => {
    if (supplierFilter === 'all') return supplierGroups;
    return supplierGroups.filter(g => g.supplier.id === supplierFilter);
  }, [supplierGroups, supplierFilter]);

  const totalValue = useMemo(() =>
    filteredGroups.reduce((sum, g) => sum + g.total, 0),
    [filteredGroups]
  );

  const totalCoupons = useMemo(() =>
    filteredGroups.reduce((sum, g) => sum + g.coupons.length, 0),
    [filteredGroups]
  );

  // Fetch fechamento records
  const { data: fechamentos = [] } = useQuery({
    queryKey: ['fechamentos_for_report', tenant?.id, selectedMonth, selectedYear],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('reference_month', selectedMonth)
        .eq('reference_year', selectedYear);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const getClosedRecord = (supplierId: string) =>
    fechamentos.find((f: any) => f.supplier_id === supplierId);

  const handleExportSupplierPDF = (supplierId: string) => {
    const group = supplierGroups.find(g => g.supplier.id === supplierId);
    if (!group) return;

    const closedRecord = getClosedRecord(supplierId);
    const discount = closedRecord?.discount_value || 0;
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const rightEdge = pageWidth - margin;
    let y = 16;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Cupons Fiscais', margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, rightEdge, y);
    y += 8;

    // Company & supplier info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (tenant?.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(tenant.name, margin, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    }
    doc.text(`Fornecedor: ${group.supplier.name}`, margin, y);
    if (group.supplier.cnpj) {
      doc.text(`CNPJ: ${group.supplier.cnpj}`, rightEdge, y, { align: 'right' });
    }
    y += 6;
    doc.text(`Período: ${monthLabel} de ${selectedYear}`, margin, y);
    doc.text(`Status: ${closedRecord ? 'FECHADO' : 'EM ABERTO'}`, rightEdge, y, { align: 'right' });
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Divider
    doc.line(margin, y, rightEdge, y);
    y += 8;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(235, 235, 235);
    doc.rect(margin, y - 5, rightEdge - margin, 8, 'F');
    doc.text('Data', margin + 2, y);
    doc.text('Observação', 60, y);
    doc.text('Valor (R$)', rightEdge - 2, y, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    const sortedCoupons = [...group.coupons].sort(
      (a: any, b: any) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
    );

    let rowIndex = 0;
    sortedCoupons.forEach((coupon: any) => {
      if (y > 272) {
        doc.addPage();
        y = 20;
      }
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y - 4.5, rightEdge - margin, 6.5, 'F');
      }
      doc.text(format(parseDateOnly(coupon.issue_date), 'dd/MM/yyyy'), margin + 2, y);
      const notes = coupon.notes || '-';
      doc.text(notes.length > 50 ? notes.substring(0, 50) + '...' : notes, 60, y);
      doc.text(formatCurrency(coupon.total_value), rightEdge - 2, y, { align: 'right' });
      y += 6.5;
      rowIndex++;
    });

    // Totals
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(80, 80, 80);
    doc.line(margin, y - 3, rightEdge, y - 3);
    doc.setFontSize(10);
    doc.text(`Total: ${sortedCoupons.length} cupom(ns)`, margin + 2, y + 2);
    doc.text(formatCurrency(group.total), rightEdge - 2, y + 2, { align: 'right' });

    if (discount > 0) {
      y += 8;
      doc.setTextColor(200, 100, 0);
      doc.text('Desconto:', margin + 2, y);
      doc.text(`- ${formatCurrency(discount)}`, rightEdge - 2, y, { align: 'right' });
      y += 8;
      doc.setTextColor(0, 128, 0);
      doc.text('Valor Líquido:', margin + 2, y);
      doc.text(formatCurrency(group.total - discount), rightEdge - 2, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    const safeName = group.supplier.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`cupons_${safeName}_${monthLabel}_${selectedYear}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Mês</label>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ano</label>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Fornecedores</SelectItem>
              {supplierGroups.map((g) => (
                <SelectItem key={g.supplier.id} value={g.supplier.id}>{g.supplier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total de Cupons</p>
            <p className="text-2xl font-bold">{totalCoupons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Fornecedores</p>
            <p className="text-2xl font-bold">{filteredGroups.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table grouped by supplier */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nenhum cupom encontrado no período
          </CardContent>
        </Card>
      ) : (
        filteredGroups.map((group) => (
          <Card key={group.supplier.id}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div>
                  <p className="font-semibold text-sm">{group.supplier.name}</p>
                  {group.supplier.cnpj && (
                    <p className="text-xs text-muted-foreground">CNPJ: {group.supplier.cnpj}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{group.coupons.length} cupom(ns)</p>
                    <p className="font-semibold text-sm text-primary">{formatCurrency(group.total)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSupplierPDF(group.supplier.id)}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.coupons
                      .sort((a: any, b: any) => new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime())
                      .map((coupon: any) => (
                        <TableRow key={coupon.id}>
                          <TableCell>{format(parseDateOnly(coupon.issue_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-muted-foreground">{coupon.notes || '-'}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(coupon.total_value)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
