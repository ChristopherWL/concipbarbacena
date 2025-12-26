import { useState } from "react";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Plus, Search, Phone, Mail, Wrench, Edit, Trash2 } from "lucide-react";
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

export function ServiceProvidersTab() {
  const { providers, isLoading, deleteProvider } = useServiceProviders();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<ServiceProvider | null>(null);

  const filteredProviders = providers.filter((p) =>
    p.is_active && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(search.toLowerCase()) ||
      p.document?.includes(search)
    )
  );

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

  const getPaymentRateLabel = (provider: ServiceProvider) => {
    const type = provider.payment_type as PaymentType;
    const rates: Record<PaymentType, number | undefined> = {
      diaria: provider.daily_rate,
      hora: provider.hourly_rate,
      por_os: provider.rate_per_os,
      mensal: provider.monthly_rate,
    };
    const rate = rates[type];
    if (!rate) return PAYMENT_TYPE_LABELS[type];
    return `${PAYMENT_TYPE_LABELS[type]}: ${formatCurrency(rate)}`;
  };

  if (isLoading) {
    return <TableSkeleton columns={5} rows={5} />;
  }

  return (
    <div className="space-y-4">
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

      {filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum prestador encontrado</p>
            <p className="text-sm">Clique em "Novo Prestador" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={provider.photo_url || undefined} />
                      <AvatarFallback>
                        {provider.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      {provider.specialty && (
                        <Badge variant="secondary" className="mt-1">
                          {provider.specialty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(provider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setProviderToDelete(provider); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {provider.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{provider.email}</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Badge variant="outline">
                    {getPaymentRateLabel(provider)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
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
            <AlertDialogTitle>Desativar prestador?</AlertDialogTitle>
            <AlertDialogDescription>
              O prestador "{providerToDelete?.name}" será desativado e não aparecerá mais na lista.
              Esta ação pode ser revertida posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
