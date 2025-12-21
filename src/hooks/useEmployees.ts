import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';
import type { Employee, EmployeeStatus } from '@/types/hr';

export function useEmployees() {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', tenantId, branchId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as Employee[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (employee: Partial<Employee>) => {
      if (!tenantId) {
        throw new Error('Tenant não identificado');
      }

      const insertData = {
        ...employee,
        tenant_id: tenantId,
        // Ensure the record is visible when the app is filtering by branch
        ...(shouldFilter && branchId && !employee.branch_id ? { branch_id: branchId } : {}),
        // jsonb columns should be sent as JSON, not stringified text
        dependents: (employee as any).dependents ?? [],
        documents: (employee as any).documents ?? [],
      };

      const { data, error } = await supabase
        .from('employees')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', tenantId] });
      toast.success('Colaborador cadastrado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating employee:', error);
      toast.error(error.message || 'Erro ao cadastrar colaborador');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const updateData = {
        ...updates,
        ...(shouldFilter && branchId && !updates.branch_id ? { branch_id: branchId } : {}),
        dependents: (updates as any).dependents ?? undefined,
        documents: (updates as any).documents ?? undefined,
      };
      
      const { error } = await supabase
        .from('employees')
        .update(updateData as any)
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', tenantId] });
      toast.success('Colaborador atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Erro ao atualizar colaborador');
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async ({ id, terminationDate, reason }: { id: string; terminationDate: string; reason: string }) => {
      const { error } = await supabase
        .from('employees')
        .update({
          status: 'desligado' as EmployeeStatus,
          termination_date: terminationDate,
          termination_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', tenantId] });
      toast.success('Colaborador desligado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error terminating employee:', error);
      toast.error(error.message || 'Erro ao desligar colaborador');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', tenantId] });
      toast.success('Colaborador excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting employee:', error);
      toast.error(error.message || 'Erro ao excluir colaborador');
    },
  });

  const createEmployee = async (employee: Partial<Employee>) => {
    try {
      const result = await createMutation.mutateAsync(employee);
      return result;
    } catch {
      return null;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      return true;
    } catch {
      return false;
    }
  };

  const terminateEmployee = async (id: string, terminationDate: string, reason: string) => {
    try {
      await terminateMutation.mutateAsync({ id, terminationDate, reason });
      return true;
    } catch {
      return false;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    employees,
    isLoading,
    createEmployee,
    updateEmployee,
    terminateEmployee,
    deleteEmployee,
  };
}
