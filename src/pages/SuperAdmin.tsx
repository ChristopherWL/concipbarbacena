import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, LogOut, Settings, Palette, Building, Building2, Users, ChevronRight, Sparkles, Zap, Lock, KeyRound } from 'lucide-react';
import { CompanyDataPanel } from '@/components/super-admin/CompanyDataPanel';
import { SystemModulesPanel } from '@/components/super-admin/SystemModulesPanel';
import { ThemePanel } from '@/components/super-admin/ThemePanel';
import { BranchesPanel } from '@/components/super-admin/BranchesPanel';
import { UserManagementPanel } from '@/components/super-admin/UserManagementPanel';
import { AccessManagementPanel } from '@/components/super-admin/AccessManagementPanel';
import { cn } from '@/lib/utils';

type PanelType = 'company' | 'branches' | 'modules' | 'users' | 'access' | 'theme';

const menuItems: { id: PanelType; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Dados da Empresa', description: 'Informações gerais e branding', icon: Building },
  { id: 'branches', label: 'Filiais', description: 'Gerenciar unidades', icon: Building2 },
  { id: 'modules', label: 'Módulos e Páginas', description: 'Funcionalidades do sistema', icon: Settings },
  { id: 'users', label: 'Usuários e Permissões', description: 'Controle de acesso', icon: Users },
  { id: 'access', label: 'Gestão de Acessos', description: 'Cargos, filiais e equipes', icon: KeyRound },
  { id: 'theme', label: 'Tema e Aparência', description: 'Personalização visual', icon: Palette },
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isSuperAdmin, signOut, tenant } = useAuthContext();
  const [activePanel, setActivePanel] = useState<PanelType>('company');

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin())) {
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

  const renderPanel = () => {
    switch (activePanel) {
      case 'company':
        return <CompanyDataPanel />;
      case 'branches':
        return <BranchesPanel />;
      case 'modules':
        return <SystemModulesPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'access':
        return <AccessManagementPanel />;
      case 'theme':
        return <ThemePanel />;
      default:
        return <CompanyDataPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <Sparkles className="absolute top-20 right-20 w-6 h-6 text-white/10 animate-pulse hidden lg:block" />
        <Zap className="absolute bottom-32 left-16 w-5 h-5 text-white/10 animate-pulse hidden lg:block" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-3 py-2 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">SuperAdmin</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {/* Mobile Tabs */}
          <div className="grid grid-cols-6 gap-1.5 mt-2">
            {menuItems.map((item) => {
              const isActive = activePanel === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-md text-[10px] font-medium transition-all",
                    isActive 
                      ? "bg-primary text-white" 
                      : "bg-white/10 text-white/60 active:bg-white/20"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate w-full text-center">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-80 bg-white/5 backdrop-blur-xl border-r border-white/10 flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 rounded-xl blur-md" />
                  <div className="relative p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">SuperAdmin</h1>
                  <p className="text-xs text-white/50">Configuração do Sistema</p>
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

          {/* User Info */}
          <div className="p-4 mx-4 mt-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">Acesso Total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">Menu</p>
            {menuItems.map((item) => {
              const isActive = activePanel === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group",
                    isActive 
                      ? "bg-primary/20 text-white border border-primary/30" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive ? "bg-primary text-white" : "bg-white/10 group-hover:bg-white/20"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className={cn(
                      "text-xs truncate",
                      isActive ? "text-white/60" : "text-white/40"
                    )}>
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    isActive ? "text-primary rotate-90" : "text-white/30 group-hover:text-white/50"
                  )} />
                </button>
              );
            })}
          </nav>

        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Content Area */}
          <div className="flex-1 p-3 sm:p-4 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {/* Panel Title - Centered */}
              <div className="mb-3 sm:mb-4 lg:mb-6 text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {menuItems.find(m => m.id === activePanel)?.label}
                </h2>
                <p className="text-xs sm:text-sm text-white/50 mt-1">
                  {menuItems.find(m => m.id === activePanel)?.description}
                </p>
              </div>

              {/* Panel Content */}
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  {renderPanel()}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
