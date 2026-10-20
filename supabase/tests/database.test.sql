-- RideHive pgTAP Database and RLS Tests
BEGIN;
SELECT plan(10);

-- Test 1: PostGIS extension is installed
SELECT has_extension('postgis', 'PostGIS extension should be installed');

-- Test 2: Core tables exist
SELECT has_table('public', 'profiles', 'profiles table should exist');
SELECT has_table('public', 'profile_private', 'profile_private table should exist');
SELECT has_table('public', 'pools', 'pools table should exist');
SELECT has_table('public', 'pool_members', 'pool_members table should exist');
SELECT has_table('public', 'settlements', 'settlements table should exist');

-- Test 3: RLS is enabled on sensitive tables
SELECT row_level_security_active('public', 'profiles', 'RLS should be active on profiles');
SELECT row_level_security_active('public', 'profile_private', 'RLS should be active on profile_private');
SELECT row_level_security_active('public', 'pool_messages', 'RLS should be active on pool_messages');
SELECT row_level_security_active('public', 'settlements', 'RLS should be active on settlements');

SELECT * FROM finish();
ROLLBACK;
