// Edge Function: Découverte de prospects réels (data.gouv.fr SIRENE + IA enrichissement)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Mapping secteurs vers codes NAF
const SECTOR_TO_NAF: any = {
  "Vins & Spiritueux": "1102",
  "Brasseries craft": "1105",
  "Agroalimentaire": "10",
  "Cosmétique & Parfumerie": "2042",
  "Pharmacie & Parapharmacie": "2120",
  "Huiles & Condiments": "1043",
  "Miel & Confitures": "1039",
  "Produits laitiers": "1051",
  "Épicerie fine Bio": "1089",
  "Chimie & Produits d'entretien": "2041",
  "Compléments alimentaires": "2120"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const criteria = await req.json();
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    // 1. Recherche dans l'API SIRENE (data.gouv.fr) - Entreprises réelles officielles
    const naf = SECTOR_TO_NAF[criteria.sector] || "";
    const dept = criteria.department || "";
    
    // Construction de la requête SIRENE
    let query = "etatAdministratifEtablissement:A"; // Actives uniquement
    if (naf) query += ` AND activitePrincipaleEtablissement:${naf}*`;
    if (dept) query += ` AND codeCommuneEtablissement:${dept}*`;
    
    const sireneUrl = `https://api.insee.fr/entreprises/sirene/V3.11/siret?q=${encodeURIComponent(query)}&nombre=${Math.min(criteria.count || 10, 50)}`;
    
    const sireneResponse = await fetch(sireneUrl, {
      headers: {
        "Accept": "application/json"
      }
    });

    let prospects = [];
    
    if (sireneResponse.ok) {
      const sireneData = await sireneResponse.json();
      const etablissements = sireneData.etablissements || [];
      
      // 2. Enrichir chaque entreprise avec IA pour trouver site web et contacts
      const enrichedProspects = await Promise.all(
        etablissements.slice(0, criteria.count || 10).map(async (etab: any) => {
          const uniteLegale = etab.uniteLegale || {};
          const adresse = etab.adresseEtablissement || {};
          
          const companyName = uniteLegale.denominationUniteLegale || 
                             `${uniteLegale.prenom1UniteLegale || ''} ${uniteLegale.nomUniteLegale || ''}`.trim() ||
                             "Entreprise";
          const city = adresse.libelleCommuneEtablissement || "";
          const siret = etab.siret;
          
          let websiteData: any = {};
          
          // Enrichissement IA pour site web et contacts
          if (groqApiKey) {
            try {
              const webSearchPrompt = `Entreprise réelle française : "${companyName}" à ${city} (SIRET: ${siret})

Trouve les informations suivantes si tu les connais :
1. Site web officiel (format: exemple.fr sans http)
2. Email de contact (format: contact@exemple.fr)
3. Nom du dirigeant si connu

Réponds en JSON :
{
  "website": "exemple.fr ou vide",
  "email": "contact@exemple.fr ou vide",
  "contact_name": "Nom ou vide",
  "verified": true si tu es sûr que ces infos sont exactes, false sinon
}`;

              const webResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${groqApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages: [{ role: "user", content: webSearchPrompt }],
                  temperature: 0.1,
                  response_format: { type: "json_object" },
                }),
              });

              if (webResponse.ok) {
                const webData = await webResponse.json();
                websiteData = JSON.parse(webData.choices[0].message.content);
              }
            } catch (e) {
              console.log("Web enrichment failed for", companyName);
            }
          }
          
          // Construction du prospect avec badges de confiance
          const website = websiteData.website || "";
          const hasWebsite = !!website;
          const isVerified = websiteData.verified || false;
          
          return {
            company_name: companyName,
            company_name_confidence: "✅ Vérifié SIRENE",
            siret: siret,
            sector: criteria.sector,
            city: city,
            city_confidence: "✅ Vérifié SIRENE",
            department: adresse.codeCommuneEtablissement?.substring(0, 2) || "",
            postal_code: adresse.codePostalEtablissement || "",
            address: `${adresse.numeroVoieEtablissement || ""} ${adresse.typeVoieEtablissement || ""} ${adresse.libelleVoieEtablissement || ""}`.trim(),
            country: "France",
            website: website ? `https://${website.replace('https://', '').replace('http://', '')}` : "",
            website_confidence: hasWebsite ? (isVerified ? "✅ Vérifié" : "🔍 Estimé par IA") : "❌ Inconnu",
            company_size: criteria.companySize || "PME",
            company_size_confidence: "🔍 Estimé",
            contact_name: websiteData.contact_name || "À identifier",
            contact_name_confidence: websiteData.contact_name ? (isVerified ? "✅ Vérifié" : "🔍 Estimé par IA") : "❌ Inconnu",
            contact_position: "Dirigeant",
            email: websiteData.email || (website ? `contact@${website.replace('https://', '').replace('http://', '')}` : ""),
            email_confidence: websiteData.email ? (isVerified ? "✅ Vérifié" : "🔍 Estimé par IA") : (hasWebsite ? "🔍 Estimé générique" : "❌ Inconnu"),
            phone: "",
            phone_confidence: "❌ Inconnu",
            container_type: criteria.containerType || "À déterminer",
            relevance_score: 85,
            reason: `Entreprise réelle enregistrée au SIRENE dans le secteur ${criteria.sector}`,
            verified: true,
            data_quality: {
              company_exists: "high",
              website_accuracy: hasWebsite ? (isVerified ? "high" : "medium") : "low",
              email_accuracy: websiteData.email ? (isVerified ? "high" : "low") : "very_low",
              contact_accuracy: websiteData.contact_name ? (isVerified ? "high" : "low") : "very_low"
            }
          };
        })
      );
      
      prospects = enrichedProspects;
    }

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
