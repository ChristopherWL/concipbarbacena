import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, PackageCheck, AlertTriangle } from 'lucide-react';
import { useStockAudits, useUpdateStockAudit, StockAudit } from '@/hooks/useStockAudits';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';

interface BulkWarrantyReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkWarrantyReturnDialog({ open, onOpenChange }: BulkWarrantyReturnDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: audits } = useStockAudits({ audit_type: 'garantia' });
  const updateAudit = useUpdateStockAudit();

  const pendingWarranties = audits?.filter(
    a => a.audit_type === 'garantia' && a.status !== 'resolvido' && a.status !== 'cancelado'
  ) || [];

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.length === pendingWarranties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingWarranties.map(a => a.id));
    }
  }, [selectedIds.length, pendingWarranties]);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um item');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      for (const id of selectedIds) {
        const audit = pendingWarranties.find(a => a.id === id);
        if (audit) {
          await updateAudit.mutateAsync({
            id: audit.id,
            status: 'recebido',
            resolution_notes: 'Item recebido da garantia (processamento em lote)',
            return_to_stock: true,
            quantity: audit.quantity,
            product_id: audit.product_id,
            serial_number_id: audit.serial_number_id,
          });
        }
      }
      
      toast.success(`${selectedIds.length} itens recebidos da garantia com sucesso`);
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao processar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  // Step 1: Selection
  const step1Content = (
    <div className="space-y-4">
      {pendingWarranties.length === 0 ? (
        <div className="p-8 text-center">
          <PackageCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhum Item Pendente</p>
          <p className="text-muted-foreground">Não há itens pendentes em garantia</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} de {pendingWarranties.length} selecionados
            </span>
            <Button type="button" variant="outline" size="sm" onClick={selectAll}>
              {selectedIds.length === pendingWarranties.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-3 space-y-2">
              {pendingWarranties.map((audit) => (
                <div 
                  key={audit.id}
                  className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(audit.id) 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'border border-border hover:bg-muted/50'
                  }`}
                  onClick={() => toggleItem(audit.id)}
                >
                  <Checkbox 
                    checked={selectedIds.includes(audit.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{audit.product?.name}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(audit.reported_at), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{audit.product?.code}</p>
                    {audit.serial_number && (
                      <p className="text-sm text-primary font-mono">SN: {audit.serial_number.serial_number}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {audit.description}
                    </p>
                  </div>
                  <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                    {audit.quantity}x
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedIds.length === 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Selecione pelo menos um item para receber
            </p>
          )}
        </>
      )}
    </div>
  );

  // Step 2: Confirmation
  const step2Content = (
    <div className="space-y-4">
      <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
        <PackageCheck className="w-16 h-16 mx-auto text-emerald-600 mb-4" />
        <p className="text-lg font-medium text-emerald-800 dark:text-emerald-300">
          {selectedIds.length} item(ns) serão recebidos
        </p>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Os itens serão devolvidos ao estoque automaticamente
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Itens selecionados:</p>
        <ScrollArea className="h-[200px] border rounded-lg">
          <div className="p-3 space-y-2">
            {selectedIds.map(id => {
              const audit = pendingWarranties.find(a => a.id === id);
              if (!audit) return null;
              return (
                <div key={id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <p className="text-sm font-medium">{audit.product?.name}</p>
                    {audit.serial_number && (
                      <p className="text-xs text-muted-foreground font-mono">
                        SN: {audit.serial_number.serial_number}
                      </p>
                    )}
                  </div>
                  <span className="text-sm">{audit.quantity}x</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  const wizardSteps: WizardStep[] = pendingWarranties.length === 0
    ? [{ id: 'empty', title: 'Itens', content: step1Content }]
    : [
        { id: 'selection', title: 'Selecionar Itens', content: step1Content },
        { id: 'confirm', title: 'Confirmação', content: step2Content },
      ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0 bg-emerald-600 text-white">
        <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
          <PackageCheck className="w-5 h-5" />
          Receber Garantia em Lote
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Wizard */}
      <MobileFormWizard
        steps={wizardSteps}
        onComplete={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isSubmitting={isSubmitting}
        submitLabel={pendingWarranties.length === 0 ? 'Fechar' : `Receber ${selectedIds.length} Itens`}
        className="flex-1 min-h-0"
      />
    </div>,
    document.body
  );
}
