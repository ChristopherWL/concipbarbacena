import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if any superadmin exists
    const { data: existingSuperadmins, error: checkError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'superadmin')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing superadmins:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing superadmins' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If superadmins already exist, require authentication from an existing superadmin
    if (existingSuperadmins && existingSuperadmins.length > 0) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if caller is superadmin
      const { data: callerRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin');

      if (roleError || !callerRoles || callerRoles.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - Only superadmins can create superadmins' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Authenticated superadmin creating new superadmin:', user.email);
    } else {
      // For first superadmin creation, require initialization token
      const initToken = req.headers.get('X-Init-Token');
      const expectedToken = Deno.env.get('SUPERADMIN_INIT_TOKEN');
      
      if (!initToken || !expectedToken || initToken !== expectedToken) {
        console.log('First superadmin creation attempted without valid init token');
        return new Response(
          JSON.stringify({ error: 'Initialization token required for first superadmin creation' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('First superadmin creation with valid init token');
    }

    const { email, password, full_name } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating superadmin user:', email);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    let userId: string;
    
    if (existingUser) {
      // Update existing user's password
      console.log('User exists, updating password for:', email);
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true }
      );
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = existingUser.id;
      console.log('Password updated for user:', userId);
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || 'Super Admin' }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = authData.user.id;
      console.log('User created with ID:', userId);
    }
    console.log('User created with ID:', userId);

    // Create a system tenant for superadmin if needed
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'system')
      .maybeSingle();

    let tenantId = existingTenant?.id;

    if (!tenantId) {
      // Default theme configuration - Premium Corporate Blue
      const defaultTheme = {
        name: 'System',
        slug: 'system',
        status: 'active',
        theme: 'light',
        primary_color: '#3b82f6',     // Blue 500 - vibrant corporate blue
        secondary_color: '#f1f5f9',   // Slate 100 - clean light background
        menu_color: '#1e3a5f',        // Deep navy blue for sidebar
      };

      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(defaultTheme)
        .select('id')
        .single();

      if (tenantError) {
        console.error('Error creating system tenant:', tenantError);
      } else {
        tenantId = newTenant.id;
        console.log('System tenant created with default theme:', tenantId);
      }
    }

    // Update profile with tenant
    if (tenantId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId, full_name: full_name || 'Super Admin' })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }

    // Check if user already has superadmin role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (!existingRole) {
      // Add superadmin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'superadmin',
          tenant_id: tenantId
        });

      if (roleError) {
        console.error('Error adding superadmin role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Usuário criado mas erro ao adicionar role: ' + roleError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Superadmin created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Superadmin criado com sucesso',
        user_id: userId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
