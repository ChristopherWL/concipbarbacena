import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Mail, Lock, Sparkles, Zap, ArrowLeft, MapPin } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(100),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface Branch {
  id: string;
  name: string;
  is_main: boolean;
}

interface TenantBranding {
  logo_url: string | null;
  background_url: string | null;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
}

// Helper to convert hex to HSL
const hexToHSL = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 207, s: 50, l: 50 };
  
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

// Apply theme colors to CSS variables
const applyThemeColors = (primaryColor: string, secondaryColor: string) => {
  const primary = hexToHSL(primaryColor);
  document.documentElement.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
  document.documentElement.style.setProperty('--ring', `${primary.h} ${primary.s}% ${primary.l}%`);
  
  const secondary = hexToHSL(secondaryColor);
  document.documentElement.style.setProperty('--background', `${secondary.h} ${Math.round(secondary.s * 0.2)}% ${secondary.l}%`);
};

export default function Auth() {
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, tenant: userTenant, isSuperAdmin, roles, refetchUserData } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('geral');
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Fetch branches and branding
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingBranches(true);
      try {
        // Fetch active branches
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('id, name, is_main')
          .eq('is_active', true)
          .order('is_main', { ascending: false })
          .order('name');

        if (branchesError) throw branchesError;
        setBranches(branchesData || []);

        // Fetch public branding (matriz logo/background) via backend function (works before login)
        const { data: brandingRes, error: brandingError } = await supabase.functions.invoke('get-public-branding');
        if (brandingError) throw brandingError;

        const tenantData = brandingRes?.branding as TenantBranding | null;
        if (tenantData) {
          setBranding(tenantData);
          if (tenantData.primary_color && tenantData.secondary_color) {
            applyThemeColors(tenantData.primary_color, tenantData.secondary_color);
          }
          // Preload background image
          if (tenantData.background_url) {
            const img = new Image();
            img.onload = () => {
              setIsBackgroundLoaded(true);
              setIsPageReady(true);
            };
            img.onerror = () => {
              setIsBackgroundLoaded(true);
              setIsPageReady(true);
            };
            img.src = tenantData.background_url;
          } else {
            setIsBackgroundLoaded(true);
            setIsPageReady(true);
          }
        } else {
          setIsBackgroundLoaded(true);
          setIsPageReady(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsBackgroundLoaded(true);
        setIsPageReady(true);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchData();
  }, []);

  // Use user's tenant branding if available
  useEffect(() => {
    if (userTenant) {
      setBranding({
        logo_url: userTenant.logo_url,
        background_url: userTenant.background_url,
        name: userTenant.name,
        primary_color: userTenant.primary_color,
        secondary_color: userTenant.secondary_color,
      });
    }
  }, [userTenant]);

  // Apply theme colors when branding changes
  useEffect(() => {
    if (branding?.primary_color && branding?.secondary_color) {
      applyThemeColors(branding.primary_color, branding.secondary_color);
    }
  }, [branding?.primary_color, branding?.secondary_color]);

  // Redirect after login (only if not validating location)
  useEffect(() => {
    if (!authLoading && user && roles.length > 0 && !isValidatingLocation) {
      const isSuperAdminOnly = isSuperAdmin() && roles.length === 1 && roles[0].role === 'superadmin';
      if (isSuperAdminOnly) {
        navigate('/superadmin', { replace: true });
        return;
      }
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, searchParams, isSuperAdmin, roles, isValidatingLocation]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setIsValidatingLocation(true); // Prevent auto-redirect during validation
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        setIsValidatingLocation(false);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu e-mail antes de fazer login');
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Get user data and roles to validate location
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error('Erro ao obter dados do usuário');
        return;
      }

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id);

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_branch_id')
        .eq('id', userData.user.id)
        .single();

      const isSuperAdminUser = userRoles?.some(r => r.role === 'superadmin');
      // Director is admin/manager with no branch assigned (selected_branch_id is null or doesn't exist)
      const isAdminOrManager = userRoles?.some(r => r.role === 'admin' || r.role === 'manager');
      const hasNoBranchAssigned = !profile?.selected_branch_id;
      const isDirectorUser = isAdminOrManager && hasNoBranchAssigned && !isSuperAdminUser;
      const isGeneralAccessUser = isSuperAdminUser || isDirectorUser;

      // Validate location selection
      if (selectedLocation === 'geral') {
        // User selected "Geral" but is not superadmin or director
        if (!isGeneralAccessUser) {
          toast.error('Acesso negado. Selecione sua filial para fazer login.');
          setIsValidatingLocation(false);
          await supabase.auth.signOut();
          return;
        }
      } else {
        // User selected a branch
        if (isSuperAdminUser && !isDirectorUser) {
          // Pure superadmin should use "Geral"
          toast.error('SuperAdmin deve acessar pelo local "Geral".');
          setIsValidatingLocation(false);
          await supabase.auth.signOut();
          return;
        }

        // For regular users, validate they have access to the selected branch
        if (!isGeneralAccessUser) {
          // Check if the user is assigned to this branch
          const userBranchId = profile?.selected_branch_id;
          
          // Fetch employee to check branch assignment
          const { data: employee } = await supabase
            .from('employees')
            .select('branch_id')
            .eq('user_id', userData.user.id)
            .maybeSingle();

          const assignedBranchId = employee?.branch_id || userBranchId;
          
          if (assignedBranchId && assignedBranchId !== selectedLocation) {
            toast.error('Local incorreto. Selecione a filial correta para seu acesso.');
            setIsValidatingLocation(false);
            await supabase.auth.signOut();
            return;
          }
        }
      }

      // Save selected branch to user profile
      if (selectedLocation !== 'geral') {
        await supabase
          .from('profiles')
          .update({ selected_branch_id: selectedLocation })
          .eq('id', userData.user.id);
      } else {
        // Clear branch selection for general access
        await supabase
          .from('profiles')
          .update({ selected_branch_id: null })
          .eq('id', userData.user.id);
      }

      // Refetch user data to update the selectedBranch in AuthContext
      await refetchUserData();

      toast.success('Login realizado com sucesso!');
      // Allow redirect to proceed
      setIsValidatingLocation(false);
    } catch (error) {
      toast.error('Erro ao fazer login. Tente novamente.');
      setIsValidatingLocation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading until page is ready (branding + background loaded)
  if (authLoading || !isPageReady) {
    return <PageLoading text="Carregando" size="lg" />;
  }

  const primaryColor = branding?.primary_color || '#3b82f6';
  const secondaryColor = branding?.secondary_color || '#1e40af';

  return (
    <div 
      className="min-h-screen flex items-center justify-center overflow-hidden relative px-4 py-8"
      style={{
        backgroundImage: branding?.background_url 
          ? `url(${branding.background_url})` 
          : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`,
        backgroundSize: branding?.background_url ? 'cover' : '200% 200%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        animation: branding?.background_url ? 'none' : 'gradientShift 8s ease infinite',
      }}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 text-white/80 hover:text-white hover:bg-white/10 hidden sm:flex"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Floating Elements - Hidden on mobile */}
      <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-24 h-24 bg-white/10 rounded-full floating blur-sm" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-white/10 rounded-full floating-slow blur-sm" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-white/10 rounded-full floating" style={{ animationDelay: '2s' }} />
        <Sparkles className="absolute top-20 right-1/3 w-10 h-10 text-white/20 floating" />
        <Zap className="absolute bottom-20 left-1/3 w-8 h-8 text-white/20 floating-slow" />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        {/* Mobile Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="sm:hidden mb-4 text-white/80 hover:text-white hover:bg-white/10 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            {branding?.logo_url ? (
              <img 
                src={branding.logo_url} 
                alt={branding.name} 
                className="h-16 sm:h-20 w-auto cursor-pointer hover:scale-105 transition-all duration-300"
              />
            ) : (
              <div className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-wider">
                  {branding?.name || 'SISTEMA'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden hover:bg-white/15 transition-all duration-300">
          {/* Card Header */}
          <div className="p-6 sm:p-8 pb-0">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-sm sm:text-base text-white/70">
                Entre com suas credenciais para acessar
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 pt-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-white">
                  E-mail
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 group-focus-within:text-white transition-colors" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    data-auth-input
                    className="pl-12 h-12 !bg-slate-800 !text-white border-white/30 placeholder:!text-white/50 focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-300">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-white">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 group-focus-within:text-white transition-colors" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    data-auth-input
                    className="pl-12 h-12 !bg-slate-800 !text-white border-white/30 placeholder:!text-white/50 focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-300">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-white">
                  Local
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70 z-10 pointer-events-none" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger 
                      id="location"
                      className="pl-12 h-12 !bg-slate-800 !text-white border-white/30 focus:border-white/60 focus:ring-2 focus:ring-white/30 transition-all [&>span]:text-white"
                    >
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/30">
                      <SelectItem value="geral" className="text-white hover:bg-white/10 focus:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">★</span>
                          <span>Geral (SuperAdmin / Diretor)</span>
                        </div>
                      </SelectItem>
                      {branches.map((branch) => (
                        <SelectItem 
                          key={branch.id} 
                          value={branch.id}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-white/70" />
                            <span>{branch.name}</span>
                            {branch.is_main && (
                              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Matriz</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold transition-all duration-200"
                disabled={isSubmitting || isLoadingBranches}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floating-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .floating { animation: floating 6s ease-in-out infinite; }
        .floating-slow { animation: floating-slow 8s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
