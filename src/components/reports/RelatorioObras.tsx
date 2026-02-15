import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Download, FileText, MoreHorizontal } from 'lucide-react';
import { useObras } from '@/hooks/useObras';
import { useObraEtapas } from '@/hooks/useObraEtapas';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import { exportRelatorioObras, exportRelatorioObraIndividual } from '@/lib/exportRelatorioPDF';

export function RelatorioObras() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const { obras, isLoading } = useObras();
  const { tenant } = useAuth();
  const { etapas } = useObraEtapas(selectedObraId || '');

  const filteredObras = useMemo(() => {
    return obras.filter(obra => {
      const matchesSearch = !searchTerm || 
        obra.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.cidade?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || obra.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [obras, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      planejada: { label: 'Planejada', className: 'bg-muted text-muted-foreground' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      pausada: { label: 'Pausada', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      concluida: { label: 'Concluída', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    const config = variants[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getCompanyInfo = () => ({
    name: tenant?.name || 'Empresa',
    cnpj: tenant?.cnpj,
    address: tenant?.address,
    city: tenant?.city,
    state: tenant?.state,
    phone: tenant?.phone,
    email: tenant?.email,
  });

  const handleExportPDF = () => {
    exportRelatorioObras(getCompanyInfo(), filteredObras, formatCurrency);
  };

  const handleExportIndividual = async (obra: any) => {
    setSelectedObraId(obra.id);
    // Need to fetch etapas for this specific obra
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: obraEtapas } = await supabase
      .from('obra_etapas')
      .select('*')
      .eq('obra_id', obra.id)
      .order('ordem');
    
    exportRelatorioObraIndividual(getCompanyInfo(), obra, obraEtapas || [], formatCurrency);
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Status', 'Progresso', 'Data Início', 'Previsão Término', 'Cidade', 'Valor Contrato'];
    const rows = filteredObras.map(obra => [
      obra.nome,
      obra.status,
      `${obra.progresso}%`,
      obra.data_inicio ? format(new Date(obra.data_inicio), 'dd/MM/yyyy') : '-',
      obra.previsao_termino ? format(new Date(obra.previsao_termino), 'dd/MM/yyyy') : '-',
      obra.cidade || '-',
      obra.valor_contrato ? formatCurrency(obra.valor_contrato) : '-',
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_obras_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Relatório de Obras</CardTitle>
            <CardDescription>Visão geral de todas as obras cadastradas</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, descrição ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle px-4 sm:px-6">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Obra</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Progresso</TableHead>
                      <TableHead className="min-w-[90px]">Data Início</TableHead>
                      <TableHead className="min-w-[90px]">Previsão</TableHead>
                      <TableHead className="min-w-[100px]">Cidade</TableHead>
                      <TableHead className="text-right min-w-[120px]">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredObras.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhuma obra encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredObras.map((obra) => (
                        <TableRow key={obra.id}>
                          <TableCell className="font-medium whitespace-nowrap">{obra.nome}</TableCell>
                          <TableCell>{getStatusBadge(obra.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={obra.progresso} className="w-16 h-2" />
                              <span className="text-xs text-muted-foreground">{obra.progresso}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {obra.data_inicio 
                              ? format(new Date(obra.data_inicio), 'dd/MM/yy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {obra.previsao_termino 
                              ? format(new Date(obra.previsao_termino), 'dd/MM/yy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {obra.cidade || '-'}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {obra.valor_contrato ? formatCurrency(obra.valor_contrato) : '-'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExportIndividual(obra)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Exportar PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}

        <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>Total: {filteredObras.length} obras</span>
          <span>
            Valor total: {formatCurrency(filteredObras.reduce((acc, o) => acc + (o.valor_contrato || 0), 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
