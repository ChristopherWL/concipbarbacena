import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments, useServiceProviderPaymentSummary } from "@/hooks/useServiceProviders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DollarSign, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  CalendarDays,
  Timer,
  FileText,
  Building2,
  CreditCard,
  Printer,
  TrendingUp,
  ArrowRight,
  Check,
  Clock,
  Receipt
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/types/serviceProviders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

  const { data: summary, isLoading: summaryLoading } = useServiceProviderPaymentSummary(
    selectedProviderId,
    selectedMonth,
    selectedYear
  );

  const { assignments, markAsPaid } = useServiceProviderAssignments(selectedProviderId || undefined);

  const activeProviders = providers.filter(p => p.is_active);
  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Filtra atribuições do mês selecionado
  const monthAssignments = assignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    return (
      assignedDate.getMonth() + 1 === selectedMonth &&
      assignedDate.getFullYear() === selectedYear
    );
  });

  const pendingAssignments = monthAssignments.filter(a => !a.is_paid);
  const paidAssignments = monthAssignments.filter(a => a.is_paid);
  const paidPercentage = monthAssignments.length > 0 
    ? (paidAssignments.length / monthAssignments.length) * 100 
    : 0;

  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];

  // Calcula valores baseado no tipo de pagamento
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
      case 'diaria': return <CalendarDays className="h-4 w-4" />;
      case 'hora': return <Timer className="h-4 w-4" />;
      case 'por_os': return <FileText className="h-4 w-4" />;
      case 'mensal': return <Wallet className="h-4 w-4" />;
    }
  };

  const handleMarkAsPaid = async (assignmentId: string) => {
    await markAsPaid(assignmentId);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filtros Estilizados */}
      <Card className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Prestador
              </label>
              <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um prestador" />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Mês
              </label>
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Ano</label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProviderId && (
              <Button variant="outline" onClick={handlePrint} className="ml-auto print:hidden gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedProviderId ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <Calculator className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Selecione um Prestador</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Escolha um prestador de serviço para visualizar o resumo de pagamentos, 
              demonstrativos e histórico de atribuições.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cards de Resumo Animados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ClipboardCheck className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{summary?.total_os_count || 0}</p>
                    <p className="text-sm text-muted-foreground">OS Realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-500/20 rounded-xl">
                    <CalendarDays className="h-6 w-6 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{summary?.total_days_worked || 0}</p>
                    <p className="text-sm text-muted-foreground">Dias Trabalhados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Timer className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{summary?.total_hours_worked || 0}</p>
                    <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{summary?.paid_count || 0}</p>
                    <p className="text-sm text-muted-foreground">OS Pagas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Layout Principal */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Card do Prestador */}
            <Card className="lg:col-span-1 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center text-2xl font-bold shadow-lg">
                    {selectedProvider?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{selectedProvider?.name}</h3>
                    {selectedProvider?.specialty && (
                      <Badge variant="secondary" className="mt-1">
                        {selectedProvider.specialty}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                {selectedProvider && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          {getPaymentTypeIcon(selectedProvider.payment_type)}
                          Tipo de Pagamento
                        </span>
                        <Badge variant="outline">
                          {PAYMENT_TYPE_LABELS[selectedProvider.payment_type]}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                        <span className="text-sm font-medium">Valor Unitário</span>
                        <span className="font-bold text-primary text-xl">
                          {formatCurrency(getProviderRate())}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Dados Bancários */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Dados Bancários
                      </h4>
                      {selectedProvider.bank_name ? (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <p className="font-medium">{selectedProvider.bank_name}</p>
                          {selectedProvider.bank_agency && (
                            <p className="text-sm text-muted-foreground">
                              Agência: {selectedProvider.bank_agency}
                            </p>
                          )}
                          {selectedProvider.bank_account && (
                            <p className="text-sm text-muted-foreground">
                              Conta: {selectedProvider.bank_account}
                            </p>
                          )}
                        </div>
                      ) : selectedProvider.pix_key ? (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm">
                            <span className="text-muted-foreground">PIX:</span>{" "}
                            <span className="font-medium">{selectedProvider.pix_key}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg">
                          Dados bancários não cadastrados
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Card de Cálculo */}
            <Card className="lg:col-span-2">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Demonstrativo - {MONTHS[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>
                  Resumo financeiro do período selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Progresso de Pagamentos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso de Pagamentos</span>
                    <span className="font-medium">{Math.round(paidPercentage)}% pago</span>
                  </div>
                  <Progress value={paidPercentage} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{paidAssignments.length} pagas</span>
                    <span>{pendingAssignments.length} pendentes</span>
                  </div>
                </div>

                <Separator />

                {/* Demonstrativo */}
                <div className="bg-gradient-to-br from-muted/50 to-transparent rounded-xl p-6 space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Cálculo Detalhado
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedProvider?.payment_type === 'diaria' && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {summary?.total_days_worked || 0} dias × {formatCurrency(getProviderRate())}
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_days_worked || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}
                    
                    {selectedProvider?.payment_type === 'hora' && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {summary?.total_hours_worked || 0}h × {formatCurrency(getProviderRate())}
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_hours_worked || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}

                    {selectedProvider?.payment_type === 'por_os' && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {summary?.total_os_count || 0} OS × {formatCurrency(getProviderRate())}
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_os_count || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}

                    {selectedProvider?.payment_type === 'mensal' && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          Valor mensal fixo
                        </span>
                        <span className="font-medium">
                          {formatCurrency(getProviderRate())}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totais */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Valor Total</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(summary?.total_amount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Já Pago
                      </span>
                      <span className="font-medium">
                        - {formatCurrency((summary?.total_amount || 0) - (summary?.pending_amount || 0))}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <span className="font-bold flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Saldo a Pagar
                      </span>
                      <span className="text-2xl font-bold text-amber-600">
                        {formatCurrency(summary?.pending_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de OS do Período */}
          {monthAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    OS do Período
                  </CardTitle>
                  <Badge variant="outline" className="text-sm">
                    {monthAssignments.length} ordens
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {monthAssignments.map((assignment, index) => (
                    <div 
                      key={assignment.id}
                      className={cn(
                        "flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200",
                        assignment.is_paid && "bg-emerald-500/5"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        assignment.is_paid 
                          ? "bg-emerald-500/20 text-emerald-600" 
                          : "bg-amber-500/20 text-amber-600"
                      )}>
                        {assignment.is_paid ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {assignment.service_order && (
                            <span className="font-semibold">
                              OS #{assignment.service_order.order_number}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                          </Badge>
                        </div>
                        {assignment.service_order && (
                          <p className="text-sm text-muted-foreground truncate">
                            {assignment.service_order.title}
                          </p>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {format(new Date(assignment.assigned_at), "dd/MM", { locale: ptBR })}
                        </span>
                        {assignment.days_worked && (
                          <Badge variant="secondary">{assignment.days_worked} dias</Badge>
                        )}
                        {assignment.hours_worked && (
                          <Badge variant="secondary">{assignment.hours_worked}h</Badge>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg">
                          {formatCurrency(assignment.total_amount || 0)}
                        </p>
                        {!assignment.is_paid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsPaid(assignment.id)}
                            className="text-xs h-7 px-2 hover:bg-emerald-500 hover:text-white print:hidden"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rodapé com Totais */}
                <div className="border-t bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total do Período</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(summary?.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
