-- RideHive Initial Database Migration
-- Includes PostGIS extensions, core tables, triggers, RLS policies, and RPCs.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS FOR TIMESTAMPS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  ride_count int NOT NULL DEFAULT 0 CHECK (ride_count >= 0),
  rating_avg numeric(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating_avg >= 1.00 AND rating_avg <= 5.00),
  rating_count int NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,14}$'),
  upi_id text CHECK (upi_id IS NULL OR upi_id ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$'),
  late_cancellations int NOT NULL DEFAULT 0 CHECK (late_cancellations >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. LOCATIONS TABLE (Curated Destinations & Campus Gate)
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('campus', 'airport', 'metro', 'railway', 'mall', 'market', 'other')),
  point geography(Point, 4326) NOT NULL,
  place_id text,
  is_campus boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_point ON public.locations USING GIST (point);

-- 5. POOLS TABLE
CREATE TABLE IF NOT EXISTS public.pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  origin_name text NOT NULL,
  origin_geog geography(Point, 4326) NOT NULL,
  destination_name text NOT NULL,
  destination_geog geography(Point, 4326) NOT NULL,
  destination_place_id text,
  route_geog geography(LineString, 4326),
  route_polyline text,
  route_distance_m int CHECK (route_distance_m IS NULL OR route_distance_m >= 0),
  route_duration_s int CHECK (route_duration_s IS NULL OR route_duration_s >= 0),
  departs_at timestamptz NOT NULL,
  flexibility_minutes int NOT NULL DEFAULT 15 CHECK (flexibility_minutes IN (0, 10, 15, 30)),
  total_seats int NOT NULL DEFAULT 4 CHECK (total_seats >= 3 AND total_seats <= 6),
  seats_taken int NOT NULL DEFAULT 1 CHECK (seats_taken >= 1 AND seats_taken <= total_seats),
  join_mode text NOT NULL DEFAULT 'instant' CHECK (join_mode IN ('instant', 'approval')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'booked', 'completed', 'cancelled', 'expired')),
  note text CHECK (note IS NULL OR length(note) <= 150),
  estimated_fare_min int NOT NULL CHECK (estimated_fare_min >= 0), -- in paise
  estimated_fare_max int NOT NULL CHECK (estimated_fare_max >= estimated_fare_min), -- in paise
  final_fare int CHECK (final_fare IS NULL OR final_fare >= 0), -- in paise
  cab_provider text CHECK (cab_provider IS NULL OR cab_provider IN ('uber', 'ola', 'rapido', 'other')),
  cab_vehicle_number text,
  cab_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pools_origin_geog ON public.pools USING GIST (origin_geog);
CREATE INDEX IF NOT EXISTS idx_pools_dest_geog ON public.pools USING GIST (destination_geog);
CREATE INDEX IF NOT EXISTS idx_pools_route_geog ON public.pools USING GIST (route_geog);
CREATE INDEX IF NOT EXISTS idx_pools_departs_status ON public.pools (departs_at, status);
CREATE INDEX IF NOT EXISTS idx_pools_host ON public.pools (host_id);

-- 6. POOL MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.pool_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('host', 'member')),
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'left', 'removed')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pool_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pool_members_pool_status ON public.pool_members (pool_id, status);
CREATE INDEX IF NOT EXISTS idx_pool_members_user_status ON public.pool_members (user_id, status);

-- 7. POOL MESSAGES (CHAT)
CREATE TABLE IF NOT EXISTS public.pool_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 1000),
  kind text NOT NULL DEFAULT 'user' CHECK (kind IN ('user', 'system')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_messages_pool_created ON public.pool_messages (pool_id, created_at);

-- 8. SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paise int NOT NULL CHECK (amount_paise >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'marked_paid', 'confirmed')),
  marked_paid_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pool_id, payer_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_pool ON public.settlements (pool_id);
CREATE INDEX IF NOT EXISTS idx_settlements_payer ON public.settlements (payer_id);

-- 9. RIDE ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.ride_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_name text NOT NULL,
  origin_geog geography(Point, 4326) NOT NULL,
  destination_name text NOT NULL,
  destination_geog geography(Point, 4326) NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL CHECK (window_end >= window_start),
  seats int NOT NULL DEFAULT 1 CHECK (seats >= 1 AND seats <= 5),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_alerts_user ON public.ride_alerts (user_id, active);
