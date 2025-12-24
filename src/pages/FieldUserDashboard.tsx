import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Package, 
  Wrench, 
  ClipboardList, 
  LogOut, 
  User,
  ChevronRight,
  Sparkles,
  HardHat,
  Building2,
  ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

function QuickAction({ icon: Icon, title, description, onClick, color, gradientFrom, gradientTo }: QuickActionProps) {
  return (
    <Card 
      onClick={onClick}
      className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group active:scale-[0.98]"
    >
      <CardContent className="p-6 flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            boxShadow: `0 4px 20px ${gradientFrom}40`
          }}
        >
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/60">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
      </CardContent>
    </Card>
  );
}

export default function FieldUserDashboard() {
  const navigate = useNavigate();
  const { user, profile, tenant, signOut, selectedBranch } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const primaryColor = tenant?.primary_color || '#3b82f6';

  const quickActions: QuickActionProps[] = [
    {
      icon: ArrowRightLeft,
      title: 'Retirar Material',
      description: 'Solicitar materiais do estoque',
      onClick: () => navigate('/estoque/entrada'),
      color: 'emerald',
      gradientFrom: '#10b981',
      gradientTo: '#059669',
    },
    {
      icon: Wrench,
      title: 'Meus Equipamentos',
      description: 'Ver ferramentas e EPIs sob sua responsabilidade',
      onClick: () => navigate('/cautelas'),
      color: 'blue',
      gradientFrom: '#3b82f6',
      gradientTo: '#2563eb',
    },
    {
      icon: ClipboardList,
      title: 'Minhas O.S.',
      description: 'Ver ordens de serviço atribuídas',
      onClick: () => navigate('/os'),
      color: 'violet',
      gradientFrom: '#8b5cf6',
      gradientTo: '#7c3aed',
    },
    {
      icon: HardHat,
      title: 'Diário de Obras',
      description: 'Registrar atividades do dia',
      onClick: () => navigate('/diario-obras'),
      color: 'amber',
      gradientFrom: '#f59e0b',
      gradientTo: '#d97706',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <Sparkles className="absolute top-20 right-20 w-6 h-6 text-white/10 animate-pulse hidden lg:block" />
      </div>

      <div className="relative min-h-screen flex flex-col safe-area-inset-top safe-area-inset-bottom">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant?.logo_dark_url ? (
                <img src={tenant.logo_dark_url} alt={tenant.name} className="h-8 w-auto" />
              ) : tenant?.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-auto" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{tenant?.name || 'Sistema'}</p>
                {selectedBranch && (
                  <p className="text-xs text-white/50">{selectedBranch.name}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6">
          <div className="max-w-lg mx-auto space-y-6">
            {/* User Welcome Card */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-white/20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-white/10 text-white text-lg">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-white truncate">
                    Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
                  </p>
                  <p className="text-sm text-white/50">
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider px-1">
                Ações Rápidas
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Bottom Safe Area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
