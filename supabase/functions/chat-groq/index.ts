// Edge Function: Chat avec Groq pour affiner les recherches
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construire le contexte pour l'IA
    const systemPrompt = `Tu es un assistant expert en prospection B2B pour une entreprise qui vend des étiquettes en bobine.

Tu aides l'utilisateur à :
- Affiner ses critères de recherche
- Comprendre pourquoi certaines entreprises sont suggérées
- Trouver des entreprises spécifiques
- Expliquer les résultats de recherche

${context?.criteria ? `Critères de recherche actuels :
- Secteur : ${context.criteria.sector}
- Département : ${context.criteria.department || 'Tous'}
- Ville : ${context.criteria.location || 'Toutes'}
- Mots-clés : ${context.criteria.keywords || 'Aucun'}
- Instructions : ${context.criteria.customPrompt || 'Aucune'}` : ''}

${context?.prospects ? `Résultats actuels : ${context.prospects.length} prospects trouvés` : ''}

Réponds de manière concise et utile. Si l'utilisateur demande une nouvelle recherche, suggère des critères précis.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        reply: reply
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erreur inconnue"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
