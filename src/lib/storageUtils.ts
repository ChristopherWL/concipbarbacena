import { supabase } from '@/integrations/supabase/client';

/**
 * Extracts the raw storage path from a value that might be:
 * - A raw path (e.g. "tenantId/logos/123.png")
 * - A full signed URL containing the path
 * - An empty string or null
 */
export function extractStoragePath(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;

  // If it looks like a URL (contains supabase storage path), extract the path
  const signedMatch = value.match(/\/storage\/v1\/object\/sign\/tenant-assets\/(.+?)(?:\?|$)/);
  if (signedMatch) return decodeURIComponent(signedMatch[1]);

  const publicMatch = value.match(/\/storage\/v1\/object\/public\/tenant-assets\/(.+?)(?:\?|$)/);
  if (publicMatch) return decodeURIComponent(publicMatch[1]);

  // If it's already a raw path (no protocol), return as-is
  if (!value.startsWith('http')) return value;

  // Unknown URL format – return null
  return null;
}

/**
 * Resolves a stored value (path or signed URL) to a fresh signed URL.
 * Returns empty string if the value is empty/null or resolution fails.
 */
export async function resolveStorageUrl(
  value: string | null | undefined,
  expiresIn = 86400 // 24 hours
): Promise<string> {
  const path = extractStoragePath(value);
  if (!path) return '';

  return getTenantAssetUrl(path, expiresIn);
}

/**
 * Gets a signed URL for a file in tenant-assets (private bucket).
 */
export async function getTenantAssetUrl(filePath: string, expiresIn = 86400): Promise<string> {
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
 * Uploads a file to tenant-assets and returns the raw storage path.
 * The path should be stored in the database (NOT a signed URL).
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
  // Generate a signed URL for immediate preview
  const url = await getTenantAssetUrl(actualPath);

  return { url, path: actualPath };
}
