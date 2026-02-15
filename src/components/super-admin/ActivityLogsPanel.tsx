import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Search, RefreshCw, User, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  tenant_id: string;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string | null;
  tenant?: { name: string; slug: string } | null;
  profile?: { full_name: string } | null;
}

export function ActivityLogsPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          tenant:tenants(name, slug),
          profile:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data || []) as unknown as ActivityLog[]);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueEntityTypes = [...new Set(logs.map(log => log.entity_type))];
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEntityType = entityTypeFilter === 'all' || log.entity_type === entityTypeFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesEntityType && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('insert')) {
      return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Criação</Badge>;
    }
    if (action.includes('update') || action.includes('edit')) {
      return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Atualização</Badge>;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Exclusão</Badge>;
    }
    if (action.includes('login') || action.includes('auth')) {
      return <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">Autenticação</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const getEntityTypeBadge = (entityType: string) => {
    const colors: Record<string, string> = {
      product: 'bg-orange-500/20 text-orange-700',
      vehicle: 'bg-cyan-500/20 text-cyan-700',
      service_order: 'bg-yellow-500/20 text-yellow-700',
      technician: 'bg-indigo-500/20 text-indigo-700',
      customer: 'bg-pink-500/20 text-pink-700',
      invoice: 'bg-emerald-500/20 text-emerald-700',
      team: 'bg-violet-500/20 text-violet-700',
    };
    return (
      <Badge className={colors[entityType] || 'bg-muted text-muted-foreground'}>
        {entityType}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {uniqueEntityTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Criações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.action.includes('create') || l.action.includes('insert')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.action.includes('update') || l.action.includes('edit')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Exclusões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.action.includes('delete') || l.action.includes('remove')).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Atividade ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de atividade encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {log.created_at 
                            ? format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })
                            : '-'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {log.tenant?.name || log.tenant_id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {log.profile?.full_name || log.user_id?.slice(0, 8) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityTypeBadge(log.entity_type)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.ip_address || '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.details ? JSON.stringify(log.details).slice(0, 50) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
