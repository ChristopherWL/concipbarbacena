import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranchFilter } from './useBranchFilter';
import { useHierarchyFilter } from './useHierarchyFilter';

export function useDashboardStats() {
  const { branchId, shouldFilter } = useBranchFilter();
  const { level, technicianId, employeeId, ledTeamIds } = useHierarchyFilter();

  return useQuery({
    queryKey: ['dashboard-stats', branchId, level, technicianId, ledTeamIds],
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
    queryFn: async () => {
      // Get products count and stock alerts
      let productsQuery = supabase
        .from('products')
        .select('id, current_stock, min_stock, is_active')
        .eq('is_active', true)
        .not('branch_id', 'is', null); // Only count products with a branch assigned
      
      if (shouldFilter && branchId) {
        productsQuery = productsQuery.eq('branch_id', branchId);
      }

      const { data: products, error: productsError } = await productsQuery;

      if (productsError) throw productsError;

      const totalProducts = products?.length || 0;
      const lowStockProducts = products?.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)) || [];
      const totalStock = products?.reduce((acc, p) => acc + (p.current_stock || 0), 0) || 0;

      // Get vehicles count
      let vehiclesQuery = supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (shouldFilter && branchId) {
        vehiclesQuery = vehiclesQuery.eq('branch_id', branchId);
      }

      const { count: vehiclesCount, error: vehiclesError } = await vehiclesQuery;

      if (vehiclesError) throw vehiclesError;

      // Get maintenances in progress
      let maintQuery = supabase
        .from('maintenances')
        .select('id', { count: 'exact', head: true })
        .in('status', ['agendada', 'em_andamento']);
      
      if (shouldFilter && branchId) {
        maintQuery = maintQuery.eq('branch_id', branchId);
      }

      const { count: maintenancesInProgress } = await maintQuery;

      // Get technicians count
      let techQuery = supabase
        .from('technicians')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (shouldFilter && branchId) {
        techQuery = techQuery.eq('branch_id', branchId);
      }

      const { count: techniciansCount, error: techError } = await techQuery;

      if (techError) throw techError;

      // Get service orders stats with hierarchy filter
      let osQuery = supabase
        .from('service_orders')
        .select('id, status, created_at, team_id');
      
      if (shouldFilter && branchId) {
        osQuery = osQuery.eq('branch_id', branchId);
      }

      // Apply hierarchy filter for service orders
      if (level === 'technician' && technicianId) {
        // Technician only sees their assigned orders
        const { data: assignedOrders } = await supabase
          .from('service_order_technicians')
          .select('service_order_id')
          .eq('technician_id', technicianId);
        
        const orderIds = assignedOrders?.map(o => o.service_order_id) || [];
        if (orderIds.length > 0) {
          osQuery = osQuery.in('id', orderIds);
        } else {
          // No assigned orders - return empty
          return {
            totalStock,
            totalProducts,
            lowStockProducts,
            vehiclesCount: vehiclesCount || 0,
            maintenancesInProgress: maintenancesInProgress || 0,
            techniciansCount: techniciansCount || 0,
            osThisMonth: 0,
            osChange: 0,
            openOS: 0,
            inProgressOS: 0,
            completedOS: 0,
            totalOS: 0,
          };
        }
      } else if (level === 'supervisor' && ledTeamIds.length > 0) {
        // Supervisor sees orders from their teams
        osQuery = osQuery.in('team_id', ledTeamIds);
      }

      const { data: serviceOrders, error: osError } = await osQuery;

      if (osError) throw osError;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const osThisMonth = serviceOrders?.filter(os => {
        const date = new Date(os.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }) || [];

      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const osLastMonth = serviceOrders?.filter(os => {
        const date = new Date(os.created_at);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      }) || [];

      const osChange = osLastMonth.length > 0 
        ? Math.round(((osThisMonth.length - osLastMonth.length) / osLastMonth.length) * 100)
        : 0;

      const openOS = serviceOrders?.filter(os => os.status === 'aberta').length || 0;
      const inProgressOS = serviceOrders?.filter(os => os.status === 'em_andamento').length || 0;
      const completedOS = serviceOrders?.filter(os => os.status === 'concluida').length || 0;

      return {
        totalStock,
        totalProducts,
        lowStockProducts,
        vehiclesCount: vehiclesCount || 0,
        maintenancesInProgress: maintenancesInProgress || 0,
        techniciansCount: techniciansCount || 0,
        osThisMonth: osThisMonth.length,
        osChange,
        openOS,
        inProgressOS,
        completedOS,
        totalOS: serviceOrders?.length || 0,
      };
    },
  });
}

