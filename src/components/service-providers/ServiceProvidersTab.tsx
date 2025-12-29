import { useState } from "react";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Phone, Mail, Wrench, Edit, Trash2, MapPin, CreditCard, Building2, UserCheck, UserX } from "lucide-react";
import { ServiceProviderFormDialog } from "./ServiceProviderFormDialog";
import { PAYMENT_TYPE_LABELS, type ServiceProvider, type PaymentType } from "@/types/serviceProviders";
import { formatCurrency } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ServiceProvidersTab() {
  const { providers, isLoading, deleteProvider, toggleProviderActive } = useServiceProviders();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<ServiceProvider | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredProviders = providers.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(search.toLowerCase()) ||
      p.document?.includes(search);
    
    const matchesStatus = 
      statusFilter === "all" ? true :
      statusFilter === "active" ? p.is_active :
      !p.is_active;
    
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const activeCount = providers.filter(p => p.is_active).length;
  const inactiveCount = providers.filter(p => !p.is_active).length;

  const handleEdit = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (providerToDelete) {
      await deleteProvider(providerToDelete.id);
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    }
  };

  const handleToggleActive = async (provider: ServiceProvider) => {
    await toggleProviderActive({ id: provider.id, isActive: !provider.is_active });
  };

  const getPaymentInfo = (provider: ServiceProvider) => {
    const type = provider.payment_type as PaymentType;
    const rates: Record<PaymentType, number | undefined> = {
      diaria: provider.daily_rate,
      hora: provider.hourly_rate,
      por_os: provider.rate_per_os,
      mensal: provider.monthly_rate,
    };
    const rate = rates[type];
    return { label: PAYMENT_TYPE_LABELS[type], rate };
  };

  if (isLoading) {
    return <TableSkeleton columns={5} rows={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar prestador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => { setSelectedProvider(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prestador
          </Button>
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Ativos</span>
              <Badge variant="secondary" className="ml-1">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              <span className="hidden sm:inline">Inativos</span>
              <Badge variant="secondary" className="ml-1">{inactiveCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <span>Todos</span>
              <Badge variant="secondary" className="ml-1">{providers.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum prestador encontrado</p>
            <p className="text-sm">
              {statusFilter === "inactive" 
                ? "Não há prestadores inativos" 
                : "Clique em \"Novo Prestador\" para começar"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProviders.map((provider) => {
            return (
              <Card 
                key={provider.id} 
                className={`group relative transition-all duration-300 hover:shadow-lg border-0 shadow-sm ${
                  !provider.is_active ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 rounded-xl bg-primary text-primary-foreground shrink-0">
                      <AvatarImage src={provider.photo_url || undefined} className="rounded-xl" />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg rounded-xl">
                        {provider.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Name */}
                      <h3 className="font-semibold text-foreground truncate text-base">
                        {provider.name}
                      </h3>

                      {/* Document */}
                      {provider.document && (
                        <Badge variant="secondary" className="font-mono text-xs bg-muted/80">
                          {provider.document}
                        </Badge>
                      )}

                      {/* Specialty */}
                      {provider.specialty && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wrench className="h-4 w-4 shrink-0" />
                          <span className="truncate">{provider.specialty}</span>
                        </div>
                      )}

                      {/* Location */}
                      {(provider.city || provider.state) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0 text-orange-500" />
                          <span className="truncate">
                            {provider.city}{provider.city && provider.state ? '/' : ''}{provider.state}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(provider)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => { setProviderToDelete(provider); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Status Footer */}
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${provider.is_active ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                        {provider.is_active ? 'Prestador ativo' : 'Prestador inativo'}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Switch
                              checked={provider.is_active}
                              onCheckedChange={() => handleToggleActive(provider)}
                              className="data-[state=checked]:bg-success scale-90"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {provider.is_active ? 'Desativar' : 'Ativar'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProviders.length)} de {filteredProviders.length}
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
        </>
      )}

      <ServiceProviderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={selectedProvider}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prestador?</AlertDialogTitle>
            <AlertDialogDescription>
              O prestador "{providerToDelete?.name}" será excluído permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}