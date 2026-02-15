// Fleet Types
export type MaintenanceType = 'preventiva' | 'corretiva';
export type MaintenanceStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  preventiva: 'Preventiva',
  corretiva: 'Corretiva',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export interface Vehicle {
  id: string;
  tenant_id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  chassis?: string;
  renavam?: string;
  fleet_number?: string;
  fuel_type: string;
  current_km: number;
  image_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  maintenance_type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  scheduled_date?: string;
  scheduled_km?: number;
  completed_date?: string;
  completed_km?: number;
  cost: number;
  supplier?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FuelLog {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  supplier_id?: string;
  supplier?: { id: string; name: string };
  date: string;
  km_at_fill: number;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  fuel_type?: string;
  full_tank: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
}
