import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments, useServiceProviderPaymentSummary } from "@/hooks/useServiceProviders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { 
  Calculator, 
  DollarSign, 
  Clock, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  CalendarDays,
  Timer,
  FileText,
  Building2,
  CreditCard,
  Printer
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/types/serviceProviders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Prestador</label>
          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um prestador" />
            </SelectTrigger>
            <SelectContent>
              {activeProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
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
            <SelectTrigger className="w-32">
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
          <Button variant="outline" onClick={handlePrint} className="ml-auto print:hidden">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        )}
      </div>

      {!selectedProviderId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um prestador para ver o resumo de pagamentos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Card de Resumo Principal */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Informações do Prestador */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados do Prestador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProvider && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProvider.name}</h3>
                      {selectedProvider.specialty && (
                        <Badge variant="secondary" className="mt-1">
                          {selectedProvider.specialty}
                        </Badge>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          {getPaymentTypeIcon(selectedProvider.payment_type)}
                          Tipo de Pagamento
                        </span>
                        <Badge variant="outline">
                          {PAYMENT_TYPE_LABELS[selectedProvider.payment_type]}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Valor Unitário</span>
                        <span className="font-bold text-primary text-lg">
                          {formatCurrency(getProviderRate())}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Dados Bancários */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Dados Bancários
                      </h4>
                      {selectedProvider.bank_name ? (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{selectedProvider.bank_name}</p>
                          {selectedProvider.bank_agency && (
                            <p>Ag: {selectedProvider.bank_agency}</p>
                          )}
                          {selectedProvider.bank_account && (
                            <p>CC: {selectedProvider.bank_account}</p>
                          )}
                        </div>
                      ) : selectedProvider.pix_key ? (
                        <p className="text-sm text-muted-foreground">
                          PIX: {selectedProvider.pix_key}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Dados bancários não cadastrados
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Cálculo */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cálculo do Período - {MONTHS[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>
                  Resumo dos valores a pagar para o prestador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{summary?.total_os_count || 0}</p>
                    <p className="text-xs text-muted-foreground">OS Realizadas</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <CalendarDays className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{summary?.total_days_worked || 0}</p>
                    <p className="text-xs text-muted-foreground">Dias Trabalhados</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Timer className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{summary?.total_hours_worked || 0}</p>
                    <p className="text-xs text-muted-foreground">Horas Trabalhadas</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                    <p className="text-2xl font-bold">{summary?.paid_count || 0}</p>
                    <p className="text-xs text-muted-foreground">OS Pagas</p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Cálculo Detalhado */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">
                    Demonstrativo de Cálculo
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedProvider?.payment_type === 'diaria' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {summary?.total_days_worked || 0} dias × {formatCurrency(getProviderRate())} (diária)
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_days_worked || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}
                    
                    {selectedProvider?.payment_type === 'hora' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {summary?.total_hours_worked || 0}h × {formatCurrency(getProviderRate())} (hora)
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_hours_worked || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}

                    {selectedProvider?.payment_type === 'por_os' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {summary?.total_os_count || 0} OS × {formatCurrency(getProviderRate())} (por OS)
                        </span>
                        <span className="font-medium">
                          {formatCurrency((summary?.total_os_count || 0) * getProviderRate())}
                        </span>
                      </div>
                    )}

                    {selectedProvider?.payment_type === 'mensal' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Valor mensal fixo</span>
                        <span className="font-medium">
                          {formatCurrency(getProviderRate())}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Valor Total do Período</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(summary?.total_amount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-success">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Já Pago
                      </span>
                      <span className="font-medium">
                        - {formatCurrency((summary?.total_amount || 0) - (summary?.pending_amount || 0))}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        A Pagar
                      </span>
                      <span className="text-2xl font-bold text-warning">
                        {formatCurrency(summary?.pending_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista Detalhada de Atribuições */}
          {monthAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Detalhamento das OS - {MONTHS[selectedMonth - 1]} {selectedYear}</span>
                  <Badge variant="outline">
                    {monthAssignments.length} OS
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="print:hidden"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthAssignments.map((assignment) => (
                      <TableRow key={assignment.id} className={assignment.is_paid ? 'bg-success/5' : ''}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(assignment.assigned_at), 'dd/MM', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              #{assignment.service_order?.order_number}
                            </span>
                            <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                              {assignment.service_order?.title}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getPaymentTypeIcon(assignment.payment_type)}
                            {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {assignment.payment_type === "diaria" && `${assignment.days_worked || 1} dias`}
                          {assignment.payment_type === "hora" && `${assignment.hours_worked || 0}h`}
                          {assignment.payment_type === "por_os" && "1 OS"}
                          {assignment.payment_type === "mensal" && "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(assignment.rate_applied)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(assignment.total_amount || 0)}
                        </TableCell>
                        <TableCell>
                          {assignment.is_paid ? (
                            <Badge className="bg-success text-success-foreground">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="print:hidden">
                          {!assignment.is_paid && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsPaid(assignment.id)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-semibold">
                        Total do Período
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg text-primary">
                        {formatCurrency(summary?.total_amount || 0)}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          )}

          {monthAssignments.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma OS encontrada para este período</p>
                <p className="text-sm">Atribua OS ao prestador na aba "Atribuições"</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}