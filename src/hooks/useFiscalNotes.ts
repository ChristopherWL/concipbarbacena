import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBranchFilter } from './useBranchFilter';
import { toast } from 'sonner';

export type FiscalNoteType = 'nfe' | 'nfce' | 'nfse';
export type FiscalNoteStatus = 'pendente' | 'autorizada' | 'cancelada' | 'rejeitada';

export interface FiscalNote {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  note_type: FiscalNoteType;
  numero: string;
  serie: string;
  status: FiscalNoteStatus;
  issue_date: string;
  total_value: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_document: string | null;
  operation_nature: string | null;
  freight_value: number;
  discount_value: number;
  products_value: number;
  service_code: string | null;
  service_description: string | null;
  deductions: number;
  iss_rate: number;
  iss_value: number;
  competence_date: string | null;
  access_key: string | null;
  protocol_number: string | null;
  xml_content: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  customer?: {
    id: string;
    name: string;
    document: string | null;
  };
}

export interface FiscalNoteItem {
  id: string;
  fiscal_note_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ncm: string | null;
  cfop: string | null;
  unit: string;
  discount: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface CreateFiscalNoteInput {
  note_type: FiscalNoteType;
  customer_id?: string | null;
  customer_name?: string;
  customer_document?: string;
  operation_nature?: string;
  freight_value?: number;
  discount_value?: number;
  products_value?: number;
  service_code?: string;
  service_description?: string;
  deductions?: number;
  iss_rate?: number;
  competence_date?: string;
  notes?: string;
  items?: CreateFiscalNoteItemInput[];
}

export interface CreateFiscalNoteItemInput {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  ncm?: string;
  cfop?: string;
  unit?: string;
  discount?: number;
}

// Generate next note number
async function getNextNoteNumber(tenantId: string, noteType: FiscalNoteType): Promise<string> {
  const { data, error } = await supabase
    .from('fiscal_notes')
    .select('numero')
    .eq('tenant_id', tenantId)
    .eq('note_type', noteType)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return '000001';
  }

  const lastNumber = parseInt(data[0].numero, 10);
  return String(lastNumber + 1).padStart(6, '0');
}

// Fetch fiscal notes
export function useFiscalNotes(noteType?: FiscalNoteType) {
  const { profile } = useAuth();
  const { branchId, shouldFilter } = useBranchFilter();

  return useQuery({
    queryKey: ['fiscal-notes', profile?.tenant_id, noteType, branchId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('fiscal_notes')
        .select(`
          *,
          customer:customers(id, name, document)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('issue_date', { ascending: false });

      if (noteType) {
        query = query.eq('note_type', noteType);
      }

      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FiscalNote[];
    },
    enabled: !!profile?.tenant_id,
  });
}

// Fetch single fiscal note with items
export function useFiscalNote(noteId: string | null) {
  return useQuery({
    queryKey: ['fiscal-note', noteId],
    queryFn: async () => {
      if (!noteId) return null;

      const { data: note, error: noteError } = await supabase
        .from('fiscal_notes')
        .select(`
          *,
          customer:customers(id, name, document)
        `)
        .eq('id', noteId)
        .single();

      if (noteError) throw noteError;

      const { data: items, error: itemsError } = await supabase
        .from('fiscal_note_items')
        .select(`
          *,
          product:products(id, name, code)
        `)
        .eq('fiscal_note_id', noteId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return { ...note, items } as FiscalNote & { items: FiscalNoteItem[] };
    },
    enabled: !!noteId,
  });
}

// Create fiscal note
export function useCreateFiscalNote() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const { branchId, shouldFilter } = useBranchFilter();

  return useMutation({
    mutationFn: async (input: CreateFiscalNoteInput) => {
      if (!profile?.tenant_id) throw new Error('Usuário não autenticado');

      const numero = await getNextNoteNumber(profile.tenant_id, input.note_type);

      // Calculate total value
      let totalValue = 0;
      if (input.note_type === 'nfe' || input.note_type === 'nfce') {
        const itemsTotal = input.items?.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price - (item.discount || 0));
        }, 0) || 0;
        totalValue = itemsTotal + (input.freight_value || 0) - (input.discount_value || 0);
      } else if (input.note_type === 'nfse') {
        const serviceValue = input.products_value || 0;
        const issValue = (serviceValue - (input.deductions || 0)) * ((input.iss_rate || 0) / 100);
        totalValue = serviceValue - (input.deductions || 0);
        input.iss_rate = input.iss_rate;
      }

      // Create the fiscal note
      const { data: note, error: noteError } = await supabase
        .from('fiscal_notes')
        .insert({
          tenant_id: profile.tenant_id,
          branch_id: shouldFilter && branchId ? branchId : profile.selected_branch_id,
          note_type: input.note_type,
          numero,
          status: 'autorizada', // Auto-authorize for now
          total_value: totalValue,
          customer_id: input.customer_id,
          customer_name: input.customer_name,
          customer_document: input.customer_document,
          operation_nature: input.operation_nature,
          freight_value: input.freight_value || 0,
          discount_value: input.discount_value || 0,
          products_value: input.products_value || 0,
          service_code: input.service_code,
          service_description: input.service_description,
          deductions: input.deductions || 0,
          iss_rate: input.iss_rate || 0,
          iss_value: input.note_type === 'nfse' ? ((input.products_value || 0) - (input.deductions || 0)) * ((input.iss_rate || 0) / 100) : 0,
          competence_date: input.competence_date,
          notes: input.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Create items if provided
      if (input.items && input.items.length > 0) {
        const itemsToInsert = input.items.map(item => ({
          fiscal_note_id: note.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price - (item.discount || 0),
          ncm: item.ncm,
          cfop: item.cfop,
          unit: item.unit || 'UN',
          discount: item.discount || 0,
        }));

        const { error: itemsError } = await supabase
          .from('fiscal_note_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-notes'] });
      toast.success('Nota fiscal emitida com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating fiscal note:', error);
      toast.error('Erro ao emitir nota fiscal: ' + error.message);
    },
  });
}

// Cancel fiscal note
export function useCancelFiscalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, reason }: { noteId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('fiscal_notes')
        .update({
          status: 'cancelada',
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-notes'] });
      toast.success('Nota fiscal cancelada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error cancelling fiscal note:', error);
      toast.error('Erro ao cancelar nota fiscal: ' + error.message);
    },
  });
}
