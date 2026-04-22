// Edge Function: Génération d'email personnalisé par IA
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prospect } = await req.json();
    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Tu représentes une entreprise qui vend des ÉTIQUETTES EN BOBINE sur-mesure pour tous types de contenants (bouteilles, pots, flacons, emballages).

Génère un email de prospection ULTRA-PERSONNALISÉ pour :
- Entreprise : ${prospect.company_name}
- Secteur : ${prospect.sector}
- Contact : ${prospect.contact_name} (${prospect.contact_position})
- Type de contenant : ${prospect.container_type}
- Raison du ciblage : ${prospect.reason}

L'email doit :
1. Accroche SPÉCIFIQUE à leur activité (pas générique)
2. Mentionner un besoin concret d'étiquetage
3. Proposer valeur ajoutée (qualité, résistance, personnalisation)
4. Question ouverte / proposition d'échantillons gratuits
5. 120-180 mots maximum
6. Ton professionnel humain, pas commercial agressif

Arguments : résistance (humidité, froid, huiles, alimentaire), personnalisation (formes, matières, finitions), adaptabilité aux machines d'étiquetage, petites/grandes séries, conseil technique.

Réponds en JSON :
{
  "subject": "objet accrocheur",
  "body": "corps en HTML avec <p>"
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
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const email = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(email), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
