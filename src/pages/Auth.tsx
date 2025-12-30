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
import { Loader2, Building2, Mail, Lock, MapPin, ArrowLeft, Shield, Zap } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingBranches(true);
      try {
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('id, name, is_main')
          .eq('is_active', true)
          .order('is_main', { ascending: false })
          .order('name');

        if (branchesError) throw branchesError;
        setBranches(branchesData || []);

        const { data: brandingRes, error: brandingError } = await supabase.functions.invoke('get-public-branding');
        if (brandingError) throw brandingError;

        const tenantData = brandingRes?.branding as TenantBranding | null;
        if (tenantData) {
          setBranding(tenantData);
          if (tenantData.primary_color && tenantData.secondary_color) {
            applyThemeColors(tenantData.primary_color, tenantData.secondary_color);
          }
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

  useEffect(() => {
    if (branding?.primary_color && branding?.secondary_color) {
      applyThemeColors(branding.primary_color, branding.secondary_color);
    }
  }, [branding?.primary_color, branding?.secondary_color]);

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

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error('Erro ao obter dados do usuário');
        return;
      }

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_branch_id, branch_id')
        .eq('id', userData.user.id)
        .single();

      const isSuperAdminUser = userRoles?.some(r => r.role === 'superadmin');
      const isAdminOrManager = userRoles?.some(r => r.role === 'admin' || r.role === 'manager');
      const hasNoBranchAssigned = !profile?.branch_id && !profile?.selected_branch_id;
      const isDirectorUser = isAdminOrManager && hasNoBranchAssigned && !isSuperAdminUser;
      const isGeneralAccessUser = isSuperAdminUser || isDirectorUser;

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
          const assignedBranchId = profile?.branch_id;
          
          if (assignedBranchId && assignedBranchId !== selectedLocation) {
            toast.error('Local incorreto. Selecione a filial correta para seu acesso.');
            setIsValidatingLocation(false);
            await supabase.auth.signOut();
            return;
          }
        }
      }

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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          {/* Header */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Voltar ao início</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {branding?.logo_url ? (
                <img src={branding.logo_url} alt={branding.name} className="h-14 w-auto" />
              ) : (
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              )}
              <span className="text-2xl font-bold text-white">{branding?.name || 'Sistema'}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Bem-vindo de volta
            </h1>
            <p className="text-lg xl:text-xl text-white/80 leading-relaxed max-w-lg mb-12">
              Acesse sua conta para gerenciar suas operações de forma eficiente e segura.
            </p>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Acesso Seguro</h3>
                  <p className="text-white/70 text-sm">Seus dados protegidos com criptografia</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Gestão Completa</h3>
                  <p className="text-white/70 text-sm">Todas as ferramentas em um só lugar</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Multi-Filiais</h3>
                  <p className="text-white/70 text-sm">Gerencie todas as unidades facilmente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            © {new Date().getFullYear()} {branding?.name || 'Sistema'}. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt={branding.name} className="h-8 w-auto" />
            ) : (
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Building2 className="w-4 h-4" />
              </div>
            )}
            <span className="font-semibold text-foreground">{branding?.name || 'Sistema'}</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                  border: `1px solid ${primaryColor}30`
                }}
              >
                <Lock className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Fazer Login</h2>
              <p className="text-muted-foreground">
                Insira suas credenciais para acessar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-12 h-12 bg-background border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-background border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-foreground">
                  Local de Acesso
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none" />
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger 
                      id="location"
                      className="pl-12 h-12 bg-background border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                    >
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">
                        Geral (Matriz/Diretoria)
                      </SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
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
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl text-white"
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
                  'Acessar Sistema'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Problemas para acessar? Entre em contato com o administrador.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden p-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {branding?.name || 'Sistema'}
          </p>
        </div>
      </div>
    </div>
  );
}
