export interface Technician {
  id: string;
  tenant_id: string;
  user_id?: string;
  name: string;
  cpf?: string;
  rg?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  hire_date?: string;
  position?: string;
  hourly_rate?: number;
  photo_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  position?: string;
  photo_url?: string;
}

export interface Team {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  leader_id?: string;
  leader?: Technician;
  leader_employee_id?: string;
  leader_employee?: Employee;
  vehicle_id?: string;
  vehicle?: Vehicle;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  technician_id?: string;
  technician?: Technician;
  employee_id?: string;
  employee?: Employee;
  joined_at: string;
}

export interface AssetAssignment {
  id: string;
  tenant_id: string;
  technician_id: string;
  technician?: Technician;
  asset_type: 'vehicle' | 'serial_number' | 'product';
  vehicle_id?: string;
  serial_number_id?: string;
  product_id?: string;
  quantity: number;
  assigned_at: string;
  returned_at?: string;
  expected_return?: string;
  notes?: string;
  assigned_by?: string;
  created_at: string;
}
