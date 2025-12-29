import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageLoading } from '@/components/ui/page-loading';
import { supabase } from '@/integrations/supabase/client';


import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardVendas } from '@/components/dashboard/DashboardVendas';
import { DashboardEstoque } from '@/components/dashboard/DashboardEstoque';
import { DashboardFrota } from '@/components/dashboard/DashboardFrota';
import { DashboardServico } from '@/components/dashboard/DashboardServico';
import { DashboardRH } from '@/components/dashboard/DashboardRH';
import { DashboardObras } from '@/components/dashboard/DashboardObras';

type DashboardType = 'overview' | 'vendas' | 'estoque' | 'frota' | 'servico' | 'rh' | 'obras';

export default function Dashboard() {
  const { user, profile, tenant, roles } = useAuthContext();
  const [dashboardType, setDashboardType] = useState<DashboardType>('overview');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchDashboardType = async () => {
      if (!user || !tenant?.id) {
        setIsLoadingDashboard(false);
        return;
      }

      try {
        // First check user-specific dashboard setting or template default
        const { data: userPerms } = await supabase
          .from('user_permissions')
          .select('dashboard_type, template_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userPerms?.dashboard_type) {
          setDashboardType(userPerms.dashboard_type as DashboardType);
          setIsLoadingDashboard(false);
          return;
        }

        // Check permission template's default dashboard
        if (userPerms?.template_id) {
          const { data: template } = await supabase
            .from('permission_templates')
            .select('default_dashboard')
            .eq('id', userPerms.template_id)
            .maybeSingle();

          if (template?.default_dashboard) {
            setDashboardType(template.default_dashboard as DashboardType);
            setIsLoadingDashboard(false);
            return;
          }
        }

        // Fall back to role-based default from tenant_features
        const { data: features } = await supabase
          .from('tenant_features')
          .select('default_dashboard_admin, default_dashboard_manager, default_dashboard_warehouse, default_dashboard_technician')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (features) {
          const userRole = roles?.[0]?.role;
          let defaultType: DashboardType = 'overview';

          switch (userRole) {
            case 'admin':
              defaultType = (features.default_dashboard_admin as DashboardType) || 'overview';
              break;
            case 'manager':
              defaultType = (features.default_dashboard_manager as DashboardType) || 'overview';
              break;
            case 'warehouse':
              defaultType = (features.default_dashboard_warehouse as DashboardType) || 'estoque';
              break;
            case 'technician':
              defaultType = (features.default_dashboard_technician as DashboardType) || 'servico';
              break;
          }
          setDashboardType(defaultType);
        }
      } catch (error) {
        console.error('Error fetching dashboard type:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardType();
  }, [user, tenant?.id, roles]);

  if (isLoadingDashboard) {
    return <PageLoading text="Carregando dashboard" />;
  }

  const renderDashboard = () => {
    switch (dashboardType) {
      case 'vendas':
        return <DashboardVendas />;
      case 'estoque':
        return <DashboardEstoque />;
      case 'frota':
        return <DashboardFrota />;
      case 'servico':
        return <DashboardServico />;
      case 'rh':
        return <DashboardRH />;
      case 'obras':
        return <DashboardObras />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-3 sm:space-y-4 lg:space-y-6" data-tour="dashboard-content">
        <PageHeader
          title={`Bem-vindo, ${profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}!`}
          description={tenant ? `Visão geral de ${tenant.name}` : 'Entre em contato com o administrador'}
        />

        {renderDashboard()}
      </div>
    </DashboardLayout>
  );
}
