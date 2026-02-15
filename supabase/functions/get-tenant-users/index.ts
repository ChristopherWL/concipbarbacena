import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

<<<<<<< HEAD
function getCorsHeaders(req: Request) {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "*";
  const origins = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get("Origin");
  const allowOrigin = (origin && origins.includes(origin)) ? origin : (raw === "*" ? "*" : (origins[0] ?? "*"));
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
=======
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parallel fetch: roles, permissions, and profile
    const [rolesResult, permResult, profileResult] = await Promise.all([
      supabaseAdmin.from('user_roles').select('role').eq('user_id', caller.id),
      supabaseAdmin.from('user_permissions').select('template_id, can_manage_users').eq('user_id', caller.id).maybeSingle(),
      supabaseAdmin.from('profiles').select('tenant_id').eq('id', caller.id).single()
    ]);

    const callerRoles = rolesResult.data;
    const userPermission = permResult.data;
    const callerProfile = profileResult.data;

    const hasDirectAdminRole = callerRoles?.some(
      r => r.role === 'admin' || r.role === 'superadmin'
    );

    const hasDirectManageUsers = userPermission?.can_manage_users === true;

    // Check template permission only if needed
    let hasTemplateAdminRole = false;
    if (!hasDirectAdminRole && !hasDirectManageUsers && userPermission?.template_id) {
      const { data: template } = await supabaseAdmin
        .from('permission_templates')
        .select('role, can_manage_users')
        .eq('id', userPermission.template_id)
        .single();
      
      hasTemplateAdminRole = template?.role === 'admin' || template?.can_manage_users === true;
    }

    if (!hasDirectAdminRole && !hasTemplateAdminRole && !hasDirectManageUsers) {
      console.log('User does not have admin permissions:', { userId: caller.id });
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callerProfile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all profiles for this tenant
    const tenantId = callerProfile.tenant_id;

    const [profilesResult, rolesTenantResult, permsTenantResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_active, tenant_id, selected_branch_id, created_at')
        .eq('tenant_id', tenantId)
        .order('full_name', { ascending: true }),
      supabaseAdmin
        .from('user_roles')
        .select('id, user_id, role')
        .eq('tenant_id', tenantId),
      supabaseAdmin
        .from('user_permissions')
        .select('user_id, template_id')
        .eq('tenant_id', tenantId),
    ]);

    const profiles = profilesResult.data || [];
    const profilesError = profilesResult.error;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build lookups for roles/template to avoid extra client-side roundtrips
    const rolesByUserId = new Map<string, Array<{ id: string; role: string }>>();
    for (const r of rolesTenantResult.data || []) {
      const arr = rolesByUserId.get(r.user_id) || [];
      arr.push({ id: r.id, role: r.role });
      rolesByUserId.set(r.user_id, arr);
    }

    const templateByUserId = new Map<string, string | null>();
    for (const p of permsTenantResult.data || []) {
      templateByUserId.set(p.user_id, p.template_id);
    }

    // Only fetch auth users if we have profiles without email
    const profilesWithoutEmail = (profiles || []).filter((p) => !p.email);

    let emailMap = new Map<string, string>();
    if (profilesWithoutEmail.length > 0) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authUsers?.users) {
        for (const user of authUsers.users) {
          emailMap.set(user.id, user.email || '');
        }
      }
    }

    const usersWithEmails = (profiles || []).map((profile) => ({
      ...profile,
      email: profile.email || emailMap.get(profile.id) || null,
      roles: rolesByUserId.get(profile.id) || [],
      template_id: templateByUserId.get(profile.id) || null,
    }));

    const duration = Date.now() - startTime;
    console.log(`get-tenant-users completed in ${duration}ms, returned ${usersWithEmails.length} users`);

    return new Response(
      JSON.stringify({ users: usersWithEmails }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
