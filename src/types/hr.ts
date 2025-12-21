export type EmployeeStatus = 'ativo' | 'ferias' | 'afastado' | 'desligado';
export type ContractType = 'clt' | 'pj' | 'estagio' | 'temporario' | 'autonomo';
export type VacationStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'em_gozo' | 'concluida';
export type LeaveType = 'atestado_medico' | 'licenca_maternidade' | 'licenca_paternidade' | 'acidente_trabalho' | 'falta_justificada' | 'falta_injustificada' | 'outro';

export interface Dependent {
  name: string;
  birth_date: string;
  relationship: string;
  cpf?: string;
}

export interface EmployeeDocument {
  name: string;
  url: string;
  type: string;
  uploaded_at: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  branch_id?: string;
  user_id?: string;
  
  // Dados pessoais
  name: string;
  cpf?: string;
  rg?: string;
  birth_date?: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  
  // Contato
  email?: string;
  phone?: string;
  phone2?: string;
  
  // Endereço
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  
  // Dados profissionais
  registration_number?: string;
  position?: string;
  department?: string;
  contract_type: ContractType;
  hire_date?: string;
  termination_date?: string;
  termination_reason?: string;
  
  // Dados bancários
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: string;
  pix_key?: string;
  
  // Remuneração
  base_salary: number;
  hourly_rate?: number;
  
  // Tamanhos de uniforme
  blusa_numero?: string;
  calca_numero?: string;
  calcado_numero?: string;
  
  // Status
  status: EmployeeStatus;
  is_technician: boolean;
  photo_url?: string;
  notes?: string;
  
  dependents: Dependent[];
  documents: EmployeeDocument[];
  
  created_at: string;
  updated_at: string;
}

export interface Vacation {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee?: Employee;
  
  acquisition_start: string;
  acquisition_end: string;
  start_date: string;
  end_date: string;
  days_taken: number;
  sold_days: number;
  
  status: VacationStatus;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Leave {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee?: Employee;
  
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  
  doctor_name?: string;
  crm?: string;
  cid?: string;
  document_url?: string;
  
  notes?: string;
  registered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee?: Employee;
  
  reference_month: number;
  reference_year: number;
  
  // Proventos
  base_salary: number;
  overtime_hours: number;
  overtime_value: number;
  night_shift_hours: number;
  night_shift_value: number;
  bonuses: number;
  commissions: number;
  other_earnings: number;
  total_earnings: number;
  
  // Descontos
  inss_value: number;
  inss_rate: number;
  irrf_value: number;
  irrf_rate: number;
  fgts_value: number;
  fgts_rate: number;
  transport_discount: number;
  meal_discount: number;
  healthcare_discount: number;
  other_discounts: number;
  total_discounts: number;
  
  net_salary: number;
  
  earnings_details: any[];
  discounts_details: any[];
  
  status: 'rascunho' | 'calculada' | 'aprovada' | 'paga';
  calculated_at?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeHistory {
  id: string;
  tenant_id: string;
  employee_id: string;
  
  event_type: string;
  event_date: string;
  description?: string;
  old_value?: string;
  new_value?: string;
  
  registered_by?: string;
  created_at: string;
}

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  estagio: 'Estágio',
  temporario: 'Temporário',
  autonomo: 'Autônomo',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ativo: 'Ativo',
  ferias: 'Férias',
  afastado: 'Afastado',
  desligado: 'Desligado',
};

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  em_gozo: 'Em Gozo',
  concluida: 'Concluída',
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  atestado_medico: 'Atestado Médico',
  licenca_maternidade: 'Licença Maternidade',
  licenca_paternidade: 'Licença Paternidade',
  acidente_trabalho: 'Acidente de Trabalho',
  falta_justificada: 'Falta Justificada',
  falta_injustificada: 'Falta Injustificada',
  outro: 'Outro',
};

export interface EPIAssignment {
  id: string;
  tenant_id: string;
  employee_id: string;
  product_id?: string;
  description: string;
  ca_number?: string;
  quantity: number;
  size?: string;
  delivery_date: string;
  return_date?: string;
  return_reason?: string;
  signature_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
