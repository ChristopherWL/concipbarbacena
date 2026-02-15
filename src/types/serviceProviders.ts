export type PaymentType = 'diaria' | 'hora' | 'por_os' | 'mensal';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  diaria: 'Diária',
  hora: 'Por Hora',
  por_os: 'Por OS',
  mensal: 'Mensal',
};

export interface ServiceProvider {
  id: string;
  tenant_id: string;
  branch_id?: string;
  name: string;
  document_type?: string;
  document?: string;
  rg?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  specialty?: string;
  skills?: string[];
  notes?: string;
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: string;
  pix_key?: string;
  payment_type: PaymentType;
  daily_rate?: number;
  hourly_rate?: number;
  rate_per_os?: number;
  monthly_rate?: number;
  monthly_due_day?: number;
  monthly_payment_day?: number;
  is_active: boolean;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceProviderAssignment {
  id: string;
  tenant_id: string;
  service_provider_id: string;
  service_provider?: ServiceProvider;
  service_order_id: string;
  service_order?: {
    id: string;
    order_number: number;
    title: string;
    status: string;
    customer?: { name: string };
  };
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  hours_worked?: number;
  days_worked?: number;
  payment_type: PaymentType;
  rate_applied: number;
  total_amount?: number;
  is_paid: boolean;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceProviderPayment {
  id: string;
  tenant_id: string;
  service_provider_id: string;
  service_provider?: ServiceProvider;
  reference_month: number;
  reference_year: number;
  total_os_count: number;
  total_days_worked: number;
  total_hours_worked: number;
  total_amount: number;
  status: string;
  paid_at?: string;
  paid_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
