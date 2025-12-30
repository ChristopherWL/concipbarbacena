export type StockCategory = 'epi' | 'epc' | 'ferramentas' | 'materiais' | 'equipamentos';
export type SerialStatus = 'disponivel' | 'em_uso' | 'em_manutencao' | 'descartado';
export type MovementType = 'entrada' | 'saida' | 'transferencia' | 'ajuste' | 'devolucao';

export const CATEGORY_LABELS: Record<StockCategory, string> = {
  epi: 'EPI',
  epc: 'EPC',
  ferramentas: 'Ferramentas',
  materiais: 'Materiais',
  equipamentos: 'Equipamentos',
};

export const SERIAL_STATUS_LABELS: Record<SerialStatus, string> = {
  disponivel: 'Disponível',
  em_uso: 'Em Uso',
  em_manutencao: 'Em Manutenção',
  descartado: 'Descartado',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência',
  ajuste: 'Ajuste',
  devolucao: 'Devolução',
};

export type SupplierCategory = 'geral' | 'combustivel' | 'pecas' | 'materiais' | 'servicos' | 'epi' | 'ferramentas';

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  geral: 'Geral',
  combustivel: 'Combustível',
  pecas: 'Peças e Acessórios',
  materiais: 'Materiais',
  servicos: 'Serviços',
  epi: 'EPI/EPC',
  ferramentas: 'Ferramentas',
};

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  contact_name?: string;
  notes?: string;
  category?: SupplierCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  category: StockCategory;
  unit: string;
  is_serialized: boolean;
  min_stock: number;
  max_stock?: number;
  current_stock: number;
  cost_price: number;
  sale_price?: number;
  location?: string;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // EPI-specific fields
  epi_type?: string;
  ca_number?: string;
  ca_validity?: string;
  size?: string;
  applicable_norm?: string;
  // Other category-specific fields
  brand?: string;
  model?: string;
  tool_type?: string;
  equipment_type?: string;
  material_type?: string;
  epc_type?: string;
  voltage?: string;
  power?: string;
  dimensions?: string;
  condition?: string;
  validity_date?: string;
  acquisition_date?: string;
  warranty_until?: string;
  mac_address?: string;
  branch_id?: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  supplier_id?: string;
  supplier?: Supplier;
  invoice_number: string;
  invoice_series?: string;
  invoice_key?: string;
  issue_date: string;
  entry_date: string;
  total_value: number;
  discount: number;
  freight: number;
  taxes: number;
  notes?: string;
  xml_content?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
  cfop?: string;
  ncm?: string;
  created_at: string;
  serial_numbers?: SerialNumber[];
}

export interface SerialNumber {
  id: string;
  tenant_id: string;
  product_id: string;
  product?: Product;
  invoice_item_id?: string;
  serial_number: string;
  status: SerialStatus;
  assigned_to?: string;
  assigned_at?: string;
  location?: string;
  notes?: string;
  warranty_expires?: string;
  purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  product?: Product;
  serial_number_id?: string;
  serial_number?: SerialNumber;
  invoice_id?: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  reason?: string;
  reference_type?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
}
