import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

  const filteredCoupons = useMemo(() => {
    if (supplierFilter === 'all') return coupons;
    return coupons.filter((c: any) => (c.supplier as any)?.id === supplierFilter);
  }, [coupons, supplierFilter]);

  const totalValue = useMemo(() =>
    filteredCoupons.reduce((sum: number, c: any) => sum + (c.total_value || 0), 0),
    [filteredCoupons]
  );

  // Get unique suppliers from coupons for filter
  const couponSuppliers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    coupons.forEach((c: any) => {
      const s = c.supplier as any;
      if (s?.id) map.set(s.id, { id: s.id, name: s.name });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [coupons]);

  const parseDateOnly = (dateStr: string) => {
    const safe = (dateStr || '').slice(0, 10);
    const [y, m, d] = safe.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';
    const supplierName = supplierFilter !== 'all'
      ? couponSuppliers.find(s => s.id === supplierFilter)?.name || ''
      : 'Todos os Fornecedores';

    // Header
    doc.setFontSize(16);
    doc.text('Relatório de Cupons Fiscais', 14, 20);
    doc.setFontSize(10);
    doc.text(`${tenant?.name || ''}`, 14, 28);
    doc.text(`Período: ${monthLabel} de ${selectedYear}`, 14, 34);
    doc.text(`Fornecedor: ${supplierName}`, 14, 40);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 46);

    // Table header
    let y = 56;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y - 5, 182, 8, 'F');
    doc.text('Nº Cupom', 16, y);
    doc.text('Data', 56, y);
    doc.text('Fornecedor', 86, y);
    doc.text('Valor', 166, y, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    filteredCoupons.forEach((coupon: any) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(coupon.coupon_number || '-', 16, y);
      doc.text(format(parseDateOnly(coupon.issue_date), 'dd/MM/yyyy'), 56, y);
      const name = (coupon.supplier as any)?.name || '-';
      doc.text(name.length > 30 ? name.substring(0, 30) + '...' : name, 86, y);
      doc.text(formatCurrency(coupon.total_value), 166, y, { align: 'right' });
      y += 6;
    });

    // Total
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.line(14, y - 3, 196, y - 3);
    doc.text(`Total: ${filteredCoupons.length} cupom(ns)`, 16, y + 2);
    doc.text(formatCurrency(totalValue), 166, y + 2, { align: 'right' });

    doc.save(`cupons_${monthLabel}_${selectedYear}.pdf`);
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
              {couponSuppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportPDF} disabled={filteredCoupons.length === 0} variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total de Cupons</p>
            <p className="text-2xl font-bold">{filteredCoupons.length}</p>
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
            <p className="text-2xl font-bold">{couponSuppliers.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Cupom</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Obs.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Nenhum cupom encontrado no período
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon: any) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium">{coupon.coupon_number || '-'}</TableCell>
                      <TableCell>{format(parseDateOnly(coupon.issue_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{(coupon.supplier as any)?.name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(coupon.total_value)}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">{coupon.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
