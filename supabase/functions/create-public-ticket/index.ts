import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketPayload {
  nome: string
  telefone: string
  email?: string
  rua: string
  numero?: string
  bairro: string
  referencia?: string
  placaPoste: string
  tipoProblema: string
  descricao?: string
  latitude?: number
  longitude?: number
  tenantId: string
  branchId?: string
}

const TIPO_PROBLEMA_LABELS: Record<string, string> = {
  lampada_apagada: 'Lâmpada Apagada',
  lampada_piscando: 'Lâmpada Piscando',
  lampada_acesa_dia: 'Lâmpada Acesa Durante o Dia',
  poste_danificado: 'Poste Danificado',
  fiacao_exposta: 'Fiação Exposta',
  luminaria_quebrada: 'Luminária Quebrada',
  outros: 'Outros',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: TicketPayload = await req.json()
    
    console.log('Received ticket payload:', JSON.stringify(payload, null, 2))

    // Validate required fields
    if (!payload.nome || !payload.telefone || !payload.rua || !payload.bairro || !payload.placaPoste || !payload.tipoProblema || !payload.tenantId) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Input validation
    if (payload.nome.length > 255 || payload.telefone.length > 50 || payload.rua.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Dados excedem o tamanho máximo permitido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get or create a default customer for public tickets
    const { data: existingCustomer, error: customerSearchError } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', payload.tenantId)
      .eq('phone', payload.telefone)
      .maybeSingle()

    let customerId: string

    if (existingCustomer) {
      customerId = existingCustomer.id
      console.log('Using existing customer:', customerId)
    } else {
      // Create a new customer
      const { data: newCustomer, error: customerCreateError } = await supabase
        .from('customers')
        .insert({
          tenant_id: payload.tenantId,
          branch_id: payload.branchId,
          name: payload.nome,
          phone: payload.telefone,
          email: payload.email || null,
          address: payload.rua,
          number: payload.numero || null,
          neighborhood: payload.bairro,
          type: 'pf',
          is_active: true,
        })
        .select('id')
        .single()

      if (customerCreateError) {
        console.error('Error creating customer:', customerCreateError)
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cadastro do solicitante' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      customerId = newCustomer.id
      console.log('Created new customer:', customerId)
    }

    // Build the full address
    const fullAddress = `${payload.rua}${payload.numero ? ', ' + payload.numero : ''} - ${payload.bairro}`

    // Get tipo problema label
    const tipoProblemaLabel = TIPO_PROBLEMA_LABELS[payload.tipoProblema] || payload.tipoProblema

    // Create the service order as a public ticket
    const { data: serviceOrder, error: soError } = await supabase
      .from('service_orders')
      .insert({
        tenant_id: payload.tenantId,
        branch_id: payload.branchId,
        customer_id: customerId,
        title: `Chamado: ${tipoProblemaLabel} - Poste ${payload.placaPoste}`,
        description: payload.descricao || `Problema reportado: ${tipoProblemaLabel}`,
        address: fullAddress,
        status: 'aberta',
        priority: 'media',
        origem: 'chamado_publico',
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        placa_poste: payload.placaPoste,
        tipo_problema: payload.tipoProblema,
        solicitante_nome: payload.nome,
        solicitante_telefone: payload.telefone,
        solicitante_email: payload.email || null,
        bairro: payload.bairro,
        numero: payload.numero || null,
        referencia: payload.referencia || null,
        notes: payload.referencia ? `Referência: ${payload.referencia}` : null,
      })
      .select('id, order_number')
      .single()

    if (soError) {
      console.error('Error creating service order:', soError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar chamado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Created service order:', serviceOrder)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: serviceOrder.id,
        orderNumber: serviceOrder.order_number,
        message: `Chamado #${serviceOrder.order_number} registrado com sucesso!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
