import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("Missing env vars");
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

    // Verify admin/staff role
    const { data: adminRoles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", actor.id)
      .in("role", ["admin", "fire_officer", "senior_officer"]);

    if (roleError) return json({ error: "Role check failed" }, 500);
    if (!adminRoles || adminRoles.length === 0) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { applicationId, scheduledDate, scheduledTime } = body;

    if (!applicationId || !scheduledDate || !scheduledTime) {
      return json({ error: "Missing required fields" }, 400);
    }

    // Get application details
    const { data: app, error: appError } = await adminClient
      .from("applications")
      .select("id, application_number, applicant_id, building_id, buildings(name, address, city)")
      .eq("id", applicationId)
      .single();

    if (appError || !app) return json({ error: "Application not found" }, 404);

    // Check if inspection already exists
    const { data: existingInspection } = await adminClient
      .from("inspections")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    let inspectionId: string;

    if (existingInspection) {
      // Update existing inspection
      const { error: updateError } = await adminClient
        .from("inspections")
        .update({
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          status: "scheduled",
          officer_id: actor.id,
        })
        .eq("id", existingInspection.id);

      if (updateError) return json({ error: "Failed to update inspection" }, 500);
      inspectionId = existingInspection.id;
    } else {
      // Create new inspection
      const { data: newInspection, error: insertError } = await adminClient
        .from("inspections")
        .insert({
          application_id: applicationId,
          building_id: app.building_id,
          officer_id: actor.id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          status: "scheduled",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        return json({ error: "Failed to create inspection" }, 500);
      }
      inspectionId = newInspection.id;
    }

    // Update application status to inspection_scheduled
    const { error: appUpdateError } = await adminClient
      .from("applications")
      .update({ status: "inspection_scheduled" })
      .eq("id", applicationId);

    if (appUpdateError) {
      console.error("App update error:", appUpdateError);
    }

    // Get applicant details for email
    const { data: applicantProfile } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", app.applicant_id)
      .single();

    const formattedDate = new Date(scheduledDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const buildingInfo = app.buildings as unknown as { name: string; address: string; city: string } | null;

    // Create notification
    await adminClient.from("notifications").insert({
      user_id: app.applicant_id,
      title: "Inspection Scheduled",
      message: `Your inspection for application ${app.application_number} is scheduled for ${formattedDate} at ${scheduledTime}. Building: ${buildingInfo?.name || "N/A"}`,
      type: "info",
      action_url: `/applications/${app.id}`,
    });

    // Send email if Resend is configured
    if (resendApiKey && applicantProfile?.email) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "Fire NOC System <onboarding@resend.dev>",
          to: [applicantProfile.email],
          subject: `Inspection Scheduled - ${app.application_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e40af;">Inspection Scheduled</h1>
              <p>Dear ${applicantProfile.full_name || "Applicant"},</p>
              <p>Your fire safety inspection has been scheduled with the following details:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Application Number:</strong> ${app.application_number}</p>
                <p><strong>Building:</strong> ${buildingInfo?.name || "N/A"}</p>
                <p><strong>Address:</strong> ${buildingInfo?.address || "N/A"}, ${buildingInfo?.city || ""}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${scheduledTime}</p>
              </div>
              <p>Please ensure the following before the inspection:</p>
              <ul>
                <li>All fire safety equipment is accessible</li>
                <li>Fire exits are clear and unobstructed</li>
                <li>Relevant documents are available for review</li>
              </ul>
              <p>Best regards,<br>Fire NOC System</p>
            </div>
          `,
        });
        console.log("Email sent successfully");
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return json({ ok: true, inspectionId });
  } catch (err) {
    console.error(err);
    return json({ error: "Unexpected error" }, 500);
  }
});
