// supabase/functions/admin-application-decision/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("Missing env vars:", { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey, anonKey: !!anonKey });
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

    // Verify admin role server-side
    const { data: adminRoles, error: adminRoleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", actor.id)
      .eq("role", "admin");

    if (adminRoleError) return json({ error: "Role check failed" }, 500);
    if (!adminRoles || adminRoles.length === 0) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const applicationId = String(body?.applicationId ?? "");
    const decision = String(body?.decision ?? "");
    const rejectionReason = typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

    if (!applicationId) return json({ error: "Missing applicationId" }, 400);
    if (decision !== "approve" && decision !== "reject") {
      return json({ error: "Invalid decision" }, 400);
    }
    if (decision === "reject" && !rejectionReason) {
      return json({ error: "Rejection reason required" }, 400);
    }

    const { data: app, error: appError } = await adminClient
      .from("applications")
      .select("id, application_number, applicant_id")
      .eq("id", applicationId)
      .single();

    if (appError || !app) return json({ error: "Application not found" }, 404);

    const newStatus = decision === "approve" ? "approved" : "rejected";

    const { error: updateError } = await adminClient
      .from("applications")
      .update({
        status: newStatus,
        rejection_reason: decision === "reject" ? rejectionReason : null,
      })
      .eq("id", applicationId);

    if (updateError) return json({ error: "Failed to update application" }, 500);

    let nocNumber: string | null = null;

    // If approved, create a NOC record
    if (decision === "approve") {
      // Get building info from application
      const { data: appWithBuilding } = await adminClient
        .from("applications")
        .select("building_id, buildings(name, owner_id)")
        .eq("id", applicationId)
        .single();

      if (appWithBuilding?.building_id) {
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1); // Valid for 1 year

        // Get applicant profile for issued_to field
        const { data: applicantProfile } = await adminClient
          .from("profiles")
          .select("full_name")
          .eq("user_id", app.applicant_id)
          .single();

        const { data: nocData, error: nocError } = await adminClient
          .from("nocs")
          .insert({
            application_id: applicationId,
            building_id: appWithBuilding.building_id,
            issued_by: actor.id,
            issued_to: applicantProfile?.full_name || "Applicant",
            valid_until: validUntil.toISOString().split("T")[0],
            status: "active",
            conditions: [],
          })
          .select("noc_number")
          .single();

        if (nocError) {
          console.error("NOC creation failed", nocError);
        } else {
          nocNumber = nocData?.noc_number || null;
        }
      }
    }

    // Create notification for applicant
    const title = decision === "approve" ? "NOC Approved" : "NOC Rejected";
    const message = decision === "approve"
      ? `Your application ${app.application_number} has been approved.${nocNumber ? ` Your NOC Number: ${nocNumber}` : ""}`
      : `Your application ${app.application_number} was rejected. Reason: ${rejectionReason}`;

    const { error: notifError } = await adminClient.from("notifications").insert({
      user_id: app.applicant_id,
      title,
      message,
      type: decision === "approve" ? "success" : "error",
      action_url: `/applications/${app.id}`,
    });

    if (notifError) {
      console.error("Notification insert failed", notifError);
    }

    return json({ ok: true, nocNumber });
  } catch (err) {
    console.error(err);
    return json({ error: "Unexpected error" }, 500);
  }
});
