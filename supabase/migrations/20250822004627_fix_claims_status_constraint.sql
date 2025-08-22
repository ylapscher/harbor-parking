-- Fix for Claims Re-claiming Issue
-- This script addresses the issue where users cannot re-claim spots they previously released

-- Step 1: Fix the database constraint to allow 'released' status
-- Drop the existing constraint that's blocking 'released' status
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;

-- Add the new constraint that includes 'released'
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled', 'released'));

-- Ensure the default value is correct
ALTER TABLE public.claims ALTER COLUMN status SET DEFAULT 'pending';

-- Step 2: Fix any orphaned availabilities that should be reactivated
-- This handles cases where claims were meant to be released but the operation failed
UPDATE public.availabilities 
SET is_active = true, updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT a.id 
  FROM public.availabilities a
  LEFT JOIN public.claims c ON a.id = c.availability_id AND c.status = 'confirmed'
  WHERE a.is_active = false 
    AND c.id IS NULL  -- No confirmed claims exist
    AND a.end_time > NOW()  -- Availability is still valid
);

-- Step 3: Verify the fix
-- Check constraint exists and includes 'released'
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'claims_status_check' 
  AND conrelid = 'public.claims'::regclass;

-- Check for any availabilities that might need reactivation
SELECT 
  a.id as availability_id,
  a.is_active,
  COUNT(c.id) as confirmed_claims_count,
  a.end_time > NOW() as is_still_valid
FROM public.availabilities a
LEFT JOIN public.claims c ON a.id = c.availability_id AND c.status = 'confirmed'
WHERE a.is_active = false
GROUP BY a.id, a.is_active, a.end_time
HAVING COUNT(c.id) = 0 AND a.end_time > NOW()
ORDER BY a.created_at DESC
LIMIT 10;

-- Display recent claims to verify status values
SELECT 
  id,
  availability_id,
  claimer_id,
  status,
  created_at,
  updated_at
FROM public.claims 
ORDER BY updated_at DESC 
LIMIT 10;