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
import { Loader2, Building2, Mail, Lock, MapPin, ArrowLeft } from 'lucide-react';
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

  // Futuristic theme colors
  const theme = {
    primaryBlue: '#00d4ff',
    secondaryPurple: '#7c3aed',
    darkBg: '#0a0a0f',
    cardBg: 'rgba(255, 255, 255, 0.03)',
    glassEffect: 'rgba(255, 255, 255, 0.05)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    borderGlow: 'rgba(0, 212, 255, 0.3)',
    gradientPrimary: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
    gradientButton: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ 
        backgroundColor: theme.darkBg,
        fontFamily: "'Inter', 'Segoe UI', sans-serif"
      }}
    >
      {/* Subtle Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: `radial-gradient(circle, ${theme.primaryBlue} 0%, transparent 60%)`, opacity: 0.12 }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[180px]"
          style={{ background: `radial-gradient(circle, ${theme.secondaryPurple} 0%, transparent 60%)`, opacity: 0.1 }}
        />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-4 sm:mx-auto">
        {/* Back link */}
        <div className="mb-6 flex justify-start">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all group text-sm"
            style={{ 
              color: theme.textSecondary,
              background: theme.glassEffect,
              border: `1px solid rgba(255,255,255,0.08)`
            }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar ao início
          </Link>
        </div>

        {/* Glass Card */}
        <div 
          className="p-8 sm:p-10 rounded-3xl"
          style={{
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.borderGlow}`,
            boxShadow: `0 0 60px ${theme.primaryBlue}08`
          }}
        >
          {/* Logo / Icon */}
          <div className="flex flex-col items-center mb-8">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt={branding.name} className="h-16 w-auto mb-4" />
            ) : (
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ 
                  background: theme.gradientPrimary,
                  boxShadow: `0 0 30px ${theme.primaryBlue}30`
                }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <h2 className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
              Fazer Login
            </h2>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              Insira suas credenciais para acessar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm" style={{ color: theme.textSecondary }}>
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-11 h-12 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    color: theme.textPrimary,
                  }}
                  {...loginForm.register('email')}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm" style={{ color: theme.textSecondary }}>
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: theme.textMuted }} />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-11 h-12 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    color: theme.textPrimary,
                  }}
                  {...loginForm.register('password')}
                />
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-location" className="text-sm" style={{ color: theme.textSecondary }}>
                Local de Acesso
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 z-10 pointer-events-none" style={{ color: theme.textMuted }} />
                <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={isLoadingBranches}>
                  <SelectTrigger 
                    id="login-location"
                    className="pl-11 h-12 rounded-xl [&>span]:text-white"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid rgba(255,255,255,0.1)`,
                      color: theme.textPrimary,
                    }}
                  >
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent 
                    className="rounded-xl border-0"
                    style={{
                      background: '#1a1a2e',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${theme.borderGlow}`,
                    }}
                  >
                    <SelectItem value="geral" className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg">
                      Geral (Admin/Diretor)
                    </SelectItem>
                    {branches.map((branch) => (
                      <SelectItem 
                        key={branch.id} 
                        value={branch.id}
                        className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg"
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
              className="w-full h-12 text-base font-semibold text-white rounded-xl transition-all duration-200 hover:brightness-110 disabled:opacity-50 mt-2"
              style={{ 
                background: theme.gradientButton,
                boxShadow: `0 8px 30px ${theme.primaryBlue}25`
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
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: theme.textMuted }}>
          Problemas para acessar? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}
