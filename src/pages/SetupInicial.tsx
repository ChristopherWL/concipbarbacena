import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Shield, Lock, Mail, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const setupSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(100),
  confirmPassword: z.string().min(8, 'Confirme a senha').max(100),
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  initToken: z.string().min(1, 'Token de inicialização é obrigatório'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupInicial() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      email: 'superadmin@admin.local',
      password: '@Volluty123',
      confirmPassword: '@Volluty123',
      fullName: 'Super Admin',
      initToken: '',
    },
  });

  const handleSetup = async (data: SetupFormData) => {
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-superadmin', {
        headers: {
          'X-Init-Token': data.initToken,
        },
        body: {
          email: data.email,
          password: data.password,
          full_name: data.fullName,
        },
      });

      if (error) {
        console.error('Setup error:', error);
        toast.error('Erro ao criar superadmin: ' + error.message);
        return;
      }

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Sistema configurado com sucesso! Faça login para continuar.');
      
      // Redirect to auth
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao configurar sistema');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configuração Inicial</h1>
          <p className="text-slate-400">
            Configure o primeiro superadministrador do sistema
          </p>
        </div>

        {/* Warning */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium mb-1">Atenção</p>
            <p className="text-amber-300/80">
              Esta configuração só pode ser feita uma vez. O token de inicialização
              deve ser obtido nas configurações de secrets do backend.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Dados do SuperAdmin</CardTitle>
            <CardDescription className="text-slate-400">
              Este usuário terá acesso completo ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSetup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    {...form.register('fullName')}
                  />
                </div>
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-400">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@empresa.com"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    {...form.register('confirmPassword')}
                  />
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-400">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="initToken" className="text-white">Token de Inicialização</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="initToken"
                    type="password"
                    placeholder="Token secreto"
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    {...form.register('initToken')}
                  />
                </div>
                {form.formState.errors.initToken && (
                  <p className="text-sm text-red-400">{form.formState.errors.initToken.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  O token está configurado na variável SUPERADMIN_INIT_TOKEN do backend
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 mt-6" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Criar SuperAdmin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Após a configuração, você poderá criar empresas e usuários pelo painel SuperAdmin
        </p>
      </div>
    </div>
  );
}