CREATE INDEX IF NOT EXISTS idx_ride_alerts_origin ON public.ride_alerts USING GIST (origin_geog);
CREATE INDEX IF NOT EXISTS idx_ride_alerts_dest ON public.ride_alerts USING GIST (destination_geog);

-- 10. NOTIFICATIONS AND TOKENS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pool_updates boolean NOT NULL DEFAULT true,
  chat_messages boolean NOT NULL DEFAULT true,
  departure_reminders boolean NOT NULL DEFAULT true,
  ride_alerts boolean NOT NULL DEFAULT true,
  payment_updates boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. TRUST AND SAFETY: REPORTS, BLOCKS, RATINGS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_pool_id uuid REFERENCES public.pools(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (reason IN ('no_show', 'inappropriate_behavior', 'fake_ride', 'payment_issue', 'safety_concern', 'other')),
  details text CHECK (details IS NULL OR length(details) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks (blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks (blocked_id, blocker_id);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.pools(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pool_id, rater_id, ratee_id),
  CHECK (rater_id <> ratee_id)
);

-- 12. DEMAND EVENTS & CONFIG
CREATE TABLE IF NOT EXISTS public.demand_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_name text NOT NULL,
  origin_geog geography(Point, 4326) NOT NULL,
  destination_name text NOT NULL,
  destination_geog geography(Point, 4326) NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  seats int NOT NULL,
  results_count int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text
);

-- UPDATED_AT TRIGGERS
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_profile_private_updated_at BEFORE UPDATE ON public.profile_private FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pools_updated_at BEFORE UPDATE ON public.pools FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_pool_members_updated_at BEFORE UPDATE ON public.pool_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_settlements_updated_at BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_notification_prefs_updated_at BEFORE UPDATE ON public.notification_prefs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. AUTH EMAIL DOMAIN GUARD & USER INITIALIZATION
CREATE OR REPLACE FUNCTION public.check_user_email_domain()
RETURNS trigger AS $$
BEGIN
  IF lower(NEW.email) NOT LIKE '%@bmu.edu.in' THEN
    RAISE EXCEPTION 'Access restricted: Only @bmu.edu.in university email addresses are permitted.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_bmu_email_domain ON auth.users;
CREATE TRIGGER enforce_bmu_email_domain
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_email_domain();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name text;
BEGIN
  IF lower(NEW.email) NOT LIKE '%@bmu.edu.in' THEN
    RAISE EXCEPTION 'Access restricted: Only @bmu.edu.in university email addresses are permitted.';
  END IF;

  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, v_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_private (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 14. RATING RECALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_avg = (
      SELECT ROUND(AVG(score)::numeric, 2)
      FROM public.ratings
      WHERE ratee_id = NEW.ratee_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE ratee_id = NEW.ratee_id
    )
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_ratings_after_insert
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_rating();

-- 15. ROW LEVEL SECURITY (RLS) - ENABLE ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Helper function to check if two users have blocked each other
CREATE OR REPLACE FUNCTION public.is_blocked(u1 uuid, u2 uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = u1 AND blocked_id = u2)
       OR (blocker_id = u2 AND blocked_id = u1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users not blocked"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (NOT public.is_blocked(auth.uid(), id));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- PROFILE PRIVATE POLICIES
CREATE POLICY "Private profile only viewable by owner"
  ON public.profile_private FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own private profile"
  ON public.profile_private FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- LOCATIONS POLICIES
CREATE POLICY "Locations are readable by authenticated users"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

-- POOLS POLICIES
CREATE POLICY "Pools are viewable if not blocked by host"
  ON public.pools FOR SELECT
  TO authenticated
  USING (NOT public.is_blocked(auth.uid(), host_id));

CREATE POLICY "Host can insert pool"
  ON public.pools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update own pool"
  ON public.pools FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- POOL MEMBERS POLICIES
CREATE POLICY "Pool members viewable by members or pool host"
  ON public.pool_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = pool_members.pool_id AND p.host_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.pool_members pm
      WHERE pm.pool_id = pool_members.pool_id AND pm.user_id = auth.uid() AND pm.status = 'confirmed'
    )
  );

CREATE POLICY "Authenticated users can request or join pool"
  ON public.pool_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership or host can update members"
  ON public.pool_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = pool_members.pool_id AND p.host_id = auth.uid()
    )
  );

