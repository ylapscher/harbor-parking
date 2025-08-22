-- Fix claims status check constraint to include 'released' status
-- This migration updates the existing constraint to allow the 'released' status

-- First, drop the existing constraint
ALTER TABLE public.claims DROP CONSTRAINT IF EXISTS claims_status_check;

-- Add the new constraint that includes 'released'
ALTER TABLE public.claims ADD CONSTRAINT claims_status_check 
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled', 'released'));

-- Update the default value to ensure consistency
ALTER TABLE public.claims ALTER COLUMN status SET DEFAULT 'pending';
