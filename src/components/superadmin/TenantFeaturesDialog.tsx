import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Package, Car, Users, ClipboardList, Building2, FileText, BarChart3, DollarSign, Eye, Truck } from 'lucide-react';
import { Tenant, TenantFeatures } from '@/types/database';

interface TenantFeaturesDialogProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const defaultFeatures: Omit<TenantFeatures, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> = {
  enable_fleet: true,
  enable_service_orders: true,
  enable_teams: true,
  enable_customers: true,
  enable_invoices: true,
  enable_reports: true,
  show_prices: true,
  show_costs: true,
  show_suppliers: true,
  settings: {},
};

export function TenantFeaturesDialog({ tenant, open, onOpenChange, onSave }: TenantFeaturesDialogProps) {
  const [features, setFeatures] = useState(defaultFeatures);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && tenant) {
      fetchFeatures();
    }
  }, [open, tenant]);

  const fetchFeatures = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFeatures({
          enable_fleet: data.enable_fleet ?? true,
          enable_service_orders: data.enable_service_orders ?? true,
          enable_teams: data.enable_teams ?? true,
          enable_customers: data.enable_customers ?? true,
          enable_invoices: data.enable_invoices ?? true,
          enable_reports: data.enable_reports ?? true,
          show_prices: data.show_prices ?? true,
          show_costs: data.show_costs ?? true,
          show_suppliers: data.show_suppliers ?? true,
          settings: (data.settings as Record<string, unknown>) ?? {},
        });
      } else {
        setFeatures(defaultFeatures);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('tenant_features')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('tenant_features')
          .update({
            enable_fleet: features.enable_fleet,
            enable_service_orders: features.enable_service_orders,
            enable_teams: features.enable_teams,
            enable_customers: features.enable_customers,
            enable_invoices: features.enable_invoices,
            enable_reports: features.enable_reports,
            show_prices: features.show_prices,
            show_costs: features.show_costs,
            show_suppliers: features.show_suppliers,
          })
          .eq('tenant_id', tenant.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('tenant_features')
          .insert({
            tenant_id: tenant.id,
            enable_fleet: features.enable_fleet,
            enable_service_orders: features.enable_service_orders,
            enable_teams: features.enable_teams,
            enable_customers: features.enable_customers,
            enable_invoices: features.enable_invoices,
            enable_reports: features.enable_reports,
            show_prices: features.show_prices,
            show_costs: features.show_costs,
            show_suppliers: features.show_suppliers,
          });
        error = result.error;
      }

      if (error) throw error;

      toast.success('Módulos configurados com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (key: keyof typeof features, value: boolean) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
  };

  const moduleFeatures = [
    { 
      key: 'enable_fleet' as const, 
      label: 'Módulo Frota', 
      icon: Car, 
      description: 'Veículos, manutenções, combustível e abastecimentos' 
    },
    { 
      key: 'enable_service_orders' as const, 
      label: 'Módulo Ordens de Serviço', 
      icon: ClipboardList, 
      description: 'Gestão de OS, agendamentos e execução de serviços' 
    },
    { 
      key: 'enable_teams' as const, 
      label: 'Módulo Equipes', 
      icon: Users, 
      description: 'Técnicos, equipes e atribuições de trabalho' 
    },
    { 
      key: 'enable_customers' as const, 
      label: 'Módulo Clientes', 
      icon: Building2, 
      description: 'Cadastro e gestão de clientes' 
    },
    { 
      key: 'enable_invoices' as const, 
      label: 'Módulo Notas Fiscais', 
      icon: FileText, 
      description: 'Entrada de notas fiscais e XML' 
    },
    { 
      key: 'enable_reports' as const, 
      label: 'Módulo Relatórios', 
      icon: BarChart3, 
      description: 'Relatórios, dashboards e análises' 
    },
  ];

  const displayFeatures = [
    { 
      key: 'show_prices' as const, 
      label: 'Exibir Preços de Venda', 
      icon: DollarSign, 
      description: 'Mostra campos de preço de venda nos produtos' 
    },
    { 
      key: 'show_costs' as const, 
      label: 'Exibir Custos', 
      icon: Eye, 
      description: 'Mostra campos de custo e valores financeiros' 
    },
    { 
      key: 'show_suppliers' as const, 
      label: 'Exibir Fornecedores', 
      icon: Truck, 
      description: 'Mostra módulo de fornecedores' 
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-primary-foreground">
            <Package className="h-5 w-5" />
            Módulos de {tenant.name}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            Configure quais módulos e funcionalidades estão disponíveis para esta empresa.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Module Features */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
                Módulos do Sistema
              </h3>
              <div className="grid gap-3">
                {moduleFeatures.map(({ key, label, icon: Icon, description }) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${features[key] ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-4 w-4 ${features[key] ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <Label htmlFor={key} className="cursor-pointer font-medium">
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={features[key]}
                      onCheckedChange={(checked) => updateFeature(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Display Features */}
            <div>
              <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
                Exibição de Campos
              </h3>
              <div className="grid gap-3">
                {displayFeatures.map(({ key, label, icon: Icon, description }) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${features[key] ? 'bg-green-500/10' : 'bg-muted'}`}>
                        <Icon className={`h-4 w-4 ${features[key] ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <Label htmlFor={key} className="cursor-pointer font-medium">
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={features[key]}
                      onCheckedChange={(checked) => updateFeature(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
