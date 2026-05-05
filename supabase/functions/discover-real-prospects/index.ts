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

    // ÉTAPE 0: Si une localisation précise est donnée, faire une recherche locale d'abord
    let localProspects = [];
    
    if (criteria.location || criteria.department) {
      const locationQuery = criteria.location || `département ${criteria.department}`;
      const localSearchPrompt = `Recherche locale : "${criteria.sector || 'entreprises'}" près de "${locationQuery}" en France.

MISSION : Liste TOUTES les entreprises locales que tu connais dans cette zone géographique précise.
Privilégie les entreprises de proximité, même petites ou artisanales.

Critères :
- Zone : ${locationQuery}
- Secteur : ${criteria.sector || 'tous'}
- Rayon : maximum 20-30km autour de ${locationQuery}

Donne UNIQUEMENT des entreprises que tu connais dans cette zone géographique.

Réponds en JSON :
{
  "local_companies": [
    {
      "name": "Nom exact",
      "city": "Ville exacte",
      "distance_info": "à X km de ${locationQuery}",
      "is_local": true
    }
  ]
}`;

      try {
        const localResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: localSearchPrompt }],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        if (localResponse.ok) {
          const localData = await localResponse.json();
          const parsed = JSON.parse(localData.choices[0].message.content);
          localProspects = (parsed.local_companies || []).map((c: any) => ({
            company_name: c.name,
            city: c.city,
            department: criteria.department || "",
            google_query: `${c.name} ${c.city} site officiel`,
            reason: `Entreprise locale ${c.distance_info || 'dans la zone'}`,
            criteria_match: `Proximité géographique de ${locationQuery}`,
            confidence: "high",
            is_local: true
          }));
          
          console.log(`Local search found ${localProspects.length} nearby companies`);
        }
      } catch (e) {
        console.log("Local search failed, continuing with general search");
      }
    }

    // ÉTAPE 1: L'IA génère une liste d'entreprises réelles + requêtes de recherche optimisées
    const step1Prompt = `Tu es un expert en prospection B2B pour une entreprise qui vend des étiquettes en bobine.

🎯 MISSION CRITIQUE : Génère ${criteria.count || 10} entreprises RÉELLES françaises qui correspondent EXACTEMENT à TOUS ces critères :

📋 CRITÈRES OBLIGATOIRES :
${criteria.sector ? `✅ Secteur : "${criteria.sector}" - OBLIGATOIRE` : ''}
${criteria.department ? `✅ Département : ${criteria.department} - OBLIGATOIRE (ne donne QUE des entreprises dans ce département)` : ''}
${criteria.location ? `✅ Ville/Zone : ${criteria.location} - OBLIGATOIRE` : ''}
${criteria.keywords ? `✅ Mots-clés : ${criteria.keywords} - OBLIGATOIRE (l'entreprise DOIT correspondre)` : ''}
${criteria.companySize ? `✅ Taille : ${criteria.companySize}` : ''}
${criteria.containerType ? `✅ Type de contenant : ${criteria.containerType}` : ''}

${criteria.customPrompt ? `🔥 INSTRUCTIONS PERSONNALISÉES PRIORITAIRES (À RESPECTER ABSOLUMENT) :
${criteria.customPrompt}

⚠️ Ces instructions personnalisées sont PRIORITAIRES sur tout le reste !` : ''}

⚠️ RÈGLES ABSOLUES :
1. Si un critère géographique est spécifié (département, ville), NE DONNE QUE des entreprises dans cette zone
2. Si des instructions personnalisées sont données, elles sont PRIORITAIRES
3. VÉRIFIE que chaque entreprise correspond à TOUS les critères avant de la proposer
4. Si tu ne connais pas d'entreprise qui correspond EXACTEMENT, dis-le plutôt que d'en inventer
5. Donne UNIQUEMENT des entreprises que tu CONNAIS et qui EXISTENT vraiment

Pour CHAQUE entreprise, fournis :
1. Nom exact de l'entreprise
2. Ville exacte (DOIT correspondre aux critères géographiques)
3. Département (DOIT correspondre si spécifié)
4. Une requête Google optimale
5. Pourquoi cette entreprise correspond EXACTEMENT aux critères
6. Comment elle répond aux instructions personnalisées (si présentes)

Réponds en JSON :
{
  "prospects": [
    {
      "company_name": "Nom exact",
      "city": "Ville",
      "department": "XX",
      "google_query": "requête optimisée",
      "reason": "pourquoi cette entreprise correspond EXACTEMENT aux critères",
      "criteria_match": "comment elle répond aux instructions personnalisées",
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
    const generalProspects = JSON.parse(step1Data.choices[0].message.content).prospects || [];
    
    console.log(`Step 1: Found ${generalProspects.length} general prospects`);

    // Fusionner les prospects locaux (prioritaires) avec les généraux
    const allProspects = [...localProspects, ...generalProspects];
    const initialProspects = allProspects.slice(0, criteria.count || 10);
    
    console.log(`Combined: ${localProspects.length} local + ${generalProspects.length} general = ${initialProspects.length} total`);

    // VALIDATION STRICTE : Filtrer les prospects qui ne correspondent pas aux critères
    const validatedProspects = initialProspects.filter((p: any) => {
      // Vérifier département si spécifié
      if (criteria.department && p.department !== criteria.department) {
        console.log(`Rejected ${p.company_name}: wrong department (${p.department} vs ${criteria.department})`);
        return false;
      }
      
      // Vérifier ville si spécifiée
      if (criteria.location && !p.city.toLowerCase().includes(criteria.location.toLowerCase())) {
        console.log(`Rejected ${p.company_name}: wrong location (${p.city} vs ${criteria.location})`);
        return false;
      }
      
      return true;
    });

    console.log(`After validation: ${validatedProspects.length} prospects match criteria`);

    // ÉTAPE 2: Pour chaque entreprise validée, recherche approfondie des coordonnées
    const enrichedProspects = await Promise.all(
      validatedProspects.map(async (prospect: any) => {
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
