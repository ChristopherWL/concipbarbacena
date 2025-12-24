import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, LogOut, Building2, Users, LayoutDashboard, UsersRound, Sparkles, Zap, Lock } from 'lucide-react';
import { SuperAdminOverview } from '@/components/super-admin/SuperAdminOverview';
import { SuperAdminBranches } from '@/components/super-admin/SuperAdminBranches';
import { SuperAdminTeams } from '@/components/super-admin/SuperAdminTeams';
import { SuperAdminUsers } from '@/components/super-admin/SuperAdminUsers';
import { toast } from 'sonner';

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isSuperAdmin, signOut } = useAuthContext();

  // Protection: Only superadmin can access
  useEffect(() => {
    if (!authLoading && user) {
      if (!isSuperAdmin()) {
        toast.error('Acesso restrito ao Super Admin');
        navigate('/dashboard', { replace: true });
      }
    } else if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, isSuperAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
          </div>
          <p className="text-white/60 animate-pulse">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <Sparkles className="absolute top-20 right-20 w-6 h-6 text-white/10 animate-pulse hidden lg:block" />
        <Zap className="absolute bottom-32 left-16 w-5 h-5 text-white/10 animate-pulse hidden lg:block" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 safe-area-inset-top">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 rounded-lg blur-md" />
                  <div className="relative p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">SuperAdmin</h1>
                  <p className="text-xs text-white/50 hidden sm:block">Centro de Controle</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">Acesso Total</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleSignOut}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/10 border border-white/10 p-1 h-auto flex-wrap">
              <TabsTrigger 
                value="overview" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 px-4 py-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Geral</span>
              </TabsTrigger>
              <TabsTrigger 
                value="branches" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 px-4 py-2"
              >
                <Building2 className="h-4 w-4" />
                Filiais
              </TabsTrigger>
              <TabsTrigger 
                value="teams" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 px-4 py-2"
              >
                <UsersRound className="h-4 w-4" />
                Equipes
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white text-white/70 px-4 py-2"
              >
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardContent className="p-4 sm:p-6">
                  <SuperAdminOverview />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branches" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardContent className="p-4 sm:p-6">
                  <SuperAdminBranches />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardContent className="p-4 sm:p-6">
                  <SuperAdminTeams />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardContent className="p-4 sm:p-6">
                  <SuperAdminUsers />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
