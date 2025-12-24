import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  Loader2, Package, Car, Users, ClipboardList, Building2, FileText, 
  BarChart3, DollarSign, Eye, Truck, Save, UserCog, HardHat, Wrench, Calculator,
  ChevronDown, ChevronRight, Settings, AlertTriangle, ArrowLeftRight, BookOpen
} from 'lucide-react';

interface SystemFeatures {
  // Main modules
  enable_stock: boolean;
  enable_movimentacao: boolean;
  enable_cautelas: boolean;
  enable_fechamento: boolean;
  enable_fleet: boolean;
  enable_service_orders: boolean;
  enable_teams: boolean;
  enable_customers: boolean;
  enable_invoices: boolean;
  enable_reports: boolean;
  enable_hr: boolean;
  enable_obras: boolean;
  // Estoque subpages
  enable_stock_materiais: boolean;
  enable_stock_equipamentos: boolean;
  enable_stock_ferramentas: boolean;
  enable_stock_epi: boolean;
  enable_stock_epc: boolean;
  enable_stock_auditoria: boolean;
  // Notas Fiscais subpages
  enable_nf_entrada: boolean;
  enable_nf_emissao: boolean;
  // RH subpages
  enable_hr_colaboradores: boolean;
  enable_hr_folha: boolean;
  enable_hr_ferias: boolean;
  enable_hr_afastamentos: boolean;
  // Obras subpages
  enable_obras_projetos: boolean;
  enable_obras_diario: boolean;
  // Display features
  show_prices: boolean;
  show_costs: boolean;
  show_suppliers: boolean;
}

const defaultFeatures: SystemFeatures = {
  enable_stock: true,
  enable_movimentacao: true,
  enable_cautelas: true,
  enable_fechamento: true,
  enable_fleet: true,
  enable_service_orders: true,
  enable_teams: true,
  enable_customers: true,
  enable_invoices: true,
  enable_reports: true,
  enable_hr: true,
  enable_obras: true,
  enable_stock_materiais: true,
  enable_stock_equipamentos: true,
  enable_stock_ferramentas: true,
  enable_stock_epi: true,
  enable_stock_epc: true,
  enable_stock_auditoria: true,
  enable_nf_entrada: true,
  enable_nf_emissao: true,
  enable_hr_colaboradores: true,
  enable_hr_folha: true,
  enable_hr_ferias: true,
  enable_hr_afastamentos: true,
  enable_obras_projetos: true,
  enable_obras_diario: true,
  show_prices: true,
  show_costs: true,
  show_suppliers: true,
};

