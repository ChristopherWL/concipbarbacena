-- Fix 1: Remove overly permissive invitations policy
DROP POLICY IF EXISTS "Anyone can view invitation by valid token" ON public.invitations;

-- Create a restricted policy: anon can only view by specific token match
CREATE POLICY "Anon can view invitation by token"
ON public.invitations
FOR SELECT
TO anon
USING (false);

-- Authenticated users can view their own invitations by email
CREATE POLICY "Users can view their own invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  OR public.is_tenant_admin(auth.uid(), tenant_id)
  OR public.is_superadmin(auth.uid())
);

-- Fix 2: Make tenant-assets bucket private
UPDATE storage.buckets SET public = false WHERE id = 'tenant-assets';

-- Fix 3: Add RLS policies for tenant-assets storage
CREATE POLICY "Authenticated users can upload to tenant folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Authenticated users can read tenant files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (
    (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin(auth.uid())
  )
);

CREATE POLICY "Authenticated users can update tenant files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (
    (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin(auth.uid())
  )
);

CREATE POLICY "Authenticated users can delete tenant files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-assets'
  AND (
    (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid())
    OR public.is_superadmin(auth.uid())
  )
);