import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, LayoutDashboard, Package, Car, Users, ClipboardList, Building2, FileText, BarChart3, Settings, Plus, Pencil, Trash2, Download, Eye, DollarSign, UserCog, Home, ArrowLeftRight, Briefcase, HardHat, BookOpen, Truck } from 'lucide-react';
import { UserWithDetails } from '@/types/database';

interface UserPermissionsDialogProps {
  user: UserWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

interface PermissionsState {
  page_dashboard: boolean;
  page_stock: boolean;
  page_fleet: boolean;
  page_teams: boolean;
  page_service_orders: boolean;
  page_customers: boolean;
  page_invoices: boolean;
  page_reports: boolean;
  page_settings: boolean;
  page_movimentacao: boolean;
  page_fechamento: boolean;
  page_hr: boolean;
  page_obras: boolean;
  page_diario_obras: boolean;
  page_suppliers: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_view_costs: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  dashboard_type: string | null;
}

const defaultPermissions: PermissionsState = {
  page_dashboard: true,
  page_stock: true,
  page_fleet: true,
  page_teams: true,
  page_service_orders: true,
  page_customers: true,
  page_invoices: true,
  page_reports: true,
  page_settings: false,
  page_movimentacao: true,
  page_fechamento: true,
  page_hr: true,
  page_obras: true,
  page_diario_obras: true,
  page_suppliers: true,
  can_create: true,
  can_edit: true,
  can_delete: false,
  can_export: true,
  can_view_costs: true,
  can_view_reports: true,
  can_manage_users: false,
  dashboard_type: null,
};

const dashboardTypes = [
  { value: 'default', label: 'Padrão do cargo', description: 'Usa o dashboard definido para o cargo do usuário' },
  { value: 'overview', label: 'Visão Geral', description: 'Dashboard completo com todas as informações' },
  { value: 'vendas', label: 'Vendas', description: 'Focado em vendas, pedidos e faturamento' },
  { value: 'estoque', label: 'Estoque/Almoxarifado', description: 'Focado em controle de estoque' },
  { value: 'frota', label: 'Frota', description: 'Focado em veículos e manutenções' },
  { value: 'servico', label: 'Ordens de Serviço', description: 'Focado em OS e técnicos' },
];

export function UserPermissionsDialog({ user, open, onOpenChange, onSave }: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<PermissionsState>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchPermissions();
    }
  }, [open, user]);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const anyData = data as any;
        setPermissions({
          page_dashboard: anyData.page_dashboard ?? true,
          page_stock: anyData.page_stock ?? true,
          page_fleet: anyData.page_fleet ?? true,
          page_teams: anyData.page_teams ?? true,
          page_service_orders: anyData.page_service_orders ?? true,
          page_customers: anyData.page_customers ?? true,
          page_invoices: anyData.page_invoices ?? true,
          page_reports: anyData.page_reports ?? true,
          page_settings: anyData.page_settings ?? false,
          page_movimentacao: anyData.page_movimentacao ?? true,
          page_fechamento: anyData.page_fechamento ?? true,
          page_hr: anyData.page_hr ?? true,
          page_obras: anyData.page_obras ?? true,
          page_diario_obras: anyData.page_diario_obras ?? true,
          page_suppliers: anyData.page_suppliers ?? true,
          can_create: anyData.can_create ?? true,
          can_edit: anyData.can_edit ?? true,
          can_delete: anyData.can_delete ?? false,
          can_export: anyData.can_export ?? true,
          can_view_costs: anyData.can_view_costs ?? true,
          can_view_reports: anyData.can_view_reports ?? true,
          can_manage_users: anyData.can_manage_users ?? false,
          dashboard_type: anyData.dashboard_type ?? null,
        });
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user.tenant_id) {
      toast.error('Usuário não possui empresa vinculada');
      return;
    }

    setIsSaving(true);
    try {
      const dashboardValue = permissions.dashboard_type === 'default' ? null : permissions.dashboard_type;
      
      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: user.id,
          tenant_id: user.tenant_id,
          ...permissions,
          dashboard_type: dashboardValue,
        }, { onConflict: 'user_id,tenant_id' });

      if (error) throw error;

      toast.success('Permissões salvas com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePermission = (key: keyof PermissionsState, value: boolean | string | null) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const pagePermissions = [
    { key: 'page_dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'page_stock' as const, label: 'Estoque', icon: Package },
    { key: 'page_movimentacao' as const, label: 'Movimentação', icon: ArrowLeftRight },
    { key: 'page_fleet' as const, label: 'Frota', icon: Car },
    { key: 'page_teams' as const, label: 'Equipes', icon: Users },
    { key: 'page_service_orders' as const, label: 'Ordens de Serviço', icon: ClipboardList },
    { key: 'page_customers' as const, label: 'Clientes', icon: Building2 },
    { key: 'page_invoices' as const, label: 'Notas Fiscais', icon: FileText },
    { key: 'page_fechamento' as const, label: 'Fechamento', icon: DollarSign },
    { key: 'page_reports' as const, label: 'Relatórios', icon: BarChart3 },
    { key: 'page_settings' as const, label: 'Configurações', icon: Settings },
    { key: 'page_hr' as const, label: 'Recursos Humanos', icon: Briefcase },
    { key: 'page_obras' as const, label: 'Obras', icon: HardHat },
    { key: 'page_diario_obras' as const, label: 'Diário de Obras', icon: BookOpen },
    { key: 'page_suppliers' as const, label: 'Fornecedores', icon: Truck },
  ];

  const actionPermissions = [
    { key: 'can_create' as const, label: 'Criar Registros', icon: Plus, description: 'Permite criar novos registros em todos os módulos' },
    { key: 'can_edit' as const, label: 'Editar Registros', icon: Pencil, description: 'Permite editar registros existentes' },
    { key: 'can_delete' as const, label: 'Excluir Registros', icon: Trash2, description: 'Permite excluir registros (ação crítica)' },
    { key: 'can_export' as const, label: 'Exportar Dados', icon: Download, description: 'Permite exportar dados em PDF/Excel' },
    { key: 'can_view_costs' as const, label: 'Ver Custos/Valores', icon: DollarSign, description: 'Permite visualizar campos de custos e valores' },
    { key: 'can_view_reports' as const, label: 'Ver Relatórios', icon: BarChart3, description: 'Permite acessar relatórios detalhados' },
    { key: 'can_manage_users' as const, label: 'Gerenciar Usuários', icon: UserCog, description: 'Permite gerenciar usuários da empresa' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-primary-foreground">
            <Settings className="h-5 w-5" />
            Permissões de {user.full_name || 'Usuário'}
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            Configure as permissões de acesso a páginas e funções para este usuário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="pages">Páginas</TabsTrigger>
              <TabsTrigger value="actions">Funções</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Defina qual dashboard este usuário verá ao fazer login.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-base font-medium">Tipo de Dashboard</Label>
                    <p className="text-sm text-muted-foreground">
                      Escolha o dashboard que será exibido para este usuário
                    </p>
                  </div>
                </div>

                <Select 
                  value={permissions.dashboard_type || 'default'} 
                  onValueChange={(value) => updatePermission('dashboard_type', value === 'default' ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Se "Padrão do cargo" for selecionado, o dashboard será definido 
                    automaticamente baseado no cargo do usuário (admin, manager, warehouse, technician).
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pages" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Defina quais páginas este usuário pode acessar no sistema.
              </p>
              <div className="grid gap-3">
                {pagePermissions.map(({ key, label, icon: Icon }) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <Label htmlFor={key} className="cursor-pointer">
                        {label}
                      </Label>
                    </div>
                    <Switch
                      id={key}
                      checked={permissions[key] as boolean}
                      onCheckedChange={(checked) => updatePermission(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Defina quais ações este usuário pode executar no sistema.
              </p>
              <div className="grid gap-3">
                {actionPermissions.map(({ key, label, icon: Icon, description }) => (
                  <div 
                    key={key} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${key === 'can_delete' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Icon className={`h-4 w-4 ${key === 'can_delete' ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <div>
                        <Label htmlFor={key} className="cursor-pointer">
                          {label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch
                      id={key}
                      checked={permissions[key] as boolean}
                      onCheckedChange={(checked) => updatePermission(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
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
              'Salvar Permissões'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
