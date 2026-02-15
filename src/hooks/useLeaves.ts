import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';
import type { Leave } from '@/types/hr';

export function useLeaves() {
  const { tenant, user } = useAuth();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaves = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          employee:employees!inner(id, name, position, department, branch_id)
        `)
        .eq('tenant_id', tenantId);

      if (shouldFilter && branchId) {
        query = query.eq('employee.branch_id', branchId);
      } else {
        query = query.not('employee.branch_id', 'is', null);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      setLeaves((data || []) as unknown as Leave[]);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast.error('Erro ao carregar afastamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const createLeave = async (leave: Partial<Leave>) => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('leaves')
        .insert({ 
          ...leave, 
          tenant_id: tenantId,
          registered_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Afastamento registrado com sucesso!');
      await fetchLeaves();
      return data;
    } catch (error: any) {
      console.error('Error creating leave:', error);
      toast.error(error.message || 'Erro ao registrar afastamento');
      return null;
    }
  };

  const updateLeave = async (id: string, updates: Partial<Leave>) => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Afastamento atualizado!');
      await fetchLeaves();
      return true;
    } catch (error: any) {
      console.error('Error updating leave:', error);
      toast.error(error.message || 'Erro ao atualizar afastamento');
      return false;
    }
  };

  const deleteLeave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Afastamento excluído');
      await fetchLeaves();
      return true;
    } catch (error: any) {
      console.error('Error deleting leave:', error);
      toast.error(error.message || 'Erro ao excluir afastamento');
      return false;
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [tenantId, branchId]);

  return {
    leaves,
    isLoading,
    fetchLeaves,
    createLeave,
    updateLeave,
    deleteLeave,
  };
}
