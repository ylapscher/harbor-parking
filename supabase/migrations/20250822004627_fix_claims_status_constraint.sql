-- Fix for Claims Re-claiming Issue
-- This script addresses the issue where users cannot re-claim spots they previously released

-- Step 1: Fix the database constraint to allow 'released' status
-- Drop the existing constraint that's blocking 'released' status
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;

-- Add the new constraint that includes 'released'
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled', 'released'));

-- Update the default value to ensure consistency
ALTER TABLE public.claims ALTER COLUMN status SET DEFAULT 'pending';
