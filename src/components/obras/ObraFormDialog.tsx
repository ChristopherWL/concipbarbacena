import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, GripVertical } from "lucide-react";
import { Obra } from "@/hooks/useObras";

interface EtapaForm {
  nome: string;
  descricao: string;
  percentual_peso: number;
  data_inicio_prevista: string;
  data_fim_prevista: string;
}

interface ObraFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (obra: Partial<Obra>, etapas: EtapaForm[]) => Promise<void>;
  isPending: boolean;
}

export const ObraFormDialog = ({ isOpen, onOpenChange, onSave, isPending }: ObraFormDialogProps) => {
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
  });

  const [etapas, setEtapas] = useState<EtapaForm[]>([]);
  const [novaEtapa, setNovaEtapa] = useState({
    nome: "",
    descricao: "",
    percentual_peso: 0,
    data_inicio_prevista: "",
    data_fim_prevista: "",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      descricao: "",
      notas: "",
      data_inicio: "",
      previsao_termino: "",
      status: "planejada",
    });
    setEtapas([]);
    setNovaEtapa({
      nome: "",
      descricao: "",
      percentual_peso: 0,
      data_inicio_prevista: "",
      data_fim_prevista: "",
    });
  };

  const handleAddEtapa = () => {
    if (!novaEtapa.nome) return;
    setEtapas([...etapas, novaEtapa]);
    setNovaEtapa({
      nome: "",
      descricao: "",
      percentual_peso: 0,
      data_inicio_prevista: "",
      data_fim_prevista: "",
    });
  };

  const handleRemoveEtapa = (index: number) => {
    setEtapas(etapas.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await onSave(formData, etapas);
    resetForm();
  };

  const totalPeso = etapas.reduce((acc, e) => acc + e.percentual_peso, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] p-0 sm:p-0 bg-transparent shadow-none border-0">
        <div className="bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="bg-primary px-6 pt-6 pb-4 rounded-t-xl flex-shrink-0">
            <DialogTitle className="text-primary-foreground">Cadastrar Nova Obra</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 min-h-0 space-y-6">
            {/* Dados básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados da Obra</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Obra *</Label>
                  <Input 
                    id="nome" 
                    placeholder="Ex: Instalação CFTV" 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  placeholder="Endereço completo da obra" 
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input 
                    id="cidade" 
                    placeholder="Cidade" 
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input 
                    id="estado" 
                    placeholder="UF" 
                    maxLength={2}
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input 
                    id="dataInicio" 
                    type="date" 
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previsaoTermino">Previsão de Término</Label>
                  <Input 
                    id="previsaoTermino" 
                    type="date" 
                    value={formData.previsao_termino}
                    onChange={(e) => setFormData({...formData, previsao_termino: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea 
                  id="descricao" 
                  placeholder="Descreva os detalhes da obra" 
                  rows={2} 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>
            </div>

            {/* Etapas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Etapas da Obra</h3>
                {etapas.length > 0 && (
                  <Badge variant={totalPeso === 100 ? "default" : "secondary"}>
                    Peso total: {totalPeso}%
                  </Badge>
                )}
              </div>

              {/* Lista de etapas adicionadas */}
              {etapas.length > 0 && (
                <div className="space-y-2">
                  {etapas.map((etapa, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                          <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{etapa.nome}</span>
                              {etapa.percentual_peso > 0 && (
                                <Badge variant="outline" className="text-xs">{etapa.percentual_peso}%</Badge>
                              )}
                            </div>
                            {etapa.descricao && (
                              <p className="text-xs text-muted-foreground truncate">{etapa.descricao}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveEtapa(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Form para adicionar nova etapa */}
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome da Etapa</Label>
                      <Input
                        placeholder="Ex: Fundação, Alvenaria..."
                        value={novaEtapa.nome}
                        onChange={(e) => setNovaEtapa({ ...novaEtapa, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Peso (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                        value={novaEtapa.percentual_peso || ""}
                        onChange={(e) => setNovaEtapa({ ...novaEtapa, percentual_peso: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Data Início Prevista</Label>
                      <Input
                        type="date"
                        value={novaEtapa.data_inicio_prevista}
                        onChange={(e) => setNovaEtapa({ ...novaEtapa, data_inicio_prevista: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Data Fim Prevista</Label>
                      <Input
                        type="date"
                        value={novaEtapa.data_fim_prevista}
                        onChange={(e) => setNovaEtapa({ ...novaEtapa, data_fim_prevista: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição (opcional)</Label>
                    <Input
                      placeholder="Detalhes da etapa"
                      value={novaEtapa.descricao}
                      onChange={(e) => setNovaEtapa({ ...novaEtapa, descricao: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddEtapa}
                    disabled={!novaEtapa.nome}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Etapa
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.nome || isPending} className="w-full sm:w-auto">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Obra
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
