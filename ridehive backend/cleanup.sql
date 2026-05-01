-- Script to clear all ride-related data and reset auto-increment counters
SET FOREIGN_KEY_CHECKS = 0;

-- Clear data from ride-related tables
DELETE FROM pool_members;
DELETE FROM scheduled_rides;
DELETE FROM ride_pools;
DELETE FROM ride_requests;

-- Reset auto-increment counters
ALTER TABLE ride_requests AUTO_INCREMENT = 1;
ALTER TABLE ride_pools AUTO_INCREMENT = 1;
ALTER TABLE scheduled_rides AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Note: 'messages' table was omitted as it does not currently exist in the database.
