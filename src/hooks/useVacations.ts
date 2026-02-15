import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';
import type { Vacation, VacationStatus } from '@/types/hr';

export function useVacations() {
  const { tenant, user } = useAuth();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVacations = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('vacations')
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
      setVacations((data || []) as unknown as Vacation[]);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      toast.error('Erro ao carregar férias');
    } finally {
      setIsLoading(false);
    }
  };

  const createVacation = async (vacation: Partial<Vacation>) => {
    if (!tenantId) return null;

    try {
      const { data, error } = await supabase
        .from('vacations')
        .insert({ ...vacation, tenant_id: tenantId } as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Férias registradas com sucesso!');
      await fetchVacations();
      return data;
    } catch (error: any) {
      console.error('Error creating vacation:', error);
      toast.error(error.message || 'Erro ao registrar férias');
      return null;
    }
  };

  const approveVacation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'aprovada' as VacationStatus,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Férias aprovadas!');
      await fetchVacations();
      return true;
    } catch (error: any) {
      console.error('Error approving vacation:', error);
      toast.error(error.message || 'Erro ao aprovar férias');
      return false;
    }
  };

  const rejectVacation = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .update({
          status: 'rejeitada' as VacationStatus,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Férias rejeitadas');
      await fetchVacations();
      return true;
    } catch (error: any) {
      console.error('Error rejecting vacation:', error);
      toast.error(error.message || 'Erro ao rejeitar férias');
      return false;
    }
  };

  const deleteVacation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Férias excluídas');
      await fetchVacations();
      return true;
    } catch (error: any) {
      console.error('Error deleting vacation:', error);
      toast.error(error.message || 'Erro ao excluir férias');
      return false;
    }
  };

  useEffect(() => {
    fetchVacations();
  }, [tenantId, branchId]);

  return {
    vacations,
    isLoading,
    fetchVacations,
    createVacation,
    approveVacation,
    rejectVacation,
    deleteVacation,
  };
}
