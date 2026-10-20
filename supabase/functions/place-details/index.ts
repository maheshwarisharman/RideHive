import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { placeId, sessionToken } = await req.json();
    if (!placeId) {
      return new Response(JSON.stringify({ error: 'Missing placeId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GOOGLE_MAPS_SERVER_API_KEY not configured',
          fallback: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'geometry,name,formatted_address');
    url.searchParams.set('key', apiKey);
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    const googleRes = await fetch(url.toString());
    const data = await googleRes.json();

    if (data.status !== 'OK' || !data.result?.geometry?.location) {
      return new Response(
        JSON.stringify({ error: data.error_message || 'Place not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = data.result.geometry.location;
    return new Response(
      JSON.stringify({
        name: data.result.name,
        formattedAddress: data.result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
