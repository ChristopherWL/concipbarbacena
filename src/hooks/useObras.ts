import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useBranchFilter } from "./useBranchFilter";
import { toast } from "@/hooks/use-toast";


export interface Obra {
  id: string;
  tenant_id: string;
  branch_id?: string;
  customer_id?: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  descricao?: string;
  responsavel_id?: string;
  status: 'planejada' | 'em_andamento' | 'pausada' | 'concluida' | 'cancelada';
  progresso: number;
  data_inicio?: string;
  previsao_termino?: string;
  data_conclusao?: string;
  valor_contrato?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  customer?: { name: string };
  responsavel?: { name: string };
}

export interface ObraProgresso {
  id: string;
  tenant_id: string;
  obra_id: string;
  data: string;
  percentual_anterior: number;
  percentual_atual: number;
  descricao?: string;
  registrado_por?: string;
  created_at: string;
}

export interface DiarioObra {
  id: string;
  tenant_id: string;
  branch_id?: string;
  obra_id: string;
  etapa_id?: string;
  data: string;
  clima?: string;
  hora_inicio?: string;
  hora_fim?: string;
  equipe_presente?: number;
  atividades_realizadas?: string;
  materiais_utilizados?: string;
  ocorrencias?: string;
  fotos?: any[];
  registrado_por?: string;
  created_at: string;
  updated_at: string;
  obra?: { nome: string };
  etapa?: { nome: string };
  // Morning shift fields
  equipe_manha?: string;
  veiculo_manha?: string;
  placa_manha?: string;
  motorista_manha?: string;
  km_ida_manha?: string;
  km_volta_manha?: string;
  hora_inicio_manha?: string;
  hora_fim_manha?: string;
  km_rodado_manha?: string;
  // Afternoon shift fields
  equipe_tarde?: string;
  veiculo_tarde?: string;
  placa_tarde?: string;
  motorista_tarde?: string;
  km_ida_tarde?: string;
  km_volta_tarde?: string;
  hora_inicio_tarde?: string;
  hora_fim_tarde?: string;
  km_rodado_tarde?: string;
  // Responsible for materials
  responsavel_entrega_materiais?: string;
  responsavel_devolucao_materiais?: string;
  // Team signatures
  equipe_assinaturas?: Array<{ nome: string; funcao: string; assinatura?: string }>;
  // Fiscalization
  observacao_fiscalizacao?: string;
  // Weather per period
  clima_manha?: string;
  clima_tarde?: string;
  clima_noite?: string;
  // Validation fields
  status?: string;
  supervisor_signature?: string;
  validated_at?: string;
  validated_by?: string;
}

