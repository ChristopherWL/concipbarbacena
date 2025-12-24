import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, Search, AlertTriangle, Shield, Package, 
  MoreVertical, CheckCircle2, Clock, XCircle, Eye, Layers, PackageCheck, Send, ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useStockAudits, StockAuditType, StockAuditStatus, StockAudit } from '@/hooks/useStockAudits';
import { StockAuditDialog } from '@/components/stock/StockAuditDialog';
import { StockAuditDetailsDialog } from '@/components/stock/StockAuditDetailsDialog';
import { BulkWarrantyDialog } from '@/components/stock/BulkWarrantyDialog';
import { BulkWarrantyReturnDialog } from '@/components/stock/BulkWarrantyReturnDialog';
import { InventoryCountDialog } from '@/components/stock/InventoryCountDialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';

const AUDIT_TYPE_CONFIG: Record<StockAuditType, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  defeito: { label: 'Defeito', icon: <AlertTriangle className="w-3 h-3" />, variant: 'secondary' },
  furto: { label: 'Furto', icon: <Shield className="w-3 h-3" />, variant: 'destructive' },
  garantia: { label: 'Garantia', icon: <Package className="w-3 h-3" />, variant: 'default' },
  inventario: { label: 'Inventário', icon: <ClipboardList className="w-3 h-3" />, variant: 'outline' },
  resolucao: { label: 'Resolução', icon: <CheckCircle2 className="w-3 h-3" />, variant: 'default' },
};

const STATUS_CONFIG: Record<StockAuditStatus, { label: string; icon: React.ReactNode; className: string }> = {
  aberto: { label: 'Aberto', icon: <Clock className="w-3 h-3" />, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  em_analise: { label: 'Em Análise', icon: <Eye className="w-3 h-3" />, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  enviado: { label: 'Enviado', icon: <Send className="w-3 h-3" />, className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  recebido: { label: 'Recebido', icon: <PackageCheck className="w-3 h-3" />, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  resolvido: { label: 'Resolvido', icon: <CheckCircle2 className="w-3 h-3" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelado: { label: 'Cancelado', icon: <XCircle className="w-3 h-3" />, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

export default function AuditoriaEstoque() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkReturnDialogOpen, setBulkReturnDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<StockAudit | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<StockAuditType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StockAuditStatus | 'all'>('all');

  const { data: audits, isLoading } = useStockAudits({
    audit_type: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const filteredAudits = audits?.filter(audit => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      audit.product?.name?.toLowerCase().includes(searchLower) ||
      audit.product?.code?.toLowerCase().includes(searchLower) ||
      audit.description?.toLowerCase().includes(searchLower) ||
      audit.serial_number?.serial_number?.toLowerCase().includes(searchLower)
    );
  });

  const openDetails = (audit: StockAudit) => {
    setSelectedAudit(audit);
    setDetailsDialogOpen(true);
  };

  // Stats
  const stats = {
    total: audits?.length || 0,
    abertos: audits?.filter(a => a.status === 'aberto').length || 0,
    defeitos: audits?.filter(a => a.audit_type === 'defeito').length || 0,
    furtos: audits?.filter(a => a.audit_type === 'furto').length || 0,
    garantias: audits?.filter(a => a.audit_type === 'garantia').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <PageHeader 
          title="Auditoria de Estoque" 
          description="Controle de itens com defeito, furtados e em garantia"
        />
        
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setInventoryDialogOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-1 sm:mr-2" />
            Inventário
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkReturnDialogOpen(true)}>
            <PackageCheck className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Receber</span> Garantia
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)}>
            <Layers className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Enviar</span> Garantia
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nova</span> Ocorrência
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.abertos}</div>
              <p className="text-xs text-muted-foreground">Em Aberto</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-2xl font-bold">{stats.defeitos}</span>
              </div>
              <p className="text-xs text-muted-foreground">Defeitos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-2xl font-bold">{stats.furtos}</span>
              </div>
              <p className="text-xs text-muted-foreground">Furtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-bold">{stats.garantias}</span>
              </div>
              <p className="text-xs text-muted-foreground">Garantias</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto, código ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as StockAuditType | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="defeito">Defeito</SelectItem>
                  <SelectItem value="furto">Furto</SelectItem>
                  <SelectItem value="garantia">Garantia</SelectItem>
                  <SelectItem value="inventario">Inventário</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StockAuditStatus | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton columns={6} rows={5} />
            ) : filteredAudits?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ocorrência encontrada
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-border">
                  {filteredAudits?.map((audit) => {
                    const typeConfig = AUDIT_TYPE_CONFIG[audit.audit_type];
                    const statusConfig = STATUS_CONFIG[audit.status];
                    return (
                      <div 
                        key={audit.id} 
                        className="p-4 space-y-3 cursor-pointer active:bg-muted/50"
                        onClick={() => openDetails(audit)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{audit.product?.name}</p>
                            <p className="text-xs text-muted-foreground">{audit.product?.code}</p>
                            {audit.serial_number && (
                              <p className="text-xs text-primary">SN: {audit.serial_number.serial_number}</p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetails(audit)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={typeConfig.variant} className="gap-1 text-xs">
                              {typeConfig.icon}
                              {typeConfig.label}
                            </Badge>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Qtd: {audit.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(audit.reported_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAudits?.map((audit) => {
                        const typeConfig = AUDIT_TYPE_CONFIG[audit.audit_type];
                        const statusConfig = STATUS_CONFIG[audit.status];
                        return (
                          <TableRow key={audit.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(audit)}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{audit.product?.name}</p>
                                <p className="text-xs text-muted-foreground">{audit.product?.code}</p>
                                {audit.serial_number && (
                                  <p className="text-xs text-primary">SN: {audit.serial_number.serial_number}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={typeConfig.variant} className="gap-1">
                                {typeConfig.icon}
                                {typeConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{audit.quantity}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                                {statusConfig.icon}
                                {statusConfig.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(audit.reported_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openDetails(audit)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <StockAuditDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      <BulkWarrantyDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} />
      
      <BulkWarrantyReturnDialog open={bulkReturnDialogOpen} onOpenChange={setBulkReturnDialogOpen} />
      
      <InventoryCountDialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen} />
      
      {selectedAudit && (
        <StockAuditDetailsDialog 
          open={detailsDialogOpen} 
          onOpenChange={setDetailsDialogOpen}
          audit={selectedAudit}
        />
      )}
    </DashboardLayout>
  );
}
