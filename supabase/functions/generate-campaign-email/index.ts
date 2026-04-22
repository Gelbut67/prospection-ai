// Edge Function: Génération d'email de campagne par IA
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { campaignName, context } = await req.json();
    const apiKey = Deno.env.get("GROQ_API_KEY") || Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY ou OPENAI_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isGroq = !!Deno.env.get("GROQ_API_KEY");

    const prompt = `Tu es un expert en copywriting pour des campagnes d'emailing B2B.

Génère un email de prospection professionnel pour une campagne nommée "${campaignName}".

CONTEXTE :
${context || 'Campagne de prospection B2B'}

L'email doit :
1. Avoir un objet accrocheur et personnalisable (utilise {{first_name}}, {{last_name}}, {{company}})
2. Corps de l'email professionnel et engageant
3. Inclure des variables de personnalisation : {{first_name}}, {{last_name}}, {{company}}, {{position}}
4. Être concis (150-200 mots)
5. Avoir un call-to-action clair
6. Ton professionnel mais humain

Réponds en JSON :
{
  "subject": "objet avec variables {{first_name}} etc.",
  "body": "corps de l'email avec variables {{first_name}}, {{company}}, etc."
}`;

    const apiUrl = isGroq 
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    
    const model = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error: ${err}`);
    }

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
