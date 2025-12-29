import { useState } from "react";
import { useServiceProviders, useServiceProviderAssignments } from "@/hooks/useServiceProviders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Check, 
  ClipboardList, 
  Search, 
  Calendar,
  DollarSign,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
  LayoutGrid,
  List
} from "lucide-react";
import { AssignProviderDialog } from "./AssignProviderDialog";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function ServiceProviderAssignmentsTab() {
  const { providers } = useServiceProviders();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const { assignments, isLoading, markAsPaid } = useServiceProviderAssignments(selectedProviderId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === "grid" ? 9 : 10;

  const activeProviders = providers.filter(p => p.is_active);
  
  // Filtros
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = 
      a.service_provider?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.service_order?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.service_order?.order_number?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "paid" && a.is_paid) ||
      (statusFilter === "pending" && !a.is_paid);

    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.is_paid).length,
    paid: assignments.filter(a => a.is_paid).length,
    totalValue: assignments.reduce((acc, a) => acc + (a.total_amount || 0), 0),
    pendingValue: assignments.filter(a => !a.is_paid).reduce((acc, a) => acc + (a.total_amount || 0), 0),
  };

  // Paginação
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return <TableSkeleton columns={6} rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Atribuições</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(stats.pendingValue)}</p>
                <p className="text-xs text-muted-foreground">A Pagar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por prestador ou OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
            <SelectTrigger className="w-48">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prestador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {activeProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Atribuição
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {filteredAssignments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma atribuição encontrada</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca"
                : "Clique no botão acima para criar a primeira atribuição"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Atribuição
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* Visualização em Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedAssignments.map((assignment, index) => (
            <Card 
              key={assignment.id} 
              className={cn(
                "group hover:shadow-xl transition-all duration-300 overflow-hidden",
                assignment.is_paid 
                  ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent" 
                  : "hover:border-primary/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                {/* Header do Card */}
                <div className={cn(
                  "p-4 border-b",
                  assignment.is_paid 
                    ? "bg-emerald-500/10" 
                    : "bg-muted/30"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold truncate">
                          {assignment.service_provider?.name || "—"}
                        </span>
                      </div>
                      {assignment.service_provider?.specialty && (
                        <Badge variant="secondary" className="text-xs">
                          {assignment.service_provider.specialty}
                        </Badge>
                      )}
                    </div>
                    {assignment.is_paid ? (
                      <Badge className="bg-emerald-500 text-white flex-shrink-0">
                        <Check className="h-3 w-3 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 flex-shrink-0">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className="p-4 space-y-3">
                  {assignment.service_order && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          OS #{assignment.service_order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {assignment.service_order.title}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                    </Badge>
                    {assignment.days_worked && (
                      <span className="text-xs text-muted-foreground">
                        {assignment.days_worked} dias
                      </span>
                    )}
                    {assignment.hours_worked && (
                      <span className="text-xs text-muted-foreground">
                        {assignment.hours_worked}h
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(assignment.total_amount || 0)}
                    </span>
                    {!assignment.is_paid && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsPaid(assignment.id)}
                        className="hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Visualização em Lista */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {paginatedAssignments.map((assignment) => (
                <div 
                  key={assignment.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors",
                    assignment.is_paid && "bg-emerald-500/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    assignment.is_paid ? "bg-emerald-500/20" : "bg-amber-500/20"
                  )}>
                    {assignment.is_paid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {assignment.service_provider?.name || "—"}
                      </span>
                      {assignment.service_provider?.specialty && (
                        <Badge variant="secondary" className="text-xs">
                          {assignment.service_provider.specialty}
                        </Badge>
                      )}
                    </div>
                    {assignment.service_order && (
                      <p className="text-sm text-muted-foreground truncate">
                        OS #{assignment.service_order.order_number} - {assignment.service_order.title}
                      </p>
                    )}
                  </div>

                  <div className="hidden md:flex items-center gap-4">
                    <Badge variant="outline">
                      {PAYMENT_TYPE_LABELS[assignment.payment_type]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(assignment.assigned_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(assignment.total_amount || 0)}
                    </p>
                    {assignment.is_paid ? (
                      <Badge className="bg-emerald-500 text-white text-xs">Pago</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsPaid(assignment.id)}
                        className="text-xs h-6 px-2 hover:bg-emerald-500 hover:text-white"
                      >
                        Marcar Pago
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAssignments.length)} de {filteredAssignments.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  page = currentPage - 2 + i;
                }
                if (page > totalPages) page = totalPages - 4 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <AssignProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        providers={activeProviders}
      />
    </div>
  );
}
