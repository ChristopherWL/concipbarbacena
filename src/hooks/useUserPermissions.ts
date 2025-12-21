import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';

export interface UserPermissions {
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

const defaultPermissions: UserPermissions = {
  page_dashboard: true,
  page_stock: true,
  page_fleet: true,
  page_teams: true,
  page_service_orders: true,
  page_customers: true,
  page_invoices: true,
  page_reports: true,
  page_settings: true,
  page_movimentacao: true,
  page_fechamento: true,
  page_hr: true,
  page_obras: true,
  page_diario_obras: true,
  page_suppliers: true,
  can_create: true,
  can_edit: true,
  can_delete: true,
  can_export: true,
  can_view_costs: true,
  can_view_reports: true,
  can_manage_users: true,
  dashboard_type: null,
};

// Director permissions - read-only access to all pages, no create/edit/delete
const directorPermissions: UserPermissions = {
  page_dashboard: true,
  page_stock: true,
  page_fleet: true,
  page_teams: true,
  page_service_orders: true,
  page_customers: true,
  page_invoices: true,
  page_reports: true,
  page_settings: false, // Directors can't access settings
  page_movimentacao: true,
  page_fechamento: true,
  page_hr: true,
  page_obras: true,
  page_diario_obras: true,
  page_suppliers: true,
  can_create: false, // Read-only
  can_edit: false, // Read-only
  can_delete: false, // Read-only
  can_export: true, // Can export reports
  can_view_costs: true,
  can_view_reports: true,
  can_manage_users: false,
  dashboard_type: 'overview',
};

export function useUserPermissions() {
  const { user, tenant, isSuperAdmin, isAdmin } = useAuthContext();
  const { isDirector, isReadOnly } = useDirectorBranch();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id, tenant?.id, isDirector],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return defaultPermissions;

      // Directors have read-only access
      if (isDirector) {
        return directorPermissions;
      }

      // Superadmin and admin have all permissions by default
      if (isSuperAdmin() || isAdmin()) {
        return defaultPermissions;
      }

      // First check user-specific permissions
      const { data: userPerms, error: userPermsError } = await supabase
        .from('user_permissions')
        .select('*, template_id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (userPermsError) {
        console.error('Error fetching user permissions:', userPermsError);
        return defaultPermissions;
      }

      // If user has a template assigned, fetch template permissions
      if (userPerms?.template_id) {
        const { data: template, error: templateError } = await supabase
          .from('permission_templates')
          .select('*')
          .eq('id', userPerms.template_id)
          .maybeSingle();

        if (!templateError && template) {
          const anyTemplate = template as any;
          return {
            page_dashboard: anyTemplate.page_dashboard ?? true,
            page_stock: anyTemplate.page_stock ?? true,
            page_fleet: anyTemplate.page_fleet ?? true,
            page_teams: anyTemplate.page_teams ?? true,
            page_service_orders: anyTemplate.page_service_orders ?? true,
            page_customers: anyTemplate.page_customers ?? true,
            page_invoices: anyTemplate.page_invoices ?? true,
            page_reports: anyTemplate.page_reports ?? true,
            page_settings: anyTemplate.page_settings ?? false,
            page_movimentacao: anyTemplate.page_movimentacao ?? true,
            page_fechamento: anyTemplate.page_fechamento ?? true,
            page_hr: anyTemplate.page_hr ?? true,
            page_obras: anyTemplate.page_obras ?? true,
            page_diario_obras: anyTemplate.page_diario_obras ?? true,
            page_suppliers: anyTemplate.page_suppliers ?? true,
            can_create: anyTemplate.can_create ?? true,
            can_edit: anyTemplate.can_edit ?? true,
            can_delete: anyTemplate.can_delete ?? false,
            can_export: anyTemplate.can_export ?? true,
            can_view_costs: anyTemplate.can_view_costs ?? true,
            can_view_reports: anyTemplate.can_view_reports ?? true,
            can_manage_users: anyTemplate.can_manage_users ?? false,
            dashboard_type: userPerms?.dashboard_type ?? null,
          } as UserPermissions;
        }
      }

      // Use user-specific permissions if no template
      if (userPerms) {
        const anyPerms = userPerms as any;
        return {
          page_dashboard: anyPerms.page_dashboard ?? true,
          page_stock: anyPerms.page_stock ?? true,
          page_fleet: anyPerms.page_fleet ?? true,
          page_teams: anyPerms.page_teams ?? true,
          page_service_orders: anyPerms.page_service_orders ?? true,
          page_customers: anyPerms.page_customers ?? true,
          page_invoices: anyPerms.page_invoices ?? true,
          page_reports: anyPerms.page_reports ?? true,
          page_settings: anyPerms.page_settings ?? false,
          page_movimentacao: anyPerms.page_movimentacao ?? true,
          page_fechamento: anyPerms.page_fechamento ?? true,
          page_hr: anyPerms.page_hr ?? true,
          page_obras: anyPerms.page_obras ?? true,
          page_diario_obras: anyPerms.page_diario_obras ?? true,
          page_suppliers: anyPerms.page_suppliers ?? true,
          can_create: anyPerms.can_create ?? true,
          can_edit: anyPerms.can_edit ?? true,
          can_delete: anyPerms.can_delete ?? false,
          can_export: anyPerms.can_export ?? true,
          can_view_costs: anyPerms.can_view_costs ?? true,
          can_view_reports: anyPerms.can_view_reports ?? true,
          can_manage_users: anyPerms.can_manage_users ?? false,
          dashboard_type: anyPerms.dashboard_type ?? null,
        } as UserPermissions;
      }

      // Default restrictive permissions for users without explicit permissions
      return {
        ...defaultPermissions,
        page_settings: false,
        can_delete: false,
        can_manage_users: false,
      };
    },
    enabled: !!user?.id && !!tenant?.id,
    staleTime: 1000 * 30, // 30 seconds - faster refresh
  });

  return {
    permissions: permissions ?? defaultPermissions,
    isLoading,
    isReadOnly: isDirector || isReadOnly,
  };
}
