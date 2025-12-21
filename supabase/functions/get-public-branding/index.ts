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

    const { data, error } = await supabase
      .from('tenants')
      .select('name, logo_url, logo_dark_url, background_url, primary_color, secondary_color, landing_page_content')
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching tenant:', error)
      throw error
    }

    console.log('Fetched tenant branding:', data ? { name: data.name, hasLogo: !!data.logo_url } : 'no data')

    const branding = data
      ? {
          name: data.name ?? 'Sistema',
          logo_url: data.logo_url ?? null,
          logo_dark_url: data.logo_dark_url ?? null,
          background_url: data.background_url ?? null,
          primary_color: data.primary_color ?? null,
          secondary_color: data.secondary_color ?? null,
          landing_page_content: data.landing_page_content ?? null,
        }
      : null

    return new Response(JSON.stringify({ branding }), {
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
