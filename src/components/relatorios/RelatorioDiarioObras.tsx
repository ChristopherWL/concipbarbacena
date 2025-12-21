import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useObras } from '@/hooks/useObras';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function RelatorioDiarioObras() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [obraFilter, setObraFilter] = useState<string>('all');
  const { tenant } = useAuth();
  const { obras } = useObras();
  const navigate = useNavigate();

  const { data: diarios = [], isLoading } = useQuery({
    queryKey: ['diario-obras-report', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('diario_obras')
        .select(`
          *,
          obra:obras(id, nome)
        `)
        .eq('tenant_id', tenant.id)
        .order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const filteredDiarios = useMemo(() => {
    return diarios.filter(diario => {
      const matchesSearch = !searchTerm || 
        diario.obra?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        diario.atividades_realizadas?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || diario.status === statusFilter;
      const matchesObra = obraFilter === 'all' || diario.obra_id === obraFilter;
      return matchesSearch && matchesStatus && matchesObra;
    });
  }, [diarios, searchTerm, statusFilter, obraFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      rascunho: { label: 'Rascunho', variant: 'outline' },
      pendente: { label: 'Pendente', variant: 'secondary' },
      validado: { label: 'Validado', variant: 'default' },
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getClimaBadge = (clima: string | null) => {
    if (!clima) return '-';
    const icons: Record<string, string> = {
      ensolarado: '☀️',
      nublado: '☁️',
      chuvoso: '🌧️',
      tempestade: '⛈️',
    };
    return icons[clima] || clima;
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Obra', 'Status', 'Clima Manhã', 'Clima Tarde', 'Equipe', 'Atividades'];
    const rows = filteredDiarios.map(d => [
      format(new Date(d.data), 'dd/MM/yyyy'),
      d.obra?.nome || '-',
      d.status,
      d.clima_manha || '-',
      d.clima_tarde || '-',
      d.equipe_presente || '-',
      d.atividades_realizadas?.replace(/,/g, ';') || '-',
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_diario_obras_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Diário de Obras</CardTitle>
            <CardDescription>Registros diários de todas as obras</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por obra ou atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={obraFilter} onValueChange={setObraFilter}>
            <SelectTrigger className="w-[150px] sm:w-[180px]">
              <SelectValue placeholder="Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as obras</SelectItem>
              {obras.map(obra => (
                <SelectItem key={obra.id} value={obra.id}>{obra.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="validado">Validado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Clima</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Equipe</TableHead>
                  <TableHead className="hidden lg:table-cell">Atividades</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDiarios.map((diario) => (
                    <TableRow key={diario.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(diario.data), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{diario.obra?.nome || '-'}</TableCell>
                      <TableCell>{getStatusBadge(diario.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <span title="Manhã">{getClimaBadge(diario.clima_manha)}</span>
                        {' / '}
                        <span title="Tarde">{getClimaBadge(diario.clima_tarde)}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center">
                        {diario.equipe_presente || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground">
                        {diario.atividades_realizadas || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/relatorio-atualizacao-obra?id=${diario.id}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <div className="text-sm text-muted-foreground pt-2 border-t">
          Total: {filteredDiarios.length} registros
        </div>
      </CardContent>
    </Card>
  );
}
