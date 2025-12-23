import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ServiceOrderEtapa {
  id: string;
  service_order_id: string;
  tenant_id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  percentual_peso: number;
  status: string;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  data_inicio_real?: string;
  data_fim_real?: string;
  responsavel_id?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface DiarioServiceOrder {
  id: string;
  service_order_id: string;
  etapa_id?: string;
  etapa?: { nome: string };
  tenant_id: string;
  branch_id?: string;
  data: string;
  registrado_por?: string;
  atividades_realizadas?: string;
  materiais_utilizados?: string;
  ocorrencias?: string;
  fotos?: any;
  supervisor_signature?: string;
  status: string;
  validated_at?: string;
  validated_by?: string;
  observacao_fiscalizacao?: string;
  created_at: string;
  updated_at: string;
}

export const useServiceOrderEtapas = (serviceOrderId?: string) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: etapas = [], isLoading } = useQuery({
    queryKey: ["service_order_etapas", serviceOrderId],
    queryFn: async () => {
      if (!serviceOrderId || !tenantId) return [];

      const { data, error } = await supabase
        .from("service_order_etapas")
        .select("*")
        .eq("service_order_id", serviceOrderId)
        .eq("tenant_id", tenantId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as ServiceOrderEtapa[];
    },
    enabled: !!serviceOrderId && !!tenantId,
    staleTime: 30 * 1000,
  });

  const createEtapa = useMutation({
    mutationFn: async (etapa: Omit<ServiceOrderEtapa, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("service_order_etapas")
        .insert(etapa)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_order_etapas", serviceOrderId] });
      toast.success("Etapa criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar etapa"),
  });

  const updateEtapa = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceOrderEtapa> & { id: string }) => {
      const { error } = await supabase
        .from("service_order_etapas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_order_etapas", serviceOrderId] });
      toast.success("Etapa atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar etapa"),
  });

  const deleteEtapa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_order_etapas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_order_etapas", serviceOrderId] });
      toast.success("Etapa excluída!");
    },
    onError: () => toast.error("Erro ao excluir etapa"),
  });

  const completeAndStartNext = useMutation({
    mutationFn: async (etapaId: string) => {
      // Complete current etapa
      const { error: completeError } = await supabase
        .from("service_order_etapas")
        .update({
          status: "concluida",
          data_fim_real: new Date().toISOString().split("T")[0],
        })
        .eq("id", etapaId);

      if (completeError) throw completeError;

      // Find next etapa
      const currentEtapa = etapas.find((e) => e.id === etapaId);
      if (!currentEtapa) return;

      const nextEtapa = etapas.find(
        (e) => e.ordem === currentEtapa.ordem + 1 && e.status === "pendente"
      );

      if (nextEtapa) {
        const { error: startError } = await supabase
          .from("service_order_etapas")
          .update({
            status: "em_andamento",
            data_inicio_real: new Date().toISOString().split("T")[0],
          })
          .eq("id", nextEtapa.id);

        if (startError) throw startError;
      }

      // Update service order progress
      const completedWeight = etapas
        .filter((e) => e.status === "concluida" || e.id === etapaId)
        .reduce((acc, e) => acc + Number(e.percentual_peso), 0);

      if (serviceOrderId) {
        await supabase
          .from("service_orders")
          .update({ progresso: Math.round(completedWeight) })
          .eq("id", serviceOrderId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_order_etapas", serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ["service_orders"] });
      toast.success("Etapa concluída!");
    },
    onError: () => toast.error("Erro ao concluir etapa"),
  });

  return {
    etapas,
    isLoading,
    createEtapa,
    updateEtapa,
    deleteEtapa,
    completeAndStartNext,
  };
};

export const useDiarioServiceOrders = (serviceOrderId?: string) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: diarios = [], isLoading } = useQuery({
    queryKey: ["diario_service_orders", serviceOrderId],
    queryFn: async () => {
      if (!serviceOrderId || !tenantId) return [];

      const { data, error } = await supabase
        .from("diario_service_orders")
        .select(`
          *,
          etapa:service_order_etapas(nome)
        `)
        .eq("service_order_id", serviceOrderId)
        .eq("tenant_id", tenantId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data as DiarioServiceOrder[];
    },
    enabled: !!serviceOrderId && !!tenantId,
    staleTime: 30 * 1000,
  });

  const createDiario = useMutation({
    mutationFn: async (diario: Omit<DiarioServiceOrder, "id" | "created_at" | "updated_at" | "etapa">) => {
      const { data, error } = await supabase
        .from("diario_service_orders")
        .insert(diario)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_service_orders", serviceOrderId] });
      toast.success("Diário registrado!");
    },
    onError: () => toast.error("Erro ao registrar diário"),
  });

  const updateDiario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiarioServiceOrder> & { id: string }) => {
      const { error } = await supabase
        .from("diario_service_orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_service_orders", serviceOrderId] });
      toast.success("Diário atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar diário"),
  });

  const deleteDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diario_service_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_service_orders", serviceOrderId] });
      toast.success("Diário excluído!");
    },
    onError: () => toast.error("Erro ao excluir diário"),
  });

  return {
    diarios,
    isLoading,
    createDiario,
    updateDiario,
    deleteDiario,
  };
};
