import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface EPCAssignment {
  id: string;
  tenant_id: string;
  employee_id: string;
  product_id?: string;
  description: string;
  serial_number?: string;
  quantity: number;
  delivery_date: string;
  return_date?: string;
  return_reason?: string;
  condition_delivery?: string;
  condition_return?: string;
  location?: string;
  notes?: string;
  signature_url?: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmployeeEPC(employeeId: string | null) {
  const { tenant } = useAuth();
  const [assignments, setAssignments] = useState<EPCAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssignments = async () => {
    if (!tenant?.id || !employeeId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_epc_assignments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('employee_id', employeeId)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setAssignments((data as EPCAssignment[]) || []);
    } catch (error: any) {
      console.error('Error fetching EPC assignments:', error);
      toast.error('Erro ao carregar EPC');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: Partial<EPCAssignment>) => {
    if (!tenant?.id || !employeeId) return;

    try {
      const { error } = await supabase
        .from('employee_epc_assignments')
        .insert({
          ...assignment,
          tenant_id: tenant.id,
          employee_id: employeeId,
        } as any);

      if (error) throw error;
      toast.success('EPC atribuído com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error creating EPC assignment:', error);
      toast.error('Erro ao atribuir EPC');
    }
  };

  const updateAssignment = async (id: string, updates: Partial<EPCAssignment>) => {
    try {
      const { error } = await supabase
        .from('employee_epc_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('EPC atualizado com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error updating EPC assignment:', error);
      toast.error('Erro ao atualizar EPC');
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_epc_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('EPC removido com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting EPC assignment:', error);
      toast.error('Erro ao remover EPC');
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [tenant?.id, employeeId]);

  return {
    assignments,
    isLoading,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
