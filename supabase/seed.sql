-- RideHive Seed Data
-- 15+ curated Delhi-NCR transit destinations and BML Munjal University campus gate.
-- Coordinates are marked with -- VERIFY and recorded in docs/DECISIONS.md.

-- 1. APP CONFIGURATION
INSERT INTO public.app_config (key, value, description) VALUES
  ('fare', '{"base_fare_paise": 5000, "per_km_paise": 1400}'::jsonb, 'Default fare calculation constants: ₹50 base + ₹14/km'),
  ('matching', '{"origin_radius_m": 1500, "dest_radius_m": 1500, "corridor_radius_m": 1000}'::jsonb, 'Search matching radius and route corridor buffer'),
  ('limits', '{"max_active_alerts": 5, "max_seats": 6, "min_seats": 3}'::jsonb, 'Operational and user caps')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. CURATED LOCATIONS
-- Campus Origin
INSERT INTO public.locations (name, type, point, is_campus) VALUES
  (
    'BML Munjal University Main Gate, NH 48, Sidhrawali',
    'campus',
    ST_SetSRID(ST_MakePoint(76.81395, 28.24765), 4326)::geography, -- VERIFY
    true
  );

-- Airport Terminals
INSERT INTO public.locations (name, type, point, is_campus) VALUES
  (
    'IGI Airport Terminal 3 (T3 - International & Domestic)',
    'airport',
    ST_SetSRID(ST_MakePoint(77.08638, 28.55616), 4326)::geography, -- VERIFY
    false
  ),
  (
    'IGI Airport Terminal 1 (T1 - Domestic Departure/Arrival)',
    'airport',
    ST_SetSRID(ST_MakePoint(77.11246, 28.56847), 4326)::geography, -- VERIFY
    false
  ),
  (
    'IGI Airport Terminal 2 (T2)',
    'airport',
    ST_SetSRID(ST_MakePoint(77.08985, 28.55694), 4326)::geography, -- VERIFY
    false
  );

-- Metro Stations
INSERT INTO public.locations (name, type, point, is_campus) VALUES
  (
    'Millennium City Centre Gurugram Metro (HUDA City Centre)',
    'metro',
    ST_SetSRID(ST_MakePoint(77.07268, 28.45927), 4326)::geography, -- VERIFY
    false
  ),
  (
    'IFFCO Chowk Metro Station, Gurugram',
    'metro',
    ST_SetSRID(ST_MakePoint(77.07255, 28.47214), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Sikanderpur Metro Station (Interchange with Rapid Metro)',
    'metro',
    ST_SetSRID(ST_MakePoint(77.09312, 28.48197), 4326)::geography, -- VERIFY
    false
  ),
  (
    'MG Road Metro Station, Gurugram',
    'metro',
    ST_SetSRID(ST_MakePoint(77.08020, 28.47970), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Rajiv Chowk Metro Station, Connaught Place, New Delhi',
    'metro',
    ST_SetSRID(ST_MakePoint(77.21970, 28.63280), 4326)::geography, -- VERIFY
    false
  );

-- Railway Stations
INSERT INTO public.locations (name, type, point, is_campus) VALUES
  (
    'Gurugram Railway Station (GGN)',
    'railway',
    ST_SetSRID(ST_MakePoint(77.01950, 28.46870), 4326)::geography, -- VERIFY
    false
  ),
  (
    'New Delhi Railway Station (NDLS - Paharganj / Ajmeri Gate)',
    'railway',
    ST_SetSRID(ST_MakePoint(77.21950, 28.64290), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Hazrat Nizamuddin Railway Station (NZM)',
    'railway',
    ST_SetSRID(ST_MakePoint(77.25300, 28.58920), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Old Delhi Railway Station (DLI)',
    'railway',
    ST_SetSRID(ST_MakePoint(77.22850, 28.66170), 4326)::geography, -- VERIFY
    false
  );

-- Malls & Commercial Hubs
INSERT INTO public.locations (name, type, point, is_campus) VALUES
  (
    'DLF Cyber Hub / Cyber City, Gurugram',
    'other',
    ST_SetSRID(ST_MakePoint(77.08900, 28.49500), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Ambience Mall, NH 48, Gurugram',
    'mall',
    ST_SetSRID(ST_MakePoint(77.09680, 28.50480), 4326)::geography, -- VERIFY
    false
  ),
  (
    'South Point Mall, Golf Course Road, Gurugram',
    'mall',
    ST_SetSRID(ST_MakePoint(77.10700, 28.44850), 4326)::geography, -- VERIFY
    false
  ),
  (
    'Khan Market, New Delhi',
    'market',
    ST_SetSRID(ST_MakePoint(77.22700, 28.59960), 4326)::geography, -- VERIFY
    false
  );
