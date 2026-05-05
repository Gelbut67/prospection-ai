// Edge Function: Recherche approfondie multi-étapes avec IA
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

    console.log("Starting deep search with criteria:", criteria);

    // ÉTAPE 1: L'IA génère une liste d'entreprises réelles + requêtes de recherche optimisées
    const step1Prompt = `Tu es un expert en prospection B2B pour une entreprise qui vend des étiquettes en bobine.

MISSION : Génère ${criteria.count || 10} entreprises RÉELLES françaises dans le secteur "${criteria.sector || 'tous secteurs'}"
${criteria.department ? `dans le département ${criteria.department}` : ''}
${criteria.location ? `à ${criteria.location}` : ''}
${criteria.keywords ? `avec les mots-clés: ${criteria.keywords}` : ''}
${criteria.customPrompt ? `\nCRITÈRES SPÉCIFIQUES: ${criteria.customPrompt}` : ''}

Pour CHAQUE entreprise, fournis :
1. Nom exact de l'entreprise
2. Ville exacte
3. Une requête Google optimale pour trouver leur site (ex: "Château Margaux Bordeaux site officiel")
4. Pourquoi cette entreprise a besoin d'étiquettes

IMPORTANT : Donne UNIQUEMENT des entreprises que tu CONNAIS et qui EXISTENT vraiment.

Réponds en JSON :
{
  "prospects": [
    {
      "company_name": "Nom exact",
      "city": "Ville",
      "department": "XX",
      "google_query": "requête optimisée",
      "reason": "pourquoi cibler cette entreprise",
      "confidence": "high ou medium"
    }
  ]
}`;

    const step1Response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: step1Prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!step1Response.ok) {
      throw new Error("Erreur IA étape 1");
    }

    const step1Data = await step1Response.json();
    const initialProspects = JSON.parse(step1Data.choices[0].message.content).prospects || [];
    
    console.log(`Step 1: Found ${initialProspects.length} initial prospects`);

    // ÉTAPE 2: Pour chaque entreprise, recherche approfondie des coordonnées
    const enrichedProspects = await Promise.all(
      initialProspects.map(async (prospect: any) => {
        console.log(`Enriching: ${prospect.company_name}`);

        // Sous-étape 2A: L'IA cherche dans sa mémoire toutes les infos sur cette entreprise
        const step2Prompt = `Entreprise : "${prospect.company_name}" à ${prospect.city}

Donne-moi TOUTES les informations que tu connais sur cette entreprise :
- Site web officiel (domaine exact)
- Email de contact (si tu le connais)
- Téléphone (si tu le connais)
- Profil LinkedIn (URL exacte)
- Page Facebook (URL exacte)
- Nom du dirigeant actuel (si tu le connais)
- Adresse complète (si tu la connais)

RÈGLE ABSOLUE : Si tu ne connais pas une info, marque "INCONNU". NE JAMAIS INVENTER.

Réponds en JSON :
{
  "website": "domaine.fr ou INCONNU",
  "email": "email ou INCONNU",
  "phone": "téléphone ou INCONNU",
  "linkedin": "URL ou INCONNU",
  "facebook": "URL ou INCONNU",
  "contact_name": "nom ou INCONNU",
  "address": "adresse ou INCONNU",
  "additional_info": "toute autre info pertinente"
}`;

        const step2Response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: step2Prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        let enrichedData: any = {
          website: "INCONNU",
          email: "INCONNU",
          phone: "INCONNU",
          linkedin: "INCONNU",
          facebook: "INCONNU",
          contact_name: "INCONNU",
          address: "INCONNU"
        };

        if (step2Response.ok) {
          const step2Data = await step2Response.json();
          enrichedData = JSON.parse(step2Data.choices[0].message.content);
        }

        // Sous-étape 2B: Si site web trouvé, essayer de le scraper pour email/téléphone
        if (enrichedData.website && enrichedData.website !== "INCONNU") {
          try {
            const websiteUrl = enrichedData.website.startsWith('http') 
              ? enrichedData.website 
              : `https://${enrichedData.website}`;
            
            const siteResponse = await fetch(websiteUrl, {
              headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
              },
              redirect: "follow"
            });

            if (siteResponse.ok) {
              const html = await siteResponse.text();
              
              // Extraire email si pas déjà trouvé
              if (enrichedData.email === "INCONNU") {
                const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
                if (emailMatch) enrichedData.email = emailMatch[1];
              }
              
              // Extraire téléphone français si pas déjà trouvé
              if (enrichedData.phone === "INCONNU") {
                const phoneMatch = html.match(/0[1-9](?:[\s.-]?\d{2}){4}/);
                if (phoneMatch) enrichedData.phone = phoneMatch[0];
              }

              console.log(`Scraped ${websiteUrl}: email=${enrichedData.email !== "INCONNU"}, phone=${enrichedData.phone !== "INCONNU"}`);
            }
          } catch (e) {
            console.log(`Failed to scrape: ${enrichedData.website}`);
          }
        }

        // Construire le prospect final avec badges de confiance
        const hasWebsite = enrichedData.website !== "INCONNU";
        const hasEmail = enrichedData.email !== "INCONNU";
        const hasPhone = enrichedData.phone !== "INCONNU";
        const hasContact = enrichedData.contact_name !== "INCONNU";
        const hasSocial = enrichedData.linkedin !== "INCONNU" || enrichedData.facebook !== "INCONNU";

        return {
          company_name: prospect.company_name,
          company_name_confidence: prospect.confidence === "high" ? "✅ Entreprise connue" : "⚠️ À vérifier",
          siret: "",
          sector: criteria.sector || "À déterminer",
          city: prospect.city,
          city_confidence: "✅ Vérifié",
          department: prospect.department || "",
          postal_code: "",
          address: enrichedData.address !== "INCONNU" ? enrichedData.address : "",
          country: "France",
          website: hasWebsite ? (enrichedData.website.startsWith('http') ? enrichedData.website : `https://${enrichedData.website}`) : "",
          website_confidence: hasWebsite ? "✅ Connu de l'IA" : "❌ Inconnu",
          company_size: criteria.companySize || "PME",
          company_size_confidence: "❌ Non disponible",
          contact_name: hasContact ? enrichedData.contact_name : "",
          contact_name_confidence: hasContact ? "✅ Connu de l'IA" : "❌ Inconnu",
          contact_position: "Dirigeant",
          email: hasEmail ? enrichedData.email : "",
          email_confidence: hasEmail ? "✅ Trouvé" : "❌ Inconnu",
          phone: hasPhone ? enrichedData.phone : "",
          phone_confidence: hasPhone ? "✅ Trouvé" : "❌ Inconnu",
          linkedin: enrichedData.linkedin !== "INCONNU" ? enrichedData.linkedin : "",
          facebook: enrichedData.facebook !== "INCONNU" ? enrichedData.facebook : "",
          social_media_confidence: hasSocial ? "✅ Trouvé" : "❌ Inconnu",
          container_type: criteria.containerType || "À déterminer",
          relevance_score: prospect.confidence === "high" ? 90 : 75,
          reason: prospect.reason,
          verified: prospect.confidence === "high",
          additional_info: enrichedData.additional_info || "",
          data_quality: {
            company_exists: prospect.confidence === "high" ? "high" : "medium",
            website_accuracy: hasWebsite ? "high" : "none",
            email_accuracy: hasEmail ? "high" : "none",
            contact_accuracy: hasContact ? "medium" : "none"
          }
        };
      })
    );

    console.log(`Enrichment complete: ${enrichedProspects.length} prospects`);

    return new Response(
      JSON.stringify({
        success: true,
        count: enrichedProspects.length,
        prospects: enrichedProspects,
        source: "Recherche approfondie IA multi-étapes + Web scraping"
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
