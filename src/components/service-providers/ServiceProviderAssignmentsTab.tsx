import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments } from "@/hooks/useServiceProviders";
import { useServiceOrders } from "@/hooks/useServiceOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, ClipboardList } from "lucide-react";
import { AssignProviderDialog } from "./AssignProviderDialog";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";
import { formatCurrency } from "@/lib/formatters";

export function ServiceProviderAssignmentsTab() {
  const { providers } = useServiceProviders();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const { assignments, isLoading, markAsPaid } = useServiceProviderAssignments(selectedProviderId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeProviders = providers.filter(p => p.is_active);

  if (isLoading) {
    return <TableSkeleton columns={6} rows={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filtrar por prestador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os prestadores</SelectItem>
            {activeProviders.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} {p.specialty && `(${p.specialty})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Atribuir OS
        </Button>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atribuição encontrada</p>
            <p className="text-sm">Clique em "Atribuir OS" para vincular uma ordem de serviço a um prestador</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atribuições de OS</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestador</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {assignment.service_provider?.name || "—"}
                        </span>
                        {assignment.service_provider?.specialty && (
                          <Badge variant="secondary" className="ml-2">
                            {assignment.service_provider.specialty}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          #{assignment.service_order?.order_number}
                        </span>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {assignment.service_order?.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                      </Badge>
                      {assignment.days_worked && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({assignment.days_worked} dias)
                        </span>
                      )}
                      {assignment.hours_worked && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({assignment.hours_worked}h)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(assignment.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {assignment.is_paid ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!assignment.is_paid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(assignment.id)}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AssignProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        providers={activeProviders}
      />
    </div>
  );
}
