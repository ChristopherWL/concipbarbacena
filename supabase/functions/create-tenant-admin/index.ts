import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema for creating new tenant with admin
const NewTenantAdminSchema = z.object({
  tenant: z.object({
    name: z.string().min(1, "Nome da empresa é obrigatório").max(100),
    slug: z.string().min(1, "Slug é obrigatório").max(50).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
    cnpj: z.string().max(20).optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
  }),
  admin: z.object({
    email: z.string().email("Email do administrador inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    full_name: z.string().min(1, "Nome completo é obrigatório").max(100),
  }),
});

// Schema for creating admin for existing branch or director access
const BranchAdminSchema = z.object({
  tenant_id: z.string().uuid("ID do tenant inválido"),
  branch_id: z.string().uuid("ID da filial inválido").optional().nullable(),
  email: z.string().email("Email do administrador inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  full_name: z.string().min(1, "Nome completo é obrigatório").max(100),
  role: z.enum(['admin', 'manager']).optional().default('admin'),
  template_id: z.string().uuid("ID do template inválido").optional().nullable(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'superadmin');

    if (rolesError || !callerRoles || callerRoles.length === 0) {
      console.error('Caller is not superadmin');
      return new Response(
        JSON.stringify({ error: 'Apenas superadmins podem criar admins' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawInput = await req.json();

    if (rawInput.tenant_id) {
      return await createBranchAdmin(supabaseAdmin, rawInput);
    }

    return await createTenantWithAdmin(supabaseAdmin, rawInput);

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createBranchAdmin(supabaseAdmin: any, rawInput: any) {
  let parsedInput;
  try {
    parsedInput = BranchAdminSchema.parse(rawInput);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error("Validation errors:", errorMessages);
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw err;
  }

  const { tenant_id, branch_id, email, password, full_name, role, template_id } = parsedInput;

  console.log('Creating user for tenant:', tenant_id, 'branch:', branch_id || 'none (director access)', 'role:', role, 'template:', template_id || 'none');

  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('id', tenant_id)
    .single();

  if (tenantError || !tenant) {
    return new Response(
      JSON.stringify({ error: 'Empresa não encontrada' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (branch_id) {
    const { data: branch, error: branchError } = await supabaseAdmin
      .from('branches')
      .select('id, tenant_id')
      .eq('id', branch_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (branchError || !branch) {
      return new Response(
        JSON.stringify({ error: 'Filial não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingUsers?.users?.some((u: any) => u.email === email);
  
  if (emailExists) {
    return new Response(
      JSON.stringify({ error: 'Este e-mail já está cadastrado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (userError) {
    console.error('Error creating user:', userError);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar usuário: ' + userError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('User created:', newUser.user.id);

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: newUser.user.id,
        tenant_id,
        email,
        full_name,
        selected_branch_id: branch_id || null,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.error('Error updating profile:', profileError);
  }

  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: newUser.user.id,
      tenant_id,
      role: role || 'admin',
    });

  if (roleError) {
    console.error('Error creating role:', roleError);
  }

  if (template_id) {
    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .upsert({
        user_id: newUser.user.id,
        tenant_id,
        template_id,
      }, { onConflict: 'user_id,tenant_id' });

    if (permError) {
      console.error('Error creating user permissions:', permError);
    } else {
      console.log('User permissions created with template:', template_id);
    }
  }

  const accessType = branch_id ? 'branch admin' : 'director access';
  console.log(`${accessType} created for tenant:`, tenant_id);

  return new Response(
    JSON.stringify({ 
      success: true,
      user: { id: newUser.user.id, email: newUser.user.email },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createTenantWithAdmin(supabaseAdmin: any, rawInput: any) {
  let parsedInput;
  try {
    parsedInput = NewTenantAdminSchema.parse(rawInput);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errorMessages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error("Validation errors:", errorMessages);
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: errorMessages }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    throw err;
  }

  const { tenant, admin } = parsedInput;

  console.log('Creating tenant:', tenant.name);

  const { data: existingTenant } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', tenant.slug)
    .maybeSingle();

  if (existingTenant) {
    return new Response(
      JSON.stringify({ error: 'Este slug já está em uso' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingUser?.users?.some((u: any) => u.email === admin.email);
  
  if (emailExists) {
    return new Response(
      JSON.stringify({ error: 'Este e-mail já está cadastrado' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: newTenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .insert({
      name: tenant.name,
      slug: tenant.slug,
      cnpj: tenant.cnpj,
      email: tenant.email,
      phone: tenant.phone,
      status: 'trial',
    })
    .select()
    .single();

  if (tenantError) {
    console.error('Error creating tenant:', tenantError);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar empresa: ' + tenantError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Tenant created:', newTenant.id);

  const { data: mainBranch } = await supabaseAdmin
    .from('branches')
    .select('id')
    .eq('tenant_id', newTenant.id)
    .eq('is_main', true)
    .single();

  const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    user_metadata: { full_name: admin.full_name },
  });

  if (userError) {
    console.error('Error creating user:', userError);
    await supabaseAdmin.from('tenants').delete().eq('id', newTenant.id);
    return new Response(
      JSON.stringify({ error: 'Erro ao criar usuário: ' + userError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('User created:', newUser.user.id);

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: newUser.user.id,
        tenant_id: newTenant.id,
        email: admin.email,
        full_name: admin.full_name,
        selected_branch_id: mainBranch?.id || null,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.error('Error updating profile:', profileError);
  }

  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .insert({
      user_id: newUser.user.id,
      tenant_id: newTenant.id,
      role: 'admin',
    });

  if (roleError) {
    console.error('Error creating role:', roleError);
  }

  console.log('Admin role created for tenant:', newTenant.id);

  return new Response(
    JSON.stringify({ 
      success: true,
      tenant: newTenant,
      user: { id: newUser.user.id, email: newUser.user.email },
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
