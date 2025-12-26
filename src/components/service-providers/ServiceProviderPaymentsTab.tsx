import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments, useServiceProviderPaymentSummary } from "@/hooks/useServiceProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/table";
import { Calculator, DollarSign, Clock, ClipboardCheck } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";

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

  const { assignments } = useServiceProviderAssignments(selectedProviderId || undefined);

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

  const years = [currentDate.getFullYear(), currentDate.getFullYear() - 1];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
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

      {!selectedProviderId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um prestador para ver o resumo de pagamentos</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Total de OS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.total_os_count || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dias Trabalhados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{summary?.total_days_worked || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(summary?.total_amount || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary?.pending_amount || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do prestador */}
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedProvider.name}</span>
                  <Badge variant="outline">
                    {PAYMENT_TYPE_LABELS[selectedProvider.payment_type]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedProvider.specialty && (
                    <p>Especialidade: {selectedProvider.specialty}</p>
                  )}
                  {selectedProvider.phone && <p>Telefone: {selectedProvider.phone}</p>}
                  {selectedProvider.pix_key && <p>PIX: {selectedProvider.pix_key}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de atribuições do mês */}
          {monthAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  OS de {MONTHS[selectedMonth - 1]} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OS</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
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
                          <Badge variant="outline">
                            {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {assignment.payment_type === "diaria" && `${assignment.days_worked || 1} dias`}
                          {assignment.payment_type === "hora" && `${assignment.hours_worked || 0}h`}
                          {assignment.payment_type === "por_os" && "1 OS"}
                          {assignment.payment_type === "mensal" && "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(assignment.rate_applied)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(assignment.total_amount || 0)}
                        </TableCell>
                        <TableCell>
                          {assignment.is_paid ? (
                            <Badge className="bg-green-600">Pago</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
