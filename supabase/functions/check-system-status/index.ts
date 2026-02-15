import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getCorsHeaders(req: Request) {
  const raw = Deno.env.get('ALLOWED_ORIGINS') ?? '*';
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get('Origin');
  const allowOrigin = (origin && origins.includes(origin)) ? origin : (raw === '*' ? '*' : (origins[0] ?? '*'));
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

// Default superadmin credentials
const DEFAULT_SUPERADMIN = {
  email: 'superadmin@admin.local',
  password: '@Volluty123',
  full_name: 'Super Admin'
};

// Default theme configuration
const DEFAULT_THEME = {
  name: 'System',
  slug: 'system',
  status: 'active',
  theme: 'light',
  primary_color: '#3b82f6',
  secondary_color: '#f1f5f9',
  menu_color: '#1e3a5f',
};

async function createDefaultSuperadmin(supabase: any): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Creating default superadmin...');

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === DEFAULT_SUPERADMIN.email);
    
    let userId: string;
    
    if (existingUser) {
      console.log('User exists, updating password');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: DEFAULT_SUPERADMIN.password, email_confirm: true }
      );
      if (updateError) throw updateError;
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: DEFAULT_SUPERADMIN.email,
        password: DEFAULT_SUPERADMIN.password,
        email_confirm: true,
        user_metadata: { full_name: DEFAULT_SUPERADMIN.full_name }
      });
      if (authError) throw authError;
      userId = authData.user.id;
      console.log('User created:', userId);
    }

    // Create or get system tenant
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'system')
      .maybeSingle();

    let tenantId = existingTenant?.id;

    if (!tenantId) {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(DEFAULT_THEME)
        .select('id')
        .single();

      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
      } else {
        tenantId = newTenant.id;
        console.log('System tenant created:', tenantId);
      }
    }

    // Update profile
    if (tenantId) {
      await supabase
        .from('profiles')
        .update({ tenant_id: tenantId, full_name: DEFAULT_SUPERADMIN.full_name })
        .eq('id', userId);
    }

    // Check/add superadmin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'superadmin', tenant_id: tenantId });
      
      if (roleError) {
        console.error('Error adding role:', roleError);
        return { success: false, error: roleError.message };
      }
    }

    console.log('Default superadmin created successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating superadmin:', error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if any superadmin exists
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

    // If no superadmin exists, create one automatically
    if (!hasSuperadmin) {
      console.log('No superadmin found, creating default superadmin...');
      const result = await createDefaultSuperadmin(supabase);
      
      if (result.success) {
        return new Response(
          JSON.stringify({ 
            success: true,
            needs_setup: false,
            is_fresh_database: false,
            has_superadmin: true,
            auto_created: true,
            message: 'Sistema inicializado com superadmin padrão'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            needs_setup: true,
            is_fresh_database: true,
            has_superadmin: false,
            error: result.error
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if any tenant exists (besides system)
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
