import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, UsersRound, TrendingUp, Loader2 } from 'lucide-react';

interface Stats {
  totalBranches: number;
  activeBranches: number;
  totalTeams: number;
  totalUsers: number;
}

export function SuperAdminOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: async (): Promise<Stats> => {
      // Fetch branches count
      const { count: totalBranches } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true });

      const { count: activeBranches } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch teams count
      const { count: totalTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      // Fetch users count (via edge function)
      const { data: usersResult } = await supabase.functions.invoke('get-tenant-users');
      const totalUsers = usersResult?.users?.length || 0;

      return {
        totalBranches: totalBranches || 0,
        activeBranches: activeBranches || 0,
        totalTeams: totalTeams || 0,
        totalUsers,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Filiais',
      value: stats?.totalBranches || 0,
      subtitle: `${stats?.activeBranches || 0} ativas`,
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Equipes',
      value: stats?.totalTeams || 0,
      subtitle: 'cadastradas',
      icon: UsersRound,
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Usuários',
      value: stats?.totalUsers || 0,
      subtitle: 'no sistema',
      icon: Users,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Taxa de Ocupação',
      value: stats?.totalBranches ? Math.round((stats.activeBranches / stats.totalBranches) * 100) : 0,
      subtitle: '% filiais ativas',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Visão Geral do Sistema</h3>
        <p className="text-sm text-white/50">Estatísticas e indicadores principais</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/50 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/40 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/70">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-white/50">
            Use as abas acima para gerenciar filiais, equipes e usuários do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
