import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ObraEtapa {
  id: string;
  tenant_id: string;
  obra_id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'pausada';
  percentual_peso: number;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  data_inicio_real?: string;
  data_fim_real?: string;
  responsavel_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  responsavel?: { name: string };
  diarios_count?: number;
}

export const useObraEtapas = (obraId?: string) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["obra_etapas", obraId],
    queryFn: async () => {
      if (!obraId || !tenantId) return [];

      const { data, error } = await supabase
        .from("obra_etapas")
        .select(`
          *,
          responsavel:technicians(name)
        `)
        .eq("obra_id", obraId)
        .eq("tenant_id", tenantId)
        .order("ordem", { ascending: true });

      if (error) throw error;

      // Fetch diarios count for each etapa
      const etapasWithCount = await Promise.all(
        (data || []).map(async (etapa) => {
          const { count } = await supabase
            .from("diario_obras")
            .select("*", { count: "exact", head: true })
            .eq("etapa_id", etapa.id);
          return { ...etapa, diarios_count: count || 0 };
        })
      );

      return etapasWithCount as ObraEtapa[];
    },
    enabled: !!obraId && !!tenantId,
  });

  // Calculate progress based on completed etapas
  const progressoCalculado = etapas.length > 0
    ? Math.round(
        etapas
          .filter(e => e.status === 'concluida')
          .reduce((acc, e) => acc + e.percentual_peso, 0)
      )
    : 0;

  const createEtapa = useMutation({
    mutationFn: async (etapa: Partial<ObraEtapa>) => {
      if (!tenantId || !obraId) throw new Error("Dados incompletos");

      const { data, error } = await supabase
        .from("obra_etapas")
        .insert({
          tenant_id: tenantId,
          obra_id: obraId,
          nome: etapa.nome!,
          descricao: etapa.descricao || null,
          ordem: etapa.ordem || 0,
          status: etapa.status || 'pendente',
          percentual_peso: etapa.percentual_peso || 0,
          data_inicio_prevista: etapa.data_inicio_prevista || null,
          data_fim_prevista: etapa.data_fim_prevista || null,
          responsavel_id: etapa.responsavel_id || null,
          notas: etapa.notas || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obra_etapas", obraId] });
      toast({ title: "Etapa criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar etapa", description: error.message, variant: "destructive" });
    },
  });

  const updateEtapa = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ObraEtapa> & { id: string }) => {
      const { data, error } = await supabase
        .from("obra_etapas")
        .update({
          nome: updates.nome,
          descricao: updates.descricao,
          ordem: updates.ordem,
          status: updates.status,
          percentual_peso: updates.percentual_peso,
          data_inicio_prevista: updates.data_inicio_prevista,
          data_fim_prevista: updates.data_fim_prevista,
          data_inicio_real: updates.data_inicio_real,
          data_fim_real: updates.data_fim_real,
          responsavel_id: updates.responsavel_id,
          notas: updates.notas,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obra_etapas", obraId] });
      toast({ title: "Etapa atualizada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar etapa", description: error.message, variant: "destructive" });
    },
  });

  const deleteEtapa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obra_etapas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obra_etapas", obraId] });
      toast({ title: "Etapa excluída com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir etapa", description: error.message, variant: "destructive" });
    },
  });

  const reorderEtapas = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase.from("obra_etapas").update({ ordem: index }).eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obra_etapas", obraId] });
    },
  });

  // Complete current etapa and start the next one
  const completeAndStartNext = useMutation({
    mutationFn: async (currentEtapaId: string) => {
      const currentEtapa = etapas.find(e => e.id === currentEtapaId);
      if (!currentEtapa) throw new Error("Etapa não encontrada");

      // Complete current etapa
      await supabase
        .from("obra_etapas")
        .update({
          status: 'concluida',
          data_fim_real: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEtapaId);

      // Find and start next pending etapa
      const nextEtapa = etapas.find(e => e.ordem > currentEtapa.ordem && e.status === 'pendente');
      if (nextEtapa) {
        await supabase
          .from("obra_etapas")
          .update({
            status: 'em_andamento',
            data_inicio_real: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextEtapa.id);
      }

      return { completed: currentEtapa, started: nextEtapa };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["obra_etapas", obraId] });
      if (result.started) {
        toast({ title: `Etapa "${result.completed.nome}" concluída! Iniciando "${result.started.nome}".` });
      } else {
        toast({ title: `Etapa "${result.completed.nome}" concluída!` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar etapas", description: error.message, variant: "destructive" });
    },
  });

  return {
    etapas,
    isLoading,
    progressoCalculado,
    createEtapa,
    updateEtapa,
    deleteEtapa,
    reorderEtapas,
    completeAndStartNext,
  };
};

// Hook to fetch diários for a specific etapa
export const useDiariosByEtapa = (etapaId?: string) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;

  return useQuery({
    queryKey: ["diario_obras_by_etapa", etapaId],
    queryFn: async () => {
      if (!etapaId || !tenantId) return [];

      const { data, error } = await supabase
        .from("diario_obras")
        .select("*")
        .eq("etapa_id", etapaId)
        .eq("tenant_id", tenantId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!etapaId && !!tenantId,
  });
};
