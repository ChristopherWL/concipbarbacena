import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Calculator,
  Check,
  DollarSign,
  FileText,
  Trash2
} from 'lucide-react';
import { usePayrolls } from '@/hooks/usePayrolls';
import { useEmployees } from '@/hooks/useEmployees';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface PayrollsTabProps {
  isReadOnly?: boolean;
}

export function PayrollsTab({ isReadOnly = false }: PayrollsTabProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  
  const { payrolls, isLoading, fetchPayrolls, calculatePayroll, approvePayroll, markAsPaid, deletePayroll } = usePayrolls();
  const { employees } = useEmployees();

  const activeEmployees = employees.filter(e => e.status === 'ativo');

  const filteredPayrolls = payrolls.filter(p => 
    (p.employee as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-muted text-muted-foreground';
      case 'calculada': return 'bg-blue-500/10 text-blue-500';
      case 'aprovada': return 'bg-green-500/10 text-green-500';
      case 'paga': return 'bg-emerald-500/10 text-emerald-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCalculateAll = async () => {
    for (const emp of activeEmployees) {
      await calculatePayroll(emp.id, selectedMonth, selectedYear);
    }
    fetchPayrolls(selectedMonth, selectedYear);
  };

  const handleCalculateOne = async (employeeId: string) => {
    await calculatePayroll(employeeId, selectedMonth, selectedYear);
  };

  const handleApprove = async (id: string) => {
    await approvePayroll(id);
  };

  const handleMarkPaid = async (id: string) => {
    await markAsPaid(id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta folha?')) {
      await deletePayroll(id);
    }
  };

  const handlePeriodChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchPayrolls(month, year);
  };

  // Totais
  const totals = filteredPayrolls.reduce((acc, p) => ({
    totalEarnings: acc.totalEarnings + Number(p.total_earnings || 0),
    totalDiscounts: acc.totalDiscounts + Number(p.total_discounts || 0),
    netSalary: acc.netSalary + Number(p.net_salary || 0),
    fgts: acc.fgts + Number(p.fgts_value || 0),
  }), { totalEarnings: 0, totalDiscounts: 0, netSalary: 0, fgts: 0 });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(v) => handlePeriodChange(parseInt(v), selectedYear)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => handlePeriodChange(selectedMonth, parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCalculateAll}>
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Todos
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Proventos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalEarnings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalDiscounts)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Líquido a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totals.netSalary)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total FGTS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.fgts)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={8} rows={5} />
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma folha calculada para este período</p>
              <Button variant="outline" className="mt-4" onClick={handleCalculateAll}>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Folha
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="text-right">Salário Base</TableHead>
                  <TableHead className="text-right">Proventos</TableHead>
                  <TableHead className="text-right">INSS</TableHead>
                  <TableHead className="text-right">IRRF</TableHead>
                  <TableHead className="text-right">Descontos</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(payroll.employee as any)?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(payroll.employee as any)?.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(payroll.base_salary)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(payroll.total_earnings)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(payroll.inss_value)}
                      <span className="text-xs text-muted-foreground ml-1">({payroll.inss_rate.toFixed(1)}%)</span>
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(payroll.irrf_value)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(payroll.total_discounts)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(payroll.net_salary)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payroll.status)}>
                        {payroll.status.charAt(0).toUpperCase() + payroll.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {payroll.status === 'calculada' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleApprove(payroll.id)}
                            className="text-green-600"
                            title="Aprovar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {payroll.status === 'aprovada' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleMarkPaid(payroll.id)}
                            className="text-emerald-600"
                            title="Marcar como pago"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(payroll.id)}
                          className="text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
