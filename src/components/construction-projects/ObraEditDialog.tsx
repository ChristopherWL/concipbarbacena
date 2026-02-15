import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Edit } from "lucide-react";
import { Obra } from "@/hooks/useObras";
import { ObraImageUpload } from "./ObraImageUpload";

interface ObraEditDialogProps {
  obra: Obra | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (obra: Partial<Obra> & { id: string; image_url?: string | null }) => void;
  isPending: boolean;
}

export const ObraEditDialog = ({ obra, isOpen, onOpenChange, onSave, isPending }: ObraEditDialogProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    estado: "",
    descricao: "",
    notas: "",
    data_inicio: "",
    previsao_termino: "",
    status: "planejada" as Obra['status'],
    valor_contrato: null as number | null,
    image_url: null as string | null,
  });

  useEffect(() => {
    if (obra && isOpen) {
      setFormData({
        nome: obra.nome || "",
        endereco: obra.endereco || "",
        cidade: obra.cidade || "",
        estado: obra.estado || "",
        descricao: obra.descricao || "",
        notas: obra.notas || "",
        data_inicio: obra.data_inicio || "",
        previsao_termino: obra.previsao_termino || "",
        status: obra.status || "planejada",
        valor_contrato: obra.valor_contrato ?? null,
        image_url: obra.image_url || null,
      });
    }
  }, [obra, isOpen]);

  const handleSave = () => {
    if (!obra) return;
    onSave({
      id: obra.id,
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
              Editar Obra
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da Obra *</Label>
                <Input 
                  id="edit-nome" 
                  placeholder="Ex: Instalação CFTV" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v as Obra['status']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejada">Planejada</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input 
                id="edit-endereco" 
                placeholder="Endereço completo da obra" 
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="edit-cidade">Cidade</Label>
                <Input 
                  id="edit-cidade" 
                  placeholder="Cidade" 
                  value={formData.cidade}
                  onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado</Label>
                <Input 
                  id="edit-estado" 
                  placeholder="UF" 
                  maxLength={2}
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dataInicio">Data de Início</Label>
                <Input 
                  id="edit-dataInicio" 
                  type="date" 
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-previsaoTermino">Previsão de Término</Label>
                <Input 
                  id="edit-previsaoTermino" 
                  type="date" 
                  value={formData.previsao_termino}
                  onChange={(e) => setFormData({...formData, previsao_termino: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valorContrato">Valor do Contrato</Label>
              <Input 
                id="edit-valorContrato" 
                type="number" 
                step="0.01"
                placeholder="R$ 0,00"
                value={formData.valor_contrato || ""}
                onChange={(e) => setFormData({...formData, valor_contrato: e.target.value ? Number(e.target.value) : null})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea 
                id="edit-descricao" 
                placeholder="Descreva os detalhes da obra" 
                rows={2} 
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notas">Notas</Label>
              <Textarea 
                id="edit-notas" 
                placeholder="Observações adicionais" 
                rows={2} 
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
              />
            </div>

            <ObraImageUpload
              currentUrl={formData.image_url}
              onUploadComplete={(url) => setFormData({...formData, image_url: url || null})}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.nome || isPending} className="w-full sm:w-auto">
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
