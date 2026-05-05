// Edge Function: Recherche optimisée rapide (1 seul appel IA)
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

    console.log("Starting optimized search:", criteria);

    // UN SEUL APPEL IA avec toutes les infos complètes
    const prompt = `Tu es un expert en prospection B2B pour une entreprise qui vend des étiquettes en bobine.

🎯 MISSION : Génère ${criteria.count || 10} entreprises RÉELLES françaises avec TOUTES leurs coordonnées.

📋 CRITÈRES STRICTS :
${criteria.sector ? `✅ Secteur : "${criteria.sector}" - OBLIGATOIRE` : ''}
${criteria.department ? `✅ Département : ${criteria.department} - OBLIGATOIRE` : ''}
${criteria.location ? `✅ Ville : ${criteria.location} - OBLIGATOIRE (privilégie les entreprises PROCHES)` : ''}
${criteria.keywords ? `✅ Mots-clés : ${criteria.keywords}` : ''}
${criteria.customPrompt ? `\n🔥 INSTRUCTIONS PRIORITAIRES :\n${criteria.customPrompt}` : ''}

⚠️ RÈGLES ABSOLUES :
1. UNIQUEMENT des entreprises que tu CONNAIS et qui EXISTENT
2. Si localisation donnée, privilégie les entreprises LOCALES (rayon 20km)
3. Donne TOUTES les infos que tu connais pour chaque entreprise
4. Si tu ne connais pas une info, marque "INCONNU"
5. NE JAMAIS INVENTER

Pour CHAQUE entreprise, fournis :
- Nom exact
- Adresse COMPLÈTE (numéro, rue, code postal, ville)
- Site web
- Email
- Téléphone
- Nom du dirigeant
- LinkedIn/Facebook

Réponds en JSON :
{
  "prospects": [
    {
      "company_name": "Nom exact",
      "address": "12 rue de la Paix, 33000 Bordeaux ou INCONNU",
      "city": "Ville",
      "postal_code": "33000 ou INCONNU",
      "department": "33",
      "website": "exemple.fr ou INCONNU",
      "email": "contact@exemple.fr ou INCONNU",
      "phone": "0556123456 ou INCONNU",
      "contact_name": "Jean Dupont ou INCONNU",
      "linkedin": "URL ou INCONNU",
      "facebook": "URL ou INCONNU",
      "reason": "Pourquoi cette entreprise",
      "confidence": "high si sûr à 100%, medium sinon"
    }
  ]
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`IA API error: ${response.status}`);
    }

    const data = await response.json();
    const aiProspects = JSON.parse(data.choices[0].message.content).prospects || [];

    console.log(`AI returned ${aiProspects.length} prospects`);

    // Formater les prospects avec badges de confiance
    const prospects = aiProspects.map((p: any) => {
      const hasWebsite = p.website && p.website !== "INCONNU";
      const hasEmail = p.email && p.email !== "INCONNU";
      const hasPhone = p.phone && p.phone !== "INCONNU";
      const hasContact = p.contact_name && p.contact_name !== "INCONNU";
      const hasAddress = p.address && p.address !== "INCONNU";
      const hasSocial = (p.linkedin && p.linkedin !== "INCONNU") || (p.facebook && p.facebook !== "INCONNU");
      const isHighConfidence = p.confidence === "high";

      return {
        company_name: p.company_name,
        company_name_confidence: isHighConfidence ? "✅ Entreprise connue" : "⚠️ À vérifier",
        siret: "",
        sector: criteria.sector || "À déterminer",
        city: p.city,
        city_confidence: "✅ Vérifié",
        department: p.department || criteria.department || "",
        postal_code: p.postal_code !== "INCONNU" ? p.postal_code : "",
        address: hasAddress ? p.address : "",
        address_confidence: hasAddress ? "✅ Adresse exacte" : "❌ Non trouvée",
        country: "France",
        website: hasWebsite ? (p.website.startsWith('http') ? p.website : `https://${p.website}`) : "",
        website_confidence: hasWebsite ? "✅ Connu de l'IA" : "❌ Inconnu",
        company_size: criteria.companySize || "PME",
        company_size_confidence: "❌ Non disponible",
        contact_name: hasContact ? p.contact_name : "",
        contact_name_confidence: hasContact ? "✅ Connu de l'IA" : "❌ Inconnu",
        contact_position: "Dirigeant",
        email: hasEmail ? p.email : "",
        email_confidence: hasEmail ? "✅ Connu de l'IA" : "❌ Inconnu",
        phone: hasPhone ? p.phone : "",
        phone_confidence: hasPhone ? "✅ Connu de l'IA" : "❌ Inconnu",
        linkedin: p.linkedin !== "INCONNU" ? p.linkedin : "",
        facebook: p.facebook !== "INCONNU" ? p.facebook : "",
        social_media_confidence: hasSocial ? "✅ Trouvé" : "❌ Inconnu",
        container_type: criteria.containerType || "À déterminer",
        relevance_score: isHighConfidence ? 90 : 75,
        reason: p.reason,
        verified: isHighConfidence,
        data_quality: {
          company_exists: isHighConfidence ? "high" : "medium",
          website_accuracy: hasWebsite ? "high" : "none",
          email_accuracy: hasEmail ? "high" : "none",
          contact_accuracy: hasContact ? "medium" : "none"
        }
      };
    });

    console.log(`Returning ${prospects.length} formatted prospects`);

    return new Response(
      JSON.stringify({
        success: true,
        count: prospects.length,
        prospects: prospects,
        source: "IA optimisée (1 appel)"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erreur inconnue",
        count: 0,
        prospects: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
