export type AppRole = 'superadmin' | 'admin' | 'manager' | 'technician' | 'warehouse' | 'caixa';
export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  razao_social?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  logo_url?: string;
  logo_dark_url?: string;
  background_url?: string;
  primary_color: string;
  secondary_color: string;
  theme: string;
  status: TenantStatus;
  settings: Record<string, unknown>;
  landing_page_content: LandingPageContent;
  created_at: string;
  updated_at: string;
}

export interface LandingPageContent {
  title: string;
  description: string;
  services: Array<{
    name: string;
    description: string;
    icon?: string;
  }>;
}

export interface Profile {
  id: string;
  tenant_id?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  selected_branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: AppRole;
  created_at: string;
}

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: AppRole;
  invited_by?: string;
  token: string;
  accepted_at?: string;
  expires_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  code?: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_active: boolean;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantFeatures {
  id: string;
  tenant_id: string;
  enable_fleet: boolean;
  enable_service_orders: boolean;
  enable_teams: boolean;
  enable_customers: boolean;
  enable_invoices: boolean;
  enable_reports: boolean;
  show_prices: boolean;
  show_costs: boolean;
  show_suppliers: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  id: string;
  user_id: string;
  tenant_id: string;
  page_dashboard: boolean;
  page_stock: boolean;
  page_fleet: boolean;
  page_teams: boolean;
  page_service_orders: boolean;
  page_customers: boolean;
  page_invoices: boolean;
  page_reports: boolean;
  page_settings: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_view_costs: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  branch_ids?: string[];
  dashboard_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithDetails {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  tenant_id?: string;
  tenant_name?: string;
  roles: UserRole[];
  permissions?: UserPermissions;
  created_at: string;
}
