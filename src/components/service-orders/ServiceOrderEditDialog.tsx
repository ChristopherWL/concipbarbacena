import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Edit } from "lucide-react";
import { ServiceOrder, SERVICE_ORDER_STATUS_LABELS, PRIORITY_LABELS, ServiceOrderStatus, PriorityLevel } from "@/types/serviceOrders";

interface ServiceOrderEditDialogProps {
  order: ServiceOrder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: Partial<ServiceOrder> & { id: string }) => void;
  isPending: boolean;
}

export const ServiceOrderEditDialog = ({ order, isOpen, onOpenChange, onSave, isPending }: ServiceOrderEditDialogProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    priority: "media" as PriorityLevel,
    status: "aberta" as ServiceOrderStatus,
    scheduled_date: "",
    estimated_hours: null as number | null,
    notes: "",
    internal_notes: "",
  });

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title || "",
        description: order.description || "",
        address: order.address || "",
        city: order.city || "",
        state: order.state || "",
        priority: order.priority || "media",
        status: order.status || "aberta",
        scheduled_date: order.scheduled_date || "",
        estimated_hours: order.estimated_hours || null,
        notes: order.notes || "",
        internal_notes: order.internal_notes || "",
      });
    }
  }, [order]);

  const handleSave = () => {
    if (!order) return;
    onSave({
      id: order.id,
      ...formData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
        <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
            <DialogTitle className="text-primary-foreground flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Ordem de Serviço
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-title">Título *</Label>
                <Input 
                  id="edit-title" 
                  placeholder="Descrição breve do serviço" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v as ServiceOrderStatus})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_ORDER_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v) => setFormData({...formData, priority: v as PriorityLevel})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Detalhes do serviço" 
                rows={2} 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input 
                id="edit-address" 
                placeholder="Local do serviço" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input 
                  id="edit-city" 
                  placeholder="Cidade" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado</Label>
                <Input 
                  id="edit-state" 
                  placeholder="UF" 
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-scheduled">Data Agendada</Label>
                <Input 
                  id="edit-scheduled" 
                  type="date" 
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hours">Horas Estimadas</Label>
                <Input 
                  id="edit-hours" 
                  type="number" 
                  step="0.5"
                  placeholder="0"
                  value={formData.estimated_hours || ""}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value ? Number(e.target.value) : null})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea 
                id="edit-notes" 
                placeholder="Notas adicionais" 
                rows={2} 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-internal-notes">Notas Internas</Label>
              <Textarea 
                id="edit-internal-notes" 
                placeholder="Notas internas (não visíveis ao cliente)" 
                rows={2} 
                value={formData.internal_notes}
                onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.title || isPending} className="w-full sm:w-auto">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