-- POOL MESSAGES POLICIES
CREATE POLICY "Chat messages only viewable by confirmed members"
  ON public.pool_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pool_members
      WHERE pool_id = pool_messages.pool_id
        AND user_id = auth.uid()
        AND status = 'confirmed'
    )
  );

CREATE POLICY "Confirmed members can insert chat messages"
  ON public.pool_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (sender_id IS NULL OR sender_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.pool_members
      WHERE pool_id = pool_messages.pool_id
        AND user_id = auth.uid()
        AND status = 'confirmed'
    )
  );

-- SETTLEMENTS POLICIES
CREATE POLICY "Settlements viewable by payer or host"
  ON public.settlements FOR SELECT
  TO authenticated
  USING (
    payer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = settlements.pool_id AND p.host_id = auth.uid()
    )
  );

CREATE POLICY "Settlements updatable by payer or host"
  ON public.settlements FOR UPDATE
  TO authenticated
  USING (
    payer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = settlements.pool_id AND p.host_id = auth.uid()
    )
  );

-- RIDE ALERTS POLICIES
CREATE POLICY "Users manage own ride alerts"
  ON public.ride_alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DEVICE TOKENS POLICIES
CREATE POLICY "Users manage own device tokens"
  ON public.device_tokens FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATION PREFS POLICIES
CREATE POLICY "Users manage own notification prefs"
  ON public.notification_prefs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- REPORTS POLICIES
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- BLOCKS POLICIES
CREATE POLICY "Users manage own blocks"
  ON public.blocks FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- RATINGS POLICIES
CREATE POLICY "Users can submit ratings"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can view ratings involving them"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = rater_id OR auth.uid() = ratee_id);

-- DEMAND EVENTS POLICIES (Anonymous insert only)
CREATE POLICY "Authenticated users can record demand events"
  ON public.demand_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- APP CONFIG POLICIES
CREATE POLICY "App config viewable by authenticated"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (true);

-- 16. CORE RPCS (SECURITY DEFINER WITH PINNED SEARCH_PATH)

-- RPC 1: search_pools
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
  v_origin_radius int := 1500;
  v_dest_radius int := 1500;
  v_corridor_radius int := 1000;
  v_results_count int;
BEGIN
  v_origin_geog := ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography;
  v_dest_geog := ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography;

  -- Read configurable radii if available
  SELECT COALESCE((value->>'origin_radius_m')::int, 1500) INTO v_origin_radius FROM public.app_config WHERE key = 'matching';
  SELECT COALESCE((value->>'dest_radius_m')::int, 1500) INTO v_dest_radius FROM public.app_config WHERE key = 'matching';
  SELECT COALESCE((value->>'corridor_radius_m')::int, 1000) INTO v_corridor_radius FROM public.app_config WHERE key = 'matching';

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
      ABS(EXTRACT(EPOCH FROM (p.departs_at - ((p_window_start + p_window_end) / 2))) / 60)::int AS time_diff_minutes,
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

  -- Log anonymous demand event
  GET DIAGNOSTICS v_results_count = ROW_COUNT;
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
END;
$$;

