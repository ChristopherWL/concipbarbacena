import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

Deno.serve(async (req) => {
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

    let matrizLogo = null
    let matrizLogoDark = null
    let ticketBranchId = null

    // Helper to resolve a stored value (path or old signed URL) to a fresh signed URL
    async function resolveUrl(value: string | null | undefined): Promise<string | null> {
      if (!value || value.trim() === '') return null

      let path: string | null = null

      // Extract path from signed URL
      const signedMatch = value.match(/\/storage\/v1\/object\/sign\/tenant-assets\/(.+?)(?:\?|$)/)
      if (signedMatch) path = decodeURIComponent(signedMatch[1])

      // Extract path from public URL
      if (!path) {
        const publicMatch = value.match(/\/storage\/v1\/object\/public\/tenant-assets\/(.+?)(?:\?|$)/)
        if (publicMatch) path = decodeURIComponent(publicMatch[1])
      }

      // If it's a raw path (no protocol)
      if (!path && !value.startsWith('http')) path = value

      if (!path) return value // Unknown format, return as-is

      const { data, error } = await supabase.storage
        .from('tenant-assets')
        .createSignedUrl(path, 86400) // 24h

      if (error || !data?.signedUrl) {
        console.error('Error creating signed URL for', path, error)
        return null
      }
      return data.signedUrl
    }
    
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
    const rawLogoUrl = tenantData?.logo_url || matrizLogo || null
    const rawLogoDarkUrl = tenantData?.logo_dark_url || matrizLogoDark || null
    const rawBgUrl = tenantData?.background_url ?? null

    // Resolve all URLs in parallel
    const [finalLogoUrl, finalLogoDarkUrl, finalBgUrl] = await Promise.all([
      resolveUrl(rawLogoUrl),
      resolveUrl(rawLogoDarkUrl),
      resolveUrl(rawBgUrl),
    ])

    const branding = tenantData
      ? {
          name: tenantData.name ?? 'Sistema',
          logo_url: finalLogoUrl,
          logo_dark_url: finalLogoDarkUrl,
          background_url: finalBgUrl,
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
