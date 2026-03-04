import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: superadmins, error: superadminError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'superadmin')
      .limit(1);

    if (superadminError) {
      console.error('Error checking superadmins:', superadminError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to check system status',
          needs_setup: true,
          is_fresh_database: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasSuperadmin = superadmins && superadmins.length > 0;

    if (!hasSuperadmin) {
      return new Response(
        JSON.stringify({ 
          success: true,
          needs_setup: true,
          is_fresh_database: true,
          has_superadmin: false,
          has_tenants: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, slug')
      .neq('slug', 'system')
      .limit(1);

    const hasTenants = tenants && tenants.length > 0;

    return new Response(
      JSON.stringify({ 
        success: true,
        needs_setup: false,
        is_fresh_database: false,
        has_superadmin: true,
        has_tenants: hasTenants,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        needs_setup: true,
        is_fresh_database: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
