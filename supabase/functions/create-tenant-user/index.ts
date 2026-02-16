import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Strong password regex patterns
const hasUppercase = /[A-Z]/;
const hasLowercase = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;']/;

const TenantUserInputSchema = z.object({
  tenant_id: z.string().uuid("ID da empresa inválido"),
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres")
    .refine((p) => hasUppercase.test(p), { message: "Senha deve conter pelo menos uma letra maiúscula" })
    .refine((p) => hasLowercase.test(p), { message: "Senha deve conter pelo menos uma letra minúscula" })
    .refine((p) => hasNumber.test(p), { message: "Senha deve conter pelo menos um número" })
    .refine((p) => hasSpecial.test(p), { message: "Senha deve conter pelo menos um caractere especial" }),
  full_name: z.string().min(1, "Nome completo é obrigatório").max(100),
  template_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
});

type TenantUserInput = z.infer<typeof TenantUserInputSchema>;

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

    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .in('role', ['admin', 'superadmin', 'manager']);

    const { data: callerPermissions } = await supabaseAdmin
      .from('user_permissions')
      .select('can_manage_users, template_id')
      .eq('user_id', callerUser.id)
      .maybeSingle();

    let templateCanManageUsers = false;
    if (callerPermissions?.template_id) {
      const { data: templateData } = await supabaseAdmin
        .from('permission_templates')
        .select('can_manage_users')
        .eq('id', callerPermissions.template_id)
        .maybeSingle();
      templateCanManageUsers = templateData?.can_manage_users === true;
    }

    const hasRole = callerRoles && callerRoles.length > 0;
    const hasPermission = callerPermissions?.can_manage_users === true || templateCanManageUsers;

    if (!hasRole && !hasPermission) {
      console.error('Caller does not have permission to create users');
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedInput: TenantUserInput;
    try {
      const rawInput = await req.json();
      parsedInput = TenantUserInputSchema.parse(rawInput);
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

    const { tenant_id, email, password, full_name, template_id, branch_id } = parsedInput;

    console.log('Creating user for tenant:', tenant_id, 'with template:', template_id, 'branch:', branch_id);

    const { data: existingTenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError || !existingTenant) {
      console.error('Tenant not found:', tenant_id);
      return new Response(
        JSON.stringify({ error: 'Empresa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Este e-mail já está cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: full_name },
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
          branch_id: branch_id || null,
          selected_branch_id: branch_id || null,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    let userRole = 'technician';
    if (template_id) {
      const { data: templateData } = await supabaseAdmin
        .from('permission_templates')
        .select('role')
        .eq('id', template_id)
        .maybeSingle();
      
      if (templateData?.role) {
        userRole = templateData.role;
      }
    }

    console.log('Assigning role:', userRole);

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        tenant_id: tenant_id,
        role: userRole,
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
    }

    const { error: permError } = await supabaseAdmin
      .from('user_permissions')
      .upsert(
        {
          user_id: newUser.user.id,
          tenant_id: tenant_id,
          template_id: template_id || null,
        },
        { onConflict: 'user_id,tenant_id', ignoreDuplicates: false }
      );

    if (permError) {
      console.error('Error upserting permissions:', permError);
    }

    console.log('User created successfully with template_id:', template_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: newUser.user.id,
        user: { id: newUser.user.id, email: newUser.user.email },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
