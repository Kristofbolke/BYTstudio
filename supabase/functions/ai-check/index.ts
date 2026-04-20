import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectContext } = await req.json()

    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1500,
          system: `Je bent een senior app-architect gespecialiseerd in KMO-digitalisering in België.
Analyseer de beschreven klant-app en geef exact 5 concrete, prioritaire suggesties.

Voor elke suggestie geef je:
- titel (max 6 woorden)
- categorie (AI / UX / Feature / Integratie / Schaalbaarheid)
- beschrijving (2-3 zinnen, specifiek voor sector)
- meerwaarde (waarom dit waarde toevoegt)
- geschatte bouwtijd (in uren)

Antwoord ALTIJD in dit exacte JSON-formaat:
{
  "suggesties": [
    {
      "titel": "...",
      "categorie": "...",
      "beschrijving": "...",
      "meerwaarde": "...",
      "bouwtijd": 0
    }
  ]
}

Antwoord in het Nederlands.
Wees specifiek voor de opgegeven sector.
Geen algemene adviezen — alleen concrete features.`,
          messages: [
            {
              role: 'user',
              content: projectContext,
            },
          ],
        }),
      }
    )

    const data = await response.json()
    const tekst = data.content[0].text

    let suggesties
    try {
      suggesties = JSON.parse(tekst)
    } catch {
      suggesties = { suggesties: [], raw: tekst }
    }

    return new Response(
      JSON.stringify(suggesties),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
