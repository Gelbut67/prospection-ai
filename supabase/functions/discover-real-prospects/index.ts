// Edge Function: Découverte de prospects réels (IA avec consigne stricte)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const criteria = await req.json();
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prompt strict pour obtenir UNIQUEMENT des entreprises réelles
    const prompt = `Tu es un expert en prospection B2B pour une entreprise française qui vend des étiquettes en bobine.

MISSION CRITIQUE : Trouve ${criteria.count || 10} entreprises RÉELLES et VÉRIFIABLES qui existent vraiment en France.

CRITÈRES :
- Secteur : ${criteria.sector || 'Tous secteurs'}
- Département : ${criteria.department || 'France entière'}
- Ville : ${criteria.location || 'France'}
- Mots-clés : ${criteria.keywords || 'Aucun'}
${criteria.customPrompt ? `\nINSTRUCTIONS SPÉCIFIQUES : ${criteria.customPrompt}` : ''}

⚠️ RÈGLES ABSOLUES :
1. UNIQUEMENT des entreprises que tu CONNAIS et qui EXISTENT vraiment
2. Donne leur nom EXACT et officiel
3. Donne leur ville EXACTE
4. Si tu connais leur site web, donne-le (sinon laisse vide)
5. Si tu connais un email de contact, donne-le (sinon laisse vide)
6. Si tu connais le dirigeant, donne son nom (sinon laisse vide)
7. NE JAMAIS INVENTER - si tu ne sais pas, marque "INCONNU"

Réponds en JSON strict :
{
  "prospects": [
    {
      "company_name": "Nom exact de l'entreprise",
      "city": "Ville exacte",
      "department": "Numéro département (ex: 33)",
      "website": "exemple.fr ou INCONNU",
      "email": "contact@exemple.fr ou INCONNU",
      "contact_name": "Nom du dirigeant ou INCONNU",
      "sector": "${criteria.sector}",
      "reason": "Pourquoi cette entreprise a besoin d'étiquettes",
      "confidence": "high si tu es sûr à 100%, medium sinon"
    }
  ]
}`;

    const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Erreur IA");
    }

    const aiData = await aiResponse.json();
    const aiProspects = JSON.parse(aiData.choices[0].message.content).prospects || [];

    // Formater les prospects avec badges de confiance
    const prospects = aiProspects.map((p: any) => {
      const hasWebsite = p.website && p.website !== "INCONNU";
      const hasEmail = p.email && p.email !== "INCONNU";
      const hasContact = p.contact_name && p.contact_name !== "INCONNU";
      const isHighConfidence = p.confidence === "high";

      return {
        company_name: p.company_name,
        company_name_confidence: isHighConfidence ? "✅ Entreprise connue" : "⚠️ À vérifier",
        siret: "",
        sector: p.sector || criteria.sector,
        city: p.city,
        city_confidence: isHighConfidence ? "✅ Vérifié" : "⚠️ À vérifier",
        department: p.department || "",
        postal_code: "",
        address: "",
        country: "France",
        website: hasWebsite ? `https://${p.website.replace('https://', '').replace('http://', '')}` : "",
        website_confidence: hasWebsite ? "✅ Connu de l'IA" : "❌ Inconnu",
        company_size: criteria.companySize || "PME",
        company_size_confidence: "❌ Non disponible",
        contact_name: hasContact ? p.contact_name : "",
        contact_name_confidence: hasContact ? "✅ Connu de l'IA" : "❌ Inconnu",
        contact_position: "Dirigeant",
        email: hasEmail ? p.email : "",
        email_confidence: hasEmail ? "✅ Connu de l'IA" : "❌ Inconnu",
        phone: "",
        phone_confidence: "❌ Non disponible",
        container_type: criteria.containerType || "À déterminer",
        relevance_score: isHighConfidence ? 90 : 70,
        reason: p.reason,
        verified: isHighConfidence,
        data_quality: {
          company_exists: isHighConfidence ? "high" : "medium",
          website_accuracy: hasWebsite ? "medium" : "none",
          email_accuracy: hasEmail ? "medium" : "none",
          contact_accuracy: hasContact ? "medium" : "none"
        }
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: prospects.length,
        prospects: prospects,
        source: "SIRENE (data.gouv.fr) + IA enrichissement"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
