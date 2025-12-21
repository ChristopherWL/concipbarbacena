import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface TenantFeatures {
  // Main modules
  enable_fleet: boolean;
  enable_service_orders: boolean;
  enable_teams: boolean;
  enable_customers: boolean;
  enable_invoices: boolean;
  enable_reports: boolean;
  enable_hr: boolean;
  enable_obras: boolean;
  enable_stock: boolean;
  enable_movimentacao: boolean;
  enable_cautelas: boolean;
  enable_fechamento: boolean;
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

const defaultFeatures: TenantFeatures = {
  enable_fleet: true,
  enable_service_orders: true,
  enable_teams: true,
  enable_customers: true,
  enable_invoices: true,
  enable_reports: true,
  enable_hr: true,
  enable_obras: true,
  enable_stock: true,
  enable_movimentacao: true,
  enable_cautelas: true,
  enable_fechamento: true,
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

export function useTenantFeatures() {
  const { tenant } = useAuthContext();

  const { data: features, isLoading } = useQuery({
    queryKey: ['tenant-features', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return defaultFeatures;

      const { data, error } = await supabase
        .from('tenant_features')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error || !data) return defaultFeatures;

      // Cast to any to handle columns that may not exist yet in the database
      const featuresData = data as any;

      return {
        enable_fleet: featuresData.enable_fleet ?? true,
        enable_service_orders: featuresData.enable_service_orders ?? true,
        enable_teams: featuresData.enable_teams ?? true,
        enable_customers: featuresData.enable_customers ?? true,
        enable_invoices: featuresData.enable_invoices ?? true,
        enable_reports: featuresData.enable_reports ?? true,
        enable_hr: featuresData.enable_hr ?? true,
        enable_obras: featuresData.enable_obras ?? true,
        enable_stock: featuresData.enable_stock ?? true,
        enable_movimentacao: featuresData.enable_movimentacao ?? true,
        enable_cautelas: featuresData.enable_cautelas ?? true,
        enable_fechamento: featuresData.enable_fechamento ?? true,
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
      } as TenantFeatures;
    },
    enabled: !!tenant?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    features: features ?? defaultFeatures,
    isLoading,
  };
}