import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache for repeated routes
const routeCache = new Map<string, any>();

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

    const { originLat, originLng, destLat, destLng } = await req.json();
    if (!originLat || !originLng || !destLat || !destLng) {
      return new Response(JSON.stringify({ error: 'Missing origin or destination coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
    if (routeCache.has(cacheKey)) {
      return new Response(JSON.stringify(routeCache.get(cacheKey)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY');
    if (!apiKey) {
      // Calculate haversine approximation for fallback
      const R = 6371e3; // meters
      const φ1 = (originLat * Math.PI) / 180;
      const φ2 = (destLat * Math.PI) / 180;
      const Δφ = ((destLat - originLat) * Math.PI) / 180;
      const Δλ = ((destLng - originLng) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const approxDistanceM = Math.round(R * c);
      const approxDurationS = Math.round(approxDistanceM / 11); // ~40 km/h average

      const fallbackResult = {
        polyline: null,
        distanceM: approxDistanceM,
        durationS: approxDurationS,
        fallback: true,
      };

      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', `${originLat},${originLng}`);
    url.searchParams.set('destination', `${destLat},${destLng}`);
    url.searchParams.set('mode', 'driving');
    url.searchParams.set('key', apiKey);

    const googleRes = await fetch(url.toString());
    const data = await googleRes.json();

    if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
      return new Response(
        JSON.stringify({ error: data.error_message || 'Could not calculate route' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leg = data.routes[0].legs[0];
    const result = {
      polyline: data.routes[0].overview_polyline?.points || null,
      distanceM: leg.distance.value,
      durationS: leg.duration.value,
      fallback: false,
    };

    routeCache.set(cacheKey, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
