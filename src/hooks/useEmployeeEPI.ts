import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { EPIAssignment } from '@/types/hr';

export function useEmployeeEPI(employeeId: string | null) {
  const { tenant } = useAuth();
  const tenantId = tenant?.id;
  const [assignments, setAssignments] = useState<EPIAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssignments = async () => {
    if (!tenantId || !employeeId) {
      setAssignments([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_epi_assignments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setAssignments((data || []) as unknown as EPIAssignment[]);
    } catch (error) {
      console.error('Error fetching EPI assignments:', error);
      toast.error('Erro ao carregar EPIs');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: Partial<EPIAssignment>) => {
    if (!tenantId || !employeeId) {
      toast.error('Dados incompletos');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('employee_epi_assignments')
        .insert({
          ...assignment,
          tenant_id: tenantId,
          employee_id: employeeId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('EPI registrado com sucesso!');
      await fetchAssignments();
      return data;
    } catch (error: any) {
      console.error('Error creating EPI assignment:', error);
      toast.error(error.message || 'Erro ao registrar EPI');
      return null;
    }
  };

  const updateAssignment = async (id: string, updates: Partial<EPIAssignment>) => {
    try {
      const { error } = await supabase
        .from('employee_epi_assignments')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('EPI atualizado com sucesso!');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error updating EPI assignment:', error);
      toast.error(error.message || 'Erro ao atualizar EPI');
      return false;
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_epi_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('EPI removido com sucesso!');
      await fetchAssignments();
      return true;
    } catch (error: any) {
      console.error('Error deleting EPI assignment:', error);
      toast.error(error.message || 'Erro ao remover EPI');
      return false;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [tenantId, employeeId]);

  return {
    assignments,
    isLoading,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
