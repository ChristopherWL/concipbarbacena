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
import { Loader2, Building2, Mail, Lock, Sparkles, MapPin, ArrowRight, Menu, X, Play } from 'lucide-react';
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

// Create a darker version of a color for gradients
const getDarkerGradientColor = (hex: string, primaryHex: string) => {
  const hsl = hexToHSL(hex);
  // If color is too light (lightness > 70%), create a dark version based on primary hue
  if (hsl.l > 70) {
    const primaryHsl = hexToHSL(primaryHex);
    return `hsl(${primaryHsl.h}, ${Math.min(primaryHsl.s + 20, 100)}%, 25%)`;
  }
  return hex;
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Scroll handler for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    setIsValidatingLocation(true);
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
        .select('selected_branch_id, branch_id')
        .eq('id', userData.user.id)
        .single();

      const isSuperAdminUser = userRoles?.some(r => r.role === 'superadmin');
      // Director is admin/manager with no branch assigned
      const isAdminOrManager = userRoles?.some(r => r.role === 'admin' || r.role === 'manager');
      const hasNoBranchAssigned = !profile?.branch_id && !profile?.selected_branch_id;
      const isDirectorUser = isAdminOrManager && hasNoBranchAssigned && !isSuperAdminUser;
      const isGeneralAccessUser = isSuperAdminUser || isDirectorUser;

      // Validate location selection
      if (selectedLocation === 'geral') {
        if (!isGeneralAccessUser) {
          toast.error('Acesso negado. Selecione sua filial para fazer login.');
          setIsValidatingLocation(false);
          await supabase.auth.signOut();
          return;
        }
      } else {
        if (isSuperAdminUser && !isDirectorUser) {
          toast.error('SuperAdmin deve acessar pelo local "Geral".');
          setIsValidatingLocation(false);
          await supabase.auth.signOut();
          return;
        }

        if (!isGeneralAccessUser) {
          // Check if the user is assigned to this branch
          const assignedBranchId = profile?.branch_id;
          
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
        await supabase
          .from('profiles')
          .update({ selected_branch_id: null })
          .eq('id', userData.user.id);
      }

      await refetchUserData();
      toast.success('Login realizado com sucesso!');
      setIsValidatingLocation(false);
    } catch (error) {
      toast.error('Erro ao fazer login. Tente novamente.');
      setIsValidatingLocation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isPageReady) {
    return <PageLoading text="Carregando" size="lg" />;
  }

  const primaryColor = branding?.primary_color || '#3b82f6';
  const secondaryColor = branding?.secondary_color || '#1e40af';
  // For gradients, use a darker version if secondary is too light
  const gradientSecondary = getDarkerGradientColor(secondaryColor, primaryColor);

  // Use dark background colors like GenericLandingPage
  const backgroundGradientFrom = '#020617';
  const backgroundGradientTo = '#0f172a';
  // Light effect color - use a purple/violet like the landing page
  const lightEffectColor = '#8b5cf6';

  return (
    <div 
      className="min-h-screen text-white overflow-hidden relative"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor,
        background: `linear-gradient(135deg, ${backgroundGradientFrom} 0%, ${backgroundGradientTo} 100%)`,
      } as React.CSSProperties}
    >

      {/* Moving Light Focus Effects - Using lightEffectColor */}
      <div 
        className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] sm:w-[35vw] sm:h-[35vw] rounded-full blur-[80px] sm:blur-[120px] animate-float-slow z-[1]"
        style={{ background: lightEffectColor, opacity: 0.25 }}
      />
      <div 
        className="absolute top-[5%] right-[8%] w-[38vw] h-[38vw] sm:w-[32vw] sm:h-[32vw] rounded-full blur-[80px] sm:blur-[120px] animate-float-slower z-[1]"
        style={{ background: lightEffectColor, opacity: 0.2 }}
      />
      <div 
        className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] sm:w-[40vw] sm:h-[40vw] rounded-full blur-[80px] sm:blur-[120px] animate-float-slow z-[1]"
        style={{ background: lightEffectColor, opacity: 0.25 }}
      />
      <div 
        className="absolute top-[50%] left-[40%] w-[50vw] h-[50vw] sm:w-[45vw] sm:h-[45vw] rounded-full blur-[100px] sm:blur-[150px] animate-float-slower z-[1]"
        style={{ background: lightEffectColor, opacity: 0.15 }}
      />

      {/* Drifting Particles */}
      <div className="hidden sm:block absolute top-[20%] left-[20%] w-2 h-2 rounded-full bg-white/20 animate-pulse-slow z-[2]" />
      <div className="hidden sm:block absolute top-[30%] right-[25%] w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse-slow z-[2]" style={{ animationDelay: '1s' }} />
      <div className="hidden md:block absolute top-[60%] left-[15%] w-1 h-1 rounded-full bg-white/20 animate-pulse-slow z-[2]" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt={branding.name} className="h-12 w-auto" />
              ) : (
                <>
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 4px 14px ${primaryColor}40`
                    }}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold text-white hidden sm:block">{branding?.name || 'Sistema'}</span>
                </>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-b border-white/10 mobile-menu-enter">
            <div className="container mx-auto px-4 py-6">
              <Link to="/">
                <Button 
                  className="w-full"
                  variant="outline"
                  style={{ borderColor: `${primaryColor}50`, color: 'white' }}
                >
                  Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Login Form */}
      <section className="relative min-h-screen flex items-start justify-center pt-28 lg:pt-32 pb-12 z-10">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-start max-w-6xl mx-auto">
            {/* Left side - Welcome text */}
            <div className="text-center lg:text-left lg:mt-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-sm mb-8 animate-fade-in-up">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Acesso ao sistema</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up animation-delay-100">
                Bem-vindo de volta
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
                Entre com suas credenciais para acessar o sistema e gerenciar suas operações.
              </p>

              <div className="hidden lg:flex items-center gap-6 animate-fade-in-up animation-delay-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/70">Gestão completa</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/70">Multi-filiais</span>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up animation-delay-200">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl relative overflow-visible">
                {/* Decorative top gradient line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)` }}
                />
                
                {/* Decorative floating dots */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </div>
                
                {/* Card Header - Static, no scroll */}
                <div className="p-6 sm:p-8 pb-4">
                  <div className="text-center">
                    {/* Logo/Icon */}
                    <div 
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)`,
                        border: `1px solid ${primaryColor}40`
                      }}
                    >
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Fazer Login</h2>
                    <p className="text-sm sm:text-base text-white/60 mb-1">
                      Insira seus dados para continuar
                    </p>
                    <p className="text-xs text-white/40">
                      Acesso seguro ao sistema
                    </p>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="mx-6 sm:mx-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Form */}
                <div className="p-6 sm:p-8 pt-4">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium text-white">
                        E-mail
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          data-auth-input
                          className="pl-12 h-12 bg-white/5 text-white border-white/20 placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all rounded-xl"
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
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          data-auth-input
                          className="pl-12 h-12 bg-white/5 text-white border-white/20 placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all rounded-xl"
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
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 z-10 pointer-events-none" />
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                          <SelectTrigger 
                            id="location"
                            className="pl-12 h-12 bg-white/5 text-white border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all rounded-xl [&>span]:text-white"
                          >
                            <SelectValue placeholder="Selecione o local" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/20">
                            <SelectItem value="geral" className="text-white hover:bg-white/10">
                              Geral (Matriz/Diretoria)
                            </SelectItem>
                            {branches.map((branch) => (
                              <SelectItem 
                                key={branch.id} 
                                value={branch.id}
                                className="text-white hover:bg-white/10"
                              >
                                {branch.name} {branch.is_main ? '(Matriz)' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoadingBranches}
                      className="w-full h-12 text-base font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300 rounded-xl text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 4px 14px ${primaryColor}40`
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Acessar Sistema
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Back to home link */}
              <div className="mt-6 text-center">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Voltar para o início</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
