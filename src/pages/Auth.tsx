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
        }
        setIsPageReady(true);
      } catch (error) {
        console.error('Error fetching data:', error);
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
  const bgPrimary = '#0f172a';
  const bgSecondary = '#1e293b';

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: bgPrimary }}>
      {/* Background light effects - Always visible */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Main light orbs - always visible */}
        <div 
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 60%)`, opacity: 0.3 }}
        />
        <div 
          className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 60%)`, opacity: 0.25 }}
        />
        
        {/* Secondary floating lights */}
        <div 
          className="absolute top-[30%] right-[25%] w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(circle, #60a5fa 0%, transparent 50%)`, opacity: 0.18 }}
        />
        <div 
          className="absolute bottom-[20%] left-[25%] w-[350px] h-[350px] rounded-full blur-[100px]"
          style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 50%)`, opacity: 0.15 }}
        />
        
        {/* Light beams */}
        <div 
          className="absolute top-0 right-[35%] w-[1px] h-[60%]"
          style={{ background: `linear-gradient(to bottom, ${primaryColor}35, transparent)` }}
        />
        <div 
          className="absolute top-0 left-[45%] w-[1px] h-[40%]"
          style={{ background: `linear-gradient(to bottom, #60a5fa20, transparent)` }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        />

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

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
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col" style={{ backgroundColor: bgSecondary }}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
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
            <span className="font-semibold text-white">{branding?.name || 'Sistema'}</span>
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
                  background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20)`,
                  border: `1px solid ${primaryColor}40`
                }}
              >
                <Lock className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Fazer Login</h2>
              <p className="text-white/60">
                Insira suas credenciais para acessar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium text-white/90">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all rounded-xl"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium text-white/90">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all rounded-xl"
                    {...loginForm.register('password')}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-location" className="text-sm font-medium text-white/90">
                  Local de Acesso
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 z-10 pointer-events-none" />
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                    disabled={isLoadingBranches}
                  >
                    <SelectTrigger 
                      id="login-location"
                      className="pl-12 h-12 bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-white/10 rounded-xl [&>span]:text-white"
                    >
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="geral" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                        Geral (Admin/Diretor)
                      </SelectItem>
                      {branches.map((branch) => (
                        <SelectItem 
                          key={branch.id} 
                          value={branch.id}
                          className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                        >
                          {branch.name} {branch.is_main && '(Matriz)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-medium text-white rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  boxShadow: `0 10px 40px ${primaryColor}30`
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Help text */}
            <p className="mt-8 text-center text-sm text-white/40">
              Problemas para acessar? Entre em contato com o administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