-- RPC 2: create_pool
CREATE OR REPLACE FUNCTION public.create_pool(
  p_origin_name text,
  p_origin_lat double precision,
  p_origin_lng double precision,
  p_destination_name text,
  p_dest_lat double precision,
  p_dest_lng double precision,
  p_destination_place_id text,
  p_departs_at timestamptz,
  p_flexibility_minutes int,
  p_total_seats int,
  p_join_mode text,
  p_note text,
  p_estimated_fare_min int,
  p_estimated_fare_max int,
  p_route_polyline text DEFAULT NULL,
  p_route_distance_m int DEFAULT NULL,
  p_route_duration_s int DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_pool_id uuid;
  v_origin_geog geography;
  v_dest_geog geography;
  v_conflict_count int;
  v_alert record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is already in a pool departing within 60 minutes
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.pool_members pm
  JOIN public.pools p ON p.id = pm.pool_id
  WHERE pm.user_id = v_user_id
    AND pm.status = 'confirmed'
    AND p.status IN ('open', 'closed', 'booked')
    AND ABS(EXTRACT(EPOCH FROM (p.departs_at - p_departs_at))) < 3600;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'You are already in a pool departing within 60 minutes of this time.';
  END IF;

  v_origin_geog := ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography;
  v_dest_geog := ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography;

  -- Create pool
  INSERT INTO public.pools (
    host_id,
    origin_name,
    origin_geog,
    destination_name,
    destination_geog,
    destination_place_id,
    route_polyline,
    route_distance_m,
    route_duration_s,
    departs_at,
    flexibility_minutes,
    total_seats,
    seats_taken,
    join_mode,
    status,
    note,
    estimated_fare_min,
    estimated_fare_max
  ) VALUES (
    v_user_id,
    p_origin_name,
    v_origin_geog,
    p_destination_name,
    v_dest_geog,
    p_destination_place_id,
    p_route_polyline,
    p_route_distance_m,
    p_route_duration_s,
    p_departs_at,
    p_flexibility_minutes,
    p_total_seats,
    1, -- Host counts as first seat
    p_join_mode,
    'open',
    p_note,
    p_estimated_fare_min,
    p_estimated_fare_max
  )
  RETURNING id INTO v_pool_id;

  -- Add host as confirmed pool member
  INSERT INTO public.pool_members (
    pool_id,
    user_id,
    role,
    status
  ) VALUES (
    v_pool_id,
    v_user_id,
    'host',
    'confirmed'
  );

  -- System chat message
  INSERT INTO public.pool_messages (
    pool_id,
    sender_id,
    body,
    kind
  ) VALUES (
    v_pool_id,
    NULL,
    'Pool created by host.',
    'system'
  );

  -- Trigger matching ride alerts
  FOR v_alert IN
    SELECT ra.user_id, ra.id AS alert_id
    FROM public.ride_alerts ra
    WHERE ra.active = true
      AND ra.user_id <> v_user_id
      AND ST_DWithin(ra.origin_geog, v_origin_geog, 1500)
      AND ST_DWithin(ra.destination_geog, v_dest_geog, 1500)
      AND p_departs_at >= ra.window_start
      AND p_departs_at <= ra.window_end
  LOOP
    INSERT INTO public.notifications (
      user_id,
      type,
      payload
    ) VALUES (
      v_alert.user_id,
      'alert_match',
      jsonb_build_object(
        'pool_id', v_pool_id,
        'destination_name', p_destination_name,
        'departs_at', p_departs_at,
        'seats_left', p_total_seats - 1
      )
    );
  END LOOP;

  RETURN v_pool_id;
END;
$$;

-- RPC 3: join_pool (CONCURRENCY-SAFE ROW LOCKING)
CREATE OR REPLACE FUNCTION public.join_pool(
  p_pool_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_pool public.pools%ROWTYPE;
  v_conflict_count int;
  v_user_name text;
  v_member_status text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the pool row exclusively
  SELECT * INTO v_pool
  FROM public.pools
  WHERE id = p_pool_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found';
  END IF;

  IF v_pool.status <> 'open' THEN
    RAISE EXCEPTION 'Pool is not open for new joins (status: %)', v_pool.status;
  END IF;

  IF v_pool.seats_taken >= v_pool.total_seats THEN
    RAISE EXCEPTION 'Pool is already full';
  END IF;

  -- Block check
  IF public.is_blocked(v_user_id, v_pool.host_id) THEN
    RAISE EXCEPTION 'Cannot join pool due to user blocking';
  END IF;

  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = p_pool_id AND user_id = v_user_id AND status IN ('confirmed', 'pending')
  ) THEN
    RAISE EXCEPTION 'You have already joined or requested to join this pool';
  END IF;

  -- Conflict check (within 60 min)
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.pool_members pm
  JOIN public.pools p ON p.id = pm.pool_id
  WHERE pm.user_id = v_user_id
    AND pm.status = 'confirmed'
    AND p.status IN ('open', 'closed', 'booked')
    AND ABS(EXTRACT(EPOCH FROM (p.departs_at - v_pool.departs_at))) < 3600;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'You are in another ride departing within 60 minutes.';
  END IF;

  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;

  IF v_pool.join_mode = 'instant' THEN
    v_member_status := 'confirmed';

    -- Increment seats_taken
    UPDATE public.pools
    SET
      seats_taken = seats_taken + 1,
      status = CASE WHEN seats_taken + 1 >= total_seats THEN 'closed' ELSE status END
    WHERE id = p_pool_id;

    -- Insert or update membership
    INSERT INTO public.pool_members (pool_id, user_id, role, status)
    VALUES (p_pool_id, v_user_id, 'member', 'confirmed')
    ON CONFLICT (pool_id, user_id)
    DO UPDATE SET status = 'confirmed', updated_at = now();

    -- System message
    INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
    VALUES (p_pool_id, NULL, v_user_name || ' joined the pool.', 'system');

    -- Notify host
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_pool.host_id,
      'member_joined',
      jsonb_build_object(
        'pool_id', p_pool_id,
        'user_id', v_user_id,
        'user_name', v_user_name,
        'seats_left', v_pool.total_seats - (v_pool.seats_taken + 1)
      )
    );

    RETURN jsonb_build_object('success', true, 'status', 'confirmed', 'message', 'Joined pool successfully');
  ELSE
    v_member_status := 'pending';

    INSERT INTO public.pool_members (pool_id, user_id, role, status)
    VALUES (p_pool_id, v_user_id, 'member', 'pending')
    ON CONFLICT (pool_id, user_id)
    DO UPDATE SET status = 'pending', updated_at = now();

    -- Notify host of request
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_pool.host_id,
      'join_request',
      jsonb_build_object(
        'pool_id', p_pool_id,
        'user_id', v_user_id,
        'user_name', v_user_name
      )
    );

    RETURN jsonb_build_object('success', true, 'status', 'pending', 'message', 'Join request sent to host');
  END IF;
