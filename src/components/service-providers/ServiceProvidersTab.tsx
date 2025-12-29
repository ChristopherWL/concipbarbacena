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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => {
            const paymentInfo = getPaymentInfo(provider);
            return (
              <Card 
                key={provider.id} 
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  !provider.is_active ? 'opacity-60 bg-muted/50' : ''
                }`}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  provider.is_active ? 'bg-success' : 'bg-muted-foreground'
                }`} />
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={provider.photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {provider.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online/offline indicator */}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                          provider.is_active ? 'bg-success' : 'bg-muted-foreground'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{provider.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {provider.specialty && (
                            <Badge variant="secondary" className="text-xs">
                              {provider.specialty}
                            </Badge>
                          )}
                          {!provider.is_active && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Toggle Active */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={provider.is_active}
                            onCheckedChange={() => handleToggleActive(provider)}
                            className="data-[state=checked]:bg-success"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {provider.is_active ? 'Desativar prestador' : 'Ativar prestador'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-1.5 text-sm">
                    {provider.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${provider.phone}`} className="hover:text-foreground transition-colors">
                          {provider.phone}
                        </a>
                      </div>
                    )}
                    {provider.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a href={`mailto:${provider.email}`} className="truncate hover:text-foreground transition-colors">
                          {provider.email}
                        </a>
                      </div>
                    )}
                    {provider.city && provider.state && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{provider.city}/{provider.state}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{paymentInfo.label}</span>
                    </div>
                    {paymentInfo.rate && (
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {formatCurrency(paymentInfo.rate)}
                      </Badge>
                    )}
                  </div>

                  {/* Bank Info Indicator */}
                  {(provider.bank_name || provider.pix_key) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>
                        {provider.bank_name ? `${provider.bank_name}` : ''}
                        {provider.bank_name && provider.pix_key ? ' • ' : ''}
                        {provider.pix_key ? 'PIX cadastrado' : ''}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(provider)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setProviderToDelete(provider); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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