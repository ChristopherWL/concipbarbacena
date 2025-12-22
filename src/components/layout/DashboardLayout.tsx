import { ReactNode, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useNotificationAlerts } from '@/hooks/useNotificationAlerts';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { PushNotificationPrompt } from '@/components/notifications/PushNotificationPrompt';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  FileText,
  Wrench,
  UserPlus,
  BarChart3,
  FileCheck,
  Shield,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  Clock,
  MapPin,
  Receipt,
  Plus,
  MoreHorizontal,
  X,
  Calculator,
  ArrowLeftRight,
  HardHat,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
  Download,
  Smartphone,
  HelpCircle,
  Play,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { PageTransition } from './PageTransition';
import { DirectorBranchDropdown } from '@/components/dashboard/DirectorBranchDropdown';
import { MatrizBranchSelector } from '@/components/dashboard/MatrizBranchSelector';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { useMatrizBranch } from '@/contexts/MatrizBranchContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isSameDay, addDays, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import '@/styles/tour.css';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavChild {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  badgeType?: 'danger' | 'warning'; // danger = red (zero stock), warning = yellow (low stock)
}

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  badge?: number;
  badgeType?: 'danger' | 'warning';
  children?: NavChild[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Estoque', 
    href: '/estoque',
    icon: Package,
    children: [
      { name: 'Materiais', href: '/estoque/materiais', icon: Package },
      { name: 'Equipamentos', href: '/estoque/equipamentos', icon: Package },
      { name: 'Ferramentas', href: '/estoque/ferramentas', icon: Wrench },
      { name: 'EPI', href: '/estoque/epi', icon: Package },
      { name: 'EPC', href: '/estoque/epc', icon: Package },
      { name: 'Auditoria', href: '/estoque/auditoria', icon: AlertTriangle },
    ]
  },
  { name: 'Movimentação', href: '/estoque/entrada', icon: FileText },
  { 
    name: 'Notas Fiscais', 
    icon: Receipt,
    children: [
      { name: 'Entrada de NF', href: '/notas-fiscais', icon: Receipt },
      { name: 'Emissão de NF', href: '/emissao-nf', icon: FileText },
    ]
  },
  { name: 'Fechamento', href: '/fechamento', icon: Calculator },
  { name: 'Frota', href: '/frota', icon: Truck },
  { name: 'Equipes', href: '/equipes', icon: Users },
  { name: 'Recursos Humanos', href: '/rh', icon: UserPlus },
  { 
    name: 'Atendimento', 
    icon: ClipboardList,
    children: [
      { name: 'Ordens de Serviço', href: '/os', icon: ClipboardList },
      { name: 'Clientes', href: '/clientes', icon: UserPlus },
    ]
  },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
];