export function useRecentActivities() {
  const { branchId, shouldFilter } = useBranchFilter();
  const { level, technicianId, ledTeamIds } = useHierarchyFilter();

  return useQuery({
    queryKey: ['recent-activities', branchId, level, technicianId, ledTeamIds],
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      // Get recent stock movements
      let movementsQuery = supabase
        .from('stock_movements')
        .select('id, movement_type, quantity, created_at, branch_id, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (shouldFilter && branchId) {
        movementsQuery = movementsQuery.eq('branch_id', branchId);
      }

      const { data: movements } = await movementsQuery;

      // Get recent service orders with hierarchy filter
      let ordersQuery = supabase
        .from('service_orders')
        .select('id, order_number, status, title, created_at, team_id, customer:customers(name)')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (shouldFilter && branchId) {
        ordersQuery = ordersQuery.eq('branch_id', branchId);
      }

      // Apply hierarchy filter
      if (level === 'technician' && technicianId) {
        const { data: assignedOrders } = await supabase
          .from('service_order_technicians')
          .select('service_order_id')
          .eq('technician_id', technicianId);
        
        const orderIds = assignedOrders?.map(o => o.service_order_id) || [];
        if (orderIds.length > 0) {
          ordersQuery = ordersQuery.in('id', orderIds);
        }
      } else if (level === 'supervisor' && ledTeamIds.length > 0) {
        ordersQuery = ordersQuery.in('team_id', ledTeamIds);
      }

      const { data: orders } = await ordersQuery;

      // Get recent maintenances
      let maintQuery = supabase
        .from('maintenances')
        .select('id, description, status, created_at, vehicle:vehicles(plate, model)')
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (shouldFilter && branchId) {
        maintQuery = maintQuery.eq('branch_id', branchId);
      }

      const { data: maintenances } = await maintQuery;

      const activities: Array<{
        id: string;
        type: string;
        action: string;
        description: string;
        time: string;
      }> = [];

      movements?.forEach(m => {
        const productName = (m.product as any)?.name || 'Produto';
        activities.push({
          id: m.id,
          type: 'stock',
          action: m.movement_type === 'entrada' ? 'Entrada de estoque' : 'Saída de estoque',
          description: `${productName} - ${m.quantity} unidades`,
          time: m.created_at,
        });
      });

      orders?.forEach(o => {
        const customerName = (o.customer as any)?.name || 'Cliente';
        activities.push({
          id: o.id,
          type: 'service_order',
          action: o.status === 'concluida' ? 'OS Concluída' : 'Nova OS',
          description: `OS #${o.order_number} - ${customerName}`,
          time: o.created_at,
        });
      });

      maintenances?.forEach(m => {
        const vehicle = m.vehicle as any;
        activities.push({
          id: m.id,
          type: 'maintenance',
          action: m.status === 'concluida' ? 'Manutenção concluída' : 'Manutenção agendada',
          description: `${vehicle?.model || 'Veículo'} - ${vehicle?.plate || ''}`,
          time: m.created_at,
        });
      });

      // Sort by time and take top 6
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 6);
    },
  });
}

export function useStockAlerts() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['stock-alerts', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      // Low stock alerts
      let lowStockQuery = supabase
        .from('products')
        .select('id, name, current_stock, min_stock')
        .eq('is_active', true)
        .not('branch_id', 'is', null); // Only count products with a branch assigned
      
      if (shouldFilter && branchId) {
        lowStockQuery = lowStockQuery.eq('branch_id', branchId);
      }

      const { data: lowStock } = await lowStockQuery;

      const alerts: Array<{
        id: string;
        type: 'warning' | 'info' | 'error';
        message: string;
        entity: string;
      }> = [];

      lowStock?.forEach(p => {
        if ((p.current_stock || 0) <= (p.min_stock || 0)) {
          alerts.push({
            id: p.id,
            type: (p.current_stock || 0) === 0 ? 'error' : 'warning',
            message: `Estoque baixo: ${p.name} (${p.current_stock} unidades)`,
            entity: 'product',
          });
        }
      });

      // Pending maintenances
      let pendingMaintQuery = supabase
        .from('maintenances')
        .select('id, description, scheduled_date, vehicle:vehicles(plate)')
        .eq('status', 'agendada')
        .order('scheduled_date', { ascending: true })
        .limit(3);
      
      if (shouldFilter && branchId) {
        pendingMaintQuery = pendingMaintQuery.eq('branch_id', branchId);
      }

      const { data: pendingMaint } = await pendingMaintQuery;

      pendingMaint?.forEach(m => {
        const vehicle = m.vehicle as any;
        alerts.push({
          id: m.id,
          type: 'info',
          message: `Manutenção: ${m.description} - ${vehicle?.plate || ''}`,
          entity: 'maintenance',
        });
      });

      return alerts.slice(0, 5);
    },
  });
}

