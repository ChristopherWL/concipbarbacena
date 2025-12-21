import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';
import type { Payroll, Employee } from '@/types/hr';

// Tabelas INSS 2024
const INSS_RATES = [
  { min: 0, max: 1412, rate: 0.075 },
  { min: 1412.01, max: 2666.68, rate: 0.09 },
  { min: 2666.69, max: 4000.03, rate: 0.12 },
  { min: 4000.04, max: 7786.02, rate: 0.14 },
];

// Tabela IRRF 2024
const IRRF_RATES = [
  { min: 0, max: 2259.20, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 },
];

export function usePayrolls() {
  const { tenant, user } = useAuth();
  const { branchId, shouldFilter } = useBranchFilter();
  const tenantId = tenant?.id;
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayrolls = async (month?: number, year?: number) => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('payrolls')
        .select(`
          *,
          employee:employees!inner(id, name, position, department, base_salary, branch_id)
        `)
        .eq('tenant_id', tenantId);

      if (month) query = query.eq('reference_month', month);
      if (year) query = query.eq('reference_year', year);

      if (shouldFilter && branchId) {
        query = query.eq('employee.branch_id', branchId);
      } else {
        query = query.not('employee.branch_id', 'is', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPayrolls((data || []) as unknown as Payroll[]);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      toast.error('Erro ao carregar folha de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateINSS = (salary: number): { value: number; rate: number } => {
    let inss = 0;
    let previousMax = 0;

    for (const bracket of INSS_RATES) {
      if (salary > bracket.min) {
        const taxableAmount = Math.min(salary, bracket.max) - previousMax;
        inss += taxableAmount * bracket.rate;
        previousMax = bracket.max;
      }
    }

    const effectiveRate = salary > 0 ? (inss / salary) * 100 : 0;
    return { value: Math.min(inss, 908.85), rate: effectiveRate }; // Teto INSS 2024
  };

  const calculateIRRF = (salaryAfterINSS: number, dependents: number = 0): { value: number; rate: number } => {
    const dependentDeduction = dependents * 189.59;
    const taxableBase = salaryAfterINSS - dependentDeduction;

    for (const bracket of IRRF_RATES) {
      if (taxableBase >= bracket.min && taxableBase <= bracket.max) {
        const irrf = taxableBase * bracket.rate - bracket.deduction;
        return { value: Math.max(0, irrf), rate: bracket.rate * 100 };
      }
    }

    return { value: 0, rate: 0 };
  };

  const calculatePayroll = async (employeeId: string, month: number, year: number, extras?: {
    overtime_hours?: number;
    overtime_value?: number;
    bonuses?: number;
    commissions?: number;
    other_earnings?: number;
    transport_discount?: number;
    meal_discount?: number;
    healthcare_discount?: number;
    other_discounts?: number;
  }) => {
    if (!tenantId) return null;

    try {
      // Buscar dados do colaborador
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (empError) throw empError;

      const baseSalary = Number(employee.base_salary) || 0;
      const overtimeValue = extras?.overtime_value || 0;
      const bonuses = extras?.bonuses || 0;
      const commissions = extras?.commissions || 0;
      const otherEarnings = extras?.other_earnings || 0;

      const totalEarnings = baseSalary + overtimeValue + bonuses + commissions + otherEarnings;

      // Calcular INSS
      const inss = calculateINSS(totalEarnings);

      // Calcular IRRF
      const dependentsCount = (employee.dependents as any[])?.length || 0;
      const irrf = calculateIRRF(totalEarnings - inss.value, dependentsCount);

      // FGTS (8%)
      const fgtsValue = totalEarnings * 0.08;

      // Descontos
      const transportDiscount = extras?.transport_discount || 0;
      const mealDiscount = extras?.meal_discount || 0;
      const healthcareDiscount = extras?.healthcare_discount || 0;
      const otherDiscounts = extras?.other_discounts || 0;

      const totalDiscounts = inss.value + irrf.value + transportDiscount + mealDiscount + healthcareDiscount + otherDiscounts;
      const netSalary = totalEarnings - totalDiscounts;

      const payrollData = {
        tenant_id: tenantId,
        employee_id: employeeId,
        reference_month: month,
        reference_year: year,
        base_salary: baseSalary,
        overtime_hours: extras?.overtime_hours || 0,
        overtime_value: overtimeValue,
        night_shift_hours: 0,
        night_shift_value: 0,
        bonuses,
        commissions,
        other_earnings: otherEarnings,
        total_earnings: totalEarnings,
        inss_value: inss.value,
        inss_rate: inss.rate,
        irrf_value: irrf.value,
        irrf_rate: irrf.rate,
        fgts_value: fgtsValue,
        fgts_rate: 8,
        transport_discount: transportDiscount,
        meal_discount: mealDiscount,
        healthcare_discount: healthcareDiscount,
        other_discounts: otherDiscounts,
        total_discounts: totalDiscounts,
        net_salary: netSalary,
        status: 'calculada',
        calculated_at: new Date().toISOString(),
      };

      // Verificar se já existe
      const { data: existing } = await supabase
        .from('payrolls')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('employee_id', employeeId)
        .eq('reference_month', month)
        .eq('reference_year', year)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('payrolls')
          .update(payrollData)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('payrolls')
          .insert(payrollData)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      toast.success('Folha calculada com sucesso!');
      await fetchPayrolls(month, year);
      return result;
    } catch (error: any) {
      console.error('Error calculating payroll:', error);
      toast.error(error.message || 'Erro ao calcular folha');
      return null;
    }
  };

  const approvePayroll = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payrolls')
        .update({
          status: 'aprovada',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Folha aprovada!');
      await fetchPayrolls();
      return true;
    } catch (error: any) {
      console.error('Error approving payroll:', error);
      toast.error(error.message || 'Erro ao aprovar folha');
      return false;
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payrolls')
        .update({
          status: 'paga',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Pagamento registrado!');
      await fetchPayrolls();
      return true;
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
      return false;
    }
  };

  const deletePayroll = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payrolls')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Folha excluída');
      await fetchPayrolls();
      return true;
    } catch (error: any) {
      console.error('Error deleting payroll:', error);
      toast.error(error.message || 'Erro ao excluir folha');
      return false;
    }
  };

  useEffect(() => {
    const now = new Date();
    fetchPayrolls(now.getMonth() + 1, now.getFullYear());
  }, [tenantId]);

  return {
    payrolls,
    isLoading,
    fetchPayrolls,
    calculatePayroll,
    approvePayroll,
    markAsPaid,
    deletePayroll,
    calculateINSS,
    calculateIRRF,
  };
}