export const useObras = () => {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: obras = [], isLoading, error } = useQuery({
    queryKey: ["obras", tenantId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from("obras")
        .select(`
          *,
          customer:customers(name),
          responsavel:technicians(name)
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (shouldFilter && branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Obra[];
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const createObra = useMutation({
    mutationFn: async (obra: Partial<Obra>) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");

      const { data, error } = await supabase
        .from("obras")
        .insert({
          nome: obra.nome!,
          endereco: obra.endereco || null,
          cidade: obra.cidade || null,
          estado: obra.estado || null,
          cep: obra.cep || null,
          descricao: obra.descricao || null,
          responsavel_id: obra.responsavel_id || null,
          status: obra.status || 'planejada',
          progresso: obra.progresso || 0,
          data_inicio: obra.data_inicio || null,
          previsao_termino: obra.previsao_termino || null,
          valor_contrato: obra.valor_contrato || null,
          notas: obra.notas || null,
          customer_id: obra.customer_id || null,
          branch_id: obra.branch_id ?? (shouldFilter ? branchId : null),
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast({ title: "Obra cadastrada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao cadastrar obra", description: error.message, variant: "destructive" });
    },
  });

  const updateObra = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Obra> & { id: string }) => {
      const { data, error } = await supabase
        .from("obras")
        .update({ 
          nome: updates.nome,
          endereco: updates.endereco,
          cidade: updates.cidade,
          estado: updates.estado,
          cep: updates.cep,
          descricao: updates.descricao,
          responsavel_id: updates.responsavel_id,
          customer_id: updates.customer_id,
          branch_id: updates.branch_id,
          status: updates.status,
          progresso: updates.progresso,
          data_inicio: updates.data_inicio,
          previsao_termino: updates.previsao_termino,
          data_conclusao: updates.data_conclusao,
          valor_contrato: updates.valor_contrato,
          notas: updates.notas,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast({ title: "Obra atualizada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar obra", description: error.message, variant: "destructive" });
    },
  });

  const deleteObra = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast({ title: "Obra excluída com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir obra", description: error.message, variant: "destructive" });
    },
  });

  return {
    obras,
    isLoading,
    error,
    createObra,
    updateObra,
    deleteObra,
  };
};

export const useObraProgresso = (obraId?: string) => {
  const { tenant } = useAuthContext();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: progressos = [], isLoading } = useQuery({
    queryKey: ["obras_progresso", obraId],
    queryFn: async () => {
      if (!obraId) return [];

      const { data, error } = await supabase
        .from("obras_progresso")
        .select("*")
        .eq("obra_id", obraId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ObraProgresso[];
    },
    enabled: !!obraId,
  });

  const addProgresso = useMutation({
    mutationFn: async (progresso: Partial<ObraProgresso>) => {
      if (!tenantId || !obraId) throw new Error("Dados incompletos");

      const { data, error } = await supabase
        .from("obras_progresso")
        .insert({
          tenant_id: tenantId,
          obra_id: obraId,
          data: progresso.data || new Date().toISOString().split('T')[0],
          percentual_anterior: progresso.percentual_anterior || 0,
          percentual_atual: progresso.percentual_atual!,
          descricao: progresso.descricao,
        })
        .select()
        .single();

      if (error) throw error;

      // Update obra progress
      if (progresso.percentual_atual !== undefined) {
        const newStatus = progresso.percentual_atual === 100 ? 'concluida' : undefined;
        await supabase
          .from("obras")
          .update({ 
            progresso: progresso.percentual_atual,
            ...(newStatus && { status: newStatus, data_conclusao: new Date().toISOString().split('T')[0] }),
            updated_at: new Date().toISOString()
          })
          .eq("id", obraId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["obras_progresso", obraId] });
      queryClient.invalidateQueries({ queryKey: ["obras"] });
      toast({ title: "Progresso registrado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar progresso", description: error.message, variant: "destructive" });
    },
  });

  return { progressos, isLoading, addProgresso };
};

export const useDiarioObras = (obraId?: string) => {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: diarios = [], isLoading } = useQuery({
    queryKey: ["diario_obras", obraId, tenantId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from("diario_obras")
        .select(`
          *,
          obra:obras(nome),
          etapa:obra_etapas(nome)
        `)
        .eq("tenant_id", tenantId)
        .order("data", { ascending: false });

      if (obraId) {
        query = query.eq("obra_id", obraId);
      }

      if (shouldFilter && branchId) {
        query = query.eq("branch_id", branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DiarioObra[];
    },
    enabled: !!tenantId,
  });

  const createDiario = useMutation({
    mutationFn: async (diario: Partial<DiarioObra>) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");

      const { data, error } = await supabase
        .from("diario_obras")
        .insert({
          tenant_id: tenantId,
          obra_id: diario.obra_id || null,
          etapa_id: diario.etapa_id || null,
          branch_id: diario.branch_id ?? (shouldFilter ? branchId : null),
          data: diario.data || new Date().toISOString().split('T')[0],
          clima: diario.clima,
          hora_inicio: diario.hora_inicio,
          hora_fim: diario.hora_fim,
          equipe_presente: diario.equipe_presente,
          atividades_realizadas: diario.atividades_realizadas,
          materiais_utilizados: diario.materiais_utilizados,
          ocorrencias: diario.ocorrencias,
          // Morning shift
          equipe_manha: diario.equipe_manha,
          veiculo_manha: diario.veiculo_manha,
          placa_manha: diario.placa_manha,
          motorista_manha: diario.motorista_manha,
          km_ida_manha: diario.km_ida_manha,
          km_volta_manha: diario.km_volta_manha,
          hora_inicio_manha: diario.hora_inicio_manha,
          hora_fim_manha: diario.hora_fim_manha,
          km_rodado_manha: diario.km_rodado_manha,
          // Afternoon shift
          equipe_tarde: diario.equipe_tarde,
          veiculo_tarde: diario.veiculo_tarde,
          placa_tarde: diario.placa_tarde,
          motorista_tarde: diario.motorista_tarde,
          km_ida_tarde: diario.km_ida_tarde,
          km_volta_tarde: diario.km_volta_tarde,
          hora_inicio_tarde: diario.hora_inicio_tarde,
          hora_fim_tarde: diario.hora_fim_tarde,
          km_rodado_tarde: diario.km_rodado_tarde,
          // Materials
          responsavel_entrega_materiais: diario.responsavel_entrega_materiais,
          responsavel_devolucao_materiais: diario.responsavel_devolucao_materiais,
          // Team signatures
          equipe_assinaturas: diario.equipe_assinaturas || [],
          observacao_fiscalizacao: diario.observacao_fiscalizacao,
          // Weather per period
          clima_manha: diario.clima_manha,
          clima_tarde: diario.clima_tarde,
          clima_noite: diario.clima_noite,
          // Status
          status: 'aberto',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_obras"] });
      toast({ title: "Diário registrado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar diário", description: error.message, variant: "destructive" });
    },
  });

  const updateDiario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiarioObra> & { id: string }) => {
      const { data, error } = await supabase
        .from("diario_obras")
        .update({ 
          clima: updates.clima,
          data: updates.data,
          hora_inicio: updates.hora_inicio,
          hora_fim: updates.hora_fim,
          equipe_presente: updates.equipe_presente,
          atividades_realizadas: updates.atividades_realizadas,
          materiais_utilizados: updates.materiais_utilizados,
          ocorrencias: updates.ocorrencias,
          clima_manha: updates.clima_manha,
          clima_tarde: updates.clima_tarde,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_obras"] });
      toast({ title: "Diário atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar diário", description: error.message, variant: "destructive" });
    },
  });

  const deleteDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diario_obras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_obras"] });
      toast({ title: "Diário excluído com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir diário", description: error.message, variant: "destructive" });
    },
  });

  const validateDiario = useMutation({
    mutationFn: async ({ 
      id, 
      observacao_fiscalizacao, 
      supervisor_signature,
      validated_by 
    }: { 
      id: string; 
      observacao_fiscalizacao?: string; 
      supervisor_signature: string;
      validated_by: string;
    }) => {
      const { data, error } = await supabase
        .from("diario_obras")
        .update({ 
          observacao_fiscalizacao,
          supervisor_signature,
          validated_by,
          validated_at: new Date().toISOString(),
          status: 'validado',
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_obras"] });
      toast({ title: "Diário validado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao validar diário", description: error.message, variant: "destructive" });
    },
  });

  return { diarios, isLoading, createDiario, updateDiario, deleteDiario, validateDiario };
};
