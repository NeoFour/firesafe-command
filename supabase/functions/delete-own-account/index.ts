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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the JWT and get user claims
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role client to delete user data and account
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Delete only rejected and pending applications (not approved ones)
    // This keeps approved applications in the system for record-keeping
    await supabaseAdmin.from('applications').delete()
      .eq('applicant_id', userId)
      .in('status', ['draft', 'submitted', 'under_review', 'inspection_scheduled', 'rejected']);
    
    // Delete user's buildings
    await supabaseAdmin.from('buildings').delete().eq('owner_id', userId);
    
    // Delete user's grievances
    await supabaseAdmin.from('grievances').delete().eq('submitted_by', userId);
    
    // Delete user's notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    
    // Delete user's roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    
    // Delete user's profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);
    
    // Finally delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