export function useOSByStatusChart() {
  const { branchId, shouldFilter } = useBranchFilter();
  const { level, technicianId, ledTeamIds } = useHierarchyFilter();

  return useQuery({
    queryKey: ['os-by-status-chart', branchId, level, technicianId, ledTeamIds],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('status, team_id, id');
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      // Apply hierarchy filter
      if (level === 'technician' && technicianId) {
        const { data: assignedOrders } = await supabase
          .from('service_order_technicians')
          .select('service_order_id')
          .eq('technician_id', technicianId);
        
        const orderIds = assignedOrders?.map(o => o.service_order_id) || [];
        if (orderIds.length > 0) {
          query = query.in('id', orderIds);
        } else {
          return [];
        }
      } else if (level === 'supervisor' && ledTeamIds.length > 0) {
        query = query.in('team_id', ledTeamIds);
      }

      const { data } = await query;

      const statusCounts: Record<string, number> = {
        aberta: 0,
        em_andamento: 0,
        aguardando: 0,
        concluida: 0,
        cancelada: 0,
      };

      data?.forEach(os => {
        if (os.status && statusCounts[os.status] !== undefined) {
          statusCounts[os.status]++;
        }
      });

      return [
        { name: 'Abertas', value: statusCounts.aberta, fill: 'hsl(217, 91%, 60%)' },
        { name: 'Em Andamento', value: statusCounts.em_andamento, fill: 'hsl(38, 92%, 50%)' },
        { name: 'Aguardando', value: statusCounts.aguardando, fill: 'hsl(199, 89%, 48%)' },
        { name: 'Concluídas', value: statusCounts.concluida, fill: 'hsl(142, 76%, 36%)' },
        { name: 'Canceladas', value: statusCounts.cancelada, fill: 'hsl(0, 84%, 60%)' },
      ].filter(item => item.value > 0);
    },
  });
}

export function useStockByCategory() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['stock-by-category', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('category, current_stock, cost_price')
        .eq('is_active', true)
        .not('branch_id', 'is', null); // Only count products with a branch assigned
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const categoryTotals: Record<string, { count: number; value: number }> = {
        epi: { count: 0, value: 0 },
        epc: { count: 0, value: 0 },
        ferramentas: { count: 0, value: 0 },
        materiais: { count: 0, value: 0 },
        equipamentos: { count: 0, value: 0 },
      };

      data?.forEach(p => {
        if (p.category && categoryTotals[p.category] !== undefined) {
          categoryTotals[p.category].count += p.current_stock || 0;
          categoryTotals[p.category].value += (p.current_stock || 0) * (p.cost_price || 0);
        }
      });

      return [
        { name: 'Materiais', value: categoryTotals.materiais.count, total: categoryTotals.materiais.value, color: '#3b82f6' },
        { name: 'Equipamentos', value: categoryTotals.equipamentos.count, total: categoryTotals.equipamentos.value, color: '#06b6d4' },
        { name: 'Ferramentas', value: categoryTotals.ferramentas.count, total: categoryTotals.ferramentas.value, color: '#f59e0b' },
        { name: 'EPI', value: categoryTotals.epi.count, total: categoryTotals.epi.value, color: '#10b981' },
        { name: 'EPC', value: categoryTotals.epc.count, total: categoryTotals.epc.value, color: '#ef4444' },
      ];
    },
  });
}

export function useOSTrend() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['os-trend', branchId],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      
      let query = supabase
        .from('service_orders')
        .select('created_at, status')
        .gte('created_at', sixMonthsAgo.toISOString());
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          month: date.getMonth(),
          year: date.getFullYear(),
          total: 0,
          concluidas: 0,
        });
      }

      data?.forEach(os => {
        const date = new Date(os.created_at);
        const monthData = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthData) {
          monthData.total++;
          if (os.status === 'concluida') monthData.concluidas++;
        }
      });

      return months.map(m => ({ name: m.name, os: m.total, concluidas: m.concluidas }));
    },
  });
}

