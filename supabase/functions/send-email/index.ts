// Edge Function: Envoi d'emails via Resend
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prospectId, campaignId, subject, body } = await req.json();
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY non configurée dans Supabase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: prospect } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (!prospect) throw new Error("Prospect introuvable");

    const personalize = (text: string) => text
      .replace(/\{\{first_name\}\}/g, prospect.first_name || "")
      .replace(/\{\{last_name\}\}/g, prospect.last_name || "")
      .replace(/\{\{company\}\}/g, prospect.company || "")
      .replace(/\{\{position\}\}/g, prospect.position || "");

    const finalSubject = personalize(subject);
    const finalBody = personalize(body);

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: prospect.email,
        subject: finalSubject,
        html: finalBody,
      }),
    });

    const resendData = await resendResp.json();

    if (!resendResp.ok) {
      await supabase.from("emails").insert({
        user_id: user.id,
        campaign_id: campaignId,
        prospect_id: prospectId,
        subject: finalSubject,
        body: finalBody,
        status: "failed",
        error_message: JSON.stringify(resendData),
      });
      throw new Error(resendData.message || "Erreur Resend");
    }

    const { data: email } = await supabase.from("emails").insert({
      user_id: user.id,
      campaign_id: campaignId,
      prospect_id: prospectId,
      subject: finalSubject,
      body: finalBody,
      status: "sent",
      sent_at: new Date().toISOString(),
      type: "initial",
    }).select().single();

    await supabase.from("prospects").update({ status: "contacted" }).eq("id", prospectId);

    return new Response(JSON.stringify({ success: true, email, resendId: resendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
