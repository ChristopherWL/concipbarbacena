import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  Loader2,
  GripVertical,
} from "lucide-react";
import { useObraEtapas, ObraEtapa } from "@/hooks/useObraEtapas";
import { Skeleton } from "@/components/ui/skeleton";

interface ObraEtapasPanelProps {
  obraId: string;
  obraProgresso: number;
  isReadOnly?: boolean;
}

const statusConfig = {
  pendente: { label: "Pendente", icon: Circle, color: "bg-muted text-muted-foreground" },
  em_andamento: { label: "Em Andamento", icon: PlayCircle, color: "bg-blue-500 text-white" },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "bg-green-500 text-white" },
  pausada: { label: "Pausada", icon: PauseCircle, color: "bg-yellow-500 text-white" },
};

export const ObraEtapasPanel = ({ obraId, obraProgresso, isReadOnly }: ObraEtapasPanelProps) => {
  const { etapas, isLoading, progressoCalculado, createEtapa, updateEtapa, deleteEtapa } = useObraEtapas(obraId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<ObraEtapa | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    percentual_peso: 0,
    data_inicio_prevista: "",
    data_fim_prevista: "",
    status: "pendente" as ObraEtapa['status'],
    notas: "",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      percentual_peso: 0,
      data_inicio_prevista: "",
      data_fim_prevista: "",
      status: "pendente",
      notas: "",
    });
    setEditingEtapa(null);
  };

  const handleOpenDialog = (etapa?: ObraEtapa) => {
    if (etapa) {
      setEditingEtapa(etapa);
      setFormData({
        nome: etapa.nome,
        descricao: etapa.descricao || "",
        percentual_peso: etapa.percentual_peso,
        data_inicio_prevista: etapa.data_inicio_prevista || "",
        data_fim_prevista: etapa.data_fim_prevista || "",
        status: etapa.status,
        notas: etapa.notas || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome) return;

    if (editingEtapa) {
      await updateEtapa.mutateAsync({
        id: editingEtapa.id,
        ...formData,
        data_inicio_real: formData.status === 'em_andamento' && !editingEtapa.data_inicio_real
          ? new Date().toISOString().split('T')[0]
          : editingEtapa.data_inicio_real,
        data_fim_real: formData.status === 'concluida' && !editingEtapa.data_fim_real
          ? new Date().toISOString().split('T')[0]
          : editingEtapa.data_fim_real,
      });
    } else {
      await createEtapa.mutateAsync({
        ...formData,
        ordem: etapas.length,
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta etapa?")) {
      await deleteEtapa.mutateAsync(id);
    }
  };

  const handleQuickStatusChange = async (etapa: ObraEtapa, newStatus: ObraEtapa['status']) => {
    await updateEtapa.mutateAsync({
      id: etapa.id,
      status: newStatus,
      data_inicio_real: newStatus === 'em_andamento' && !etapa.data_inicio_real
        ? new Date().toISOString().split('T')[0]
        : etapa.data_inicio_real,
      data_fim_real: newStatus === 'concluida' && !etapa.data_fim_real
        ? new Date().toISOString().split('T')[0]
        : etapa.data_fim_real,
    });
  };

  // Use calculated progress or fallback to obra's progress
  const displayProgress = etapas.length > 0 ? progressoCalculado : obraProgresso;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Etapas e Progresso</CardTitle>
          {!isReadOnly && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Etapa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingEtapa ? "Editar Etapa" : "Nova Etapa"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Etapa *</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Fundação, Alvenaria..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Detalhes da etapa"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.percentual_peso}
                        onChange={(e) => setFormData({ ...formData, percentual_peso: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as ObraEtapa['status'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="pausada">Pausada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início Prevista</Label>
                      <Input
                        type="date"
                        value={formData.data_inicio_prevista}
                        onChange={(e) => setFormData({ ...formData, data_inicio_prevista: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim Prevista</Label>
                      <Input
                        type="date"
                        value={formData.data_fim_prevista}
                        onChange={(e) => setFormData({ ...formData, data_fim_prevista: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Observações adicionais"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.nome || createEtapa.isPending || updateEtapa.isPending}
                  >
                    {(createEtapa.isPending || updateEtapa.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-medium">{displayProgress}%</span>
          </div>
          <Progress value={displayProgress} className="h-3" />
        </div>

        {/* Etapas List */}
        {etapas.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Circle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma etapa cadastrada.</p>
            {!isReadOnly && (
              <p className="text-xs mt-1">Clique em "Nova Etapa" para adicionar.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {etapas.map((etapa, index) => {
              const StatusIcon = statusConfig[etapa.status].icon;
              return (
                <div
                  key={etapa.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 pt-0.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{etapa.nome}</h4>
                      <Badge className={statusConfig[etapa.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[etapa.status].label}
                      </Badge>
                      {etapa.percentual_peso > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({etapa.percentual_peso}%)
                        </span>
                      )}
                    </div>
                    {etapa.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{etapa.descricao}</p>
                    )}
                    {(etapa.data_inicio_prevista || etapa.data_fim_prevista) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {etapa.data_inicio_prevista && (
                          <span>Início: {new Date(etapa.data_inicio_prevista).toLocaleDateString('pt-BR')}</span>
                        )}
                        {etapa.data_inicio_prevista && etapa.data_fim_prevista && <span> • </span>}
                        {etapa.data_fim_prevista && (
                          <span>Fim: {new Date(etapa.data_fim_prevista).toLocaleDateString('pt-BR')}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      {/* Quick status buttons */}
                      {etapa.status !== 'concluida' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleQuickStatusChange(etapa, 'concluida')}
                          title="Marcar como concluída"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {etapa.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleQuickStatusChange(etapa, 'em_andamento')}
                          title="Iniciar etapa"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(etapa)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(etapa.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {etapas.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              {etapas.filter(e => e.status === 'concluida').length} de {etapas.length} etapas concluídas
            </span>
            <span>
              Peso total: {etapas.reduce((acc, e) => acc + e.percentual_peso, 0)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
