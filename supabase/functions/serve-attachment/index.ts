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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    const download = url.searchParams.get('download') === 'true';
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

<<<<<<< HEAD
    // Prevent path traversal (e.g. ../../../etc/passwd)
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid file path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

=======
>>>>>>> 2b5767b5628a98bf6f9b1410391791e86c127253
    console.log('Serving file:', filePath, 'download:', download);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Extract tenant_id from file path (first segment)
    const tenantIdFromPath = filePath.split('/')[0];

    // Get user's tenant_id from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is superadmin
    const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });

    // Validate access: allow superadmin OR same tenant
    if (!isSuperadmin && profile?.tenant_id !== tenantIdFromPath) {
      console.error('Access denied: user tenant', profile?.tenant_id, 'does not match path tenant', tenantIdFromPath);
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have access to this file' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access granted for user:', user.id, 'to file:', filePath);

    // Download the file from storage
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .download(filePath);

    if (error) {
      console.error('Storage download error:', error);
      return new Response(
        JSON.stringify({ error: 'File not found', details: error.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const fileName = filePath.split('/').pop() || 'file';
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
    }

    console.log('Serving file with content type:', contentType);

    // Set Content-Disposition based on download flag
    const disposition = download ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`;

    // Return the file with appropriate headers
    return new Response(data, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=3600',
        // Allow embedding preview inside the app (PDF/image previews)
        'Content-Security-Policy': "frame-ancestors *",
      },
    });

  } catch (error: unknown) {
    console.error('Error serving file:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
