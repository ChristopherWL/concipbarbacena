import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, FileText, Package, Hash, Calendar, MapPin, User } from 'lucide-react';
import { useSerialNumbers } from '@/hooks/useSerialNumbers';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import { SerialNumber, SerialStatus } from '@/types/stock';
import jsPDF from 'jspdf';

export function RelatorioItensInventario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: serialNumbers = [], isLoading } = useSerialNumbers();
  const { tenant, selectedBranch } = useAuth();

  const filteredItems = useMemo(() => {
    return serialNumbers.filter(item => {
      const matchesSearch = !searchTerm || 
        item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.product?.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [serialNumbers, searchTerm, categoryFilter, statusFilter]);

  const getStatusBadge = (status: SerialStatus) => {
    const statusConfig: Record<SerialStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      disponivel: { label: 'Disponível', variant: 'default' },
      em_uso: { label: 'Em Uso', variant: 'secondary' },
      em_manutencao: { label: 'Manutenção', variant: 'outline' },
      descartado: { label: 'Descartado', variant: 'destructive' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      epi: 'EPI',
      epc: 'EPC',
      ferramentas: 'Ferramentas',
      materiais: 'Materiais',
      equipamentos: 'Equipamentos',
    };
    return labels[category] || category;
  };

  // Summary statistics
  const stats = useMemo(() => {
    const byStatus = filteredItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalValue = filteredItems.reduce((acc, item) => {
      return acc + (item.product?.cost_price || 0);
    }, 0);

    return {
      total: filteredItems.length,
      disponivel: byStatus.disponivel || 0,
      em_uso: byStatus.em_uso || 0,
      em_manutencao: byStatus.em_manutencao || 0,
      descartado: byStatus.descartado || 0,
      totalValue,
    };
  }, [filteredItems]);

  const exportToCSV = () => {
    const headers = ['Nº Série', 'Produto', 'Código', 'Categoria', 'Status', 'Localização', 'Atribuído a', 'Data Atribuição', 'Valor Unit.'];
    const rows = filteredItems.map(item => [
      item.serial_number || '-',
      item.product?.name || '-',
      item.product?.code || '-',
      getCategoryLabel(item.product?.category || ''),
      item.status,
      item.location || '-',
      item.assigned_to || '-',
      item.assigned_at ? format(new Date(item.assigned_at), 'dd/MM/yyyy') : '-',
      item.product?.cost_price || 0,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_itens_inventario_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text(tenant?.name || 'Empresa', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Title
    doc.setFontSize(14);
    doc.text('Relatório de Itens do Inventário', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    // Summary
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 95);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo:', 15, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Total de itens: ${stats.total}`, 15, y);
    doc.text(`Disponíveis: ${stats.disponivel}`, 80, y);
    doc.text(`Em uso: ${stats.em_uso}`, 130, y);
    doc.text(`Manutenção: ${stats.em_manutencao}`, 180, y);
    doc.text(`Valor total: ${formatCurrency(stats.totalValue)}`, 230, y);
    y += 10;

    // Table header
    const columns = [
      { header: 'Nº Série', width: 35 },
      { header: 'Produto', width: 55 },
      { header: 'Código', width: 25 },
      { header: 'Categoria', width: 25 },
      { header: 'Status', width: 25 },
      { header: 'Localização', width: 35 },
      { header: 'Atribuído a', width: 35 },
      { header: 'Data', width: 22 },
      { header: 'Valor', width: 25, align: 'right' as const },
    ];

    doc.setFillColor(30, 58, 95);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    let x = 17;
    columns.forEach(col => {
      doc.text(col.header, x, y + 5.5);
      x += col.width;
    });
    y += 10;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(7);

    const pageHeight = doc.internal.pageSize.getHeight();
    
    filteredItems.forEach((item, index) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
        
        // Repeat header on new page
        doc.setFillColor(30, 58, 95);
        doc.rect(15, y, pageWidth - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        
        x = 17;
        columns.forEach(col => {
          doc.text(col.header, x, y + 5.5);
          x += col.width;
        });
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(7);
      }

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 1, pageWidth - 30, 6, 'F');
      }

      x = 17;
      const rowData = [
        (item.serial_number || '-').substring(0, 15),
        (item.product?.name || '-').substring(0, 25),
        (item.product?.code || '-').substring(0, 10),
        getCategoryLabel(item.product?.category || ''),
        item.status,
        (item.location || '-').substring(0, 15),
        (item.assigned_to || '-').substring(0, 15),
        item.assigned_at ? format(new Date(item.assigned_at), 'dd/MM/yy') : '-',
        formatCurrency(item.product?.cost_price || 0),
      ];

      rowData.forEach((text, colIndex) => {
        const col = columns[colIndex];
        if (col.align === 'right') {
          doc.text(text, x + col.width - 2, y + 3, { align: 'right' });
        } else {
          doc.text(text, x, y + 3);
        }
        x += col.width;
      });

      y += 6;
    });

    doc.save(`relatorio_itens_inventario_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Itens do Inventário
            </CardTitle>
            <CardDescription>Controle individual de itens com número de série</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.disponivel}</p>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.em_uso}</p>
            <p className="text-xs text-muted-foreground">Em Uso</p>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.em_manutencao}</p>
            <p className="text-xs text-muted-foreground">Manutenção</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.descartado}</p>
            <p className="text-xs text-muted-foreground">Descartado</p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted-foreground">Valor Total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nº série, produto ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="epi">EPI</SelectItem>
              <SelectItem value="epc">EPC</SelectItem>
              <SelectItem value="ferramentas">Ferramentas</SelectItem>
              <SelectItem value="materiais">Materiais</SelectItem>
              <SelectItem value="equipamentos">Equipamentos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="em_uso">Em Uso</SelectItem>
              <SelectItem value="em_manutencao">Manutenção</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Nº Série
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Produto
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Local
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Atribuído
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {item.serial_number || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.product?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{item.product?.code || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{getCategoryLabel(item.product?.category || '')}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {item.location || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {item.assigned_to || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {item.assigned_at 
                          ? format(new Date(item.assigned_at), 'dd/MM/yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(item.product?.cost_price || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground pt-2 border-t">
          <span>{filteredItems.length} itens encontrados</span>
          <span>Valor total: {formatCurrency(stats.totalValue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
