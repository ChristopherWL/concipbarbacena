import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement, MovementType } from '@/types/stock';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export function useStockMovements(productId?: string) {
  const { tenant } = useAuthContext();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['stock_movements', tenant?.id, productId, branchId],
    queryFn: async () => {
      if (!tenant?.id) return [];
      
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(*)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });
      
      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!tenant?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

interface CreateMovementInput {
  items: Array<{
    product_id: string;
    quantity: number;
    serial_number_id?: string;
    serial_number?: string;
  }>;
  movement_type: MovementType;
  technician_id?: string;
  service_order_id?: string;
  reason?: string;
  branch_id?: string;
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { tenant, user } = useAuthContext();
  const { branchId: filterBranchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async ({ items, movement_type, technician_id, service_order_id, reason, branch_id }: CreateMovementInput) => {
      if (!tenant?.id || !user?.id) throw new Error('Dados não encontrados');
      
      // Auto-fill branch_id if user is branch-scoped and not explicitly provided
      const effectiveBranchId = branch_id ?? (shouldFilter ? filterBranchId : null);

      const movements = [];

      for (const item of items) {
        // Get product info
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) throw new Error('Produto não encontrado');

        const previousStock = product.current_stock || 0;
        let newStock = previousStock;

        // Calculate new stock based on movement type
        if (movement_type === 'entrada' || movement_type === 'devolucao') {
          newStock = previousStock + item.quantity;
        } else if (movement_type === 'saida') {
          newStock = previousStock - item.quantity;
          if (newStock < 0) {
            throw new Error(`Estoque insuficiente para ${product.name}`);
          }
        }

        // Create movement record
        const { data: movement, error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            tenant_id: tenant.id,
            branch_id: effectiveBranchId || null,
            product_id: item.product_id,
            serial_number_id: item.serial_number_id || null,
            movement_type,
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reason: reason || (movement_type === 'saida' 
              ? `Saída - ${technician_id ? 'Técnico' : 'Manual'}` 
              : `Entrada/Devolução`),
            reference_type: service_order_id ? 'service_order' : (technician_id ? 'technician' : null),
            reference_id: service_order_id || technician_id || null,
            created_by: user.id,
          })
          .select()
          .single();

        if (movementError) throw movementError;
        movements.push(movement);

        // Update product stock
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: newStock })
          .eq('id', item.product_id);

        if (updateError) throw updateError;

        // If serialized product and it's a saida, update serial number status
        if (product.is_serialized && item.serial_number_id && movement_type === 'saida') {
          const { error: serialError } = await supabase
            .from('serial_numbers')
            .update({
              status: 'em_uso',
              assigned_to: technician_id || null,
              assigned_at: new Date().toISOString(),
            })
            .eq('id', item.serial_number_id);

          if (serialError) throw serialError;
        }

        // If devolucao, update serial number back to disponivel
        if (product.is_serialized && item.serial_number_id && movement_type === 'devolucao') {
          const { error: serialError } = await supabase
            .from('serial_numbers')
            .update({
              status: 'disponivel',
              assigned_to: null,
              assigned_at: null,
            })
            .eq('id', item.serial_number_id);

          if (serialError) throw serialError;
        }
      }

      return movements;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['serial_numbers'] });
      
      const typeLabels: Record<MovementType, string> = {
        entrada: 'Entrada registrada',
        saida: 'Saída registrada',
        transferencia: 'Transferência registrada',
        ajuste: 'Ajuste registrado',
        devolucao: 'Devolução registrada',
      };
      toast.success(typeLabels[vars.movement_type] + ' com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro: ' + error.message);
    },
  });
}
