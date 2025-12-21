import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface BranchStats {
  branchId: string;
  branchName: string;
  isMain: boolean;
  products: number;
  stockValue: number;
  employees: number;
  vehicles: number;
  osThisMonth: number;
  openOS: number;
  completedOS: number;
  obras: number;
}

export function useConsolidatedStats() {
  const { tenant } = useAuthContext();

  return useQuery({
    queryKey: ['consolidated-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      // Fetch all branches
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name, is_main')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('is_main', { ascending: false })
        .order('name');

      if (!branches || branches.length === 0) return null;

      // Fetch all data in parallel - only items with branch_id
      const [productsRes, employeesRes, vehiclesRes, osRes, obrasRes] = await Promise.all([
        supabase.from('products').select('id, branch_id, current_stock, cost_price').eq('is_active', true).not('branch_id', 'is', null),
        supabase.from('employees').select('id, branch_id').eq('status', 'ativo').not('branch_id', 'is', null),
        supabase.from('vehicles').select('id, branch_id').eq('is_active', true).not('branch_id', 'is', null),
        supabase.from('service_orders').select('id, branch_id, status, created_at').not('branch_id', 'is', null),
        supabase.from('obras').select('id, branch_id, status').not('branch_id', 'is', null),
      ]);

      const products = productsRes.data || [];
      const employees = employeesRes.data || [];
      const vehicles = vehiclesRes.data || [];
      const serviceOrders = osRes.data || [];
      const obras = obrasRes.data || [];

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Calculate stats per branch
      const branchStats: BranchStats[] = branches.map(branch => {
        const branchProducts = products.filter(p => p.branch_id === branch.id);
        const branchEmployees = employees.filter(e => e.branch_id === branch.id);
        const branchVehicles = vehicles.filter(v => v.branch_id === branch.id);
        const branchOS = serviceOrders.filter(os => os.branch_id === branch.id);
        const branchObras = obras.filter(o => o.branch_id === branch.id);

        const osThisMonth = branchOS.filter(os => {
          const date = new Date(os.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        return {
          branchId: branch.id,
          branchName: branch.name,
          isMain: branch.is_main || false,
          products: branchProducts.length,
          stockValue: branchProducts.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.cost_price || 0)), 0),
          employees: branchEmployees.length,
          vehicles: branchVehicles.length,
          osThisMonth: osThisMonth.length,
          openOS: branchOS.filter(os => os.status === 'aberta').length,
          completedOS: branchOS.filter(os => os.status === 'concluida').length,
          obras: branchObras.filter(o => o.status === 'em_andamento').length,
        };
      });

      // Calculate totals
      const totals = {
        products: branchStats.reduce((acc, b) => acc + b.products, 0),
        stockValue: branchStats.reduce((acc, b) => acc + b.stockValue, 0),
        employees: branchStats.reduce((acc, b) => acc + b.employees, 0),
        vehicles: branchStats.reduce((acc, b) => acc + b.vehicles, 0),
        osThisMonth: branchStats.reduce((acc, b) => acc + b.osThisMonth, 0),
        openOS: branchStats.reduce((acc, b) => acc + b.openOS, 0),
        completedOS: branchStats.reduce((acc, b) => acc + b.completedOS, 0),
        obras: branchStats.reduce((acc, b) => acc + b.obras, 0),
      };

      return {
        branches: branchStats,
        totals,
      };
    },
    enabled: !!tenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
