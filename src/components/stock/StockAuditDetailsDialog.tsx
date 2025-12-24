import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, Shield, Package, Clock, CheckCircle2, 
  XCircle, Eye, Loader2, Calendar, FileText, RotateCcw, Send, PackageCheck, ClipboardList, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StockAudit, StockAuditType, StockAuditStatus, useCreateStockAudit } from '@/hooks/useStockAudits';

const AUDIT_TYPE_CONFIG: Record<StockAuditType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  defeito: { label: 'Defeito', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-500' },
  furto: { label: 'Furto', icon: <Shield className="w-5 h-5" />, color: 'text-red-500', bgColor: 'bg-red-500' },
  garantia: { label: 'Garantia', icon: <Package className="w-5 h-5" />, color: 'text-blue-500', bgColor: 'bg-blue-500' },
  inventario: { label: 'Inventário', icon: <ClipboardList className="w-5 h-5" />, color: 'text-purple-500', bgColor: 'bg-purple-500' },
  resolucao: { label: 'Resolução', icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-500', bgColor: 'bg-green-500' },
};

const STATUS_CONFIG: Record<StockAuditStatus, { label: string; icon: React.ReactNode; className: string }> = {
  aberto: { label: 'Aberto', icon: <Clock className="w-4 h-4" />, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  em_analise: { label: 'Em Análise', icon: <Eye className="w-4 h-4" />, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  enviado: { label: 'Enviado', icon: <Send className="w-4 h-4" />, className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  recebido: { label: 'Recebido', icon: <PackageCheck className="w-4 h-4" />, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  resolvido: { label: 'Resolvido', icon: <CheckCircle2 className="w-4 h-4" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelado: { label: 'Cancelado', icon: <XCircle className="w-4 h-4" />, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

interface StockAuditDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: StockAudit;
}

export function StockAuditDetailsDialog({ open, onOpenChange, audit }: StockAuditDetailsDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [returnToStock, setReturnToStock] = useState(false);
  const createAudit = useCreateStockAudit();

  const typeConfig = AUDIT_TYPE_CONFIG[audit.audit_type];
  const statusConfig = STATUS_CONFIG[audit.status];

  const canResolve = audit.status !== 'resolvido' && audit.status !== 'cancelado' && audit.audit_type !== 'resolucao';
  const isWarranty = audit.audit_type === 'garantia';

  const handleCreateResolution = async () => {
    await createAudit.mutateAsync({
      product_id: audit.product_id,
      serial_number_id: audit.serial_number_id,
      audit_type: 'resolucao',
      quantity: returnToStock ? audit.quantity : 0,
      description: resolutionNotes || `Resolução da ocorrência de ${typeConfig.label.toLowerCase()}`,
      parent_audit_id: audit.id,
      status: 'resolvido',
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-4 flex items-center justify-between flex-shrink-0 ${typeConfig.bgColor} text-white`}>
        <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
          {typeConfig.icon}
          Detalhes da Ocorrência
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Status and Type */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.className}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <Badge variant="outline" className="text-sm">
              {typeConfig.label}
            </Badge>
          </div>

          <Separator />

          {/* Parent Audit Reference */}
          {audit.parent_audit && (
            <div className="p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-medium">Resolução de ocorrência anterior</p>
              <p className="text-xs text-muted-foreground">
                {AUDIT_TYPE_CONFIG[audit.parent_audit.audit_type]?.label} - {format(new Date(audit.parent_audit.reported_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-lg">{audit.product?.name}</p>
                <p className="text-sm text-muted-foreground">Código: {audit.product?.code}</p>
                {audit.serial_number && (
                  <p className="text-sm text-primary font-mono mt-1">
                    Série: {audit.serial_number.serial_number}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Quantidade: {audit.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm">
                  Registrado em {format(new Date(audit.reported_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                {audit.resolved_at && (
                  <p className="text-sm text-green-600 mt-1">
                    Resolvido em {format(new Date(audit.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <Label className="text-base">Descrição</Label>
            </div>
            <p className="text-sm bg-muted/50 p-4 rounded-lg">{audit.description}</p>
          </div>

          {/* Resolution Form */}
          {canResolve && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="space-y-2">
                <Label className="text-base">Registrar Resolução</Label>
                <Textarea
                  placeholder="Descreva como o problema foi resolvido..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              {(isWarranty || audit.audit_type === 'defeito') && (
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="returnToStock" 
                    checked={returnToStock}
                    onCheckedChange={(checked) => setReturnToStock(checked as boolean)}
                  />
                  <label 
                    htmlFor="returnToStock" 
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Retornar item ao estoque (repor quantidade)
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Resolution Notes (for resolved) */}
          {audit.resolution_notes && (
            <div className="space-y-2">
              <Label className="text-base">Notas de Resolução</Label>
              <p className="text-sm bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-800 dark:text-green-300">
                {audit.resolution_notes}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="flex items-center gap-3 p-4 border-t bg-background">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="flex-1 h-12"
        >
          Fechar
        </Button>
        {canResolve && (
          <Button 
            onClick={handleCreateResolution} 
            disabled={createAudit.isPending}
            className="flex-1 h-12"
          >
            {createAudit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Registrar Resolução
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}