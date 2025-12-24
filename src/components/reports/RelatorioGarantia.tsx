import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SerialWithProduct {
  id: string;
  serial_number: string;
  warranty_expires: string | null;
  purchase_date: string | null;
  status: string;
  product: {
    id: string;
    name: string;
    code: string;
    category: string;
  } | null;
}

export function RelatorioGarantia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { tenant } = useAuth();

  // Fetch serial numbers with warranty info
  const { data: serialNumbers = [], isLoading } = useQuery({
    queryKey: ['serial-numbers-warranty', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('serial_numbers')
        .select(`
          id,
          serial_number,
          warranty_expires,
          purchase_date,
          status,
          product:products(id, name, code, category)
        `)
        .eq('tenant_id', tenant.id)
        .not('warranty_expires', 'is', null)
        .order('warranty_expires', { ascending: true });
      if (error) throw error;
      return (data || []) as SerialWithProduct[];
    },
    enabled: !!tenant?.id,
  });

  const getWarrantyStatus = (warrantyExpires: string | null) => {
    if (!warrantyExpires) return { status: 'none', label: 'Sem garantia', variant: 'outline' as const, days: 0 };
    
    const endDate = new Date(warrantyExpires);
    const today = new Date();
    const daysRemaining = differenceInDays(endDate, today);
    
    if (daysRemaining < 0) {
      return { status: 'expired', label: 'Expirada', variant: 'destructive' as const, days: daysRemaining };
    }
    if (daysRemaining <= 30) {
      return { status: 'expiring', label: `${daysRemaining}d restantes`, variant: 'secondary' as const, days: daysRemaining };
    }
    if (daysRemaining <= 90) {
      return { status: 'warning', label: `${daysRemaining}d restantes`, variant: 'outline' as const, days: daysRemaining };
    }
    return { status: 'valid', label: 'Válida', variant: 'default' as const, days: daysRemaining };
  };

  const filteredSerialNumbers = useMemo(() => {
    return serialNumbers.filter(sn => {
      const matchesSearch = !searchTerm || 
        sn.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sn.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const status = getWarrantyStatus(sn.warranty_expires);
      return matchesSearch && status.status === statusFilter;
    });
  }, [serialNumbers, searchTerm, statusFilter]);

  const exportToCSV = () => {
    const headers = ['Nº Série', 'Produto', 'Categoria', 'Data Compra', 'Vencimento Garantia', 'Status', 'Dias Restantes'];
    const rows = filteredSerialNumbers.map(sn => {
      const status = getWarrantyStatus(sn.warranty_expires);
      return [
        sn.serial_number,
        sn.product?.name || '-',
        sn.product?.category || '-',
        sn.purchase_date ? format(new Date(sn.purchase_date), 'dd/MM/yyyy') : '-',
        sn.warranty_expires ? format(new Date(sn.warranty_expires), 'dd/MM/yyyy') : '-',
        status.label,
        status.days || '-',
      ];
    });
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_garantias_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const expiredCount = filteredSerialNumbers.filter(sn => getWarrantyStatus(sn.warranty_expires).status === 'expired').length;
  const expiringCount = filteredSerialNumbers.filter(sn => getWarrantyStatus(sn.warranty_expires).status === 'expiring').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Controle de Garantias</CardTitle>
            <CardDescription>Acompanhamento de garantias de produtos com número de série</CardDescription>
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
              placeholder="Buscar por número de série ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="valid">Válida</SelectItem>
              <SelectItem value="warning">Próximo ao vencimento</SelectItem>
              <SelectItem value="expiring">Expirando (&lt;30 dias)</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{filteredSerialNumbers.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-600">
              {filteredSerialNumbers.filter(sn => getWarrantyStatus(sn.warranty_expires).status === 'valid').length}
            </p>
            <p className="text-xs text-muted-foreground">Válidas</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
            <p className="text-xs text-muted-foreground">Expirando</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            <p className="text-xs text-muted-foreground">Expiradas</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Série</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Compra</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerialNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum produto com garantia encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSerialNumbers.map((sn) => {
                    const status = getWarrantyStatus(sn.warranty_expires);
                    return (
                      <TableRow key={sn.id}>
                        <TableCell className="font-mono text-xs">{sn.serial_number}</TableCell>
                        <TableCell className="font-medium">{sn.product?.name || '-'}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{sn.product?.category || '-'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {sn.purchase_date 
                            ? format(new Date(sn.purchase_date), 'dd/MM/yy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {sn.warranty_expires 
                            ? format(new Date(sn.warranty_expires), 'dd/MM/yy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            {status.status === 'expired' && <AlertTriangle className="h-3 w-3" />}
                            {status.status === 'expiring' && <Clock className="h-3 w-3" />}
                            {status.status === 'valid' && <CheckCircle className="h-3 w-3" />}
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
