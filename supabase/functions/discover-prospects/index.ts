// Edge Function: Découverte de prospects par IA pour étiquettes en bobine
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const BUSINESS_CONTEXT = `
Tu travailles pour une entreprise qui vend des ÉTIQUETTES EN BOBINE destinées à tous types de contenants :
- Bouteilles (vin, bière, spiritueux, jus, eau, huiles)
- Pots (cosmétiques, confitures, miel, yaourts, crèmes)
- Emballages alimentaires et industriels
- Flacons (pharmacie, parfumerie, produits chimiques)
- Boîtes de conserve, canettes
- Tout besoin d'étiquetage industriel

Secteurs cibles : Agroalimentaire, Cosmétique, Pharmacie, Vins/Spiritueux, Chimie, Huiles, Miel, Confitures, Bio, Artisanal
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const criteria = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY non configurée dans Supabase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `${BUSINESS_CONTEXT}

Génère une liste de ${criteria.count || 10} entreprises réelles françaises qui correspondent aux critères :

CRITÈRES :
- Secteur : ${criteria.sector || 'Tous secteurs pertinents'}
- Département : ${criteria.department ? `OBLIGATOIREMENT dans le département ${criteria.department}` : 'Tous départements'}
- Localisation : ${criteria.location || 'France'}
- Type de contenant : ${criteria.containerType || 'Tous types'}
- Taille d'entreprise : ${criteria.companySize || 'PME à ETI'}
- Mots-clés : ${criteria.keywords || 'Aucun'}

${criteria.department ? `IMPORTANT : Entreprises OBLIGATOIREMENT dans le département ${criteria.department}.` : ''}

Pour chaque entreprise fournis : nom, secteur, ville, département (numéro), pays, site web, type de contenants, taille, nom du décisionnaire, poste, email professionnel probable, raison du ciblage, score de pertinence (1-100).

Réponds en JSON strict :
{
  "prospects": [
    {
      "company_name": "...",
      "sector": "...",
      "city": "...",
      "department": "33",
      "country": "France",
      "website": "...",
      "container_type": "...",
      "company_size": "...",
      "contact_name": "...",
      "contact_position": "...",
      "email": "...",
      "reason": "...",
      "relevance_score": 85
    }
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI: ${err}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ success: true, count: result.prospects?.length || 0, prospects: result.prospects || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