export function useStockMovementsTrend() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['stock-movements-trend', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      let query = supabase
        .from('stock_movements')
        .select('created_at, movement_type, quantity')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const days: Record<string, { entradas: number; saidas: number }> = {};
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        days[key] = { entradas: 0, saidas: 0 };
      }

      data?.forEach(m => {
        const date = new Date(m.created_at).toISOString().split('T')[0];
        if (days[date]) {
          if (m.movement_type === 'entrada') {
            days[date].entradas += m.quantity || 0;
          } else {
            days[date].saidas += m.quantity || 0;
          }
        }
      });

      return Object.entries(days).map(([date, values]) => ({
        name: dayNames[new Date(date).getDay()],
        entradas: values.entradas,
        saidas: values.saidas,
      }));
    },
  });
}

export function useEmployeesStats() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['employees-stats', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, status, is_technician, department')
        .not('branch_id', 'is', null); // Only count employees with a branch assigned
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const total = data?.length || 0;
      const active = data?.filter(e => e.status === 'ativo').length || 0;
      const technicians = data?.filter(e => e.is_technician).length || 0;
      const onLeave = data?.filter(e => e.status === 'afastado').length || 0;

      return { total, active, technicians, onLeave };
    },
  });
}

export function useObrasStats() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['obras-stats', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      let query = supabase
        .from('obras')
        .select('id, status, progresso, valor_contrato')
        .not('branch_id', 'is', null); // Only count obras with a branch assigned
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const total = data?.length || 0;
      const active = data?.filter(o => o.status === 'em_andamento').length || 0;
      const completed = data?.filter(o => o.status === 'concluida').length || 0;
      const totalValue = data?.reduce((acc, o) => acc + (o.valor_contrato || 0), 0) || 0;
      const avgProgress = total > 0 ? Math.round(data?.reduce((acc, o) => acc + (o.progresso || 0), 0) / total) : 0;

      return { total, active, completed, totalValue, avgProgress };
    },
  });
}

export function useStockValue() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['stock-value', branchId],
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('current_stock, cost_price')
        .eq('is_active', true)
        .not('branch_id', 'is', null); // Only count products with a branch assigned
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const totalValue = data?.reduce((acc, p) => acc + ((p.current_stock || 0) * (p.cost_price || 0)), 0) || 0;
      
      return totalValue;
    },
  });
}

export function useTodayMovements() {
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['today-movements', branchId],
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let query = supabase
        .from('stock_movements')
        .select('movement_type, quantity')
        .gte('created_at', today.toISOString());
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data } = await query;

      const entradas = data?.filter(m => m.movement_type === 'entrada').reduce((acc, m) => acc + (m.quantity || 0), 0) || 0;
      const saidas = data?.filter(m => m.movement_type === 'saida').reduce((acc, m) => acc + (m.quantity || 0), 0) || 0;

      return { entradas, saidas };
    },
  });
}

export function usePendingOS() {
  const { branchId, shouldFilter } = useBranchFilter();
  const { level, technicianId, ledTeamIds } = useHierarchyFilter();

  return useQuery({
    queryKey: ['pending-os', branchId, level, technicianId, ledTeamIds],
    staleTime: 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    queryFn: async () => {
      let query = supabase
        .from('service_orders')
        .select('id, order_number, title, status, scheduled_date, customer:customers(name), team:teams(name)')
        .in('status', ['aberta', 'em_andamento', 'aguardando'])
        .order('scheduled_date', { ascending: true })
        .limit(5);
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (level === 'technician' && technicianId) {
        const { data: assignedOrders } = await supabase
          .from('service_order_technicians')
          .select('service_order_id')
          .eq('technician_id', technicianId);
        
        const orderIds = assignedOrders?.map(o => o.service_order_id) || [];
        if (orderIds.length > 0) {
          query = query.in('id', orderIds);
        } else {
          return [];
        }
      } else if (level === 'supervisor' && ledTeamIds.length > 0) {
        query = query.in('team_id', ledTeamIds);
      }

      const { data } = await query;
      
      return data?.map(os => ({
        id: os.id,
        orderNumber: os.order_number,
        title: os.title,
        status: os.status,
        scheduledDate: os.scheduled_date,
        customer: (os.customer as any)?.name,
        team: (os.team as any)?.name,
      })) || [];
    },
  });
}
