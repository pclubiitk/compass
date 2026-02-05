-- Test script to verify location status updates
-- Run this after admin approves/rejects a location

-- Check current status of all locations
SELECT location_id, name, status, contributed_by, created_at 
FROM locations 
ORDER BY created_at DESC 
LIMIT 10;

-- To manually test update:
-- UPDATE locations SET status = 'approved' WHERE location_id = 'YOUR-UUID-HERE';
-- UPDATE locations SET status = 'rejected' WHERE location_id = 'YOUR-UUID-HERE';
-- UPDATE locations SET status = 'pending' WHERE location_id = 'YOUR-UUID-HERE';
