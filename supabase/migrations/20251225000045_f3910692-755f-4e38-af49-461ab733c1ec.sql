-- Remove ALL existing problematic policies on profiles
DROP POLICY IF EXISTS "Superadmin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and managers can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_select" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_update" ON public.profiles;
DROP POLICY IF EXISTS "users_own_profile_insert" ON public.profiles;
DROP POLICY IF EXISTS "superadmin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "tenant_users_view" ON public.profiles;

-- Create a function to get user tenant from user_roles table (no recursion)
CREATE OR REPLACE FUNCTION public.get_user_tenant_from_roles(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create simple RLS policies for profiles using security definer functions
-- 1. Users can always see their own profile
CREATE POLICY "own_profile_select" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "own_profile_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 3. Users can insert their own profile
CREATE POLICY "own_profile_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 4. Superadmins can see all profiles
CREATE POLICY "superadmin_select_all" ON public.profiles
  FOR SELECT USING (is_super_admin(auth.uid()));

-- 5. Superadmins can update all profiles
CREATE POLICY "superadmin_update_all" ON public.profiles
  FOR UPDATE USING (is_super_admin(auth.uid()));

-- 6. Superadmins can delete profiles
CREATE POLICY "superadmin_delete" ON public.profiles
  FOR DELETE USING (is_super_admin(auth.uid()));

-- 7. Branch managers can see profiles in their branch (using user_roles for tenant check)
CREATE POLICY "manager_select_tenant" ON public.profiles
  FOR SELECT USING (
    is_branch_mgr(auth.uid()) AND 
    tenant_id = get_user_tenant_from_roles(auth.uid())
  );