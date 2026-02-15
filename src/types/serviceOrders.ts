export type ServiceOrderStatus = 'aberta' | 'em_andamento' | 'aguardando' | 'concluida' | 'cancelada';
export type PriorityLevel = 'baixa' | 'media' | 'alta' | 'urgente';

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em Andamento',
  aguardando: 'Aguardando',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-info text-info-foreground',
  alta: 'bg-warning text-warning-foreground',
  urgente: 'bg-destructive text-destructive-foreground',
};

export interface Customer {
  id: string;
  tenant_id: string;
  type: 'pf' | 'pj';
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_name?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrder {
  id: string;
  tenant_id: string;
  order_number: number;
  customer_id: string;
  customer?: Customer;
  team_id?: string;
  team?: import('./teams').Team;
  status: ServiceOrderStatus;
  priority: PriorityLevel;
  title: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  address?: string;
  city?: string;
  state?: string;
  estimated_hours?: number;
  actual_hours?: number;
  labor_cost: number;
  materials_cost: number;
  total_cost: number;
  notes?: string;
  internal_notes?: string;
  signature_url?: string;
  photos: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: ServiceOrderItem[];
  technicians?: ServiceOrderTechnician[];
}

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  product_id: string;
  product?: import('./stock').Product;
  serial_number_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface ServiceOrderTechnician {
  id: string;
  service_order_id: string;
  technician_id: string;
  technician?: import('./teams').Technician;
  hours_worked?: number;
  notes?: string;
  created_at: string;
}
