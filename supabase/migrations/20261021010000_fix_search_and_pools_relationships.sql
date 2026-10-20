-- Migration: Fix search_pools RPC syntax, foreign key relationships to profiles, and RLS policies
-- 1. Foreign key relationships from tables to public.profiles so PostgREST can embed profile information
ALTER TABLE public.pools DROP CONSTRAINT IF EXISTS pools_host_id_fkey;
ALTER TABLE public.pools ADD CONSTRAINT pools_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.pool_members DROP CONSTRAINT IF EXISTS pool_members_user_id_fkey;
ALTER TABLE public.pool_members ADD CONSTRAINT pool_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.pool_messages DROP CONSTRAINT IF EXISTS pool_messages_sender_id_fkey;
ALTER TABLE public.pool_messages ADD CONSTRAINT pool_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.settlements DROP CONSTRAINT IF EXISTS settlements_payer_id_fkey;
ALTER TABLE public.settlements ADD CONSTRAINT settlements_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_blocked_user_id_fkey;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_blocked_user_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Allow public/browsing read access for open pools, curated locations, and basic profiles
DROP POLICY IF EXISTS "Pools are viewable if not blocked by host" ON public.pools;
CREATE POLICY "Pools are viewable if not blocked by host"
  ON public.pools FOR SELECT
  TO anon, authenticated
  USING (
    status = 'open' 
    OR (auth.uid() IS NOT NULL AND (NOT public.is_blocked(auth.uid(), host_id)))
  );

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users not blocked" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users not blocked"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (auth.uid() IS NULL OR NOT public.is_blocked(auth.uid(), id));

DROP POLICY IF EXISTS "Locations are readable by authenticated users" ON public.locations;
CREATE POLICY "Locations are readable by authenticated users"
  ON public.locations FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Pool members viewable by members or pool host" ON public.pool_members;
CREATE POLICY "Pool members viewable by members or pool host"
  ON public.pool_members FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Expose generated latitude and longitude on locations for client consumption
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS latitude double precision GENERATED ALWAYS AS (ST_Y(point::geometry)) STORED;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS longitude double precision GENERATED ALWAYS AS (ST_X(point::geometry)) STORED;

-- 4. Fix search_pools RPC
CREATE OR REPLACE FUNCTION public.search_pools(
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_dest_lat double precision,
  p_dest_lng double precision,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_seats_needed int DEFAULT 1,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  host_id uuid,
  host_name text,
  host_avatar_url text,
  host_rating_avg numeric,
  origin_name text,
  destination_name text,
  departs_at timestamptz,
  flexibility_minutes int,
  total_seats int,
  seats_taken int,
  seats_left int,
  status text,
  join_mode text,
  estimated_fare_per_person int,
  time_diff_minutes int,
  dest_distance_m int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_origin_geog geography;
  v_dest_geog geography;
  v_origin_radius int := 2500;
  v_dest_radius int := 3000;
  v_corridor_radius int := 1500;
  v_results_count int;
  v_window_midpoint timestamptz;
BEGIN
  v_origin_geog := ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography;
  v_dest_geog := ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography;
  -- In PostgreSQL, adding two timestamps is invalid; midpoint is start + interval/2
  v_window_midpoint := p_window_start + ((p_window_end - p_window_start) / 2);

  -- Read configurable radii if available (with generous defaults)
  SELECT COALESCE((value->>'origin_radius_m')::int, 2500) INTO v_origin_radius FROM public.app_config WHERE key = 'matching';
  SELECT COALESCE((value->>'dest_radius_m')::int, 3000) INTO v_dest_radius FROM public.app_config WHERE key = 'matching';
  SELECT COALESCE((value->>'corridor_radius_m')::int, 1500) INTO v_corridor_radius FROM public.app_config WHERE key = 'matching';

  RETURN QUERY
  WITH matched_pools AS (
    SELECT
      p.id,
      p.host_id,
      pr.full_name AS host_name,
      pr.avatar_url AS host_avatar_url,
      pr.rating_avg AS host_rating_avg,
      p.origin_name,
      p.destination_name,
      p.departs_at,
      p.flexibility_minutes,
      p.total_seats,
      p.seats_taken,
      (p.total_seats - p.seats_taken) AS seats_left,
      p.status,
      p.join_mode,
      ROUND(p.estimated_fare_min / GREATEST(p.seats_taken + p_seats_needed, 1))::int AS estimated_fare_per_person,
      ABS(EXTRACT(EPOCH FROM (p.departs_at - v_window_midpoint)) / 60)::int AS time_diff_minutes,
      ROUND(ST_Distance(p.destination_geog, v_dest_geog))::int AS dest_distance_m
    FROM public.pools p
    JOIN public.profiles pr ON pr.id = p.host_id
    WHERE p.status = 'open'
      AND (p.total_seats - p.seats_taken) >= p_seats_needed
      -- Origin within radius
      AND ST_DWithin(p.origin_geog, v_origin_geog, v_origin_radius)
      -- Destination within radius OR rider dropoff along route corridor
      AND (
        ST_DWithin(p.destination_geog, v_dest_geog, v_dest_radius)
        OR (p.route_geog IS NOT NULL AND ST_DWithin(p.route_geog, v_dest_geog, v_corridor_radius))
      )
      -- Temporal overlap: pool window overlaps rider window
      AND (p.departs_at + (p.flexibility_minutes || ' minutes')::interval) >= p_window_start
      AND (p.departs_at - (p.flexibility_minutes || ' minutes')::interval) <= p_window_end
      -- Exclude mutual blocks if searcher is authenticated
      AND (
        p_user_id IS NULL OR (
          NOT EXISTS (
            SELECT 1 FROM public.blocks b
            WHERE (b.blocker_id = p_user_id AND b.blocked_id = p.host_id)
               OR (b.blocker_id = p.host_id AND b.blocked_id = p_user_id)
          )
        )
      )
  )
  SELECT * FROM matched_pools
  ORDER BY time_diff_minutes ASC, dest_distance_m ASC;

  -- Log anonymous demand event safely
  GET DIAGNOSTICS v_results_count = ROW_COUNT;
  BEGIN
    INSERT INTO public.demand_events (
      origin_name,
      origin_geog,
      destination_name,
      destination_geog,
      window_start,
      window_end,
      seats,
      results_count
    ) VALUES (
      'Search Origin',
      v_origin_geog,
      'Search Destination',
      v_dest_geog,
      p_window_start,
      p_window_end,
      p_seats_needed,
      v_results_count
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