// Helper to find which parent menu contains the current path
const getActiveParentMenu = (pathname: string): string | null => {
  for (const item of navigation) {
    if (item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
      return item.name;
    }
  }
  return null;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, tenant, roles, signOut, isSuperAdmin, isAdmin, selectedBranch: authSelectedBranch } = useAuthContext();
  const { isDirector, selectedBranch: directorSelectedBranch, isReadOnly } = useDirectorBranch();
  const { features } = useTenantFeatures();
  const { permissions, isLoading: isPermissionsLoading } = useUserPermissions();
  const { isMatriz } = useBranchFilter();
  const { selectedBranchId, setSelectedBranchId } = useMatrizBranch();
  const { isTourEnabled, resetTour, toggleTourEnabled } = useOnboardingTour();

  const canAccessSettings = useMemo(
    () => isAdmin() || permissions.page_settings,
    [isAdmin, permissions.page_settings]
  );

  // Determine the current branch (from auth context or director context)
  const currentBranchId =
    directorSelectedBranch?.id ||
    authSelectedBranch?.id ||
    profile?.branch_id ||
    profile?.selected_branch_id;

  // Fetch branch-specific logo if user is in a branch
  const { data: branchData } = useQuery({
    queryKey: ['branch-logo', currentBranchId],
    queryFn: async () => {
      if (!currentBranchId) return null;
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, is_main, logo_url, logo_dark_url')
        .eq('id', currentBranchId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!currentBranchId,
  });

  // Determine which logo to show:
  // 1. If branch has its own logo, use it (even for matriz if logo was set)
  // 2. Fallback to tenant logo
  const currentLogo = useMemo(() => {
    // If the branch has its own logo, always use it
    if (branchData?.logo_url) {
      return branchData.logo_url;
    }
    // Fallback to tenant logo (matriz default)
    return tenant?.logo_url || null;
  }, [branchData, tenant?.logo_url]);

  const currentLogoDark = useMemo(() => {
    if (branchData?.logo_dark_url) {
      return branchData.logo_dark_url;
    }
    return tenant?.logo_dark_url || null;
  }, [branchData, tenant?.logo_dark_url]);

  // For backward compatibility with director branch selection
  const selectedBranch = directorSelectedBranch;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // Initialize from tenant if available, default to light (false)
    if (tenant?.theme) {
      return tenant.theme === 'dark';
    }
    return false;
  });
  const userToggledTheme = useRef(false); // Track if user manually toggled theme
  const lightThemeVarsRef = useRef<Record<string, string> | null>(null);
  const THEME_VARS_TO_TOGGLE = [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--muted',
    '--muted-foreground',
    '--secondary',
    '--secondary-foreground',
  ] as const;
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const activeParent = getActiveParentMenu(window.location.pathname);
    return activeParent ? [activeParent] : [];
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuTheme, setMenuTheme] = useState('custom');
  // Scroll behavior states
  const [showHeader, setShowHeader] = useState(true);
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  // PWA Install Logic
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      toast.success('App instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (!isAppInstalled) {
      // Show instructions for iOS or when prompt is not available
      toast.info(
        'Para instalar: abra o menu do navegador e toque em "Adicionar à Tela Inicial"',
        { duration: 5000 }
      );
    }
  };

  // Redirect superadmin-only users to superadmin panel
  useEffect(() => {
    if (user && roles.length > 0) {
      const isSuperAdminOnly = isSuperAdmin() && roles.length === 1 && roles[0].role === 'superadmin';
      if (isSuperAdminOnly) {
        navigate('/superadmin', { replace: true });
      }
    }
  }, [user, roles, isSuperAdmin, navigate]);

  // Check if user has permission template assigned (required to access, except superadmin)
  const { data: hasPermissionProfile, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['user-has-permission-profile', user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return true;

      // Only superadmins can bypass the permission profile requirement.
      if (isSuperAdmin()) return true;

      const { data, error } = await supabase
        .from('user_permissions')
        .select('template_id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking permission profile:', error);
        // Fail closed: if we can't validate, block access.
        return false;
      }

      // A "perfil de permissões" is considered assigned only when a template is linked.
      return !!data?.template_id;
    },
    enabled: !!user?.id && !!tenant?.id,
    staleTime: 1000 * 30,
  });

  // Block access for users with incomplete setup (no branch or no permission profile)
  const hasIncompleteSetup = useMemo(() => {
    // Wait for data to load
    if (!user || !profile || roles.length === 0) return false;
    if (isLoadingPermissions) return false;

    // Superadmins can access without branch or permission profile
    if (isSuperAdmin()) return false;

    // Everyone else must have a branch AND a permission profile assigned
    const hasBranch = !!(profile.branch_id || profile.selected_branch_id || authSelectedBranch);
    const hasPermissions = hasPermissionProfile === true;

    return !hasBranch || !hasPermissions;
  }, [user, profile, roles, isSuperAdmin, authSelectedBranch, hasPermissionProfile, isLoadingPermissions]);

  // Determine the missing requirements for the error message
  const missingRequirements = useMemo(() => {
    if (!hasIncompleteSetup) return null;
    
    const hasBranch = !!(profile?.branch_id || profile?.selected_branch_id || authSelectedBranch);
    const hasPermissions = hasPermissionProfile === true;
    
    const missing: string[] = [];
    if (!hasBranch) missing.push('filial');
    if (!hasPermissions) missing.push('perfil de permissões');
    
    return missing;
  }, [hasIncompleteSetup, profile, authSelectedBranch, hasPermissionProfile]);

  // Route protection based on features AND user permissions - redirect if accessing disabled module or no permission
  useEffect(() => {
    const path = location.pathname;

    // Wait for auth + permissions to load to avoid brief unauthorized access.
    if (!user) return;
    if (!isSuperAdmin() && isPermissionsLoading) return;
    
    // Feature-based restrictions (modules disabled at tenant level)
    const featureRoutes: Record<string, keyof typeof features> = {
      '/frota': 'enable_fleet',
      '/os': 'enable_service_orders',
      '/equipes': 'enable_teams',
      '/clientes': 'enable_customers',
      '/notas-fiscais': 'enable_invoices',
      '/emissao-nf': 'enable_invoices',
      '/relatorios': 'enable_reports',
      '/rh': 'enable_hr',
      '/fornecedores': 'show_suppliers',
    };

    for (const [route, featureKey] of Object.entries(featureRoutes)) {
      if (path.startsWith(route) && !features[featureKey]) {
        toast.error('Este módulo está desabilitado');
        navigate('/dashboard', { replace: true });
        return;
      }
    }

    // User permission-based restrictions
    const permissionRoutes: Record<string, keyof typeof permissions> = {
      '/dashboard': 'page_dashboard',
      '/estoque': 'page_stock',
      '/frota': 'page_fleet',
      '/equipes': 'page_teams',
      '/os': 'page_service_orders',
      '/clientes': 'page_customers',
      '/notas-fiscais': 'page_invoices',
      '/emissao-nf': 'page_invoices',
      '/relatorios': 'page_reports',
      '/fechamento': 'page_fechamento',
      '/rh': 'page_hr',
      '/obras': 'page_obras',
      '/diario-obras': 'page_diario_obras',
      '/fornecedores': 'page_suppliers',
    };

    // Special handling for /configuracoes
    // Important: wait for roles to be loaded to avoid redirecting during initial hydration.
    if (path.startsWith('/configuracoes')) {
      if (roles.length === 0) return;
      if (!canAccessSettings) {
        toast.error('Você não tem permissão para acessar as configurações');
        navigate('/dashboard', { replace: true });
        return;
      }
    }

    for (const [route, permKey] of Object.entries(permissionRoutes)) {
      if (path.startsWith(route) && !permissions[permKey]) {
        toast.error('Você não tem permissão para acessar esta página');
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [
    location.pathname,
    features,
    permissions,
    navigate,
    isAdmin,
    isSuperAdmin,
    user,
    roles,
    isPermissionsLoading,
  ]);

  // FAB quick actions - Operational pages only (filtered by features AND user permissions)
  const fabActions = [
    ...(permissions.page_movimentacao ? [{ icon: ArrowLeftRight, label: 'Mov.', href: '/estoque/entrada', color: 'bg-purple-500' }] : []),
    ...(permissions.page_stock ? [{ icon: AlertTriangle, label: 'Auditoria', href: '/estoque/auditoria', color: 'bg-orange-500' }] : []),
    ...(permissions.page_obras ? [{ icon: HardHat, label: 'Obras', href: '/obras', color: 'bg-amber-500' }] : []),
    ...(permissions.page_diario_obras ? [{ icon: BookOpen, label: 'Diário', href: '/diario-obras', color: 'bg-emerald-500' }] : []),
    ...(features.enable_service_orders && permissions.page_service_orders ? [{ icon: ClipboardList, label: 'O.S.', href: '/os', color: 'bg-blue-500' }] : []),
  ];

  // More menu actions (fan menu from bottom right) - filtered by features AND user permissions
  const moreMenuActions = [
    ...(features.enable_invoices && permissions.page_invoices ? [{ icon: Receipt, label: 'Notas', href: '/notas-fiscais', color: 'bg-teal-500' }] : []),
    ...(permissions.page_fechamento ? [{ icon: FileCheck, label: 'Fechamento', href: '/fechamento', color: 'bg-pink-500' }] : []),
    ...(features.show_suppliers && permissions.page_suppliers ? [{ icon: Building2, label: 'Fornecedores', href: '/fornecedores', color: 'bg-violet-500' }] : []),
    ...(features.enable_customers && permissions.page_customers ? [{ icon: Users, label: 'Clientes', href: '/clientes', color: 'bg-sky-500' }] : []),
    ...(canAccessSettings ? [{ icon: Settings, label: 'Config', href: '/configuracoes', color: 'bg-slate-500' }] : []),
  ];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll behavior - hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      // When any overlay menu is open, keep mobile chrome stable
      if (moreExpanded || fabExpanded) {
        setShowHeader(true);
        setShowMobileHeader(true);
        setShowMobileNav(false);
        return;
      }

      const currentScrollY = window.scrollY;
      const isAtTop = currentScrollY < scrollThreshold;

      const atTop = currentScrollY < scrollThreshold;
      setIsAtTop(atTop);

      if (atTop) {
        // At top - show all
        setShowHeader(true);
        setShowMobileHeader(true);
        setShowMobileNav(true);
      } else if (currentScrollY > lastScrollY.current + scrollThreshold) {
        // Scrolling down - hide headers
        setShowHeader(false);
        setShowMobileHeader(false);
        setShowMobileNav(false);
      } else if (currentScrollY < lastScrollY.current - scrollThreshold) {
        // Scrolling up - show headers
        setShowHeader(true);
        setShowMobileHeader(true);
        setShowMobileNav(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [moreExpanded, fabExpanded]);

  // Lock page scroll when overlay menus are open (prevents half-visible floating UI)
  useEffect(() => {
    if (moreExpanded || fabExpanded) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
  }, [moreExpanded, fabExpanded]);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Apply theme (synced from tenant, no localStorage)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');

      // In dark mode, clear the light overrides so dark tokens can take effect.
      THEME_VARS_TO_TOGGLE.forEach((v) => document.documentElement.style.setProperty(v, ''));
    } else {
      document.documentElement.classList.remove('dark');

      // Restore light overrides (captured from tenant settings) if we have them.
      if (lightThemeVarsRef.current) {
        Object.entries(lightThemeVarsRef.current).forEach(([k, val]) => {
          document.documentElement.style.setProperty(k, val);
        });
      }
    }
  }, [isDark]);

  // Sync theme from tenant data (only if user hasn't manually toggled)
  useEffect(() => {
    if (tenant?.theme && !userToggledTheme.current) {
      setIsDark(tenant.theme === 'dark');
    }
  }, [tenant?.theme]);

  // Helper to convert hex to HSL for custom menu color
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 207, s: 50, l: 20 };
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const applyCustomMenuColor = (color: string) => {
    const hsl = hexToHSL(color);

    // If user picked a very light color (e.g. white), switch menu text to dark for contrast
    const isLight = hsl.l >= 70;

    const bgL = hsl.l; // respect the chosen lightness
    const fg = isLight ? `${hsl.h} 15% 14%` : `${hsl.h} 20% 98%`;

    const accentL = isLight ? Math.max(bgL - 8, 0) : Math.min(bgL + 6, 100);
    const borderL = isLight ? Math.max(bgL - 14, 0) : Math.min(bgL + 10, 100);

    // Set full HSL strings for CSS variables
    document.documentElement.style.setProperty('--custom-menu-bg', `${hsl.h} ${hsl.s}% ${bgL}%`);
    document.documentElement.style.setProperty('--custom-menu-fg', fg);
    document.documentElement.style.setProperty('--custom-menu-accent', `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${accentL}%`);
    document.documentElement.style.setProperty('--custom-menu-border', `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${borderL}%`);
  };

  // Always pull latest theme/menu settings from backend (so changes in Super Admin reflect immediately)
  const { data: tenantThemeSettings } = useQuery({
    queryKey: ['tenant-theme-settings', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('theme, menu_color')
        .eq('id', tenant!.id)
        .maybeSingle();

      if (error) throw error;
      return data as { theme: string | null; menu_color: string | null } | null;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Apply menu theme (synced from latest settings)
  useEffect(() => {
    // Remove all menu theme classes
    const themeClasses = ['menu-theme-blue', 'menu-theme-dark', 'menu-theme-slate', 'menu-theme-green',
      'menu-theme-emerald', 'menu-theme-purple', 'menu-theme-violet', 'menu-theme-red', 'menu-theme-rose',
      'menu-theme-orange', 'menu-theme-amber', 'menu-theme-teal', 'menu-theme-cyan', 'menu-theme-indigo', 'menu-theme-pink', 'menu-theme-custom'];
    themeClasses.forEach(cls => document.documentElement.classList.remove(cls));

    // Always use custom theme (colors from tenant)
    document.documentElement.classList.add('menu-theme-custom');

    const menuColor = tenantThemeSettings?.menu_color || (tenant as any)?.menu_color || '#1e3a5f';
    applyCustomMenuColor(menuColor);

    // Only sync theme from backend if user hasn't manually toggled
    if (tenantThemeSettings?.theme && !userToggledTheme.current) {
      setIsDark(tenantThemeSettings.theme === 'dark');
    }
  }, [tenant?.id, tenantThemeSettings?.menu_color, tenantThemeSettings?.theme]);


  // Get branch filter for notifications
  const { branchId, shouldFilter } = useBranchFilter();

  // Fetch notification counts - only real alerts, filtered by branch
  const { data: notifications } = useQuery({
    queryKey: ['menu-notifications', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return { 
        zeroStockMateriais: 0, lowStockMateriais: 0,
        zeroStockEquipamentos: 0, lowStockEquipamentos: 0,
        zeroStockFerramentas: 0, lowStockFerramentas: 0,
        zeroStockEPI: 0, lowStockEPI: 0,
        zeroStockEPC: 0, lowStockEPC: 0,
        urgentOS: 0, pendingMaintenance: 0, openDiarios: 0
      };
      
      // Stock products by category - separate zero stock from low stock
      let stockQuery = supabase
        .from('products')
        .select('id, current_stock, min_stock, category')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);
      
      // Apply branch filter if user should only see their branch data
      if (shouldFilter && branchId) {
        stockQuery = stockQuery.eq('branch_id', branchId);
      }
      
      const { data: stockProducts } = await stockQuery;
      
      const zeroStockByCategory = { materiais: 0, equipamentos: 0, ferramentas: 0, epi: 0, epc: 0 };
      const lowStockByCategory = { materiais: 0, equipamentos: 0, ferramentas: 0, epi: 0, epc: 0 };

      stockProducts?.forEach(p => {
        const stock = p.current_stock || 0;
        const minStock = p.min_stock || 0;
        const category = p.category as keyof typeof zeroStockByCategory;
        
        if (!category || !zeroStockByCategory.hasOwnProperty(category)) return;

        if (stock === 0) {
          zeroStockByCategory[category]++;
        } else if (minStock > 0 && stock < minStock) {
          lowStockByCategory[category]++;
        }
      });

      const totalZeroStock = Object.values(zeroStockByCategory).reduce((a, b) => a + b, 0);
      const totalLowStock = Object.values(lowStockByCategory).reduce((a, b) => a + b, 0);

      // Urgent OS: high priority open orders or overdue scheduled orders
      const today = new Date().toISOString().split('T')[0];
      let osQuery = supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'aberta')
        .or(`priority.eq.alta,scheduled_date.lt.${today}`);
      
      if (shouldFilter && branchId) {
        osQuery = osQuery.eq('branch_id', branchId);
      }
      
      const { count: urgentOS } = await osQuery;

      // Pending maintenances: status agendada or em_andamento
      let maintQuery = supabase
        .from('maintenances')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .in('status', ['agendada', 'em_andamento']);
      
      if (shouldFilter && branchId) {
        maintQuery = maintQuery.eq('branch_id', branchId);
      }
      
      const { count: pendingMaintenance } = await maintQuery;

      // Open diarios: status aberto
      let diarioQuery = supabase
        .from('diario_obras')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'aberto');
      
      if (shouldFilter && branchId) {
        diarioQuery = diarioQuery.eq('branch_id', branchId);
      }
      
      const { count: openDiarios } = await diarioQuery;

      return {
        totalZeroStock,
        totalLowStock,
        zeroStockMateriais: zeroStockByCategory.materiais,
        lowStockMateriais: lowStockByCategory.materiais,
        zeroStockEquipamentos: zeroStockByCategory.equipamentos,
        lowStockEquipamentos: lowStockByCategory.equipamentos,
        zeroStockFerramentas: zeroStockByCategory.ferramentas,
        lowStockFerramentas: lowStockByCategory.ferramentas,
        zeroStockEPI: zeroStockByCategory.epi,
        lowStockEPI: lowStockByCategory.epi,
        zeroStockEPC: zeroStockByCategory.epc,
        lowStockEPC: lowStockByCategory.epc,
        urgentOS: urgentOS || 0,
        pendingMaintenance: pendingMaintenance || 0,
        openDiarios: openDiarios || 0,
      };
    },
    enabled: !!tenant?.id,
    staleTime: 60 * 1000, // 1 minute - don't refetch if data is fresh
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchInterval: 60000, // Auto-refresh every minute
  });

  // Fetch reminders for notifications (reminders are not per-branch)
  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders-notifications', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const today = new Date();
      const tomorrow = addDays(today, 1);
      
      const { data, error } = await supabase
        .from('reminders')
        .select('id, title, reminder_date, reminder_time')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .gte('reminder_date', format(today, 'yyyy-MM-dd'))
        .lte('reminder_date', format(tomorrow, 'yyyy-MM-dd'))
        .order('reminder_date', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000,
  });
  

  // Build alarms list from notifications
  const alarms = useMemo(() => {
    const items: { id: string; type: 'danger' | 'warning'; title: string; description: string; href: string }[] = [];
    
    // Reminders for today (danger)
    const today = new Date();
    const todayReminders = reminders.filter(r => isSameDay(new Date(r.reminder_date), today));
    todayReminders.forEach(reminder => {
      items.push({
        id: `reminder-today-${reminder.id}`,
        type: 'danger',
        title: `Lembrete hoje: ${reminder.title}`,
        description: reminder.reminder_time ? `às ${reminder.reminder_time}` : 'Hoje',
        href: '/dashboard'
      });
    });
    
    // Reminders for tomorrow (warning)
    const tomorrow = addDays(today, 1);
    const tomorrowReminders = reminders.filter(r => isSameDay(new Date(r.reminder_date), tomorrow));
    tomorrowReminders.forEach(reminder => {
      items.push({
        id: `reminder-tomorrow-${reminder.id}`,
        type: 'warning',
        title: `Lembrete amanhã: ${reminder.title}`,
        description: reminder.reminder_time ? `às ${reminder.reminder_time}` : 'Amanhã',
        href: '/dashboard'
      });
    });
    
    if (!notifications) return items;
    
    // Zero stock alarms (critical)
    if (notifications.zeroStockMateriais > 0) {
      items.push({ id: 'zero-materiais', type: 'danger', title: 'Materiais sem estoque', description: `${notifications.zeroStockMateriais} produto(s) com estoque zerado`, href: '/estoque/materiais' });
    }
    if (notifications.zeroStockEquipamentos > 0) {
      items.push({ id: 'zero-equipamentos', type: 'danger', title: 'Equipamentos sem estoque', description: `${notifications.zeroStockEquipamentos} produto(s) com estoque zerado`, href: '/estoque/equipamentos' });
    }
    if (notifications.zeroStockFerramentas > 0) {
      items.push({ id: 'zero-ferramentas', type: 'danger', title: 'Ferramentas sem estoque', description: `${notifications.zeroStockFerramentas} produto(s) com estoque zerado`, href: '/estoque/ferramentas' });
    }
    if (notifications.zeroStockEPI > 0) {
      items.push({ id: 'zero-epi', type: 'danger', title: 'EPI sem estoque', description: `${notifications.zeroStockEPI} produto(s) com estoque zerado`, href: '/estoque/epi' });
    }
    if (notifications.zeroStockEPC > 0) {
      items.push({ id: 'zero-epc', type: 'danger', title: 'EPC sem estoque', description: `${notifications.zeroStockEPC} produto(s) com estoque zerado`, href: '/estoque/epc' });
    }
    
    // Low stock alarms (warning)
    if (notifications.lowStockMateriais > 0) {
      items.push({ id: 'low-materiais', type: 'warning', title: 'Materiais em baixa', description: `${notifications.lowStockMateriais} produto(s) abaixo do mínimo`, href: '/estoque/materiais' });
    }
    if (notifications.lowStockEquipamentos > 0) {
      items.push({ id: 'low-equipamentos', type: 'warning', title: 'Equipamentos em baixa', description: `${notifications.lowStockEquipamentos} produto(s) abaixo do mínimo`, href: '/estoque/equipamentos' });
    }
    if (notifications.lowStockFerramentas > 0) {
      items.push({ id: 'low-ferramentas', type: 'warning', title: 'Ferramentas em baixa', description: `${notifications.lowStockFerramentas} produto(s) abaixo do mínimo`, href: '/estoque/ferramentas' });
    }
    if (notifications.lowStockEPI > 0) {
      items.push({ id: 'low-epi', type: 'warning', title: 'EPI em baixa', description: `${notifications.lowStockEPI} produto(s) abaixo do mínimo`, href: '/estoque/epi' });
    }
    if (notifications.lowStockEPC > 0) {
      items.push({ id: 'low-epc', type: 'warning', title: 'EPC em baixa', description: `${notifications.lowStockEPC} produto(s) abaixo do mínimo`, href: '/estoque/epc' });
    }
    
    // Urgent OS
    if (notifications.urgentOS > 0) {
      items.push({ id: 'urgent-os', type: 'danger', title: 'O.S. Urgentes', description: `${notifications.urgentOS} ordem(s) de serviço urgente(s)`, href: '/os' });
    }
    
    // Pending maintenance
    if (notifications.pendingMaintenance > 0) {
      items.push({ id: 'pending-maintenance', type: 'warning', title: 'Manutenções pendentes', description: `${notifications.pendingMaintenance} manutenção(ões) agendada(s)`, href: '/frota' });
    }
    
    return items;
  }, [notifications, reminders]);

  // Enable notification pop-up alerts
  useNotificationAlerts(alarms, tenant?.id);

  // Build navigation with badges - filtered by enabled features AND user permissions
  const getNavigation = (): NavItem[] => {
    const nav: NavItem[] = [];

    // Dashboard - check permission
    if (permissions.page_dashboard) {
      nav.push({ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
    }

    // Administrativo submenu - filter children based on features AND permissions
    const adminChildren: NavChild[] = [];
    if (features.enable_fleet && permissions.page_fleet) {
      adminChildren.push({ name: 'Frota', href: '/frota', icon: Truck, badge: notifications?.pendingMaintenance || 0 });
    }
    if (features.show_suppliers && permissions.page_suppliers) {
      adminChildren.push({ name: 'Fornecedores', href: '/fornecedores', icon: Building2 });
    }
    if (permissions.page_fechamento) {
      adminChildren.push({ name: 'Fechamento', href: '/fechamento', icon: Calculator });
    }
    if (features.enable_invoices && permissions.page_invoices) {
      adminChildren.push({ name: 'Entrada de NF', href: '/notas-fiscais', icon: Receipt });
      adminChildren.push({ name: 'Emissão de NF', href: '/emissao-nf', icon: FileText });
    }
    if (features.enable_reports && permissions.page_reports) {
      adminChildren.push({ name: 'Relatórios', href: '/relatorios', icon: BarChart3 });
    }

    if (adminChildren.length > 0) {
      nav.push({
        name: 'Administrativo',
        icon: Building2,
        badge: (features.enable_fleet && permissions.page_fleet) ? (notifications?.pendingMaintenance || 0) : 0,
        children: adminChildren,
      });
    }

    // Atendimento submenu - filter children based on features AND permissions
    const atendimentoChildren: NavChild[] = [];
    if (features.enable_service_orders && permissions.page_service_orders) {
      atendimentoChildren.push({ name: 'Ordens de Serviço', href: '/os', icon: ClipboardList, badge: notifications?.urgentOS || 0 });
    }
    if (features.enable_customers && permissions.page_customers) {
      atendimentoChildren.push({ name: 'Clientes', href: '/clientes', icon: UserPlus });
    }
    if (permissions.page_obras) {
      atendimentoChildren.push({ name: 'Obras', href: '/obras', icon: Building2 });
    }
    if (permissions.page_diario_obras) {
      atendimentoChildren.push({ 
        name: 'Diário de Obras', 
        href: '/diario-obras', 
        icon: FileText,
        badge: notifications?.openDiarios || 0,
        badgeType: 'warning' as const
      });
    }

    if (atendimentoChildren.length > 0) {
      nav.push({
        name: 'Atendimento',
        icon: ClipboardList,
        badge: (features.enable_service_orders && permissions.page_service_orders) ? (notifications?.urgentOS || 0) : 0,
        children: atendimentoChildren,
      });
    }

    // Estoque - check permission
    if (permissions.page_stock) {
      // Helper to get badge info - prioritize zero stock (danger) over low stock (warning)
      const getStockBadge = (zero: number, low: number): { badge: number; badgeType: 'danger' | 'warning' } | {} => {
        if (zero > 0) return { badge: zero, badgeType: 'danger' as const };
        if (low > 0) return { badge: low, badgeType: 'warning' as const };
        return {};
      };

      const totalAlerts = (notifications?.totalZeroStock || 0) + (notifications?.totalLowStock || 0);

      nav.push({
        name: 'Estoque',
        icon: Package,
        badge: totalAlerts,
        badgeType: (notifications?.totalZeroStock || 0) > 0 ? 'danger' : 'warning',
        children: [
          { name: 'Materiais', href: '/estoque/materiais', icon: Package, ...getStockBadge(notifications?.zeroStockMateriais || 0, notifications?.lowStockMateriais || 0) },
          { name: 'Equipamentos', href: '/estoque/equipamentos', icon: Package, ...getStockBadge(notifications?.zeroStockEquipamentos || 0, notifications?.lowStockEquipamentos || 0) },
          { name: 'Ferramentas', href: '/estoque/ferramentas', icon: Wrench, ...getStockBadge(notifications?.zeroStockFerramentas || 0, notifications?.lowStockFerramentas || 0) },
          { name: 'EPI', href: '/estoque/epi', icon: Package, ...getStockBadge(notifications?.zeroStockEPI || 0, notifications?.lowStockEPI || 0) },
          { name: 'EPC', href: '/estoque/epc', icon: Package, ...getStockBadge(notifications?.zeroStockEPC || 0, notifications?.lowStockEPC || 0) },
          { name: 'Auditoria', href: '/estoque/auditoria', icon: AlertTriangle },
        ],
      });
    }

    // Movimentação - check permission
    if (permissions.page_movimentacao) {
      nav.push({ name: 'Movimentação', href: '/estoque/entrada', icon: FileText });
    }

    // Equipes - check feature AND permission
    if (features.enable_teams && permissions.page_teams) {
      nav.push({ name: 'Equipes', href: '/equipes', icon: Users });
    }

    // RH - check feature AND permission
    if (features.enable_hr && permissions.page_hr) {
      nav.push({ name: 'Recursos Humanos', href: '/rh', icon: UserPlus });
    }

    return nav;
  };

  const currentNavigation = getNavigation();

  // Keep parent menu open when navigating to a child route
  useEffect(() => {
    const activeParent = currentNavigation.find(item =>
      item.children?.some(child =>
        location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      )
    )?.name;
    
    if (activeParent && !openMenus.includes(activeParent)) {
      setOpenMenus(prev => [...prev, activeParent]);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    // Always redirect to auth, even if there was an error (e.g., session already expired).
    // The signOut hook already handles clearing local state.
    navigate('/auth', { replace: true });
  };

  // Toggle theme temporarily (resets to SuperAdmin config on reload)
  const toggleTheme = () => {
    // Capture the LIGHT variables once (so we can restore when coming back from dark)
    if (!lightThemeVarsRef.current) {
      const styles = getComputedStyle(document.documentElement);
      lightThemeVarsRef.current = THEME_VARS_TO_TOGGLE.reduce((acc, key) => {
        acc[key] = styles.getPropertyValue(key).trim();
        return acc;
      }, {} as Record<string, string>);
    }

    userToggledTheme.current = true;
    setIsDark((prev) => !prev);
  };

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return Array.from(next);
    });
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    // Only close the mobile sheet; desktop sidebar is fixed.
    setSidebarOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (item: NavItem) => {
    if (item.href) return location.pathname === item.href;
    return item.children?.some(
      (child) => location.pathname === child.href || location.pathname.startsWith(child.href + '/')
    );
  };

  const NotificationBadge = ({ count, type = 'danger', className }: { count: number; type?: 'danger' | 'warning'; className?: string }) => {
    if (count <= 0) return null;
    return (
      <span className={cn(
        "flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full animate-pulse",
        type === 'danger' && "bg-destructive text-destructive-foreground",
        type === 'warning' && "bg-warning text-warning-foreground",
        className
      )}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Helper to get tour ID for navigation items
  const getTourId = (name: string): string => {
    const tourMap: Record<string, string> = {
      'Dashboard': 'dashboard',
      'Estoque': 'estoque',
      'Movimentação': 'movimentacao',
      'Equipes': 'equipes',
      'Recursos Humanos': 'rh',
      'Atendimento': 'atendimento',
      'Administrativo': 'administrativo',
      'Materiais': 'estoque-materiais',
      'Ordens de Serviço': 'ordens-servico',
      'Obras': 'obras',
      'Frota': 'frota',
      'Relatórios': 'relatorios',
      'Configurações': 'settings',
    };
    return tourMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col h-full" data-tour="sidebar">
          {/* Navigation */}
          <nav className={cn(
            "flex-1 py-4 overflow-y-auto overflow-x-hidden transition-all duration-150",
            collapsed ? "px-2" : "px-3"
          )}>
            
            {/* Menu Label */}
            {!collapsed && (
              <div className="px-3 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  Menu Principal
                </span>
              </div>
            )}
            
            <div className="space-y-1">
              {currentNavigation.map((item, index) => {
                if (item.children && !collapsed) {
                  const isMenuOpen = openMenus.includes(item.name);
                  const hasActiveChild = isParentActive(item);
                  
                  return (
                    <div key={item.name} className="select-none" data-tour={getTourId(item.name)}>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-between gap-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors h-11 px-3',
                          hasActiveChild && 'bg-sidebar-accent/60 text-sidebar-foreground'
                        )}
                        onClick={() => toggleMenu(item.name)}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={cn(
                            "h-4.5 w-4.5 transition-colors",
                            hasActiveChild ? "text-primary" : "text-sidebar-foreground/60"
                          )} />
                          <span className="text-sm font-medium">{item.name}</span>
                          <NotificationBadge count={item.badge || 0} type={item.badgeType} />
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform duration-200 text-sidebar-foreground/40",
                          isMenuOpen && "rotate-90"
                        )} />
                      </Button>
                      <div
                        className={cn(
                          "ml-6 mt-1 overflow-hidden transition-all duration-200",
                          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                        )}
                      >
                        <div className="space-y-0.5 border-l border-sidebar-foreground/10 pl-4 py-1">
                          {item.children.map((child) => (
                            <Button
                              key={child.name}
                              variant="ghost"
                              size="sm"
                              data-tour={getTourId(child.name)}
                              className={cn(
                                'w-full justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 transition-colors h-9 px-3 rounded-md',
                                isActive(child.href) && 'bg-primary/10 text-primary font-medium'
                              )}
                              onClick={() => handleNavigation(child.href)}
                            >
                              <div className="flex items-center gap-2">
                                <child.icon className={cn(
                                  "h-3.5 w-3.5",
                                  isActive(child.href) ? "text-primary" : "text-sidebar-foreground/50"
                                )} />
                                <span className="text-xs font-medium">{child.name}</span>
                              </div>
                              <NotificationBadge count={child.badge || 0} type={child.badgeType} className="scale-90" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

              // Collapsed mode with dropdown for items with children
              if (item.children && collapsed) {
                const hasActiveChild = isParentActive(item);
                return (
                  <Tooltip key={item.name}>
                    <DropdownMenu>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            title={item.name}
                            aria-label={item.name}
                            className={cn(
                              'w-full h-11 p-0 justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200 rounded-lg relative group',
                              hasActiveChild && 'bg-sidebar-accent/50 text-sidebar-foreground'
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                              hasActiveChild 
                                ? "bg-primary/20 text-primary" 
                                : "bg-sidebar-foreground/5 text-sidebar-foreground/60 group-hover:bg-sidebar-foreground/10"
                            )}>
                              <item.icon className="h-5 w-5" />
                            </div>
                            {(item.badge || 0) > 0 && (
                              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse ring-2 ring-sidebar-background" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                      <DropdownMenuContent side="right" align="start" className="w-52 ml-2 bg-popover/95 backdrop-blur-sm border-border/50 shadow-xl z-50">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {item.children.map((child) => (
                          <DropdownMenuItem 
                            key={child.href} 
                            onClick={() => handleNavigation(child.href)}
                            className={cn(
                              "cursor-pointer gap-3",
                              isActive(child.href) && "bg-primary/10 text-primary"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.name}</span>
                            {(child.badge || 0) > 0 && (
                              <NotificationBadge count={child.badge || 0} type={child.badgeType} className="ml-auto scale-75" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Tooltip>
                );
              }

              // Regular menu item - collapsed
              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        title={item.name}
                        aria-label={item.name}
                        data-tour={getTourId(item.name)}
                        className={cn(
                          'w-full h-11 p-0 justify-center text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-200 rounded-lg relative group',
                          isActive(item.href!) && 'bg-sidebar-accent/50 text-sidebar-foreground'
                        )}
                        onClick={() => handleNavigation(item.href!)}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                          isActive(item.href!) 
                            ? "bg-primary/20 text-primary" 
                            : "bg-sidebar-foreground/5 text-sidebar-foreground/60 group-hover:bg-sidebar-foreground/10"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        {(item.badge || 0) > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full animate-pulse ring-2 ring-sidebar-background" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  data-tour={getTourId(item.name)}
                  className={cn(
                    'w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors h-11 px-3 rounded-lg',
                    isActive(item.href!) && 'bg-sidebar-accent/60 text-sidebar-foreground font-medium'
                  )}
                  onClick={() => handleNavigation(item.href!)}
                >
                  <item.icon className={cn(
                    "h-4.5 w-4.5 transition-colors",
                    isActive(item.href!) ? "text-primary" : "text-sidebar-foreground/60"
                  )} />
                  <span className="text-sm font-medium">{item.name}</span>
                  {(item.badge || 0) > 0 && (
                    <NotificationBadge count={item.badge || 0} type={item.badgeType} className="ml-auto" />
                  )}
                </Button>
              );
            })}
            </div>

            {/* Bottom Divider */}
            {!collapsed && (
              <div className="mt-6 px-3">
                <div className="menu-divider" />
              </div>
            )}
          </nav>

        </div>
      </TooltipProvider>
    );
  };

  // While validating access, don't render the app (prevents brief access during load)
  if (!isSuperAdmin() && (isLoadingPermissions || isPermissionsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div
            aria-hidden
            className="mx-auto h-10 w-10 rounded-full border-2 border-border border-t-primary animate-spin"
          />
          <h1 className="text-lg font-semibold text-foreground">Validando acesso...</h1>
          <p className="text-sm text-muted-foreground">Aguarde enquanto verificamos seu perfil de permissões.</p>
        </div>
      </div>
    );
  }

  // Show access denied screen if user has incomplete setup
  if (hasIncompleteSetup) {
    const requirementsList = missingRequirements?.join(' e ') || 'configurações necessárias';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Sua conta ainda não está configurada corretamente.
            Para acessar o sistema, é necessário ter {requirementsList} atribuído(a).
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o Super Admin para liberar seu acesso.
          </p>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="mt-4"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col menu-shell print:block">
      {/* Clean minimal background */}
      <div aria-hidden className="fixed inset-0 menu-shell-bg print:hidden" />

      {/* Top Header - Full width, invisible background, behind content */}
      <header className={cn(
        "hidden lg:flex items-center text-sidebar-foreground h-10 z-10 fixed top-0 left-0 right-0 transition-transform duration-200 print:!hidden",
        !showHeader && "-translate-y-full"
      )}>
        {/* Spacer - same width as sidebar */}
        <div className={cn(
          "h-full transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )} />

        {/* Header content - center */}
        <div className="flex-1 flex items-center justify-center gap-3 px-2">
          {/* Matriz Branch Selector */}
          {isMatriz && (
            <MatrizBranchSelector 
              selectedBranchId={selectedBranchId} 
              onSelectBranch={setSelectedBranchId}
              variant="sidebar"
            />
          )}
          {/* Date - hide on smaller screens */}
          <div className="hidden xl:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1 rounded-full text-xs text-sidebar-foreground/90">
            <Calendar className="h-3.5 w-3.5 text-sidebar-foreground/70 flex-shrink-0" />
            <span className="capitalize">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          {/* Time - always visible on lg+ */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1 rounded-full text-xs font-mono text-sidebar-foreground/90">
            <Clock className="h-3.5 w-3.5 text-sidebar-foreground/70 flex-shrink-0" />
            <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          {/* Location - hide on smaller screens */}
          {tenant?.city && (
            <div className="hidden xl:flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full text-xs text-sidebar-foreground/90">
              <MapPin className="h-3.5 w-3.5 text-sidebar-foreground/70 flex-shrink-0" />
              <span>{tenant.city}</span>
            </div>
          )}
        </div>

        {/* Notifications and User info - right */}
        <div className="flex items-center gap-3 px-4">
          {/* User text - hide on smaller screens */}
          <div className="hidden xl:block text-right">
            <div className="text-sidebar-foreground text-xs">Olá, <span className="font-semibold">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}</span></div>
            <div className="text-sidebar-foreground/60 text-[10px]">Data do último acesso: {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
          
          {/* Push Notifications Center */}
          <div data-tour="notifications">
            <NotificationCenter alarms={alarms} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-tour="user-menu" variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-full">
                <Avatar className="h-8 w-8 border-2 border-sidebar-foreground/20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getInitials(profile?.full_name || user?.email || 'SA')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              {/* Show date/time/location info in dropdown on smaller screens */}
              <div className="xl:hidden px-2 py-2 space-y-1 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="capitalize">
                    {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {tenant?.city && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{tenant.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Último acesso: {currentTime.toLocaleDateString('pt-BR')} {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              {isSuperAdmin() && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/superadmin')} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Super Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {isDark ? 'Modo Claro' : 'Modo Escuro'}
              </DropdownMenuItem>
              {canAccessSettings && (
                <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer" data-tour="settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
              )}
              {/* PWA Install Button - Mobile Menu */}
              {!isAppInstalled ? (
                <DropdownMenuItem onClick={handleInstallPWA} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4" />
                  Instalar App
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="cursor-default text-green-600">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Instalado ✓
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {/* Tour Controls */}
              <DropdownMenuItem onClick={resetTour} className="cursor-pointer">
                <Play className="mr-2 h-4 w-4" />
                Reiniciar Tour
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTourEnabled} className="cursor-pointer">
                {isTourEnabled ? <ToggleRight className="mr-2 h-4 w-4 text-green-500" /> : <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />}
                Tour Automático: {isTourEnabled ? 'Ativo' : 'Inativo'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Sidebar - below header */}
      <aside className={cn(
        "hidden lg:fixed lg:bottom-0 lg:left-0 lg:flex lg:flex-col transition-all duration-200 ease-out z-30 print:!hidden overflow-hidden",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        // When collapsed, sidebar starts below the logo area
        isCollapsed ? (isAtTop ? "lg:top-[5rem]" : "lg:top-[4.5rem]") : "lg:top-2"
      )}>
        {/* Decorative floating elements */}
        {!isCollapsed && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 w-32 h-32 rounded-full opacity-10 animate-float-slow"
                 style={{ background: `radial-gradient(circle, hsl(var(--sidebar-accent)), transparent)` }} />
            <div className="absolute bottom-1/3 right-0 w-24 h-24 rounded-full opacity-10 animate-float-slower"
                 style={{ background: `radial-gradient(circle, hsl(var(--sidebar-border)), transparent)` }} />
            <div className="absolute top-1/2 left-4 w-2 h-2 rounded-full bg-white/10 animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-8 w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          </div>
        )}
        
        <div className="flex flex-col flex-1 bg-transparent relative z-10">
          {/* Logo - show only when NOT collapsed */}
          {!isCollapsed && (
            <div className="flex flex-col items-center px-4 pb-2 animate-fade-in">
              {/* Show branch name or company logo based on director selection */}
              {isDirector && selectedBranch ? (
                <>
                  <div className="text-2xl font-bold text-sidebar-foreground text-center mb-2 animate-scale-in">
                    {selectedBranch.name}
                  </div>
                  <DirectorBranchDropdown variant="sidebar" />
                </>
              ) : isDirector ? (
                <>
                  {currentLogo ? (
                    <img 
                      src={currentLogo} 
                      alt={tenant?.name || 'Logo'} 
                      className="h-24 object-contain mb-2 animate-scale-in"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-sidebar-foreground text-center mb-2 animate-scale-in">
                      {tenant?.name || 'System'}
                    </div>
                  )}
                  <DirectorBranchDropdown variant="sidebar" />
                </>
              ) : currentLogo ? (
                <img 
                  src={currentLogo} 
                  alt={branchData?.name || tenant?.name || 'Logo'} 
                  className="h-28 object-contain animate-scale-in"
                />
              ) : (
                <div className="text-3xl font-bold text-sidebar-foreground text-center animate-scale-in">
                  {branchData?.name || tenant?.name || 'System'}
                </div>
              )}
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex-1 pt-2">
            <SidebarContent collapsed={isCollapsed} />
          </div>
        </div>
      </aside>

      {/* Large Logo when collapsed - positioned at top of sidebar */}
      {isCollapsed && (
        <div className={cn(
          "hidden lg:flex fixed z-40 items-center justify-center transition-all duration-200 ease-out w-16",
          isAtTop ? "-top-6 left-3" : "top-10 left-0"
        )}>
          {currentLogo ? (
            <img 
              src={currentLogo} 
              alt={tenant?.name || 'Logo'} 
            className={cn(
                "object-contain transition-all duration-200 ease-out",
                isAtTop ? "h-32 w-32" : "h-10 w-10"
              )}
            />
          ) : (
            <div className={cn(
              "font-bold text-sidebar-foreground transition-all duration-200 ease-out",
              isAtTop ? "text-3xl" : "text-xl"
            )}>
              {(branchData?.name || tenant?.name)?.charAt(0) || 'S'}
            </div>
          )}
        </div>
      )}

      {/* Expand Arrow between sidebar and content */}
      <div className={cn(
        "hidden lg:flex fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-200",
        isCollapsed ? "left-16" : "left-64"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsTransitioning(true);
            setIsCollapsed(!isCollapsed);
            setTimeout(() => setIsTransitioning(false), 350);
          }}
          className="h-7 w-7 rounded-full bg-sidebar text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent shadow-lg border border-sidebar-accent/50 -ml-3.5 transition-all duration-150 hover:scale-110 hover:shadow-[0_0_12px_rgba(100,150,200,0.4)]"
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-150",
            !isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Mobile Header - Transparent, background comes from menu-shell-bg */}
      <div className="lg:hidden bg-transparent text-sidebar-foreground print:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            {isDirector && selectedBranch ? (
              <div className="flex flex-col items-start gap-1">
                <span className="font-bold text-base">{selectedBranch.name}</span>
                <DirectorBranchDropdown className="h-7 text-xs" />
              </div>
            ) : isDirector ? (
              <div className="flex flex-col items-start gap-1">
                {currentLogo ? (
                  <img src={currentLogo} alt={tenant?.name || 'Logo'} className="h-7" />
                ) : (
                  <span className="font-bold text-base">{tenant?.name || 'System'}</span>
                )}
                <DirectorBranchDropdown className="h-7 text-xs" />
              </div>
            ) : currentLogo ? (
              <img src={currentLogo} alt={branchData?.name || tenant?.name || 'Logo'} className="h-8" />
            ) : (
              <span className="font-bold text-lg">{branchData?.name || tenant?.name || 'System'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Push Notifications Center - Mobile */}
            <NotificationCenter alarms={alarms} />

            {/* User Avatar with dropdown for settings/superadmin */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(profile?.full_name || user?.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover w-56">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{profile?.full_name || 'Usuário'}</span>
                    <span className="flex items-center gap-1 text-[10px] text-green-500">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Online
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isSuperAdmin() ? 'Super Administrador' : 
                      roles?.[0]?.role === 'admin' ? 'Administrador' :
                      roles?.[0]?.role === 'manager' ? 'Gerente' :
                      roles?.[0]?.role === 'warehouse' ? 'Almoxarife' :
                      roles?.[0]?.role === 'technician' ? 'Técnico' :
                      roles?.[0]?.role === 'caixa' ? 'Caixa' : 'Usuário'}
                  </div>
                  {user?.last_sign_in_at && (
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último acesso: {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR')} às {new Date(user.last_sign_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {canAccessSettings && (
                  <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                )}
                {isSuperAdmin() && (
                  <DropdownMenuItem onClick={() => navigate('/superadmin')} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    SuperAdmin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {/* Tour Controls - Mobile */}
                <DropdownMenuItem onClick={resetTour} className="cursor-pointer">
                  <Play className="mr-2 h-4 w-4" />
                  Reiniciar Tour
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTourEnabled} className="cursor-pointer">
                  {isTourEnabled ? <ToggleRight className="mr-2 h-4 w-4 text-green-500" /> : <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />}
                  Tour: {isTourEnabled ? 'Ativo' : 'Inativo'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* PWA Install Button */}
                {!isAppInstalled && (
                  <DropdownMenuItem onClick={handleInstallPWA} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    Instalar App
                  </DropdownMenuItem>
                )}
                {isAppInstalled && (
                  <DropdownMenuItem disabled className="cursor-default text-muted-foreground">
                    <Smartphone className="mr-2 h-4 w-4" />
                    App instalado
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-sidebar-border/50 transition-transform duration-200 print:hidden",
        !showMobileNav && "translate-y-[calc(100%+2rem)]"
      )}>
        {/* Animated gradient background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(90deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-accent) / 0.8) 50%, hsl(var(--sidebar-background)) 100%)`,
          }}
        />
        
        {/* Subtle mesh overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          background: `radial-gradient(ellipse at 50% 0%, hsl(var(--sidebar-accent)) 0%, transparent 70%)`
        }} />

        <div className="flex items-center h-16 px-2 relative z-10">
          {/* Left side items */}
          <div className="flex-1 flex items-center justify-evenly">
            {/* Home - always show if has dashboard permission */}
            {permissions.page_dashboard && (
              <button
                onClick={() => navigate('/dashboard')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive('/dashboard') ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-[10px]">Principal</span>
              </button>
            )}

            {/* Estoque - check permission */}
            {permissions.page_stock && (
              <button
                onClick={() => navigate('/estoque')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  location.pathname.startsWith('/estoque') ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                )}
              >
                <Package className="h-5 w-5" />
                <span className="text-[10px]">Estoque</span>
              </button>
            )}
          </div>

          {/* Spacer for FAB */}
          <div className="w-16" />

          {/* Backdrop overlay when FAB expanded */}
          {fabExpanded && (
            <div 
              className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200" 
              onClick={() => setFabExpanded(false)}
            />
          )}

          {/* FAB - Central Button with arc actions */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-50">
            {/* Arc actions - two rows for better organization */}
            {fabActions.map((action, index) => {
              // Arc layout - closer to button but spread apart
              const itemsCount = fabActions.length;
              const totalArc = 160;
              const angleStep = totalArc / (itemsCount - 1 || 1);
              const startAngle = 170;
              const angle = startAngle - (index * angleStep);
              const radian = (angle * Math.PI) / 180;
              
              const radius = 90;
              const x = Math.cos(radian) * radius;
              const y = -Math.sin(radian) * radius;

              return (
                <button
                  key={action.label}
                  onClick={() => {
                    setFabExpanded(false);
                    navigate(action.href);
                  }}
                  className={cn(
                    "absolute flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-full text-white shadow-lg transition-all duration-200 ease-out",
                    action.color,
                    fabExpanded 
                      ? "opacity-100 scale-100" 
                      : "opacity-0 scale-0 pointer-events-none"
                  )}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: fabExpanded 
                      ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                      : 'translate(-50%, -50%)',
                    transitionDelay: fabExpanded ? `${index * 50}ms` : '0ms',
                  }}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-[8px] font-medium leading-none">{action.label}</span>
                </button>
              );
            })}

            {/* Main FAB button */}
            <button 
              onClick={() => setFabExpanded(!fabExpanded)}
              className={cn(
                "relative z-10 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 grid place-items-center",
                fabExpanded && "rotate-45 bg-destructive"
              )}
            >
              <Plus className="h-7 w-7" strokeWidth={2.25} />
            </button>
          </div>

          {/* Right side items */}
          <div className="flex-1 flex items-center justify-evenly">
            {/* OS - check feature and permission */}
            {features.enable_service_orders && permissions.page_service_orders && (
              <button
                onClick={() => navigate('/os')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive('/os') ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                )}
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-[10px]">OS</span>
              </button>
            )}

            {/* Mais - slide panel */}
            <div className="relative">
              {/* More button */}
              <button
                onClick={() => setMoreExpanded(!moreExpanded)}
                className={cn(
                  "relative z-50 flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  moreExpanded ? "text-sidebar-foreground" : "text-sidebar-foreground/50"
                )}
              >
                <MoreHorizontal className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  moreExpanded && "rotate-90"
                )} />
                <span className="text-[10px]">Mais</span>
              </button>

              {/* Fan panel from bottom-right */}
              <div 
                className={cn(
                  "fixed right-0 bottom-0 top-0 w-72 border-l border-sidebar-border/50 shadow-2xl z-[70] flex flex-col overflow-hidden",
                  !moreExpanded && "pointer-events-none"
                )}
                style={{
                  clipPath: moreExpanded 
                    ? 'circle(150% at 100% 100%)' 
                    : 'circle(0% at 100% 100%)',
                  transition: 'clip-path 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Animated gradient background */}
                <div 
                  className="absolute inset-0 animate-gradient-shift"
                  style={{ 
                    background: `linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--sidebar-accent)) 50%, hsl(var(--sidebar-background)) 100%)`,
                    backgroundSize: '200% 200%',
                  }}
                />
                
                {/* Mesh overlay */}
                <div className="absolute inset-0 opacity-30" style={{
                  background: `radial-gradient(ellipse at 20% 20%, hsl(var(--sidebar-accent)) 0%, transparent 50%),
                               radial-gradient(ellipse at 80% 80%, hsl(var(--sidebar-border)) 0%, transparent 40%)`
                }} />

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }} />

                {/* Floating decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-20 right-8 w-24 h-24 rounded-full opacity-20 animate-float-slow"
                       style={{ background: `radial-gradient(circle, hsl(var(--sidebar-accent)), transparent)` }} />
                  <div className="absolute bottom-40 left-4 w-16 h-16 rounded-full opacity-15 animate-float-slower"
                       style={{ background: `radial-gradient(circle, hsl(var(--sidebar-border)), transparent)` }} />
                  <div className="absolute top-1/3 left-2 w-2 h-2 rounded-full bg-white/20 animate-pulse-slow" />
                  <div className="absolute top-2/3 right-6 w-3 h-3 rounded-full bg-white/15 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                </div>

                {/* Header - Fixed */}
                <div className="flex-shrink-0 relative z-10 border-b border-sidebar-border/30 p-4 flex items-center justify-center backdrop-blur-sm bg-sidebar/30">
                  {currentLogo ? (
                    <img src={currentLogo} alt={branchData?.name || tenant?.name || 'Logo'} className="h-8" />
                  ) : (
                    <span className="text-sidebar-foreground font-bold text-lg">{branchData?.name || tenant?.name || 'Sistema'}</span>
                  )}
                  <button 
                    onClick={() => setMoreExpanded(false)}
                    className="absolute right-4 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Matriz Branch Selector */}
                {isMatriz && (
                  <div className="flex-shrink-0 relative z-10 px-4 py-3 border-b border-sidebar-border/30 backdrop-blur-sm bg-sidebar/20">
                    <MatrizBranchSelector 
                      selectedBranchId={selectedBranchId} 
                      onSelectBranch={setSelectedBranchId}
                      variant="sidebar"
                    />
                  </div>
                )}

                {/* Full Navigation - Scrollable */}
                <div className="flex-1 relative z-10 overflow-y-auto p-3 space-y-1 pb-20">
                  {currentNavigation.map((item, index) => (
                    <div key={item.name}>
                      {item.children ? (
                        // Item with submenu
                        <div>
                          <button
                            onClick={() => toggleMenu(item.name)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150",
                              isParentActive(item) && "text-sidebar-foreground",
                              moreExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                            )}
                            style={{
                              transitionDelay: moreExpanded ? `${100 + index * 30}ms` : '0ms',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-5 w-5" />
                              <span className="text-sm font-medium">{item.name}</span>
                              {item.badge && item.badge > 0 && (
                                <span className={cn(
                                  "flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                                  item.badgeType === 'warning' ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"
                                )}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <ChevronRight className={cn(
                              "h-4 w-4 transition-transform",
                              openMenus.includes(item.name) && "rotate-90"
                            )} />
                          </button>
                          
                          {/* Submenu */}
                          <div
                            className={cn(
                              "overflow-hidden transition-[max-height] duration-150",
                              openMenus.includes(item.name) ? "max-h-96 pointer-events-auto" : "max-h-0 pointer-events-none",
                            )}
                          >
                            <div className="pl-4 py-1 space-y-1">
                              {item.children.map((child) => (
                                <button
                                  key={child.href}
                                  onClick={() => {
                                    setMoreExpanded(false);
                                    navigate(child.href);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm",
                                    isActive(child.href) && "bg-sidebar-accent text-sidebar-foreground"
                                  )}
                                >
                                  <child.icon className="h-4 w-4" />
                                  <span>{child.name}</span>
                                  {child.badge && child.badge > 0 && (
                                    <span className={cn(
                                      "ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                                      child.badgeType === 'warning' ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"
                                    )}>
                                      {child.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Simple item without submenu
                        <button
                          onClick={() => {
                            setMoreExpanded(false);
                            navigate(item.href!);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150",
                            isActive(item.href!) && "bg-sidebar-accent text-sidebar-foreground",
                            moreExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                          )}
                          style={{
                            transitionDelay: moreExpanded ? `${100 + index * 30}ms` : '0ms',
                          }}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="text-sm font-medium">{item.name}</span>
                          {item.badge && item.badge > 0 && (
                            <span className={cn(
                              "ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                              item.badgeType === 'warning' ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Configurações */}
                  {canAccessSettings && (
                    <div className="border-t border-sidebar-border mt-4 pt-4">
                      <button
                        onClick={() => {
                          setMoreExpanded(false);
                          navigate('/configuracoes');
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-150",
                          isActive('/configuracoes') && "bg-sidebar-accent text-sidebar-foreground",
                          moreExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                        )}
                        style={{
                          transitionDelay: moreExpanded ? `${100 + currentNavigation.length * 30}ms` : '0ms',
                        }}
                      >
                        <Settings className="h-5 w-5" />
                        <span className="text-sm font-medium">Configurações</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Backdrop overlay */}
              {moreExpanded && (
                <div 
                  className="fixed inset-0 bg-black/40 z-[55]" 
                  onClick={() => setMoreExpanded(false)}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar (Full Menu) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-out lg:pt-10 relative print:!pl-0 print:!pt-0",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Dark background layer for mobile - simulates sidebar bg */}
        <div className="lg:hidden fixed inset-0 bg-sidebar -z-10 print:hidden" />
        
        {/* White content area with clipped corner */}
        <main className="flex-1 bg-background min-h-[calc(100vh-3rem)] sm:min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-2.5rem)] relative z-20 content-with-curl shadow-[0_0_40px_10px_rgba(0,0,0,0.4)] lg:shadow-[0_0_80px_20px_rgba(0,0,0,0.6)] print:shadow-none print:min-h-0 print:bg-white">
          {/* Page curl effect - visible on both mobile and desktop */}
          <div
            className={cn(
              "page-curl-container print:hidden",
              isTransitioning && "opacity-0"
            )}
            style={{ 
              top: 0,
              left: 0
            }}
          >
            <div className="page-curl-page" />
          </div>
          
          {/* Mobile Breadcrumb */}
          <div className="lg:hidden mb-2 px-3 sm:px-4 print:hidden">
            <Breadcrumb />
          </div>

          {/* Content centered with equal padding */}
          <div className="p-3 sm:p-4 pb-20 sm:pb-24 lg:p-8 lg:pt-16 lg:pb-8 print:p-0">
            <div className="max-w-7xl mx-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </div>
        </main>
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
}
