import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, FileText, DollarSign, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, UserCheck, UserX, Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardCalendar } from './DashboardCalendar';
import { StatCardsGrid } from './StatCardsGrid';

export function DashboardRH() {
  const navigate = useNavigate();
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['hr-dashboard-stats', tenant?.id, branchId],
    queryFn: async () => {
      if (!tenant?.id) return null;

      let employeesQuery = supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', tenant.id)
        .not('branch_id', 'is', null); // Only count employees with branch assigned

      let leavesQuery = supabase
        .from('leaves')
        .select('*, employees!inner(name, branch_id)')
        .eq('tenant_id', tenant.id);

      let vacationsQuery = supabase
        .from('vacations')
        .select('*, employees!inner(name, branch_id)')
        .eq('tenant_id', tenant.id);

      let payrollsQuery = supabase
        .from('payrolls')
        .select('*, employees!inner(name, branch_id)')
        .eq('tenant_id', tenant.id);

      if (shouldFilter && branchId) {
        employeesQuery = employeesQuery.eq('branch_id', branchId);
        leavesQuery = leavesQuery.eq('employees.branch_id', branchId);
        vacationsQuery = vacationsQuery.eq('employees.branch_id', branchId);
        payrollsQuery = payrollsQuery.eq('employees.branch_id', branchId);
      } else {
        // When viewing all, exclude employees without branch
        leavesQuery = leavesQuery.not('employees.branch_id', 'is', null);
        vacationsQuery = vacationsQuery.not('employees.branch_id', 'is', null);
        payrollsQuery = payrollsQuery.not('employees.branch_id', 'is', null);
      }

      const [employeesRes, leavesRes, vacationsRes, payrollsRes] = await Promise.all([
        employeesQuery,
        leavesQuery,
        vacationsQuery,
        payrollsQuery
      ]);

      const employees = employeesRes.data || [];
      const leaves = leavesRes.data || [];
      const vacations = vacationsRes.data || [];
      const payrolls = payrollsRes.data || [];

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const activeEmployees = employees.filter(e => e.status === 'ativo').length;
      const inactiveEmployees = employees.filter(e => e.status !== 'ativo').length;
      
      const currentLeaves = leaves.filter(l => {
        const start = parseISO(l.start_date);
        const end = parseISO(l.end_date);
        return isWithinInterval(now, { start, end });
      });

      const pendingVacations = vacations.filter(v => v.status === 'pendente');
      const approvedVacations = vacations.filter(v => v.status === 'aprovada' || v.status === 'em_gozo');

      const currentMonthPayrolls = payrolls.filter(p => 
        p.reference_month === (now.getMonth() + 1) && 
        p.reference_year === now.getFullYear()
      );
      const pendingPayrolls = currentMonthPayrolls.filter(p => p.status === 'pending');

      // Dados por departamento
      const byDepartment: Record<string, number> = {};
      employees.forEach(emp => {
        const dept = emp.department || 'Sem departamento';
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
      });

      const departmentData = Object.entries(byDepartment)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Status distribution
      const statusData = [
        { name: 'Ativos', value: activeEmployees, color: '#10b981' },
        { name: 'Férias', value: approvedVacations.length, color: '#3b82f6' },
        { name: 'Afastados', value: currentLeaves.length, color: '#f59e0b' },
        { name: 'Inativos', value: inactiveEmployees, color: '#ef4444' },
      ].filter(s => s.value > 0);

      return {
        totalEmployees: employees.length,
        activeEmployees,
        inactiveEmployees,
        currentLeaves: currentLeaves.length,
        pendingVacations: pendingVacations.length,
        approvedVacations: approvedVacations.length,
        pendingPayrolls: pendingPayrolls.length,
        departmentData,
        statusData,
        recentLeaves: leaves.slice(0, 5),
        upcomingVacations: vacations.filter(v => v.status === 'aprovada').slice(0, 5)
      };
    },
    enabled: !!tenant?.id
  });

  const statCards = [
    { 
      label: 'Total de Colaboradores', 
      value: isLoading ? null : stats?.totalEmployees || 0,
      subtitle: `${stats?.activeEmployees || 0} ativos`,
      icon: Users,
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    { 
      label: 'Em Afastamento', 
      value: isLoading ? null : stats?.currentLeaves || 0,
      subtitle: 'atestados ativos',
      icon: FileText,
      gradient: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    { 
      label: 'Férias Pendentes', 
      value: isLoading ? null : stats?.pendingVacations || 0,
      subtitle: 'aguardando aprovação',
      icon: Calendar,
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-500',
    },
    { 
      label: 'Folhas Pendentes', 
      value: isLoading ? null : stats?.pendingPayrolls || 0,
      subtitle: 'mês atual',
      icon: DollarSign,
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <StatCardsGrid cards={statCards} isLoading={isLoading} />

      {/* Calendar + Status Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCalendar sector="rh" />
        </div>
        {/* Status Distribution Panel */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
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
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Colaboradores por Departamento
            </CardTitle>
            <CardDescription>Distribuição por área</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : stats?.departmentData && stats.departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.departmentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Status dos Colaboradores
            </CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
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
                <p>Nenhum dado disponível</p>
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
              onClick={() => navigate('/rh')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Users className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Colaboradores</span>
            </button>
            <button 
              onClick={() => navigate('/rh?tab=vacations')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Calendar className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-medium">Férias</span>
            </button>
            <button 
              onClick={() => navigate('/rh?tab=leaves')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <FileText className="h-6 w-6 text-amber-500" />
              <span className="text-sm font-medium">Atestados</span>
            </button>
            <button 
              onClick={() => navigate('/rh?tab=payrolls')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <DollarSign className="h-6 w-6 text-emerald-500" />
              <span className="text-sm font-medium">Folha</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
