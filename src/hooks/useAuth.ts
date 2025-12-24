import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, UserRole, Tenant, AppRole, Branch } from '@/types/database';
import { saveThemeSnapshotToSession, resetInlineThemeFromCachedSnapshot, clearThemeSnapshotFromSession } from '@/lib/themeCache';
import { toast } from 'sonner';
import { sanitizeErrorMessage } from '@/lib/errorUtils';

// ============= TYPES =============

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  tenant: Tenant | null;
  selectedBranch: Branch | null;
  isLoading: boolean;
  isInitialized: boolean; // Track if initial session check is complete
}

interface AuthResult {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

interface SignOutResult {
  error: AuthError | null;
}

// Helper to convert hex to HSL
const hexToHSL = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 207, s: 50, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const computeThemeSnapshot = (tenant: Tenant) => {
  const primaryOpacity = (tenant as any).primary_opacity ?? 100;
  const secondaryOpacity = (tenant as any).secondary_opacity ?? 100;
  const menuColor = (tenant as any).menu_color || '#1e3a5f';

  const dark = tenant.theme === 'dark';
  const vars: Record<string, string> = {};
  const classes: string[] = [];

  // Check if menu color is dark (luminosity < 50%)
  const menuHsl = hexToHSL(menuColor);
  const isMenuDark = menuHsl.l < 50;

  // Primary color
  if (tenant.primary_color) {
    const hsl = hexToHSL(tenant.primary_color);
    vars['--primary'] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    vars['--ring'] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    vars['--brand'] = `${hsl.h} ${Math.round(hsl.s * 0.9)}% ${Math.round(hsl.l * 0.85)}%`;
    vars['--accent'] = `${hsl.h} ${Math.round(hsl.s * 0.6)}% 93%`;
    vars['--accent-foreground'] = `${hsl.h} ${Math.round(hsl.s * 0.9)}% ${Math.round(hsl.l * 0.85)}%`;
  }

  // Secondary / background color (light mode)
  // IMPORTANT: don't auto-harmonize background with the menu color, as it can flatten contrast.
  // If the tenant has a secondary color, apply it; otherwise, keep the default tokens from index.css.
  if (tenant.secondary_color && !dark) {
    const hsl = hexToHSL(tenant.secondary_color);
    const opacityFactor = secondaryOpacity / 100;
    const adjustedL = Math.round(hsl.l + ((100 - hsl.l) * (1 - opacityFactor)));

    vars['--background'] = `${hsl.h} ${Math.round(hsl.s * 0.2)}% ${adjustedL}%`;
    // Increase contrast between surfaces so UI elements (tabs, inputs) stand out from the page.
    vars['--muted'] = `${hsl.h} ${Math.round(hsl.s * 0.15)}% ${Math.max(adjustedL - 10, 0)}%`;
    vars['--secondary'] = `${hsl.h} ${Math.round(hsl.s * 0.15)}% ${Math.max(adjustedL - 7, 0)}%`;
  }

  // Menu color (always)
  if (menuColor) {
    const hsl = hexToHSL(menuColor);
    const isLight = hsl.l >= 70;
    const bgL = hsl.l;
    const fg = isLight ? `${hsl.h} 15% 14%` : `${hsl.h} 20% 98%`;
    const accentL = isLight ? Math.max(bgL - 8, 0) : Math.min(bgL + 6, 100);
    const borderL = isLight ? Math.max(bgL - 14, 0) : Math.min(bgL + 10, 100);

    vars['--custom-menu-bg'] = `${hsl.h} ${hsl.s}% ${bgL}%`;
    vars['--custom-menu-fg'] = fg;
    vars['--custom-menu-accent'] = `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${accentL}%`;
    vars['--custom-menu-border'] = `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${borderL}%`;
    vars['--sidebar-background'] = `${hsl.h} ${hsl.s}% ${bgL}%`;
    vars['--sidebar-foreground'] = fg;
    vars['--sidebar-accent'] = `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${accentL}%`;
    vars['--sidebar-border'] = `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${borderL}%`;
    vars['--header-background'] = `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${Math.max(bgL - 2, 0)}%`;

    classes.push('menu-theme-custom');
  }

  // Persist the computed snapshot so reloads apply the same theme immediately
  saveThemeSnapshotToSession({ dark, vars, classes });

  return { dark, vars, classes };
};

// Apply theme colors from tenant settings
const applyThemeColors = (tenant: Tenant | null) => {
  if (!tenant) return;

  // Prevent theme “bleeding” between accounts/tenants (session cached vars/classes)
  resetInlineThemeFromCachedSnapshot();

  const snapshot = computeThemeSnapshot(tenant);

  // Apply theme mode FIRST to avoid flash
  if (snapshot.dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply vars
  Object.entries(snapshot.vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });

  // Ensure custom menu class present (and remove old ones)
  document.documentElement.classList.forEach((cls) => {
    if (cls.startsWith('menu-theme-')) document.documentElement.classList.remove(cls);
  });
  snapshot.classes?.forEach((cls) => document.documentElement.classList.add(cls));
};

const AUTH_CACHE_KEY = "auth:snapshot:v1";

type AuthSnapshot = {
  userId: string;
  profile: Profile | null;
  roles: UserRole[];
  tenant: Tenant | null;
  selectedBranch: Branch | null;
  savedAt: number;
};

const readAuthSnapshot = (): AuthSnapshot | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSnapshot;
    if (!parsed?.userId || !parsed?.savedAt) return null;
    // Keep snapshot valid for 10 minutes
    if (Date.now() - parsed.savedAt > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeAuthSnapshot = (snap: AuthSnapshot) => {
  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
};

const clearAuthSnapshot = () => {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // ignore
  }
};

export function useAuth() {
  const initialSnapshot = readAuthSnapshot();
  const initializationRef = useRef(false);
  const hydrationInProgress = useRef(false);

  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    session: null,
    profile: initialSnapshot?.profile ?? null,
    roles: initialSnapshot?.roles ?? [],
    tenant: initialSnapshot?.tenant ?? null,
    selectedBranch: initialSnapshot?.selectedBranch ?? null,
    // Start with loading true to prevent redirects before session check
    isLoading: true,
    isInitialized: false,
  }));

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      // Fetch tenant if user has one
      let tenant = null;
      if (profile?.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .maybeSingle();
        tenant = tenantData;
        
        // Apply theme colors when tenant is loaded
        applyThemeColors(tenant as Tenant | null);
      }

      // Fetch user's assigned branch (branch_id) - this is the user's fixed branch
      // If not set, fall back to selected_branch_id for backwards compatibility
      let selectedBranch = null;
      const branchIdToUse = profile?.branch_id || profile?.selected_branch_id;
      if (branchIdToUse) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('*')
          .eq('id', branchIdToUse)
          .maybeSingle();
        selectedBranch = branchData;
      }

      // Debug: Log roles being loaded
      console.log('[Auth Debug] Roles loaded for user:', userId, roles);
      console.log('[Auth Debug] Profile loaded:', profile?.full_name, profile?.email);

      setState(prev => {
        const next = {
          ...prev,
          profile: profile as Profile | null,
          roles: (roles as UserRole[]) || [],
          tenant: tenant as Tenant | null,
          selectedBranch: selectedBranch as Branch | null,
        };

        // Persist snapshot for quick restore when the browser reloads/discards the tab
        if (prev.user?.id) {
          writeAuthSnapshot({
            userId: prev.user.id,
            profile: next.profile,
            roles: next.roles,
            tenant: next.tenant,
            selectedBranch: next.selectedBranch,
            savedAt: Date.now(),
          });
        }

        return next;
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializationRef.current) return;
    initializationRef.current = true;

    const hydrate = async (session: Session | null, isInitialCheck = false) => {
      // Prevent concurrent hydration
      if (hydrationInProgress.current && !isInitialCheck) return;
      hydrationInProgress.current = true;

      try {
        const snapshot = readAuthSnapshot();
        const canFastRestore =
          !!session?.user &&
          !!snapshot &&
          snapshot.userId === session.user.id &&
          Date.now() - snapshot.savedAt <= 10 * 60 * 1000;

        // Update session/user immediately
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: !!session?.user && !canFastRestore,
          isInitialized: true,
          ...(canFastRestore
            ? {
                profile: snapshot.profile,
                roles: snapshot.roles,
                tenant: snapshot.tenant,
                selectedBranch: snapshot.selectedBranch,
              }
            : {}),
        }));

        // Apply cached theme ASAP when restoring
        if (canFastRestore && snapshot.tenant) {
          applyThemeColors(snapshot.tenant);
        }

        if (session?.user) {
          // Always refresh in background
          try {
            await fetchUserData(session.user.id);
          } catch (error) {
            console.error('Error fetching user data during hydration:', error);
            // Don't show toast on hydration - only on explicit actions
          } finally {
            setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
          }
        } else {
          // Clear cached theme
          clearThemeSnapshotFromSession();
          resetInlineThemeFromCachedSnapshot();
          clearAuthSnapshot();

          // Remove dark mode and restore clean state
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.forEach((cls) => {
            if (cls.startsWith('menu-theme-')) document.documentElement.classList.remove(cls);
          });

          // Clear CSS variables
          const cssVarsToReset = [
            '--primary', '--ring', '--brand', '--accent', '--accent-foreground',
            '--background', '--muted', '--secondary', '--card', '--card-foreground',
            '--custom-menu-bg', '--custom-menu-fg', '--custom-menu-accent', '--custom-menu-border',
            '--sidebar-background', '--sidebar-foreground', '--sidebar-accent', '--sidebar-border',
            '--header-background'
          ];
          cssVarsToReset.forEach(v => document.documentElement.style.removeProperty(v));

          setState(prev => ({
            ...prev,
            profile: null,
            roles: [],
            tenant: null,
            selectedBranch: null,
            isLoading: false,
            isInitialized: true,
          }));
        }
      } finally {
        hydrationInProgress.current = false;
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only hydrate on meaningful auth events
        if (event === 'TOKEN_REFRESHED') {
          setState(prev => ({ ...prev, session }));
          return;
        }
        // Defer backend calls to avoid blocking the auth callback
        setTimeout(() => {
          hydrate(session, false);
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrate(session, true);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      setState(prev => ({ ...prev, isLoading: false, isInitialized: true }));
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        const friendlyMessage = sanitizeErrorMessage(error);
        toast.error('Erro ao entrar', {
          description: friendlyMessage,
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return { data: null, error };
      }

      toast.success('Login realizado com sucesso!');
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro de conexão';
      toast.error('Erro ao conectar', {
        description: 'Verifique sua conexão com a internet e tente novamente.',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async (): Promise<SignOutResult> => {
    try {
      // Clear cached auth state first
      clearAuthSnapshot();

      // Force clear local state BEFORE calling supabase.signOut
      setState({
        user: null,
        session: null,
        profile: null,
        roles: [],
        tenant: null,
        selectedBranch: null,
        isLoading: false,
        isInitialized: true,
      });

      const { error } = await supabase.auth.signOut();

      // Ignore "session_not_found" – the user is already logged out
      if (error && (error as any)?.code === 'session_not_found') {
        toast.success('Sessão encerrada');
        return { error: null };
      }

      if (error) {
        const friendlyMessage = sanitizeErrorMessage(error);
        toast.error('Erro ao sair', {
          description: friendlyMessage,
        });
        return { error };
      }

      toast.success('Sessão encerrada');
      return { error: null };
    } catch (error) {
      toast.error('Erro ao desconectar', {
        description: 'Ocorreu um erro ao encerrar a sessão.',
      });
      return { error: error as AuthError };
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return state.roles.some(r => r.role === role);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('superadmin');
  };

  const isAdmin = (): boolean => {
    return hasRole('admin') || hasRole('superadmin');
  };

  const isManager = (): boolean => {
    return hasRole('manager') || hasRole('admin') || hasRole('superadmin');
  };

  // Field user / Technician - operational user with limited access
  const isFieldUser = (): boolean => {
    // A field user is someone who only has 'technician', 'warehouse', or 'caixa' role
    // and is NOT admin, manager, or superadmin
    if (isSuperAdmin() || isAdmin() || hasRole('manager')) return false;
    return hasRole('technician') || hasRole('warehouse') || hasRole('caixa');
  };

  return {
    ...state,
    signIn,
    signOut,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    isFieldUser,
    refetchUserData: () => state.user && fetchUserData(state.user.id),
  };
}