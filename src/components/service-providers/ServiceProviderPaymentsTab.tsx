import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments, useServiceProviderPaymentSummary } from "@/hooks/useServiceProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calculator, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  CalendarDays,
  Timer,
  FileText,
  Building2,
  Printer,
  Check,
  Clock,
  Plus
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/types/serviceProviders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AssignProviderDialog } from "./AssignProviderDialog";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function ServiceProviderPaymentsTab() {
  const { providers } = useServiceProviders();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: summary } = useServiceProviderPaymentSummary(
    selectedProviderId,
    selectedMonth,
    selectedYear
  );

  const { assignments: allAssignments, markAsPaid } = useServiceProviderAssignments();
  const { assignments: providerAssignments } = useServiceProviderAssignments(selectedProviderId || undefined);

  const activeProviders = providers.filter(p => p.is_active);
  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Estatísticas globais do mês
  const globalMonthAssignments = allAssignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    return (
      assignedDate.getMonth() + 1 === selectedMonth &&
      assignedDate.getFullYear() === selectedYear
    );
  });

  const globalStats = {
    totalAssignments: globalMonthAssignments.length,
    paidAmount: globalMonthAssignments.filter(a => a.is_paid).reduce((acc, a) => acc + (a.total_amount || 0), 0),
    pendingAmount: globalMonthAssignments.filter(a => !a.is_paid).reduce((acc, a) => acc + (a.total_amount || 0), 0),
    totalAmount: globalMonthAssignments.reduce((acc, a) => acc + (a.total_amount || 0), 0),
  };

  // Atribuições do prestador selecionado
  const monthAssignments = providerAssignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    return (
      assignedDate.getMonth() + 1 === selectedMonth &&
      assignedDate.getFullYear() === selectedYear
    );
  });

  const paidAssignments = monthAssignments.filter(a => a.is_paid);
  const pendingAssignments = monthAssignments.filter(a => !a.is_paid);
  const paidPercentage = monthAssignments.length > 0 
    ? (paidAssignments.length / monthAssignments.length) * 100 
    : 0;

  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];

  const getProviderRate = () => {
    if (!selectedProvider) return 0;
    switch (selectedProvider.payment_type) {
      case 'diaria': return selectedProvider.daily_rate || 0;
      case 'hora': return selectedProvider.hourly_rate || 0;
      case 'por_os': return selectedProvider.rate_per_os || 0;
      case 'mensal': return selectedProvider.monthly_rate || 0;
      default: return 0;
    }
  };

  const getPaymentTypeIcon = (type: PaymentType) => {
    switch (type) {
      case 'diaria': return <CalendarDays className="h-3 w-3" />;
      case 'hora': return <Timer className="h-3 w-3" />;
      case 'por_os': return <FileText className="h-3 w-3" />;
      case 'mensal': return <Wallet className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Cards Globais + Filtros */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Cards Informativos Compactos */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          <Card className="border-primary/20">
            <CardContent className="p-2.5 flex items-center gap-2">
              <div className="p-1.5 bg-primary/20 rounded">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{globalStats.totalAssignments}</p>
                <p className="text-[10px] text-muted-foreground">Atribuições</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20">
            <CardContent className="p-2.5 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/20 rounded">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-emerald-600">{formatCurrency(globalStats.paidAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Pago</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="p-2.5 flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none text-amber-600">{formatCurrency(globalStats.pendingAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Pendente</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-500/20">
            <CardContent className="p-2.5 flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 rounded">
                <Wallet className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{formatCurrency(globalStats.totalAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Linha 2: Filtros e Ações */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o prestador" />
              </SelectTrigger>
              <SelectContent>
                {activeProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button size="sm" onClick={() => setAssignDialogOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Nova Atribuição
              </Button>
              {selectedProviderId && (
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 print:hidden">
                  <Printer className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AssignProviderDialog 
        open={assignDialogOpen} 
        onOpenChange={setAssignDialogOpen}
        providers={activeProviders}
      />

      {!selectedProviderId ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calculator className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Selecione um prestador para ver detalhes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Coluna 1: Info do Prestador */}
          <Card>
            <CardHeader className="p-3 pb-2 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                  {selectedProvider?.name.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-base">{selectedProvider?.name}</CardTitle>
                  {selectedProvider?.specialty && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">{selectedProvider.specialty}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {selectedProvider && getPaymentTypeIcon(selectedProvider.payment_type)}
                  Tipo
                </span>
                <Badge variant="outline" className="text-xs">
                  {selectedProvider && PAYMENT_TYPE_LABELS[selectedProvider.payment_type]}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Valor Unit.</span>
                <span className="font-bold text-primary">{formatCurrency(getProviderRate())}</span>
              </div>
              <Separator />
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Dados Bancários
                </span>
                {selectedProvider?.bank_name ? (
                  <p className="font-medium">{selectedProvider.bank_name} • Ag: {selectedProvider.bank_agency} • Cc: {selectedProvider.bank_account}</p>
                ) : selectedProvider?.pix_key ? (
                  <p className="font-medium">PIX: {selectedProvider.pix_key}</p>
                ) : (
                  <p className="italic text-muted-foreground">Não cadastrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Coluna 2: Demonstrativo */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Demonstrativo - {MONTHS[selectedMonth - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {/* Progresso */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span>{Math.round(paidPercentage)}%</span>
                </div>
                <Progress value={paidPercentage} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{paidAssignments.length} pagas</span>
                  <span>{pendingAssignments.length} pendentes</span>
                </div>
              </div>

              <Separator />

              {/* Resumo Financeiro */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded">
                  <p className="text-lg font-bold">{formatCurrency(summary?.total_amount || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded">
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency((summary?.total_amount || 0) - (summary?.pending_amount || 0))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Pago</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded">
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(summary?.pending_amount || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">A Pagar</p>
                </div>
              </div>

              {/* Cálculo */}
              {selectedProvider && (
                <div className="text-xs bg-muted/30 p-2 rounded flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {selectedProvider.payment_type === 'diaria' && `${summary?.total_days_worked || 0} dias × ${formatCurrency(getProviderRate())}`}
                    {selectedProvider.payment_type === 'hora' && `${summary?.total_hours_worked || 0}h × ${formatCurrency(getProviderRate())}`}
                    {selectedProvider.payment_type === 'por_os' && `${summary?.total_os_count || 0} OS × ${formatCurrency(getProviderRate())}`}
                    {selectedProvider.payment_type === 'mensal' && 'Valor mensal fixo'}
                  </span>
                  <span className="font-medium">{formatCurrency(summary?.total_amount || 0)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de OS */}
          {monthAssignments.length > 0 && (
            <Card className="lg:col-span-3">
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Atribuições do Período
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">{monthAssignments.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {monthAssignments.map((assignment) => (
                    <div 
                      key={assignment.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors",
                        assignment.is_paid && "bg-emerald-500/5"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                        assignment.is_paid ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"
                      )}>
                        {assignment.is_paid ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {assignment.service_order ? (
                            <span className="text-sm font-medium">OS #{assignment.service_order.order_number}</span>
                          ) : (
                            <span className="text-sm font-medium">Atribuição Avulsa</span>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {assignment.service_order?.title || `${assignment.days_worked || 0} dias`}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {format(new Date(assignment.assigned_at), "dd/MM", { locale: ptBR })}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm">{formatCurrency(assignment.total_amount || 0)}</p>
                        {!assignment.is_paid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsPaid(assignment.id)}
                            className="text-[10px] h-5 px-1.5 hover:bg-emerald-500 hover:text-white"
                          >
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}