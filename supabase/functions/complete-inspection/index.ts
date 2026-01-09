import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authedClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const actor = userData.user;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify staff role
    const { data: staffRoles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", actor.id)
      .in("role", ["admin", "fire_officer", "senior_officer"]);

    if (roleError) return json({ error: "Role check failed" }, 500);
    if (!staffRoles || staffRoles.length === 0) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { inspectionId, findings, recommendations, overallScore, photoUrls } = body;

    if (!inspectionId) {
      return json({ error: "Missing inspectionId" }, 400);
    }

    // Get inspection
    const { data: inspection, error: inspError } = await adminClient
      .from("inspections")
      .select("id, application_id, building_id")
      .eq("id", inspectionId)
      .single();

    if (inspError || !inspection) {
      return json({ error: "Inspection not found" }, 404);
    }

    // Update inspection as completed
    const { error: updateError } = await adminClient
      .from("inspections")
      .update({
        status: "completed",
        findings: findings || null,
        recommendations: recommendations || null,
        overall_score: overallScore || null,
        photos: photoUrls || [],
        departure_time: new Date().toISOString(),
      })
      .eq("id", inspectionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return json({ error: "Failed to update inspection" }, 500);
    }

    // Update application status to inspection_completed
    const { error: appUpdateError } = await adminClient
      .from("applications")
      .update({ status: "inspection_completed" })
      .eq("id", inspection.application_id);

    if (appUpdateError) {
      console.error("App update error:", appUpdateError);
    }

    // Get application details for notification
    const { data: app } = await adminClient
      .from("applications")
      .select("application_number, applicant_id")
      .eq("id", inspection.application_id)
      .single();

    if (app) {
      // Notify applicant
      await adminClient.from("notifications").insert({
        user_id: app.applicant_id,
        title: "Inspection Completed",
        message: `The inspection for your application ${app.application_number} has been completed. Score: ${overallScore || "Pending"}. Decision pending.`,
        type: "info",
        action_url: `/applications/${inspection.application_id}`,
      });
    }

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Unexpected error" }, 500);
  }
});
