import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FerramentaAssignment {
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
  notes?: string;
  signature_url?: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmployeeFerramentas(employeeId: string | null) {
  const { tenant } = useAuth();
  const [assignments, setAssignments] = useState<FerramentaAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAssignments = async () => {
    if (!tenant?.id || !employeeId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_ferramentas_assignments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('employee_id', employeeId)
        .order('delivery_date', { ascending: false });

      if (error) throw error;
      setAssignments((data as FerramentaAssignment[]) || []);
    } catch (error: any) {
      console.error('Error fetching ferramentas assignments:', error);
      toast.error('Erro ao carregar ferramentas');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignment = async (assignment: Partial<FerramentaAssignment>) => {
    if (!tenant?.id || !employeeId) return;

    try {
      const { error } = await supabase
        .from('employee_ferramentas_assignments')
        .insert({
          ...assignment,
          tenant_id: tenant.id,
          employee_id: employeeId,
        } as any);

      if (error) throw error;
      toast.success('Ferramenta atribuída com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error creating ferramenta assignment:', error);
      toast.error('Erro ao atribuir ferramenta');
    }
  };

  const updateAssignment = async (id: string, updates: Partial<FerramentaAssignment>) => {
    try {
      const { error } = await supabase
        .from('employee_ferramentas_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Ferramenta atualizada com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error updating ferramenta assignment:', error);
      toast.error('Erro ao atualizar ferramenta');
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_ferramentas_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Ferramenta removida com sucesso');
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting ferramenta assignment:', error);
      toast.error('Erro ao remover ferramenta');
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
