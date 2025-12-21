import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SerialNumber, SerialStatus } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useSerialNumbers(productId?: string, status?: SerialStatus) {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['serial_numbers', tenant?.id, productId, status],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      let query = supabase
        .from('serial_numbers')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SerialNumber[];
    },
    enabled: !!tenant?.id,
  });
}

export function useUpdateSerialStatus() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      assignedTo,
      reason 
    }: { 
      id: string; 
      status: SerialStatus; 
      assignedTo?: string;
      reason?: string;
    }) => {
      if (!tenant?.id || !user?.id) throw new Error('Dados não encontrados');

      // Get serial number info
      const { data: serial } = await supabase
        .from('serial_numbers')
        .select('*, product:products(*)')
        .eq('id', id)
        .single();

      if (!serial) throw new Error('Número de série não encontrado');

      // Update serial status
      const { error: updateError } = await supabase
        .from('serial_numbers')
        .update({
          status,
          assigned_to: assignedTo || null,
          assigned_at: assignedTo ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create stock movement if status changes availability
      const previousStatus = serial.status;
      let movementType: 'entrada' | 'saida' | 'devolucao' | null = null;
      let quantity = 0;

      if (previousStatus === 'disponivel' && status !== 'disponivel') {
        movementType = 'saida';
        quantity = -1;
      } else if (previousStatus !== 'disponivel' && status === 'disponivel') {
        movementType = 'devolucao';
        quantity = 1;
      }

      if (movementType) {
        const product = serial.product;
        const previousStock = product.current_stock;
        const newStock = previousStock + quantity;

        await supabase
          .from('stock_movements')
          .insert({
            tenant_id: tenant.id,
            product_id: serial.product_id,
            serial_number_id: id,
            movement_type: movementType,
            quantity: Math.abs(quantity),
            previous_stock: previousStock,
            new_stock: newStock,
            reason: reason || `Alteração de status: ${status}`,
            created_by: user.id,
          });

        await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', serial.product_id);
      }

      return serial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serial_numbers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });
}
