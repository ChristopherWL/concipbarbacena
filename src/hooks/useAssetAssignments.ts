import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssetAssignment {
  id: string;
  tenant_id: string;
  technician_id: string;
  technician?: {
    id: string;
    name: string;
    phone?: string;
  };
  asset_type: 'vehicle' | 'product' | 'serial_number';
  vehicle_id?: string;
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    brand: string;
  };
  product_id?: string;
  product?: {
    id: string;
    name: string;
    code: string;
  };
  serial_number_id?: string;
  serial_number?: {
    id: string;
    serial_number: string;
    product?: {
      name: string;
    };
  };
  quantity?: number;
  assigned_at: string;
  assigned_by?: string;
  expected_return?: string;
  returned_at?: string;
  notes?: string;
  created_at: string;
}

export function useAssetAssignments() {
  return useQuery({
    queryKey: ['asset-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_assignments')
        .select(`
          *,
          technician:technicians(id, name, phone),
          vehicle:vehicles(id, plate, model, brand),
          product:products(id, name, code),
          serial_number:serial_numbers(id, serial_number, product:products(name))
        `)
        .is('returned_at', null)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as unknown as AssetAssignment[];
    },
  });
}

export function useAssetAssignmentHistory(technicianId?: string) {
  return useQuery({
    queryKey: ['asset-assignment-history', technicianId],
    queryFn: async () => {
      let query = supabase
        .from('asset_assignments')
        .select(`
          *,
          technician:technicians(id, name, phone),
          vehicle:vehicles(id, plate, model, brand),
          product:products(id, name, code),
          serial_number:serial_numbers(id, serial_number, product:products(name))
        `)
        .order('assigned_at', { ascending: false });

      if (technicianId) {
        query = query.eq('technician_id', technicianId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AssetAssignment[];
    },
    enabled: true,
  });
}

interface CreateAssetAssignmentData {
  technician_id: string;
  asset_type: 'vehicle' | 'product' | 'serial_number';
  vehicle_id?: string;
  product_id?: string;
  serial_number_id?: string;
  quantity?: number;
  expected_return?: string;
  notes?: string;
  assigned_at?: string;
}

export function useCreateAssetAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssetAssignmentData) => {
      // Get tenant_id from profile
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('User not authenticated');

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.tenant_id) throw new Error('Tenant not found');

      const { data: assignment, error } = await supabase
        .from('asset_assignments')
        .insert({
          ...data,
          tenant_id: userProfile.tenant_id,
          assigned_by: profile.user.id,
          assigned_at: data.assigned_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update serial number status if applicable
      if (data.serial_number_id) {
        await supabase
          .from('serial_numbers')
          .update({ status: 'em_uso', assigned_to: data.technician_id, assigned_at: new Date().toISOString() })
          .eq('id', data.serial_number_id);
      }

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignment-history'] });
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'] });
      toast.success('Ativo atribuído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atribuir ativo: ' + error.message);
    },
  });
}

interface ReturnAssetData {
  id: string;
  returnReason?: string;
}

export function useReturnAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReturnAssetData | string) => {
      const assignmentId = typeof data === 'string' ? data : data.id;
      const returnReason = typeof data === 'string' ? undefined : data.returnReason;

      // Get the assignment first
      const { data: assignment } = await supabase
        .from('asset_assignments')
        .select('serial_number_id, notes')
        .eq('id', assignmentId)
        .single();

      // Parse existing notes and add return reason
      let updatedNotes = assignment?.notes || '{}';
      try {
        const parsedNotes = JSON.parse(updatedNotes);
        parsedNotes.returnReason = returnReason;
        updatedNotes = JSON.stringify(parsedNotes);
      } catch {
        updatedNotes = JSON.stringify({ returnReason });
      }

      const { error } = await supabase
        .from('asset_assignments')
        .update({ 
          returned_at: new Date().toISOString(),
          notes: updatedNotes
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update serial number status if applicable
      if (assignment?.serial_number_id) {
        await supabase
          .from('serial_numbers')
          .update({ status: 'disponivel', assigned_to: null, assigned_at: null })
          .eq('id', assignment.serial_number_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['asset-assignment-history'] });
      queryClient.invalidateQueries({ queryKey: ['serial-numbers'] });
      toast.success('Ativo devolvido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao devolver ativo: ' + error.message);
    },
  });
}
