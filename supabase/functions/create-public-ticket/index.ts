import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getCorsHeaders(req: Request) {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? '*'
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const origin = req.headers.get('Origin')
  const allowOrigin = (origin && origins.includes(origin)) ? origin : (raw === '*' ? '*' : (origins[0] ?? '*'))
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Rate limit: máx 10 requisições por IP por minuto
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
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
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: TicketPayload = await req.json()
    console.log('Received ticket payload:', JSON.stringify(payload, null, 2))

    if (!payload.nome || !payload.telefone || !payload.rua || !payload.bairro || !payload.placaPoste || !payload.tipoProblema || !payload.tenantId) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (payload.nome.length > 255 || payload.telefone.length > 50 || payload.rua.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Dados excedem o tamanho máximo permitido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar que o tenant existe e está ativo
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', payload.tenantId)
      .maybeSingle()

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (tenant.status !== 'active' && tenant.status !== 'trial') {
      return new Response(
        JSON.stringify({ error: 'Empresa não está habilitada para receber chamados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Se branchId informado, validar que existe e pertence ao tenant
    if (payload.branchId) {
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .eq('id', payload.branchId)
        .eq('tenant_id', payload.tenantId)
        .eq('is_active', true)
        .maybeSingle()

      if (branchError || !branch) {
        return new Response(
          JSON.stringify({ error: 'Filial não encontrada ou inativa' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
