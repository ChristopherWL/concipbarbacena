import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

function getCorsHeaders(req: Request) {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? '*'
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean)
  const origin = req.headers.get('Origin')
  const allowOrigin = (origin && origins.includes(origin)) ? origin : (raw === '*' ? '*' : (origins[0] ?? '*'))
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Missing backend configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Fetch tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, logo_url, logo_dark_url, background_url, primary_color, secondary_color, landing_page_content')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError)
      throw tenantError
    }

    // Fetch branch data - prioritize Barbacena branch for tickets, use matriz for logo
    let matrizLogo = null
    let matrizLogoDark = null
    let ticketBranchId = null
    
    if (tenantData?.id) {
      // First, try to get Barbacena branch for tickets
      const { data: barbacenaData, error: barbacenaError } = await supabase
        .from('branches')
        .select('id')
        .eq('tenant_id', tenantData.id)
        .ilike('name', '%barbacena%')
        .eq('is_active', true)
        .maybeSingle()

      if (!barbacenaError && barbacenaData) {
        ticketBranchId = barbacenaData.id
        console.log('Using Barbacena branch for tickets:', ticketBranchId)
      }

      // Get matriz branch for logo
      const { data: matrizData, error: matrizError } = await supabase
        .from('branches')
        .select('id, logo_url, logo_dark_url')
        .eq('tenant_id', tenantData.id)
        .eq('is_main', true)
        .eq('is_active', true)
        .maybeSingle()

      if (matrizError) {
        console.error('Error fetching matriz branch:', matrizError)
      } else if (matrizData) {
        matrizLogo = matrizData.logo_url
        matrizLogoDark = matrizData.logo_dark_url
        // If no Barbacena branch found, fall back to matriz
        if (!ticketBranchId) {
          ticketBranchId = matrizData.id
        }
      }
    }

    console.log('Fetched branding:', { 
      tenantName: tenantData?.name, 
      hasTenantLogo: !!tenantData?.logo_url,
      hasMatrizLogo: !!matrizLogo 
    })

    // Priority: tenant logo > matriz branch logo
    const finalLogoUrl = tenantData?.logo_url || matrizLogo || null
    const finalLogoDarkUrl = tenantData?.logo_dark_url || matrizLogoDark || null

    const branding = tenantData
      ? {
          name: tenantData.name ?? 'Sistema',
          logo_url: finalLogoUrl,
          logo_dark_url: finalLogoDarkUrl,
          background_url: tenantData.background_url ?? null,
          primary_color: tenantData.primary_color ?? null,
          secondary_color: tenantData.secondary_color ?? null,
          landing_page_content: tenantData.landing_page_content ?? null,
        }
      : null

    return new Response(JSON.stringify({ 
      branding,
      tenantId: tenantData?.id || null,
      branchId: ticketBranchId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('get-public-branding error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
