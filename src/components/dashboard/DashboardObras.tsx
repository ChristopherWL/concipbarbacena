import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HardHat, Calendar, MapPin, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, Users, DollarSign
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

export function DashboardObras() {
  const navigate = useNavigate();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['obras-dashboard-stats', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return null;

      let obrasQuery = supabase
        .from('obras')
        .select('*, customers(name)')
        .eq('tenant_id', tenant.id);

      let diarioQuery = supabase
        .from('diario_obras')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('data', { ascending: false })
        .limit(10);

      if (shouldFilter && branchId) {
        obrasQuery = obrasQuery.eq('branch_id', branchId);
        diarioQuery = diarioQuery.eq('branch_id', branchId);
      }

      const [obrasRes, diarioRes] = await Promise.all([
        obrasQuery,
        diarioQuery
      ]);

      const obras = obrasRes.data || [];
      const diarios = diarioRes.data || [];

      const totalObras = obras.length;
      const emAndamento = obras.filter(o => o.status === 'em_andamento').length;
      const concluidas = obras.filter(o => o.status === 'concluida').length;
      const pausadas = obras.filter(o => o.status === 'pausada').length;
      const pendentes = obras.filter(o => o.status === 'pendente').length;

      // Valor total dos contratos
      const valorTotal = obras.reduce((acc, o) => acc + (o.valor_contrato || 0), 0);

      // Status distribution
      const statusData = [
        { name: 'Em Andamento', value: emAndamento, color: '#3b82f6' },
        { name: 'Concluídas', value: concluidas, color: '#10b981' },
        { name: 'Pausadas', value: pausadas, color: '#f59e0b' },
        { name: 'Pendentes', value: pendentes, color: '#6b7280' },
      ].filter(s => s.value > 0);

      // Progresso médio
      const progressoMedio = obras.length > 0 
        ? Math.round(obras.reduce((acc, o) => acc + (o.progresso || 0), 0) / obras.length)
        : 0;

      // Obras em destaque (em andamento ordenadas por progresso)
      const obrasEmDestaque = obras
        .filter(o => o.status === 'em_andamento')
        .sort((a, b) => (b.progresso || 0) - (a.progresso || 0))
        .slice(0, 5);

      return {
        totalObras,
        emAndamento,
        concluidas,
        pausadas,
        pendentes,
        valorTotal,
        statusData,
        progressoMedio,
        obrasEmDestaque,
        recentDiarios: diarios
      };
    },
    enabled: !!tenant?.id
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'bg-blue-500';
      case 'concluida': return 'bg-emerald-500';
      case 'pausada': return 'bg-amber-500';
      case 'pendente': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'pausada': return 'Pausada';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  const statCards = [
    { 
      label: 'Total de Obras', 
      value: isLoading ? null : stats?.totalObras || 0,
      subtitle: `${stats?.emAndamento || 0} em andamento`,
      icon: HardHat,
      gradient: 'from-orange-500/20 to-orange-500/5',
      iconColor: 'text-orange-500',
    },
    { 
      label: 'Obras Concluídas', 
      value: isLoading ? null : stats?.concluidas || 0,
      subtitle: 'finalizadas',
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    { 
      label: 'Progresso Médio', 
      value: isLoading ? null : `${stats?.progressoMedio || 0}%`,
      subtitle: 'das obras ativas',
      icon: TrendingUp,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Valor em Contratos', 
      value: isLoading ? null : formatCurrency(stats?.valorTotal || 0),
      subtitle: 'total contratado',
      icon: DollarSign,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="obras" />
        </div>
        {/* Status Distribution Panel */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" />
              Status
            </CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : stats?.statusData && stats.statusData.length > 0 ? (
              <div className="space-y-3">
                {stats.statusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma obra cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardHat className="h-5 w-5 text-primary" />
              Status das Obras
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : stats?.statusData && stats.statusData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {stats.statusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma obra cadastrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obras em Destaque */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Obras em Andamento
            </CardTitle>
            <CardDescription>Progresso atual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : stats?.obrasEmDestaque && stats.obrasEmDestaque.length > 0 ? (
              <div className="space-y-4">
                {stats.obrasEmDestaque.map((obra: any) => (
                  <div key={obra.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{obra.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {obra.customers?.name || obra.cidade || 'Sem cliente'}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {obra.progresso || 0}%
                      </Badge>
                    </div>
                    <Progress value={obra.progresso || 0} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma obra em andamento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => navigate('/obras')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <HardHat className="h-6 w-6 text-orange-500" />
              <span className="text-sm font-medium">Ver Obras</span>
            </button>
            <button 
              onClick={() => navigate('/diario-obras')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Calendar className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-medium">Diário</span>
            </button>
            <button 
              onClick={() => navigate('/equipes')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-medium">Equipes</span>
            </button>
            <button 
              onClick={() => navigate('/relatorios')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <span className="text-sm font-medium">Relatórios</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
