import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Shield, Pencil, Trash2, LayoutDashboard, Package, Car, Users, 
  ClipboardList, Building2, FileText, BarChart3, Settings, Download, DollarSign, 
  UserCog, PieChart, Save, Wrench, Eye, HardHat, ArrowLeftRight, Briefcase, 
  BookOpen, Truck, ChevronDown, Check, X, Copy
} from 'lucide-react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardVendas } from '@/components/dashboard/DashboardVendas';
import { DashboardEstoque } from '@/components/dashboard/DashboardEstoque';
import { DashboardFrota } from '@/components/dashboard/DashboardFrota';
import { DashboardServico } from '@/components/dashboard/DashboardServico';
import { DashboardRH } from '@/components/dashboard/DashboardRH';
import { DashboardObras } from '@/components/dashboard/DashboardObras';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';

interface PermissionTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  color: string;
  default_dashboard: string;
  page_dashboard: boolean;
  page_stock: boolean;
  page_movimentacao: boolean;
  page_fleet: boolean;
  page_teams: boolean;
  page_service_orders: boolean;
  page_customers: boolean;
  page_invoices: boolean;
  page_fechamento: boolean;
  page_reports: boolean;
  page_settings: boolean;
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
  is_active: boolean;
  created_at: string;
}

const dashboardOptions = [
  { value: 'overview', label: 'Visão Geral', icon: PieChart, color: 'bg-blue-500' },
  { value: 'vendas', label: 'Vendas', icon: DollarSign, color: 'bg-emerald-500' },
  { value: 'estoque', label: 'Estoque', icon: Package, color: 'bg-amber-500' },
  { value: 'frota', label: 'Frota', icon: Car, color: 'bg-purple-500' },
  { value: 'servico', label: 'Ordens de Serviço', icon: ClipboardList, color: 'bg-rose-500' },
  { value: 'rh', label: 'Recursos Humanos', icon: Users, color: 'bg-indigo-500' },
  { value: 'obras', label: 'Obras', icon: HardHat, color: 'bg-orange-500' },
];

const defaultTemplate: Omit<PermissionTemplate, 'id' | 'tenant_id' | 'created_at'> = {
  name: '',
  description: '',
  color: '#3b82f6',
  default_dashboard: 'overview',
  page_dashboard: true,
  page_stock: true,
  page_movimentacao: false,
  page_fleet: false,
  page_teams: false,
  page_service_orders: false,
  page_customers: false,
  page_invoices: false,
  page_fechamento: false,
  page_reports: false,
  page_settings: false,
  page_hr: false,
  page_obras: false,
  page_diario_obras: false,
  page_suppliers: false,
  can_create: true,
  can_edit: true,
  can_delete: false,
  can_export: true,
  can_view_costs: false,
  can_view_reports: false,
  can_manage_users: false,
  is_active: true,
};

const colorOptions = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];