export function SystemModulesPanel() {
  const { tenant } = useAuthContext();
  const [features, setFeatures] = useState<SystemFeatures>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    if (tenant?.id) {
      fetchData();
    }
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const featuresData = data as any;
        setFeatures({
          enable_stock: featuresData.enable_stock ?? true,
          enable_movimentacao: featuresData.enable_movimentacao ?? true,
          enable_cautelas: featuresData.enable_cautelas ?? true,
          enable_fechamento: featuresData.enable_fechamento ?? true,
          enable_fleet: featuresData.enable_fleet ?? true,
          enable_service_orders: featuresData.enable_service_orders ?? true,
          enable_teams: featuresData.enable_teams ?? true,
          enable_customers: featuresData.enable_customers ?? true,
          enable_invoices: featuresData.enable_invoices ?? true,
          enable_reports: featuresData.enable_reports ?? true,
          enable_hr: featuresData.enable_hr ?? true,
          enable_obras: featuresData.enable_obras ?? true,
          enable_stock_materiais: featuresData.enable_stock_materiais ?? true,
          enable_stock_equipamentos: featuresData.enable_stock_equipamentos ?? true,
          enable_stock_ferramentas: featuresData.enable_stock_ferramentas ?? true,
          enable_stock_epi: featuresData.enable_stock_epi ?? true,
          enable_stock_epc: featuresData.enable_stock_epc ?? true,
          enable_stock_auditoria: featuresData.enable_stock_auditoria ?? true,
          enable_nf_entrada: featuresData.enable_nf_entrada ?? true,
          enable_nf_emissao: featuresData.enable_nf_emissao ?? true,
          enable_hr_colaboradores: featuresData.enable_hr_colaboradores ?? true,
          enable_hr_folha: featuresData.enable_hr_folha ?? true,
          enable_hr_ferias: featuresData.enable_hr_ferias ?? true,
          enable_hr_afastamentos: featuresData.enable_hr_afastamentos ?? true,
          enable_obras_projetos: featuresData.enable_obras_projetos ?? true,
          enable_obras_diario: featuresData.enable_obras_diario ?? true,
          show_prices: featuresData.show_prices ?? true,
          show_costs: featuresData.show_costs ?? true,
          show_suppliers: featuresData.show_suppliers ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('tenant_features')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from('tenant_features')
          .update(features as any)
          .eq('tenant_id', tenant.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('tenant_features')
          .insert({
            tenant_id: tenant.id,
            ...features,
          } as any);
        error = result.error;
      }

      if (error) throw error;

      toast.success('Módulos salvos! As alterações serão aplicadas após recarregar.');
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Erro ao salvar módulos');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (key: keyof SystemFeatures, value: boolean) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
  };

  const toggleExpanded = (moduleKey: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(k => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  interface SubpageItem {
    key: keyof SystemFeatures;
    label: string;
    icon: any;
  }

  interface ModuleItem {
    key: keyof SystemFeatures;
    label: string;
    icon: any;
    description: string;
    subpages?: SubpageItem[];
  }

  const moduleFeatures: ModuleItem[] = [
    { 
      key: 'enable_stock', 
      label: 'Estoque', 
      icon: Package, 
      description: 'Gestão completa de inventário e materiais',
      subpages: [
        { key: 'enable_stock_materiais', label: 'Materiais', icon: Package },
        { key: 'enable_stock_equipamentos', label: 'Equipamentos', icon: Package },
        { key: 'enable_stock_ferramentas', label: 'Ferramentas', icon: Wrench },
        { key: 'enable_stock_epi', label: 'EPI', icon: Package },
        { key: 'enable_stock_epc', label: 'EPC', icon: Package },
        { key: 'enable_stock_auditoria', label: 'Auditoria', icon: AlertTriangle },
      ]
    },
    { 
      key: 'enable_movimentacao', 
      label: 'Movimentação', 
      icon: ArrowLeftRight, 
      description: 'Entrada e saída de itens do estoque',
    },
    { 
      key: 'enable_cautelas', 
      label: 'Cautelas', 
      icon: Wrench, 
      description: 'Atribuição de ativos para técnicos',
    },
    { 
      key: 'enable_fechamento', 
      label: 'Fechamento', 
      icon: Calculator, 
      description: 'Fechamento mensal de estoque',
    },
    { 
      key: 'enable_fleet', 
      label: 'Frota', 
      icon: Car, 
      description: 'Veículos, manutenções, combustível e abastecimentos',
    },
    { 
      key: 'enable_service_orders', 
      label: 'Ordens de Serviço', 
      icon: ClipboardList, 
      description: 'Gestão de OS, agendamentos e execução de serviços',
    },
    { 
      key: 'enable_teams', 
      label: 'Equipes', 
      icon: Users, 
      description: 'Técnicos, equipes e atribuições de trabalho',
    },
    { 
      key: 'enable_customers', 
      label: 'Clientes', 
      icon: Building2, 
      description: 'Cadastro e gestão de clientes',
    },
    { 
      key: 'enable_invoices', 
      label: 'Notas Fiscais', 
      icon: FileText, 
      description: 'Entrada e emissão de notas fiscais',
      subpages: [
        { key: 'enable_nf_entrada', label: 'Entrada de NF', icon: FileText },
        { key: 'enable_nf_emissao', label: 'Emissão de NF', icon: FileText },
      ]
    },
    { 
      key: 'enable_reports', 
      label: 'Relatórios', 
      icon: BarChart3, 
      description: 'Relatórios, dashboards e análises',
    },
    { 
      key: 'enable_hr', 
      label: 'Recursos Humanos', 
      icon: UserCog, 
      description: 'Funcionários, folha de pagamento, férias e afastamentos',
      subpages: [
        { key: 'enable_hr_colaboradores', label: 'Colaboradores', icon: Users },
        { key: 'enable_hr_folha', label: 'Folha de Pagamento', icon: DollarSign },
        { key: 'enable_hr_ferias', label: 'Férias', icon: BarChart3 },
        { key: 'enable_hr_afastamentos', label: 'Afastamentos', icon: BarChart3 },
      ]
    },
    { 
      key: 'enable_obras', 
      label: 'Obras', 
      icon: HardHat, 
      description: 'Projetos de construção e diário de obras',
      subpages: [
        { key: 'enable_obras_projetos', label: 'Projetos', icon: HardHat },
        { key: 'enable_obras_diario', label: 'Diário de Obras', icon: BookOpen },
      ]
    },
  ];

  const coreModules = [
    { 
      label: 'Dashboard', 
      icon: BarChart3, 
      description: 'Painel principal com visão geral do sistema',
    },
    { 
      label: 'Configurações', 
      icon: Settings, 
      description: 'Configurações gerais do sistema',
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
      description: 'Mostra funcionalidades de fornecedores' 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Core Modules - Always enabled */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-sm">
            <Package className="h-4 w-4" />
            Módulos Fixos
          </CardTitle>
          <CardDescription className="text-white/50 text-xs hidden sm:block">
            Sempre disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid gap-2 grid-cols-2">
            {coreModules.map(({ label, icon: Icon, description }) => (
              <div 
                key={label} 
                className="p-2 sm:p-3 rounded-lg border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-green-500/20">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-xs sm:text-sm truncate">{label}</p>
                    <p className="text-[10px] text-white/50 truncate hidden sm:block">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toggleable Module Features */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-white text-sm">
                <Package className="h-4 w-4" />
                <span className="truncate">Módulos Opcionais</span>
              </CardTitle>
              <CardDescription className="text-white/50 text-xs hidden sm:block">
                Ative ou desative módulos
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex-shrink-0">
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Salvar</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            {moduleFeatures.map(({ key, label, icon: Icon, description, subpages }) => {
              const hasSubpages = subpages && subpages.length > 0;
              const isExpanded = expandedModules.includes(key);
              const isEnabled = features[key];

              return (
                <div 
                  key={key} 
                  className={`rounded-lg border transition-colors ${
                    isEnabled ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  {/* Module Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {hasSubpages ? (
                          <button
                            onClick={() => toggleExpanded(key)}
                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-primary" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-primary" />
                            )}
                          </button>
                        ) : (
                          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/20' : 'bg-white/10'}`}>
                            <Icon className={`h-5 w-5 ${isEnabled ? 'text-primary' : 'text-white/40'}`} />
                          </div>
                        )}
                        <div>
                          <Label htmlFor={key} className="cursor-pointer font-medium text-white">
                            {label}
                          </Label>
                          <p className="text-xs text-white/50">{description}</p>
                        </div>
                      </div>
                      <Switch
                        id={key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => updateFeature(key, checked)}
                      />
                    </div>
                  </div>

                  {/* Subpages */}
                  {hasSubpages && isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <p className="text-xs font-medium text-white/50 mb-2">Subpáginas:</p>
                        {subpages.map(({ key: subKey, label: subLabel, icon: SubIcon }) => (
                          <div 
                            key={subKey}
                            className={`flex items-center justify-between p-2 rounded-md ${
                              isEnabled && features[subKey] ? 'bg-white/10' : 'bg-white/[0.02]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <SubIcon className={`h-4 w-4 ${
                                isEnabled && features[subKey] ? 'text-primary' : 'text-white/40'
                              }`} />
                              <span className={`text-sm ${
                                isEnabled && features[subKey] ? 'text-white' : 'text-white/40'
                              }`}>
                                {subLabel}
                              </span>
                            </div>
                            <Switch
                              id={subKey}
                              checked={features[subKey]}
                              disabled={!isEnabled}
                              onCheckedChange={(checked) => updateFeature(subKey, checked)}
                              className="scale-75"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Display Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Exibição de Campos
          </CardTitle>
          <CardDescription>
            Controle a exibição de campos específicos em todo o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayFeatures.map(({ key, label, icon: Icon, description }) => (
              <div 
                key={key} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  features[key] ? 'bg-card hover:bg-accent/50' : 'bg-muted/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${features[key] ? 'bg-green-500/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${features[key] ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <Label htmlFor={key} className="cursor-pointer font-medium text-sm">
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
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Os módulos e subpáginas desativados não aparecerão no menu de navegação para nenhum usuário do sistema. 
            Essas configurações se aplicam a toda a empresa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}