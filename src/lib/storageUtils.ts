import { supabase } from '@/integrations/supabase/client';

/**
 * Gets a signed URL for a file in tenant-assets (private bucket).
 * Falls back to constructing a storage path if signing fails.
 */
export async function getTenantAssetUrl(filePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from('tenant-assets')
    .createSignedUrl(filePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('Error creating signed URL:', error);
    return '';
  }

  return data.signedUrl;
}

/**
 * Uploads a file to tenant-assets and returns a signed URL.
 */
export async function uploadTenantAsset(
  filePath: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ url: string; path: string }> {
  const { data, error } = await supabase.storage
    .from('tenant-assets')
    .upload(filePath, file, { upsert: options?.upsert ?? false });

  if (error) throw error;

  const actualPath = data.path;
  const url = await getTenantAssetUrl(actualPath);

  return { url, path: actualPath };
}
