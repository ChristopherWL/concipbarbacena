import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Loader2
} from "lucide-react";
import { useServiceOrderEtapas, useDiarioServiceOrders, ServiceOrderEtapa } from "@/hooks/useServiceOrderEtapas";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceOrderEtapasPanelProps {
  serviceOrderId: string;
  progresso?: number;
  isReadOnly?: boolean;
}

export const ServiceOrderEtapasPanel = ({ 
  serviceOrderId, 
  progresso = 0,
  isReadOnly = false 
}: ServiceOrderEtapasPanelProps) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;
  const { etapas, isLoading, createEtapa, deleteEtapa, completeAndStartNext } = useServiceOrderEtapas(serviceOrderId);
  const { diarios } = useDiarioServiceOrders(serviceOrderId);
  
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEtapa, setNewEtapa] = useState({
    nome: "",
    percentual_peso: 0,
    data_inicio_prevista: "",
    data_fim_prevista: "",
  });

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedEtapas);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedEtapas(newSet);
  };

  const handleAddEtapa = async () => {
    if (!newEtapa.nome || !tenantId) return;

    await createEtapa.mutateAsync({
      service_order_id: serviceOrderId,
      tenant_id: tenantId,
      nome: newEtapa.nome,
      percentual_peso: newEtapa.percentual_peso,
      ordem: etapas.length,
      status: etapas.length === 0 ? "em_andamento" : "pendente",
      data_inicio_prevista: newEtapa.data_inicio_prevista || undefined,
      data_fim_prevista: newEtapa.data_fim_prevista || undefined,
      data_inicio_real: etapas.length === 0 ? new Date().toISOString().split("T")[0] : undefined,
    });

    setNewEtapa({ nome: "", percentual_peso: 0, data_inicio_prevista: "", data_fim_prevista: "" });
    setShowAddForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Concluída</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"><PlayCircle className="h-3 w-3 mr-1" />Em Andamento</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const getDiariosForEtapa = (etapaId: string) => {
    return diarios.filter(d => d.etapa_id === etapaId);
  };

  const totalPeso = etapas.reduce((acc, e) => acc + Number(e.percentual_peso), 0);
  const calculatedProgress = etapas
    .filter(e => e.status === "concluida")
    .reduce((acc, e) => acc + Number(e.percentual_peso), 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
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
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Etapas da OS
          </CardTitle>
          {etapas.length > 0 && (
            <Badge variant={totalPeso === 100 ? "default" : "secondary"}>
              {Math.round(calculatedProgress)}% concluído
            </Badge>
          )}
        </div>
        {etapas.length > 0 && (
          <Progress value={calculatedProgress} className="h-2 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {etapas.length === 0 && !showAddForm ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma etapa cadastrada</p>
            {!isReadOnly && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Etapa
              </Button>
            )}
          </div>
        ) : (
          <>
            {etapas.map((etapa, index) => {
              const etapaDiarios = getDiariosForEtapa(etapa.id);
              const isExpanded = expandedEtapas.has(etapa.id);
              const isActive = etapa.status === "em_andamento";

              return (
                <Collapsible key={etapa.id} open={isExpanded} onOpenChange={() => toggleExpanded(etapa.id)}>
                  <Card className={`border ${isActive ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                    <CollapsibleTrigger className="w-full">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{etapa.nome}</span>
                              {etapa.percentual_peso > 0 && (
                                <Badge variant="outline" className="text-xs">{etapa.percentual_peso}%</Badge>
                              )}
                              {getStatusBadge(etapa.status)}
                            </div>
                          </div>
                          {etapaDiarios.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {etapaDiarios.length} registro{etapaDiarios.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-3 border-t pt-3">
                        {etapa.data_inicio_prevista && (
                          <div className="text-xs text-muted-foreground">
                            Previsto: {new Date(etapa.data_inicio_prevista).toLocaleDateString("pt-BR")} 
                            {etapa.data_fim_prevista && ` - ${new Date(etapa.data_fim_prevista).toLocaleDateString("pt-BR")}`}
                          </div>
                        )}
                        
                        {etapaDiarios.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Diários:</p>
                            {etapaDiarios.slice(0, 3).map(d => (
                              <div key={d.id} className="text-xs p-2 bg-muted/50 rounded">
                                <span className="font-medium">{new Date(d.data).toLocaleDateString("pt-BR")}</span>
                                {d.atividades_realizadas && (
                                  <p className="text-muted-foreground line-clamp-1">{d.atividades_realizadas}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {!isReadOnly && (
                          <div className="flex gap-2 pt-2">
                            {isActive && (
                              <Button 
                                size="sm" 
                                onClick={() => completeAndStartNext.mutate(etapa.id)}
                                disabled={completeAndStartNext.isPending}
                              >
                                {completeAndStartNext.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Concluir
                                  </>
                                )}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive"
                              onClick={() => deleteEtapa.mutate(etapa.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}

            {!isReadOnly && !showAddForm && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Etapa
              </Button>
            )}
          </>
        )}

        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome da Etapa</Label>
                  <Input
                    placeholder="Ex: Instalação, Configuração..."
                    value={newEtapa.nome}
                    onChange={(e) => setNewEtapa({ ...newEtapa, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Peso (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={newEtapa.percentual_peso || ""}
                    onChange={(e) => setNewEtapa({ ...newEtapa, percentual_peso: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data Início Prevista</Label>
                  <Input
                    type="date"
                    value={newEtapa.data_inicio_prevista}
                    onChange={(e) => setNewEtapa({ ...newEtapa, data_inicio_prevista: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data Fim Prevista</Label>
                  <Input
                    type="date"
                    value={newEtapa.data_fim_prevista}
                    onChange={(e) => setNewEtapa({ ...newEtapa, data_fim_prevista: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddEtapa}
                  disabled={!newEtapa.nome || createEtapa.isPending}
                >
                  {createEtapa.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Adicionar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
