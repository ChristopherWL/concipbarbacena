import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, AlertTriangle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { exportRelatorioInventario, exportFichaControleSaidaMaterial, BranchInfo } from '@/lib/exportRelatorioPDF';

export function RelatorioInventario() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const { data: products = [], isLoading } = useProducts();
  const { tenant, selectedBranch } = useAuth();

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'critical') {
        matchesStock = (product.current_stock || 0) <= (product.min_stock || 0);
      } else if (stockFilter === 'low') {
        matchesStock = (product.current_stock || 0) <= (product.min_stock || 0) * 1.5 && 
                       (product.current_stock || 0) > (product.min_stock || 0);
      } else if (stockFilter === 'ok') {
        matchesStock = (product.current_stock || 0) > (product.min_stock || 0) * 1.5;
      } else if (stockFilter === 'zero') {
        matchesStock = (product.current_stock || 0) === 0;
      }
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Zerado</Badge>;
    }
    if (quantity <= minStock) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>;
    }
    if (quantity <= minStock * 1.5) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="h-3 w-3" /> Baixo</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" /> OK</Badge>;
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

  const getCompanyInfo = () => ({
    name: tenant?.name || 'Empresa',
    cnpj: tenant?.cnpj,
    address: tenant?.address,
    city: tenant?.city,
    state: tenant?.state,
    phone: tenant?.phone,
    email: tenant?.email,
  });

  const getBranchInfo = (): BranchInfo | null => {
    if (!selectedBranch) return null;
    return {
      name: selectedBranch.name,
      cnpj: selectedBranch.cnpj || undefined,
      address: selectedBranch.address || undefined,
      number: selectedBranch.number || undefined,
      neighborhood: selectedBranch.neighborhood || undefined,
      city: selectedBranch.city || undefined,
      state: selectedBranch.state || undefined,
      zip_code: selectedBranch.zip_code || undefined,
      phone: selectedBranch.phone || undefined,
      email: selectedBranch.email || undefined,
      logo_url: selectedBranch.logo_url || undefined,
      logo_dark_url: selectedBranch.logo_dark_url || undefined,
    };
  };

  const handleExportPDF = () => {
    exportRelatorioInventario(getCompanyInfo(), filteredProducts, formatCurrency);
  };

  const handleExportFichaSaida = async () => {
    // Export empty form for manual filling
    await exportFichaControleSaidaMaterial(getCompanyInfo(), getBranchInfo(), []);
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Nome', 'Categoria', 'Quantidade', 'Estoque Mín.', 'Status', 'Valor Unit.', 'Valor Total'];
    const rows = filteredProducts.map(p => [
      p.code || '-',
      p.name,
      getCategoryLabel(p.category),
      p.current_stock || 0,
      p.min_stock || 0,
      (p.current_stock || 0) <= (p.min_stock || 0) ? 'Crítico' : 'OK',
      p.cost_price || 0,
      ((p.current_stock || 0) * (p.cost_price || 0)).toFixed(2),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_inventario_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const totalValue = filteredProducts.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.cost_price || 0)), 0);
  const criticalCount = filteredProducts.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Inventário Geral</CardTitle>
            <CardDescription>Situação atual do estoque por produto</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Relatório PDF
            </Button>
            <Button size="sm" onClick={handleExportFichaSaida}>
              <FileText className="h-4 w-4 mr-2" />
              Ficha de Saída
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
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
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Estoque" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="zero">Zerado</SelectItem>
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
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Mín.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-xs">{product.code || '-'}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{product.current_stock || 0}</TableCell>
                      <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                        {product.min_stock || 0}
                      </TableCell>
                      <TableCell>
                        {getStockStatus(product.current_stock || 0, product.min_stock || 0)}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {formatCurrency((product.current_stock || 0) * (product.cost_price || 0))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground pt-2 border-t">
          <span>Total: {filteredProducts.length} produtos</span>
          <div className="flex gap-4">
            {criticalCount > 0 && (
              <span className="text-destructive">⚠️ {criticalCount} em estado crítico</span>
            )}
            <span>Valor em estoque: {formatCurrency(totalValue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