export function PermissionTemplatesPanel() {
  const { tenant } = useAuthContext();
  const { features } = useTenantFeatures();
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(defaultTemplate);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Dashboard preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string>('overview');

  const pagePermissions = [
    { key: 'page_dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, featureKey: null },
    { key: 'page_stock' as const, label: 'Estoque', icon: Package, featureKey: 'enable_stock' as const },
    { key: 'page_movimentacao' as const, label: 'Movimentação', icon: ArrowLeftRight, featureKey: 'enable_movimentacao' as const },
    { key: 'page_fleet' as const, label: 'Frota', icon: Car, featureKey: 'enable_fleet' as const },
    { key: 'page_teams' as const, label: 'Equipes', icon: Users, featureKey: 'enable_teams' as const },
    { key: 'page_service_orders' as const, label: 'Ordens de Serviço', icon: ClipboardList, featureKey: 'enable_service_orders' as const },
    { key: 'page_customers' as const, label: 'Clientes', icon: Building2, featureKey: 'enable_customers' as const },
    { key: 'page_invoices' as const, label: 'Notas Fiscais', icon: FileText, featureKey: 'enable_invoices' as const },
    { key: 'page_fechamento' as const, label: 'Fechamento', icon: DollarSign, featureKey: 'enable_fechamento' as const },
    { key: 'page_reports' as const, label: 'Relatórios', icon: BarChart3, featureKey: 'enable_reports' as const },
    { key: 'page_settings' as const, label: 'Configurações', icon: Settings, featureKey: null },
    { key: 'page_hr' as const, label: 'Recursos Humanos', icon: Briefcase, featureKey: 'enable_hr' as const },
    { key: 'page_obras' as const, label: 'Obras', icon: HardHat, featureKey: 'enable_obras' as const },
    { key: 'page_diario_obras' as const, label: 'Diário de Obras', icon: BookOpen, featureKey: 'enable_obras' as const },
    { key: 'page_suppliers' as const, label: 'Fornecedores', icon: Truck, featureKey: 'show_suppliers' as const },
  ];

  const actionPermissions = [
    { key: 'can_create' as const, label: 'Criar', icon: Plus },
    { key: 'can_edit' as const, label: 'Editar', icon: Pencil },
    { key: 'can_delete' as const, label: 'Excluir', icon: Trash2 },
    { key: 'can_export' as const, label: 'Exportar', icon: Download },
    { key: 'can_view_costs' as const, label: 'Ver Custos', icon: DollarSign },
    { key: 'can_view_reports' as const, label: 'Ver Relatórios', icon: BarChart3 },
    { key: 'can_manage_users' as const, label: 'Gerenciar Usuários', icon: UserCog },
  ];

  const isFeatureEnabled = (featureKey: string | null) => {
    if (!featureKey) return true;
    return features[featureKey as keyof typeof features] ?? true;
  };

  const handlePreviewClick = (dashboardType: string) => {
    setSelectedPreview(dashboardType);
    setPreviewDialogOpen(true);
  };

  const renderDashboardPreview = () => {
    switch (selectedPreview) {
      case 'vendas': return <DashboardVendas />;
      case 'estoque': return <DashboardEstoque />;
      case 'frota': return <DashboardFrota />;
      case 'servico': return <DashboardServico />;
      case 'rh': return <DashboardRH />;
      case 'obras': return <DashboardObras />;
      default: return <DashboardOverview />;
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchTemplates();
    }
  }, [tenant?.id]);

  const fetchTemplates = async () => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('permission_templates')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('name');

      if (error) throw error;
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        page_hr: item.page_hr ?? false,
        page_obras: item.page_obras ?? false,
        page_suppliers: item.page_suppliers ?? false,
      })) as PermissionTemplate[];
      setTemplates(mappedData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar perfis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (template?: PermissionTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        color: template.color,
        default_dashboard: template.default_dashboard || 'overview',
        page_dashboard: template.page_dashboard,
        page_stock: template.page_stock,
        page_movimentacao: template.page_movimentacao,
        page_fleet: template.page_fleet,
        page_teams: template.page_teams,
        page_service_orders: template.page_service_orders,
        page_customers: template.page_customers,
        page_invoices: template.page_invoices,
        page_fechamento: template.page_fechamento,
        page_reports: template.page_reports,
        page_settings: template.page_settings,
        page_hr: template.page_hr ?? false,
        page_obras: template.page_obras ?? false,
        page_diario_obras: template.page_diario_obras ?? false,
        page_suppliers: template.page_suppliers ?? false,
        can_create: template.can_create,
        can_edit: template.can_edit,
        can_delete: template.can_delete,
        can_export: template.can_export,
        can_view_costs: template.can_view_costs,
        can_view_reports: template.can_view_reports,
        can_manage_users: template.can_manage_users,
        is_active: template.is_active,
      });
    } else {
      setEditingTemplate(null);
      setFormData(defaultTemplate);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenant?.id) return;
    if (!formData.name.trim()) {
      toast.error('Nome do perfil é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('permission_templates')
          .update(formData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Perfil atualizado!');
      } else {
        const { error } = await supabase
          .from('permission_templates')
          .insert({ ...formData, tenant_id: tenant.id });

        if (error) throw error;
        toast.success('Perfil criado!');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: PermissionTemplate) => {
    if (!confirm(`Deseja excluir o perfil "${template.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('permission_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;
      toast.success('Perfil excluído!');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir perfil');
    }
  };

  const handleDuplicate = (template: PermissionTemplate) => {
    setEditingTemplate(null);
    setFormData({
      ...template,
      name: `${template.name} (Cópia)`,
    });
    setDialogOpen(true);
  };

  const updateFormData = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const countPermissions = (template: PermissionTemplate) => {
    const pages = pagePermissions.filter(p => template[p.key]).length;
    const actions = actionPermissions.filter(a => template[a.key]).length;
    return { pages, actions };
  };

  const getEnabledPages = (template: PermissionTemplate) => {
    return pagePermissions.filter(p => template[p.key]);
  };

  const getEnabledActions = (template: PermissionTemplate) => {
    return actionPermissions.filter(a => template[a.key]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
            <Shield className="h-4 w-4" />
            Perfis de Permissão
          </h2>
          <p className="text-xs text-white/50 hidden sm:block">
            Crie perfis para atribuir aos usuários
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="sm" className="gap-1 text-xs">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Novo </span>Perfil
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed bg-white/5 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Shield className="h-8 w-8 text-white/30 mb-3" />
            <h3 className="text-sm font-medium mb-1 text-white">Nenhum perfil cadastrado</h3>
            <p className="text-xs text-white/50 mb-3 text-center">
              Crie perfis para controlar o acesso
            </p>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Criar Primeiro Perfil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {templates.map((template) => {
            const { pages, actions } = countPermissions(template);
            const enabledPages = getEnabledPages(template);
            const enabledActions = getEnabledActions(template);
            const dashboardInfo = dashboardOptions.find(d => d.value === (template.default_dashboard || 'overview'));
            const DashboardIcon = dashboardInfo?.icon || PieChart;
            const isExpanded = expandedCard === template.id;
            
            return (
              <Collapsible 
                key={template.id} 
                open={isExpanded} 
                onOpenChange={() => setExpandedCard(isExpanded ? null : template.id)}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-200 bg-white/5 border-white/10 ${
                    !template.is_active ? 'opacity-60' : ''
                  } ${isExpanded ? 'ring-2 ring-primary' : 'hover:shadow-md cursor-pointer'}`}
                >
                  {/* Color indicator bar */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: template.color }}
                  />
                  
                  <CollapsibleTrigger asChild>
                    <CardHeader className={`cursor-pointer ${isExpanded ? 'pb-2' : 'pb-3'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${template.color}20` }}
                          >
                            <Shield className="h-4 w-4" style={{ color: template.color }} />
                          </div>
                          <span className="font-medium text-sm truncate text-white">{template.name}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-2 pt-0">
                      {template.description && (
                        <p className="text-xs text-white/50 line-clamp-2">{template.description}</p>
                      )}
                      
                      {/* Quick stats */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className={`p-1 rounded ${dashboardInfo?.color}`}>
                            <DashboardIcon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-white/50">{dashboardInfo?.label}</span>
                        </div>
                      </div>

                      {/* Permission pills compact */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs gap-1 border-white/20 text-white/70">
                          <LayoutDashboard className="h-3 w-3" />
                          {pages} páginas
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-1 border-white/20 text-white/70">
                          <Settings className="h-3 w-3" />
                          {actions} funções
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Button variant="ghost" size="sm" className="flex-1 text-white/70 hover:text-white hover:bg-white/10" onClick={() => handleOpenDialog(template)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => handleDuplicate(template)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => handleDelete(template)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Dashboard Gallery */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <LayoutDashboard className="h-4 w-4" />
            Dashboards Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {dashboardOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => handlePreviewClick(option.value)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  title={option.label}
                >
                  <div className={`${option.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                    <OptionIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] text-white/60 text-center truncate w-full">{option.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
            <DialogTitle className="text-primary-foreground">
              {editingTemplate ? 'Editar Perfil' : 'Novo Perfil de Permissão'}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              Configure as permissões padrão para este perfil de usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Perfil *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Ex: Almoxarife"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateFormData('color', color)}
                      >
                        {formData.color === color && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Descrição do perfil e suas responsabilidades"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Dashboard Padrão</Label>
                <Select
                  value={formData.default_dashboard}
                  onValueChange={(value) => updateFormData('default_dashboard', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboardOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`${option.color} p-1 rounded`}>
                              <OptionIcon className="h-3 w-3 text-white" />
                            </div>
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            <Tabs defaultValue="pages">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pages">Páginas</TabsTrigger>
                <TabsTrigger value="actions">Funções</TabsTrigger>
              </TabsList>

              <TabsContent value="pages" className="mt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {pagePermissions.map(({ key, label, icon: Icon, featureKey }) => {
                    const featureEnabled = isFeatureEnabled(featureKey);
                    return (
                      <div 
                        key={key} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          featureEnabled 
                            ? formData[key] 
                              ? 'bg-primary/5 border-primary/30' 
                              : 'hover:bg-accent/50' 
                            : 'opacity-50 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${formData[key] ? 'text-primary' : 'text-muted-foreground'}`} />
                          <Label htmlFor={key} className={`text-sm ${featureEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            {label}
                          </Label>
                        </div>
                        <Switch
                          id={key}
                          checked={formData[key]}
                          onCheckedChange={(checked) => updateFormData(key, checked)}
                          disabled={!featureEnabled}
                        />
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {actionPermissions.map(({ key, label, icon: Icon }) => (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        formData[key] ? 'bg-primary/5 border-primary/30' : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${key === 'can_delete' ? 'text-destructive' : formData[key] ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Label htmlFor={key} className="cursor-pointer text-sm">{label}</Label>
                      </div>
                      <Switch
                        id={key}
                        checked={formData[key]}
                        onCheckedChange={(checked) => updateFormData(key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <Label htmlFor="is_active" className="cursor-pointer">Perfil ativo</Label>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateFormData('is_active', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview - {dashboardOptions.find(d => d.value === selectedPreview)?.label || 'Visão Geral'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 border rounded-lg p-4 bg-muted/30 max-h-[60vh] overflow-y-auto">
            {renderDashboardPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