END;
$$;

-- RPC 4: approve_member
CREATE OR REPLACE FUNCTION public.approve_member(
  p_pool_id uuid,
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_pool public.pools%ROWTYPE;
  v_member_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_pool
  FROM public.pools
  WHERE id = p_pool_id
  FOR UPDATE;

  IF v_pool.host_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the pool host can approve members';
  END IF;

  IF v_pool.seats_taken >= v_pool.total_seats THEN
    RAISE EXCEPTION 'Pool is already full';
  END IF;

  UPDATE public.pool_members
  SET status = 'confirmed', updated_at = now()
  WHERE pool_id = p_pool_id AND user_id = p_target_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending join request found for this user';
  END IF;

  UPDATE public.pools
  SET
    seats_taken = seats_taken + 1,
    status = CASE WHEN seats_taken + 1 >= total_seats THEN 'closed' ELSE status END
  WHERE id = p_pool_id;

  SELECT full_name INTO v_member_name FROM public.profiles WHERE id = p_target_user_id;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (p_pool_id, NULL, v_member_name || ' was approved by host.', 'system');

  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (
    p_target_user_id,
    'request_approved',
    jsonb_build_object('pool_id', p_pool_id, 'destination_name', v_pool.destination_name)
  );

  RETURN true;
END;
$$;

-- RPC 5: leave_pool
CREATE OR REPLACE FUNCTION public.leave_pool(
  p_pool_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_pool public.pools%ROWTYPE;
  v_member public.pool_members%ROWTYPE;
  v_user_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_pool
  FROM public.pools
  WHERE id = p_pool_id
  FOR UPDATE;

  IF v_pool.host_id = v_user_id THEN
    RAISE EXCEPTION 'Host cannot leave the pool. Cancel the pool instead.';
  END IF;

  SELECT * INTO v_member
  FROM public.pool_members
  WHERE pool_id = p_pool_id AND user_id = v_user_id;

  IF NOT FOUND OR v_member.status NOT IN ('confirmed', 'pending') THEN
    RAISE EXCEPTION 'You are not a confirmed or pending member of this pool';
  END IF;

  UPDATE public.pool_members
  SET status = 'left', updated_at = now()
  WHERE pool_id = p_pool_id AND user_id = v_user_id;

  IF v_member.status = 'confirmed' THEN
    -- If cab was already booked, increment late cancellations counter
    IF v_pool.status = 'booked' THEN
      UPDATE public.profile_private
      SET late_cancellations = late_cancellations + 1
      WHERE user_id = v_user_id;
    END IF;

    -- Decrement seats taken and reopen pool if was closed due to seats
    UPDATE public.pools
    SET
      seats_taken = GREATEST(seats_taken - 1, 1),
      status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
    WHERE id = p_pool_id;
  END IF;

  SELECT full_name INTO v_user_name FROM public.profiles WHERE id = v_user_id;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (p_pool_id, NULL, v_user_name || ' left the pool.', 'system');

  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (
    v_pool.host_id,
    'member_left',
    jsonb_build_object(
      'pool_id', p_pool_id,
      'user_name', v_user_name,
      'late_cancellation', (v_pool.status = 'booked')
    )
  );

  RETURN true;
END;
$$;

-- RPC 6: close_pool
CREATE OR REPLACE FUNCTION public.close_pool(
  p_pool_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  UPDATE public.pools
  SET status = 'closed'
  WHERE id = p_pool_id AND host_id = v_user_id AND status = 'open';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found or you are not authorized to close joining.';
  END IF;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (p_pool_id, NULL, 'Host closed joining.', 'system');

  RETURN true;
END;
$$;

-- RPC 7: mark_booked
CREATE OR REPLACE FUNCTION public.mark_booked(
  p_pool_id uuid,
  p_provider text,
  p_vehicle_number text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_member record;
BEGIN
  UPDATE public.pools
  SET
    status = 'booked',
    cab_provider = p_provider,
    cab_vehicle_number = p_vehicle_number,
    cab_note = p_note
  WHERE id = p_pool_id AND host_id = v_user_id AND status IN ('open', 'closed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found or cannot be marked as booked.';
  END IF;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (
    p_pool_id,
    NULL,
    'Cab booked with ' || UPPER(p_provider) || CASE WHEN p_vehicle_number IS NOT NULL THEN ' (' || p_vehicle_number || ')' ELSE '' END || '.',
    'system'
  );

  -- Notify all confirmed members
  FOR v_member IN
    SELECT user_id FROM public.pool_members WHERE pool_id = p_pool_id AND status = 'confirmed' AND user_id <> v_user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_member.user_id,
      'cab_booked',
      jsonb_build_object(
        'pool_id', p_pool_id,
        'provider', p_provider,
        'vehicle_number', p_vehicle_number
      )
    );
  END LOOP;

  RETURN true;
END;
$$;

-- RPC 8: cancel_pool
CREATE OR REPLACE FUNCTION public.cancel_pool(
  p_pool_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_member record;
BEGIN
  UPDATE public.pools
  SET status = 'cancelled'
  WHERE id = p_pool_id AND host_id = v_user_id AND status IN ('open', 'closed', 'booked');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found or cannot be cancelled.';
  END IF;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (p_pool_id, NULL, 'Host cancelled this pool.', 'system');

  -- Notify all members
  FOR v_member IN
    SELECT user_id FROM public.pool_members WHERE pool_id = p_pool_id AND status = 'confirmed' AND user_id <> v_user_id
  LOOP
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_member.user_id,
      'pool_cancelled',
      jsonb_build_object('pool_id', p_pool_id)
    );
  END LOOP;

  RETURN true;
END;
$$;

-- RPC 9: complete_pool (EXACT PAISE SPLIT & SETTLEMENTS)
CREATE OR REPLACE FUNCTION public.complete_pool(
  p_pool_id uuid,
  p_final_fare_paise int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_member_count int;
  v_base_share int;
  v_remainder int;
  v_index int := 0;
  v_share int;
  v_member record;
BEGIN
  IF p_final_fare_paise <= 0 THEN
    RAISE EXCEPTION 'Final fare must be greater than 0';
  END IF;

  UPDATE public.pools
  SET
    status = 'completed',
    final_fare = p_final_fare_paise
  WHERE id = p_pool_id AND host_id = v_user_id AND status IN ('open', 'closed', 'booked');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pool not found or you are not authorized to complete it.';
  END IF;

  -- Count total confirmed members (including host)
  SELECT COUNT(*) INTO v_member_count
  FROM public.pool_members
  WHERE pool_id = p_pool_id AND status = 'confirmed';

  IF v_member_count <= 0 THEN
    RAISE EXCEPTION 'No confirmed members in pool';
  END IF;

  -- Calculate exact integer paise split
  v_base_share := p_final_fare_paise / v_member_count;
  v_remainder := p_final_fare_paise % v_member_count;

  -- Increment ride count for all confirmed members
  UPDATE public.profiles
  SET ride_count = ride_count + 1
  WHERE id IN (
    SELECT user_id FROM public.pool_members WHERE pool_id = p_pool_id AND status = 'confirmed'
  );

  -- Create settlements for non-host members
  FOR v_member IN
    SELECT user_id
    FROM public.pool_members
    WHERE pool_id = p_pool_id AND status = 'confirmed' AND user_id <> v_user_id
    ORDER BY joined_at ASC
  LOOP
    -- Distribute remainder paise one by one
    v_share := v_base_share + CASE WHEN v_index < v_remainder THEN 1 ELSE 0 END;
    v_index := v_index + 1;

    INSERT INTO public.settlements (
      pool_id,
      payer_id,
      amount_paise,
      status
    ) VALUES (
      p_pool_id,
      v_member.user_id,
      v_share,
      'pending'
    )
    ON CONFLICT (pool_id, payer_id)
    DO UPDATE SET amount_paise = v_share, status = 'pending';

    -- Notify member
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (
      v_member.user_id,
      'ride_completed',
      jsonb_build_object(
        'pool_id', p_pool_id,
        'amount_paise', v_share,
        'final_fare_paise', p_final_fare_paise
      )
    );
  END LOOP;

  INSERT INTO public.pool_messages (pool_id, sender_id, body, kind)
  VALUES (
    p_pool_id,
    NULL,
    'Ride completed. Final fare: ₹' || (p_final_fare_paise / 100)::text || '. Settlements generated.',
    'system'
  );

  RETURN true;
END;
$$;

-- RPC 10: mark_settlement_paid
CREATE OR REPLACE FUNCTION public.mark_settlement_paid(
  p_pool_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_host_id uuid;
  v_payer_name text;
BEGIN
  UPDATE public.settlements
  SET status = 'marked_paid', marked_paid_at = now()
  WHERE pool_id = p_pool_id AND payer_id = v_user_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Settlement not found or already marked paid';
  END IF;

  SELECT host_id INTO v_host_id FROM public.pools WHERE id = p_pool_id;
  SELECT full_name INTO v_payer_name FROM public.profiles WHERE id = v_user_id;

  -- Notify host
  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (
    v_host_id,
    'payment_marked_paid',
    jsonb_build_object('pool_id', p_pool_id, 'payer_id', v_user_id, 'payer_name', v_payer_name)
  );

  RETURN true;
END;
$$;

-- RPC 11: confirm_settlement
CREATE OR REPLACE FUNCTION public.confirm_settlement(
  p_pool_id uuid,
  p_payer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_host_id uuid;
BEGIN
  SELECT host_id INTO v_host_id FROM public.pools WHERE id = p_pool_id;

  IF v_host_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the pool host can confirm payments';
  END IF;

  UPDATE public.settlements
  SET status = 'confirmed', confirmed_at = now()
  WHERE pool_id = p_pool_id AND payer_id = p_payer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Settlement not found';
  END IF;

  -- Notify payer
  INSERT INTO public.notifications (user_id, type, payload)
  VALUES (
    p_payer_id,
    'payment_confirmed',
    jsonb_build_object('pool_id', p_pool_id)
  );

  RETURN true;
END;
$$;

-- RPC 12: get_pool_member_contacts (SECURITY DEFINER FOR PRIVACY)
CREATE OR REPLACE FUNCTION public.get_pool_member_contacts(
  p_pool_id uuid
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  role text,
  phone text,
  upi_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_viewer_id uuid := auth.uid();
  v_is_confirmed boolean;
BEGIN
  IF v_viewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify viewer is a confirmed member or host of the pool
  SELECT EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = p_pool_id AND user_id = v_viewer_id AND status = 'confirmed'
  ) INTO v_is_confirmed;

  IF NOT v_is_confirmed THEN
    RAISE EXCEPTION 'Access denied: You must be a confirmed member of this pool to view contacts.';
  END IF;

  RETURN QUERY
  SELECT
    pr.id AS user_id,
    pr.full_name,
    pm.role,
    pp.phone,
    pp.upi_id
  FROM public.pool_members pm
  JOIN public.profiles pr ON pr.id = pm.user_id
  LEFT JOIN public.profile_private pp ON pp.user_id = pm.user_id
  WHERE pm.pool_id = p_pool_id AND pm.status = 'confirmed';
END;
$$;
